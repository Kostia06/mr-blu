import { dev } from '$app/environment';
import type { RequestHandler } from './$types';
import { allTestCases } from '$lib/testing/test-cases';
import type {
	AITestCase,
	TestRunConfig,
	TestCategory,
	TestPriority,
	TestResult,
	ValidationResult,
	ValidationRule
} from '$lib/testing/types';

interface StreamResult {
	testId: string;
	passed: boolean;
	duration: number;
	error?: string;
	validationResults: Array<{ passed: boolean; message: string }>;
}

/**
 * POST /api/testing/stream
 * Stream test results as they complete using Server-Sent Events
 * Runs all tests in parallel for maximum speed
 */
export const POST: RequestHandler = async ({ request, locals, url, fetch: serverFetch }) => {
	// Only allow in development
	if (!dev) {
		return new Response('Test runner is only available in development mode', { status: 403 });
	}

	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		const body = await request.json();
		const {
			categories,
			priorities,
			tags,
			testIds,
			timeout = 30000,
			maxConcurrent = 20 // Default to 20 parallel tests
		}: TestRunConfig & { maxConcurrent?: number } = body;

		// Filter test cases
		let testsToRun = [...allTestCases];

		if (testIds && testIds.length > 0) {
			testsToRun = testsToRun.filter((t) => testIds.includes(t.id));
		} else {
			if (categories && categories.length > 0) {
				testsToRun = testsToRun.filter((t) => categories.includes(t.category));
			}
			if (priorities && priorities.length > 0) {
				testsToRun = testsToRun.filter((t) => priorities.includes(t.priority));
			}
			if (tags && tags.length > 0) {
				testsToRun = testsToRun.filter((t) => t.tags && tags.some((tag) => t.tags!.includes(tag)));
			}
		}

		const baseUrl = url.origin;
		const encoder = new TextEncoder();

		// Create readable stream for SSE
		const stream = new ReadableStream({
			async start(controller) {
				// Send initial message with total count
				const initMessage = JSON.stringify({
					type: 'init',
					total: testsToRun.length,
					testIds: testsToRun.map((t) => t.id)
				});
				controller.enqueue(encoder.encode(`data: ${initMessage}\n\n`));

				// Track summary stats
				let passed = 0;
				let failed = 0;
				let completed = 0;
				const startTime = Date.now();
				const results: StreamResult[] = [];

				// Run all tests in parallel with concurrency limit
				const runTestWithTracking = async (test: AITestCase, index: number): Promise<void> => {
					try {
						const result = await runSingleTest(test, baseUrl, serverFetch, timeout);

						if (result.passed) {
							passed++;
						} else {
							failed++;
						}
						completed++;

						const streamResult: StreamResult = {
							testId: result.testId,
							passed: result.passed,
							duration: result.duration,
							error: result.error,
							validationResults: result.validationResults.map((v) => ({
								passed: v.passed,
								message: v.message
							}))
						};
						results.push(streamResult);

						// Stream the result immediately
						const resultMessage = JSON.stringify({
							type: 'result',
							index: completed - 1,
							total: testsToRun.length,
							result: streamResult,
							summary: {
								completed,
								passed,
								failed,
								passRate: ((passed / completed) * 100).toFixed(1)
							}
						});
						controller.enqueue(encoder.encode(`data: ${resultMessage}\n\n`));
					} catch (error) {
						failed++;
						completed++;

						const streamResult: StreamResult = {
							testId: test.id,
							passed: false,
							duration: 0,
							error: error instanceof Error ? error.message : 'Unknown error',
							validationResults: []
						};
						results.push(streamResult);

						// Stream error result
						const errorMessage = JSON.stringify({
							type: 'result',
							index: completed - 1,
							total: testsToRun.length,
							result: streamResult,
							summary: {
								completed,
								passed,
								failed,
								passRate: ((passed / completed) * 100).toFixed(1)
							}
						});
						controller.enqueue(encoder.encode(`data: ${errorMessage}\n\n`));
					}
				};

				// Use a semaphore pattern for concurrency control
				const semaphore = new Semaphore(maxConcurrent);
				const promises = testsToRun.map((test, index) =>
					semaphore.acquire().then(async () => {
						try {
							await runTestWithTracking(test, index);
						} finally {
							semaphore.release();
						}
					})
				);

				// Wait for all tests to complete
				await Promise.all(promises);

				// Send completion message with sorted results (failed first)
				const duration = Date.now() - startTime;
				const sortedResults = [...results].sort((a, b) => {
					// Failed first, then passed
					if (a.passed !== b.passed) return a.passed ? 1 : -1;
					// Then by duration (slowest first for failed, fastest first for passed)
					return a.passed ? a.duration - b.duration : b.duration - a.duration;
				});

				const completeMessage = JSON.stringify({
					type: 'complete',
					summary: {
						total: testsToRun.length,
						passed,
						failed,
						passRate: testsToRun.length > 0 ? ((passed / testsToRun.length) * 100).toFixed(1) : '0',
						duration
					},
					sortedResults // Include sorted results for UI to use
				});
				controller.enqueue(encoder.encode(`data: ${completeMessage}\n\n`));
				controller.close();
			}
		});

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive'
			}
		});
	} catch (error) {
		console.error('Error in streaming tests:', error);
		return new Response(
			JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to start tests' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};

/**
 * Simple semaphore for concurrency control
 */
class Semaphore {
	private permits: number;
	private waiting: Array<() => void> = [];

	constructor(permits: number) {
		this.permits = permits;
	}

	async acquire(): Promise<void> {
		if (this.permits > 0) {
			this.permits--;
			return;
		}
		return new Promise<void>((resolve) => {
			this.waiting.push(resolve);
		});
	}

	release(): void {
		if (this.waiting.length > 0) {
			const next = this.waiting.shift();
			next?.();
		} else {
			this.permits++;
		}
	}
}

/**
 * Run a single test and return the result
 */
async function runSingleTest(
	testCase: AITestCase,
	baseUrl: string,
	fetchFn: typeof fetch,
	timeout: number
): Promise<TestResult> {
	const startTime = Date.now();

	try {
		// Create abort controller for timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		// Call the AI parser
		const response = await fetchFn(`${baseUrl}/api/ai/parse`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ transcription: testCase.input }),
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			throw new Error(`API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		const duration = Date.now() - startTime;

		// Validate the response
		const validationResults = validateResponse(data, testCase);
		const passed = validationResults.every((r) => r.passed);

		return {
			testId: testCase.id,
			testCase,
			passed,
			duration,
			actualResponse: data,
			validationResults
		};
	} catch (error) {
		const duration = Date.now() - startTime;
		const errorMessage =
			error instanceof Error
				? error.name === 'AbortError'
					? `Test timed out after ${timeout}ms`
					: error.message
				: String(error);

		return {
			testId: testCase.id,
			testCase,
			passed: false,
			duration,
			actualResponse: null,
			validationResults: [],
			error: errorMessage
		};
	}
}

/**
 * Validate response against test case rules
 */
function validateResponse(response: unknown, testCase: AITestCase): ValidationResult[] {
	const results: ValidationResult[] = [];

	// First validate intent type
	const intentResult = validateRule(
		{ field: 'intentType', operator: 'equals', value: testCase.expectedIntent },
		response
	);
	results.push(intentResult);

	// Then validate all specified rules
	for (const rule of testCase.validationRules) {
		const result = validateRule(rule, response);
		results.push(result);
	}

	return results;
}

/**
 * Validate a single rule against response data
 */
function validateRule(rule: ValidationRule, response: unknown): ValidationResult {
	const actualValue = getNestedValue(response, rule.field);

	let passed = false;
	let message = '';

	switch (rule.operator) {
		case 'equals':
			if (
				rule.tolerance !== undefined &&
				typeof actualValue === 'number' &&
				typeof rule.value === 'number'
			) {
				passed = Math.abs(actualValue - rule.value) <= rule.tolerance;
				message = passed
					? `${rule.field} is approximately ${rule.value}`
					: `${rule.field}: expected ~${rule.value}, got ${actualValue}`;
			} else {
				passed = deepEquals(actualValue, rule.value);
				message = passed
					? `${rule.field} equals expected value`
					: `${rule.field}: expected ${JSON.stringify(rule.value)}, got ${JSON.stringify(actualValue)}`;
			}
			break;

		case 'contains':
			if (typeof actualValue === 'string' && typeof rule.value === 'string') {
				passed = actualValue.toLowerCase().includes(rule.value.toLowerCase());
			} else if (Array.isArray(actualValue)) {
				passed = actualValue.some((v) => deepEquals(v, rule.value));
			} else {
				passed = false;
			}
			message = passed
				? `${rule.field} contains ${rule.value}`
				: `${rule.field}: expected to contain ${rule.value}, got ${JSON.stringify(actualValue)}`;
			break;

		case 'greaterThan':
			passed =
				typeof actualValue === 'number' &&
				typeof rule.value === 'number' &&
				actualValue > rule.value;
			message = passed
				? `${rule.field} (${actualValue}) > ${rule.value}`
				: `${rule.field}: expected > ${rule.value}, got ${actualValue}`;
			break;

		case 'greaterThanOrEqual':
			passed =
				typeof actualValue === 'number' &&
				typeof rule.value === 'number' &&
				actualValue >= rule.value;
			message = passed
				? `${rule.field} (${actualValue}) >= ${rule.value}`
				: `${rule.field}: expected >= ${rule.value}, got ${actualValue}`;
			break;

		case 'exists':
			passed = actualValue !== undefined && actualValue !== null;
			message = passed ? `${rule.field} exists` : `${rule.field}: expected to exist`;
			break;

		case 'notExists':
			passed = actualValue === undefined || actualValue === null;
			message = passed
				? `${rule.field} does not exist`
				: `${rule.field}: expected to not exist, got ${JSON.stringify(actualValue)}`;
			break;

		case 'arrayLength':
			passed = Array.isArray(actualValue) && actualValue.length === rule.value;
			message = passed
				? `${rule.field} has length ${rule.value}`
				: `${rule.field}: expected length ${rule.value}, got ${Array.isArray(actualValue) ? actualValue.length : 'not an array'}`;
			break;

		case 'between':
			if (Array.isArray(rule.value) && rule.value.length === 2) {
				const [min, max] = rule.value as [number, number];
				passed = typeof actualValue === 'number' && actualValue >= min && actualValue <= max;
				message = passed
					? `${rule.field} (${actualValue}) is between ${min} and ${max}`
					: `${rule.field}: expected between ${min}-${max}, got ${actualValue}`;
			} else {
				passed = false;
				message = `${rule.field}: invalid between rule configuration`;
			}
			break;

		case 'matches':
			if (typeof actualValue === 'string' && typeof rule.value === 'string') {
				try {
					const regex = new RegExp(rule.value, 'i');
					passed = regex.test(actualValue);
				} catch {
					passed = false;
				}
			}
			message = passed
				? `${rule.field} matches pattern`
				: `${rule.field}: expected to match ${rule.value}, got ${JSON.stringify(actualValue)}`;
			break;

		default:
			passed = false;
			message = `Unknown operator: ${rule.operator}`;
	}

	return {
		rule,
		passed,
		actualValue,
		expectedValue: rule.value,
		message: rule.message || message
	};
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: unknown, path: string): unknown {
	if (!obj || typeof obj !== 'object') return undefined;

	const parts = path.split('.');
	let current: unknown = obj;

	for (const part of parts) {
		if (current === null || current === undefined) return undefined;

		const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
		if (arrayMatch) {
			const [, key, index] = arrayMatch;
			current = (current as Record<string, unknown>)[key];
			if (Array.isArray(current)) {
				current = current[parseInt(index)];
			} else {
				return undefined;
			}
		} else if (typeof current === 'object') {
			current = (current as Record<string, unknown>)[part];
		} else {
			return undefined;
		}
	}

	return current;
}

/**
 * Deep equality comparison
 */
function deepEquals(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (a === null || b === null) return a === b;
	if (typeof a !== typeof b) return false;

	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		return a.every((val, i) => deepEquals(val, b[i]));
	}

	if (typeof a === 'object' && typeof b === 'object') {
		const keysA = Object.keys(a as object);
		const keysB = Object.keys(b as object);
		if (keysA.length !== keysB.length) return false;
		return keysA.every((key) =>
			deepEquals((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
		);
	}

	return false;
}

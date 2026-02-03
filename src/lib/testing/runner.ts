// AI Test Runner
// Executes test cases against the AI parser and generates reports

import type {
	AITestCase,
	TestResult,
	ValidationResult,
	ValidationRule,
	TestRunConfig,
	TestRunReport,
	TestRunSummary,
	CategoryResult,
	TestCategory,
	TestPriority
} from './types';

// =============================================
// TEST RUNNER
// =============================================

export class AITestRunner {
	private apiEndpoint: string;
	private authToken: string | null;
	private customFetch: typeof fetch | null;

	constructor(
		apiEndpoint: string = '/api/ai/parse',
		authToken: string | null = null,
		customFetch: typeof fetch | null = null
	) {
		this.apiEndpoint = apiEndpoint;
		this.authToken = authToken;
		this.customFetch = customFetch;
	}

	/**
	 * Run a single test case
	 */
	async runTest(testCase: AITestCase): Promise<TestResult> {
		const startTime = Date.now();

		try {
			// Call the AI parser
			const response = await this.callParser(testCase.input);
			const duration = Date.now() - startTime;

			// Validate the response
			const validationResults = this.validateResponse(response, testCase);
			const passed = validationResults.every((r) => r.passed);

			return {
				testId: testCase.id,
				testCase,
				passed,
				duration,
				actualResponse: response,
				validationResults
			};
		} catch (error) {
			const duration = Date.now() - startTime;
			const errorMessage = error instanceof Error ? error.message : String(error);

			// If test expects an error, mark as passed when error occurs
			const passed = testCase.expectsError === true;

			return {
				testId: testCase.id,
				testCase,
				passed,
				duration,
				actualResponse: null,
				validationResults: passed
					? [
							{
								rule: { field: 'error', operator: 'exists' },
								passed: true,
								actualValue: errorMessage,
								expectedValue: 'error',
								message: 'Expected error occurred'
							}
						]
					: [],
				error: passed ? undefined : errorMessage
			};
		}
	}

	/**
	 * Run multiple test cases with configuration
	 */
	async runTests(testCases: AITestCase[], config: TestRunConfig = {}): Promise<TestRunReport> {
		const runId = crypto.randomUUID();
		const startTime = new Date();

		// Filter test cases based on config
		const filteredTests = this.filterTests(testCases, config);

		// Initialize results tracking
		const results: TestResult[] = [];
		const maxConcurrent = config.maxConcurrent || 1;
		const timeout = config.timeout || 30000;

		// Run tests with concurrency control
		if (maxConcurrent === 1) {
			// Sequential execution
			for (const testCase of filteredTests) {
				const result = await this.runTestWithTimeout(testCase, timeout);
				results.push(result);

				if (config.stopOnFailure && !result.passed) {
					break;
				}
			}
		} else {
			// Parallel execution with concurrency limit
			const chunks = this.chunkArray(filteredTests, maxConcurrent);
			for (const chunk of chunks) {
				const chunkResults = await Promise.all(
					chunk.map((testCase) => this.runTestWithTimeout(testCase, timeout))
				);
				results.push(...chunkResults);

				if (config.stopOnFailure && chunkResults.some((r) => !r.passed)) {
					break;
				}
			}
		}

		const endTime = new Date();
		const duration = endTime.getTime() - startTime.getTime();

		// Generate report
		return this.generateReport(runId, startTime, endTime, duration, config, results);
	}

	/**
	 * Call the AI parser API
	 */
	private async callParser(transcription: string): Promise<unknown> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json'
		};

		if (this.authToken) {
			headers['Authorization'] = `Bearer ${this.authToken}`;
		}

		// Use custom fetch if provided (for server-side with auth), otherwise use global fetch
		const fetchFn = this.customFetch || fetch;

		const response = await fetchFn(this.apiEndpoint, {
			method: 'POST',
			headers,
			body: JSON.stringify({ transcription })
		});

		if (!response.ok) {
			throw new Error(`API error: ${response.status} ${response.statusText}`);
		}

		return response.json();
	}

	/**
	 * Run test with timeout
	 */
	private async runTestWithTimeout(testCase: AITestCase, timeout: number): Promise<TestResult> {
		return new Promise((resolve) => {
			const timeoutId = setTimeout(() => {
				resolve({
					testId: testCase.id,
					testCase,
					passed: false,
					duration: timeout,
					actualResponse: null,
					validationResults: [],
					error: `Test timed out after ${timeout}ms`
				});
			}, timeout);

			this.runTest(testCase).then((result) => {
				clearTimeout(timeoutId);
				resolve(result);
			});
		});
	}

	/**
	 * Filter tests based on configuration
	 */
	private filterTests(testCases: AITestCase[], config: TestRunConfig): AITestCase[] {
		return testCases.filter((test) => {
			// Filter by specific test IDs
			if (config.testIds && config.testIds.length > 0) {
				if (!config.testIds.includes(test.id)) return false;
			}

			// Filter by categories
			if (config.categories && config.categories.length > 0) {
				if (!config.categories.includes(test.category)) return false;
			}

			// Filter by priorities
			if (config.priorities && config.priorities.length > 0) {
				if (!config.priorities.includes(test.priority)) return false;
			}

			// Filter by tags
			if (config.tags && config.tags.length > 0) {
				if (!test.tags || !config.tags.some((tag) => test.tags!.includes(tag))) return false;
			}

			return true;
		});
	}

	/**
	 * Validate response against test case rules
	 */
	private validateResponse(response: unknown, testCase: AITestCase): ValidationResult[] {
		const results: ValidationResult[] = [];

		// First validate intent type
		const intentResult = this.validateRule(
			{ field: 'intentType', operator: 'equals', value: testCase.expectedIntent },
			response
		);
		results.push(intentResult);

		// Then validate all specified rules
		for (const rule of testCase.validationRules) {
			const result = this.validateRule(rule, response);
			results.push(result);
		}

		return results;
	}

	/**
	 * Validate a single rule against response data
	 */
	private validateRule(rule: ValidationRule, response: unknown): ValidationResult {
		const actualValue = this.getNestedValue(response, rule.field);

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
					passed = this.deepEquals(actualValue, rule.value);
					message = passed
						? `${rule.field} equals expected value`
						: `${rule.field}: expected ${JSON.stringify(rule.value)}, got ${JSON.stringify(actualValue)}`;
				}
				break;

			case 'notEquals':
				passed = !this.deepEquals(actualValue, rule.value);
				message = passed
					? `${rule.field} does not equal ${JSON.stringify(rule.value)}`
					: `${rule.field}: expected not to equal ${JSON.stringify(rule.value)}`;
				break;

			case 'contains':
				if (typeof actualValue === 'string' && typeof rule.value === 'string') {
					passed = actualValue.toLowerCase().includes(rule.value.toLowerCase());
				} else if (Array.isArray(actualValue)) {
					passed = actualValue.some((v) => this.deepEquals(v, rule.value));
				} else {
					passed = false;
				}
				message = passed
					? `${rule.field} contains ${rule.value}`
					: `${rule.field}: expected to contain ${rule.value}`;
				break;

			case 'notContains':
				if (typeof actualValue === 'string' && typeof rule.value === 'string') {
					passed = !actualValue.toLowerCase().includes(rule.value.toLowerCase());
				} else if (Array.isArray(actualValue)) {
					passed = !actualValue.some((v) => this.deepEquals(v, rule.value));
				} else {
					passed = true;
				}
				message = passed
					? `${rule.field} does not contain ${rule.value}`
					: `${rule.field}: expected not to contain ${rule.value}`;
				break;

			case 'startsWith':
				passed =
					typeof actualValue === 'string' &&
					typeof rule.value === 'string' &&
					actualValue.startsWith(rule.value);
				message = passed
					? `${rule.field} starts with ${rule.value}`
					: `${rule.field}: expected to start with ${rule.value}`;
				break;

			case 'endsWith':
				passed =
					typeof actualValue === 'string' &&
					typeof rule.value === 'string' &&
					actualValue.endsWith(rule.value);
				message = passed
					? `${rule.field} ends with ${rule.value}`
					: `${rule.field}: expected to end with ${rule.value}`;
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

			case 'lessThan':
				passed =
					typeof actualValue === 'number' &&
					typeof rule.value === 'number' &&
					actualValue < rule.value;
				message = passed
					? `${rule.field} (${actualValue}) < ${rule.value}`
					: `${rule.field}: expected < ${rule.value}, got ${actualValue}`;
				break;

			case 'lessThanOrEqual':
				passed =
					typeof actualValue === 'number' &&
					typeof rule.value === 'number' &&
					actualValue <= rule.value;
				message = passed
					? `${rule.field} (${actualValue}) <= ${rule.value}`
					: `${rule.field}: expected <= ${rule.value}, got ${actualValue}`;
				break;

			case 'exists':
				passed = actualValue !== undefined;
				message = passed ? `${rule.field} exists` : `${rule.field}: expected to exist`;
				break;

			case 'notExists':
				passed = actualValue === undefined;
				message = passed ? `${rule.field} does not exist` : `${rule.field}: expected not to exist`;
				break;

			case 'isNull':
				passed = actualValue === null;
				message = passed
					? `${rule.field} is null`
					: `${rule.field}: expected null, got ${actualValue}`;
				break;

			case 'isNotNull':
				passed = actualValue !== null && actualValue !== undefined;
				message = passed ? `${rule.field} is not null` : `${rule.field}: expected not null`;
				break;

			case 'arrayLength':
				passed = Array.isArray(actualValue) && actualValue.length === rule.value;
				message = passed
					? `${rule.field} has length ${rule.value}`
					: `${rule.field}: expected length ${rule.value}, got ${Array.isArray(actualValue) ? actualValue.length : 'not an array'}`;
				break;

			case 'arrayContains':
				passed =
					Array.isArray(actualValue) && actualValue.some((v) => this.deepEquals(v, rule.value));
				message = passed
					? `${rule.field} contains ${JSON.stringify(rule.value)}`
					: `${rule.field}: expected to contain ${JSON.stringify(rule.value)}`;
				break;

			case 'between':
				if (
					Array.isArray(rule.value) &&
					rule.value.length === 2 &&
					typeof actualValue === 'number'
				) {
					const [min, max] = rule.value as [number, number];
					passed = actualValue >= min && actualValue <= max;
					message = passed
						? `${rule.field} (${actualValue}) is between ${min} and ${max}`
						: `${rule.field}: expected between ${min} and ${max}, got ${actualValue}`;
				} else {
					passed = false;
					message = `${rule.field}: invalid between rule configuration`;
				}
				break;

			case 'matches':
				if (typeof actualValue === 'string' && typeof rule.value === 'string') {
					const regex = new RegExp(rule.value, 'i');
					passed = regex.test(actualValue);
					message = passed
						? `${rule.field} matches pattern ${rule.value}`
						: `${rule.field}: expected to match ${rule.value}, got ${actualValue}`;
				} else {
					passed = false;
					message = `${rule.field}: cannot match non-string value`;
				}
				break;

			case 'typeOf':
				passed = typeof actualValue === rule.value;
				message = passed
					? `${rule.field} is type ${rule.value}`
					: `${rule.field}: expected type ${rule.value}, got ${typeof actualValue}`;
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
	private getNestedValue(obj: unknown, path: string): unknown {
		if (!obj || typeof obj !== 'object') return undefined;

		const parts = path.split('.');
		let current: unknown = obj;

		for (const part of parts) {
			if (current === null || current === undefined) return undefined;

			// Handle array index
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
	private deepEquals(a: unknown, b: unknown): boolean {
		if (a === b) return true;
		if (a === null || b === null) return a === b;
		if (typeof a !== typeof b) return false;

		if (Array.isArray(a) && Array.isArray(b)) {
			if (a.length !== b.length) return false;
			return a.every((val, i) => this.deepEquals(val, b[i]));
		}

		if (typeof a === 'object' && typeof b === 'object') {
			const keysA = Object.keys(a as object);
			const keysB = Object.keys(b as object);
			if (keysA.length !== keysB.length) return false;
			return keysA.every((key) =>
				this.deepEquals((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
			);
		}

		return false;
	}

	/**
	 * Split array into chunks
	 */
	private chunkArray<T>(array: T[], size: number): T[][] {
		const chunks: T[][] = [];
		for (let i = 0; i < array.length; i += size) {
			chunks.push(array.slice(i, i + size));
		}
		return chunks;
	}

	/**
	 * Generate test run report
	 */
	private generateReport(
		runId: string,
		startTime: Date,
		endTime: Date,
		duration: number,
		config: TestRunConfig,
		results: TestResult[]
	): TestRunReport {
		const passed = results.filter((r) => r.passed).length;
		const failed = results.filter((r) => !r.passed).length;
		const total = results.length;

		const summary: TestRunSummary = {
			total,
			passed,
			failed,
			skipped: 0,
			passRate: total > 0 ? (passed / total) * 100 : 0,
			averageDuration: total > 0 ? results.reduce((sum, r) => sum + r.duration, 0) / total : 0
		};

		// Category breakdown
		const categoryBreakdown = this.calculateCategoryBreakdown(results);

		// Priority breakdown
		const priorityBreakdown = this.calculatePriorityBreakdown(results);

		return {
			runId,
			startTime,
			endTime,
			duration,
			config,
			summary,
			categoryBreakdown,
			priorityBreakdown,
			results,
			failedTests: results.filter((r) => !r.passed)
		};
	}

	/**
	 * Calculate breakdown by category
	 */
	private calculateCategoryBreakdown(results: TestResult[]): Record<TestCategory, CategoryResult> {
		const categories: TestCategory[] = [
			'document_creation',
			'client_identification',
			'document_clone',
			'document_merge',
			'document_send',
			'document_transform',
			'information_query',
			'payment_reminder',
			'tax_handling',
			'edge_case'
		];

		const breakdown: Record<string, CategoryResult> = {};

		for (const category of categories) {
			const categoryResults = results.filter((r) => r.testCase.category === category);
			const passed = categoryResults.filter((r) => r.passed).length;
			const failed = categoryResults.filter((r) => !r.passed).length;
			const total = categoryResults.length;

			breakdown[category] = {
				total,
				passed,
				failed,
				passRate: total > 0 ? (passed / total) * 100 : 0
			};
		}

		return breakdown as Record<TestCategory, CategoryResult>;
	}

	/**
	 * Calculate breakdown by priority
	 */
	private calculatePriorityBreakdown(results: TestResult[]): Record<TestPriority, CategoryResult> {
		const priorities: TestPriority[] = ['critical', 'high', 'medium', 'low'];
		const breakdown: Record<string, CategoryResult> = {};

		for (const priority of priorities) {
			const priorityResults = results.filter((r) => r.testCase.priority === priority);
			const passed = priorityResults.filter((r) => r.passed).length;
			const failed = priorityResults.filter((r) => !r.passed).length;
			const total = priorityResults.length;

			breakdown[priority] = {
				total,
				passed,
				failed,
				passRate: total > 0 ? (passed / total) * 100 : 0
			};
		}

		return breakdown as Record<TestPriority, CategoryResult>;
	}
}

// =============================================
// REPORT FORMATTERS
// =============================================

/**
 * Format report as console output
 */
export function formatReportConsole(report: TestRunReport): string {
	const lines: string[] = [];

	lines.push('='.repeat(60));
	lines.push('AI TEST RUN REPORT');
	lines.push('='.repeat(60));
	lines.push('');
	lines.push(`Run ID: ${report.runId}`);
	lines.push(`Duration: ${report.duration}ms`);
	lines.push(`Start: ${report.startTime.toISOString()}`);
	lines.push(`End: ${report.endTime.toISOString()}`);
	lines.push('');

	// Summary
	lines.push('-'.repeat(40));
	lines.push('SUMMARY');
	lines.push('-'.repeat(40));
	lines.push(`Total:    ${report.summary.total}`);
	lines.push(`Passed:   ${report.summary.passed}`);
	lines.push(`Failed:   ${report.summary.failed}`);
	lines.push(`Pass Rate: ${report.summary.passRate.toFixed(1)}%`);
	lines.push(`Avg Time: ${report.summary.averageDuration.toFixed(0)}ms`);
	lines.push('');

	// Category breakdown
	lines.push('-'.repeat(40));
	lines.push('BY CATEGORY');
	lines.push('-'.repeat(40));
	for (const [category, result] of Object.entries(report.categoryBreakdown)) {
		if (result.total > 0) {
			lines.push(`${category}: ${result.passed}/${result.total} (${result.passRate.toFixed(1)}%)`);
		}
	}
	lines.push('');

	// Failed tests
	if (report.failedTests.length > 0) {
		lines.push('-'.repeat(40));
		lines.push('FAILED TESTS');
		lines.push('-'.repeat(40));
		for (const test of report.failedTests) {
			lines.push(`[${test.testId}] ${test.testCase.description}`);
			if (test.error) {
				lines.push(`  Error: ${test.error}`);
			}
			for (const validation of test.validationResults.filter((v) => !v.passed)) {
				lines.push(`  - ${validation.message}`);
			}
			lines.push('');
		}
	}

	lines.push('='.repeat(60));
	return lines.join('\n');
}

/**
 * Format report as JSON
 */
export function formatReportJSON(report: TestRunReport): string {
	return JSON.stringify(report, null, 2);
}

/**
 * Format report as markdown
 */
export function formatReportMarkdown(report: TestRunReport): string {
	const lines: string[] = [];

	lines.push('# AI Test Run Report');
	lines.push('');
	lines.push(`**Run ID:** ${report.runId}`);
	lines.push(`**Duration:** ${report.duration}ms`);
	lines.push(`**Start:** ${report.startTime.toISOString()}`);
	lines.push(`**End:** ${report.endTime.toISOString()}`);
	lines.push('');

	// Summary
	lines.push('## Summary');
	lines.push('');
	lines.push('| Metric | Value |');
	lines.push('|--------|-------|');
	lines.push(`| Total Tests | ${report.summary.total} |`);
	lines.push(`| Passed | ${report.summary.passed} |`);
	lines.push(`| Failed | ${report.summary.failed} |`);
	lines.push(`| Pass Rate | ${report.summary.passRate.toFixed(1)}% |`);
	lines.push(`| Avg Duration | ${report.summary.averageDuration.toFixed(0)}ms |`);
	lines.push('');

	// Category breakdown
	lines.push('## Results by Category');
	lines.push('');
	lines.push('| Category | Passed | Failed | Pass Rate |');
	lines.push('|----------|--------|--------|-----------|');
	for (const [category, result] of Object.entries(report.categoryBreakdown)) {
		if (result.total > 0) {
			lines.push(
				`| ${category} | ${result.passed} | ${result.failed} | ${result.passRate.toFixed(1)}% |`
			);
		}
	}
	lines.push('');

	// Failed tests
	if (report.failedTests.length > 0) {
		lines.push('## Failed Tests');
		lines.push('');
		for (const test of report.failedTests) {
			lines.push(`### ${test.testId}: ${test.testCase.description}`);
			lines.push('');
			lines.push(`**Input:** \`${test.testCase.input}\``);
			lines.push('');
			if (test.error) {
				lines.push(`**Error:** ${test.error}`);
				lines.push('');
			}
			const failedValidations = test.validationResults.filter((v) => !v.passed);
			if (failedValidations.length > 0) {
				lines.push('**Validation Failures:**');
				for (const validation of failedValidations) {
					lines.push(`- ${validation.message}`);
				}
				lines.push('');
			}
		}
	}

	return lines.join('\n');
}

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';
import {
	AITestRunner,
	formatReportJSON,
	formatReportMarkdown,
	formatReportConsole
} from '$lib/testing/runner';
import {
	allTestCases,
	getTestsByCategory,
	getTestsByPriority,
	getTestsByTag,
	getTestById
} from '$lib/testing/test-cases';
import type { TestRunConfig, TestCategory, TestPriority } from '$lib/testing/types';

/**
 * POST /api/testing/run
 * Run AI test suite (development only)
 */
export const POST: RequestHandler = async ({ request, locals, url, fetch: serverFetch }) => {
	// Only allow in development
	if (!dev) {
		return json({ error: 'Test runner is only available in development mode' }, { status: 403 });
	}

	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const {
			categories,
			priorities,
			tags,
			testIds,
			maxConcurrent = 1,
			timeout = 30000,
			stopOnFailure = false,
			format = 'json'
		}: TestRunConfig & { format?: 'json' | 'markdown' | 'console' } = body;

		// Build test configuration
		const config: TestRunConfig = {
			categories: categories as TestCategory[],
			priorities: priorities as TestPriority[],
			tags,
			testIds,
			maxConcurrent,
			timeout,
			stopOnFailure
		};

		// Get the base URL for API calls
		const baseUrl = url.origin;

		// Create test runner with SvelteKit's fetch (includes auth cookies automatically)
		const runner = new AITestRunner(`${baseUrl}/api/ai/parse`, null, serverFetch);

		// Run tests
		const report = await runner.runTests(allTestCases, config);

		// Format output
		let formattedOutput: string | object;
		switch (format) {
			case 'markdown':
				formattedOutput = formatReportMarkdown(report);
				break;
			case 'console':
				formattedOutput = formatReportConsole(report);
				break;
			case 'json':
			default:
				formattedOutput = report;
		}

		return json({
			success: true,
			data: formattedOutput
		});
	} catch (error) {
		console.error('Error running tests:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to run tests'
			},
			{ status: 500 }
		);
	}
};

/**
 * GET /api/testing/run
 * Get test suite information (development only)
 */
export const GET: RequestHandler = async ({ locals }) => {
	// Only allow in development
	if (!dev) {
		return json({ error: 'Test runner is only available in development mode' }, { status: 403 });
	}

	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Return test suite statistics
	const stats = {
		total: allTestCases.length,
		byCategory: {
			document_creation: getTestsByCategory('document_creation').length,
			information_query: getTestsByCategory('information_query').length,
			document_clone: getTestsByCategory('document_clone').length,
			document_merge: getTestsByCategory('document_merge').length,
			document_send: getTestsByCategory('document_send').length,
			document_transform: getTestsByCategory('document_transform').length,
			tax_handling: getTestsByCategory('tax_handling').length,
			edge_case: getTestsByCategory('edge_case').length
		},
		byPriority: {
			critical: getTestsByPriority('critical').length,
			high: getTestsByPriority('high').length,
			medium: getTestsByPriority('medium').length,
			low: getTestsByPriority('low').length
		},
		availableCategories: [
			'document_creation',
			'information_query',
			'document_clone',
			'document_merge',
			'document_send',
			'document_transform',
			'tax_handling',
			'edge_case'
		],
		availablePriorities: ['critical', 'high', 'medium', 'low']
	};

	return json({
		success: true,
		data: stats
	});
};

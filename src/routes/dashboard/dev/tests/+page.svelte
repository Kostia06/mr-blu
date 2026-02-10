<script lang="ts">
	import { fly, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { SCROLL_DOWN_THRESHOLD, SCROLL_UP_THRESHOLD, SCROLL_HEADER_MIN_Y } from '$lib/constants';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Check from 'lucide-svelte/icons/check';
	import Search from 'lucide-svelte/icons/search';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import FileJson from 'lucide-svelte/icons/file-json';
	import FileText from 'lucide-svelte/icons/file-text';
	import Clipboard from 'lucide-svelte/icons/clipboard';
	import Clock from 'lucide-svelte/icons/clock';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import { StatsSection, FiltersSection, TestResultRow } from './components';
	import { allTestCases } from '$lib/testing/test-cases';
	import type {
		AITestCase,
		TestCategory,
		TestPriority,
		TestRunReport,
		TestResult,
		ValidationResult
	} from '$lib/testing/types';

	// Scroll-based header visibility
	let headerHidden = $state(false);
	let lastScrollY = $state(0);
	let ticking = $state(false);

	function handleScroll() {
		const currentScrollY = window.scrollY;

		if (!ticking) {
			requestAnimationFrame(() => {
				const delta = currentScrollY - lastScrollY;

				if (delta > SCROLL_DOWN_THRESHOLD && currentScrollY > SCROLL_HEADER_MIN_Y) {
					headerHidden = true;
				} else if (delta < -SCROLL_UP_THRESHOLD || currentScrollY <= SCROLL_HEADER_MIN_Y) {
					headerHidden = false;
				}

				lastScrollY = currentScrollY;
				ticking = false;
			});
			ticking = true;
		}
	}

	onMount(() => {
		window.addEventListener('scroll', handleScroll, { passive: true });
		fetchStats();
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('scroll', handleScroll);
		}
	});

	// Stats state
	interface TestStats {
		total: number;
		byCategory: Record<string, number>;
		byPriority: Record<string, number>;
		availableCategories: string[];
		availablePriorities: string[];
	}

	let stats = $state<TestStats | null>(null);
	let statsLoading = $state(true);
	let statsError = $state<string | null>(null);

	// Filter state
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

	const priorities: TestPriority[] = ['critical', 'high', 'medium', 'low'];

	let selectedCategories = new SvelteSet<TestCategory>(categories);
	let selectedPriorities = new SvelteSet<TestPriority>(priorities);
	let searchQuery = $state('');

	// Test execution state
	let isRunning = $state(false);
	let testReport = $state<TestRunReport | null>(null);
	let runError = $state<string | null>(null);
	let progress = $state(0);
	let estimatedTimeRemaining = $state<number | null>(null);
	let startTime = $state<number | null>(null);

	// Streaming results - stores results as they come in
	let streamingResults = $state<Map<string, StreamingTestResult>>(new Map());
	let completedCount = $state(0);
	let streamingSummary = $state<{ passed: number; failed: number; passRate: string } | null>(null);

	// Timeout configuration (in seconds)
	let testTimeout = $state(30);
	const minTimeout = 5;
	const maxTimeout = 120;

	interface StreamingTestResult {
		testId: string;
		passed: boolean;
		duration: number;
		error?: string;
		validationResults: Array<{ passed: boolean; message: string }>;
	}

	// UI state
	let expandedTestId = $state<string | null>(null);
	let copiedToClipboard = $state(false);

	// Sort state
	type SortOption = 'default' | 'status' | 'duration' | 'category';
	let sortBy = $state<SortOption>('default');

	// Concurrency control
	let maxConcurrent = $state(20);
	const minConcurrent = 1;
	const maxConcurrentLimit = 50;

	// Filtered and sorted tests based on current selection
	const filteredTests = $derived.by(() => {
		let tests = allTestCases.filter((test) => {
			const matchesCategory = selectedCategories.has(test.category);
			const matchesPriority = selectedPriorities.has(test.priority);
			const matchesSearch =
				searchQuery === '' ||
				test.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
				test.description.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesCategory && matchesPriority && matchesSearch;
		});

		// Apply sorting based on results
		if (sortBy !== 'default' && (streamingResults.size > 0 || testReport)) {
			tests = [...tests].sort((a, b) => {
				const resultA = getStreamingResult(a.id) || getTestResult(a.id);
				const resultB = getStreamingResult(b.id) || getTestResult(b.id);

				switch (sortBy) {
					case 'status':
						// Failed first, then passed, then pending
						if (!resultA && !resultB) return 0;
						if (!resultA) return 1;
						if (!resultB) return -1;
						if (resultA.passed !== resultB.passed) return resultA.passed ? 1 : -1;
						return 0;

					case 'duration':
						// Slowest first
						const durationA = resultA?.duration ?? 0;
						const durationB = resultB?.duration ?? 0;
						return durationB - durationA;

					case 'category':
						return a.category.localeCompare(b.category);

					default:
						return 0;
				}
			});
		}

		return tests;
	});

	// Get result for a specific test
	function getTestResult(testId: string): TestResult | undefined {
		return testReport?.results.find((r) => r.testId === testId);
	}

	// Statistics from report
	const reportStats = $derived.by(() => {
		if (!testReport) return null;
		return {
			total: testReport.summary.total,
			passed: testReport.summary.passed,
			failed: testReport.summary.failed,
			passRate: testReport.summary.passRate
		};
	});

	// Fetch initial stats
	async function fetchStats() {
		statsLoading = true;
		statsError = null;

		try {
			const response = await fetch('/api/testing/run');
			if (!response.ok) {
				throw new Error('Failed to fetch test statistics');
			}
			const data = await response.json();
			if (data.success) {
				stats = data.data;
			} else {
				throw new Error(data.error || 'Unknown error');
			}
		} catch (error) {
			statsError = error instanceof Error ? error.message : 'Failed to load statistics';
		} finally {
			statsLoading = false;
		}
	}

	// Active EventSource for cleanup
	let activeEventSource: EventSource | null = null;

	// Run tests with streaming
	async function runTests(runAll = false) {
		isRunning = true;
		runError = null;
		testReport = null;
		progress = 0;
		startTime = Date.now();
		completedCount = 0;
		streamingResults = new Map();
		streamingSummary = null;

		const testsToRun = runAll ? allTestCases : filteredTests;
		const totalTests = testsToRun.length;

		if (totalTests === 0) {
			isRunning = false;
			runError = 'No tests selected to run';
			return;
		}

		// Build request body
		const body: {
			categories?: TestCategory[];
			priorities?: TestPriority[];
			testIds?: string[];
			timeout: number;
			maxConcurrent: number;
		} = {
			timeout: testTimeout * 1000, // Convert to milliseconds
			maxConcurrent // Run tests in parallel
		};

		// Auto-sort by status when running
		sortBy = 'status';

		if (!runAll) {
			body.categories = Array.from(selectedCategories);
			body.priorities = Array.from(selectedPriorities);
			if (searchQuery) {
				body.testIds = testsToRun.map((t) => t.id);
			}
		}

		try {
			// Use POST with fetch first to get the stream
			const response = await fetch('/api/testing/stream', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			if (!response.ok) {
				throw new Error('Failed to start test stream');
			}

			if (!response.body) {
				throw new Error('No response body received');
			}

			// Read the stream
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();

				if (done) break;

				buffer += decoder.decode(value, { stream: true });

				// Process complete SSE messages
				const lines = buffer.split('\n\n');
				buffer = lines.pop() || ''; // Keep incomplete message in buffer

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const data = line.slice(6);
						try {
							const message = JSON.parse(data);
							handleStreamMessage(message, totalTests);
						} catch {
							console.warn('Failed to parse SSE message:', data);
						}
					}
				}
			}

			// Process any remaining buffer
			if (buffer.startsWith('data: ')) {
				try {
					const message = JSON.parse(buffer.slice(6));
					handleStreamMessage(message, totalTests);
				} catch {
					// Ignore incomplete messages
				}
			}
		} catch (error) {
			runError = error instanceof Error ? error.message : 'Failed to run tests';
		} finally {
			isRunning = false;
			estimatedTimeRemaining = null;
		}
	}

	// Handle incoming stream messages
	function handleStreamMessage(
		message: {
			type: string;
			total?: number;
			testIds?: string[];
			index?: number;
			result?: StreamingTestResult;
			summary?: {
				completed?: number;
				passed: number;
				failed: number;
				passRate: string;
				duration?: number;
				total?: number;
			};
		},
		totalTests: number
	) {
		switch (message.type) {
			case 'init':
				// Test run started
				progress = 0;
				break;

			case 'result':
				if (message.result) {
					// Store the result
					streamingResults.set(message.result.testId, message.result);
					streamingResults = new Map(streamingResults); // Trigger reactivity

					// Update progress
					completedCount = (message.index ?? 0) + 1;
					progress = (completedCount / totalTests) * 100;

					// Update running summary
					if (message.summary) {
						streamingSummary = {
							passed: message.summary.passed,
							failed: message.summary.failed,
							passRate: message.summary.passRate
						};
					}

					// Calculate estimated time remaining
					const elapsed = (Date.now() - (startTime || Date.now())) / 1000;
					const avgTimePerTest = elapsed / completedCount;
					const remaining = totalTests - completedCount;
					estimatedTimeRemaining = Math.round(avgTimePerTest * remaining);
				}
				break;

			case 'complete':
				// Test run completed - build full report
				progress = 100;
				if (message.summary) {
					buildFinalReport(message.summary);
				}
				break;
		}
	}

	// Build the final test report from streaming results
	function buildFinalReport(summary: {
		total?: number;
		passed: number;
		failed: number;
		passRate: string;
		duration?: number;
	}) {
		const results: TestResult[] = [];
		const categoryBreakdown: Record<
			string,
			{ total: number; passed: number; failed: number; passRate: number }
		> = {};

		for (const [testId, streamResult] of streamingResults) {
			const testCase = allTestCases.find((t) => t.id === testId);
			if (!testCase) continue;

			const result: TestResult = {
				testId,
				testCase,
				passed: streamResult.passed,
				duration: streamResult.duration,
				actualResponse: null, // Not available in streaming
				validationResults: streamResult.validationResults.map((v) => ({
					rule: { field: '', operator: 'exists' as const },
					passed: v.passed,
					actualValue: undefined,
					expectedValue: undefined,
					message: v.message
				})),
				error: streamResult.error
			};
			results.push(result);

			// Update category breakdown
			const cat = testCase.category;
			if (!categoryBreakdown[cat]) {
				categoryBreakdown[cat] = { total: 0, passed: 0, failed: 0, passRate: 0 };
			}
			categoryBreakdown[cat].total++;
			if (streamResult.passed) {
				categoryBreakdown[cat].passed++;
			} else {
				categoryBreakdown[cat].failed++;
			}
		}

		// Calculate pass rates for categories
		for (const cat of Object.keys(categoryBreakdown)) {
			const b = categoryBreakdown[cat];
			b.passRate = b.total > 0 ? (b.passed / b.total) * 100 : 0;
		}

		const totalDuration = summary.duration ?? Date.now() - (startTime || Date.now());
		const totalTests = summary.total ?? results.length;

		testReport = {
			runId: `run-${Date.now()}`,
			startTime: new Date(startTime || Date.now()),
			endTime: new Date(),
			duration: totalDuration,
			config: {},
			summary: {
				total: totalTests,
				passed: summary.passed,
				failed: summary.failed,
				skipped: 0,
				passRate: parseFloat(summary.passRate),
				averageDuration: totalTests > 0 ? totalDuration / totalTests : 0
			},
			categoryBreakdown: categoryBreakdown as TestRunReport['categoryBreakdown'],
			priorityBreakdown: {} as TestRunReport['priorityBreakdown'],
			results,
			failedTests: results.filter((r) => !r.passed)
		};
	}

	// Get streaming result for a test
	function getStreamingResult(testId: string): StreamingTestResult | undefined {
		return streamingResults.get(testId);
	}

	// Toggle category filter
	function toggleCategory(category: TestCategory) {
		if (selectedCategories.has(category)) {
			selectedCategories.delete(category);
		} else {
			selectedCategories.add(category);
		}
	}

	// Toggle priority filter
	function togglePriority(priority: TestPriority) {
		if (selectedPriorities.has(priority)) {
			selectedPriorities.delete(priority);
		} else {
			selectedPriorities.add(priority);
		}
	}

	// Select/deselect all categories
	function toggleAllCategories() {
		if (selectedCategories.size === categories.length) {
			selectedCategories.clear();
		} else {
			categories.forEach((c) => selectedCategories.add(c));
		}
	}

	// Select/deselect all priorities
	function toggleAllPriorities() {
		if (selectedPriorities.size === priorities.length) {
			selectedPriorities.clear();
		} else {
			priorities.forEach((p) => selectedPriorities.add(p));
		}
	}

	// Toggle test details
	function toggleTestDetails(testId: string) {
		expandedTestId = expandedTestId === testId ? null : testId;
	}

	// Export functions
	function downloadJSON() {
		if (!testReport) return;
		const blob = new Blob([JSON.stringify(testReport, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `test-report-${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function downloadMarkdown() {
		if (!testReport) return;
		const md = generateMarkdownReport(testReport);
		const blob = new Blob([md], { type: 'text/markdown' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `test-report-${new Date().toISOString().slice(0, 10)}.md`;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function copyToClipboard() {
		if (!testReport) return;
		const md = generateMarkdownReport(testReport);
		await navigator.clipboard.writeText(md);
		copiedToClipboard = true;
		setTimeout(() => (copiedToClipboard = false), 2000);
	}

	function generateMarkdownReport(report: TestRunReport): string {
		const lines: string[] = [
			'# AI Parser Test Report',
			'',
			`**Run Date:** ${new Date(report.startTime).toLocaleString()}`,
			`**Duration:** ${(report.duration / 1000).toFixed(2)}s`,
			'',
			'## Summary',
			'',
			`| Metric | Value |`,
			`|--------|-------|`,
			`| Total Tests | ${report.summary.total} |`,
			`| Passed | ${report.summary.passed} |`,
			`| Failed | ${report.summary.failed} |`,
			`| Pass Rate | ${report.summary.passRate.toFixed(1)}% |`,
			'',
			'## Category Breakdown',
			'',
			'| Category | Total | Passed | Failed | Pass Rate |',
			'|----------|-------|--------|--------|-----------|'
		];

		for (const [category, result] of Object.entries(report.categoryBreakdown)) {
			lines.push(
				`| ${category} | ${result.total} | ${result.passed} | ${result.failed} | ${result.passRate.toFixed(1)}% |`
			);
		}

		lines.push('', '## Failed Tests', '');

		if (report.failedTests.length === 0) {
			lines.push('No failed tests! All tests passed.');
		} else {
			for (const test of report.failedTests) {
				lines.push(`### ${test.testId}: ${test.testCase.description}`, '');
				lines.push(`**Input:** ${test.testCase.input}`, '');
				if (test.error) {
					lines.push(`**Error:** ${test.error}`, '');
				}
				const failedValidations = test.validationResults.filter((v) => !v.passed);
				if (failedValidations.length > 0) {
					lines.push('**Failed Validations:**', '');
					for (const v of failedValidations) {
						lines.push(`- ${v.message}`);
					}
				}
				lines.push('');
			}
		}

		return lines.join('\n');
	}

	// Format category name for display
	function formatCategory(category: string): string {
		return category
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	// Format priority with color class
	function getPriorityClass(priority: TestPriority): string {
		switch (priority) {
			case 'critical':
				return 'priority-critical';
			case 'high':
				return 'priority-high';
			case 'medium':
				return 'priority-medium';
			case 'low':
				return 'priority-low';
			default:
				return '';
		}
	}

	// Format duration
	function formatDuration(ms: number): string {
		if (ms < 1000) return `${ms}ms`;
		return `${(ms / 1000).toFixed(2)}s`;
	}
</script>

<main class="tests-page">
	<!-- Header -->
	<header
		class="page-header"
		class:header-hidden={headerHidden}
		in:fly={{ y: -20, duration: 400, easing: cubicOut }}
	>
		<button class="back-btn" onclick={() => goto('/dashboard')} aria-label="Back to dashboard">
			<ChevronLeft size={22} strokeWidth={2} />
		</button>
		<div class="header-title-group">
			<h1 class="page-title">AI Parser Test Suite</h1>
			<span class="dev-badge">DEV ONLY</span>
		</div>
		<div class="header-count">{allTestCases.length} tests</div>
	</header>

	<div class="page-content" in:fly={{ y: 20, duration: 500, delay: 100, easing: cubicOut }}>
		<!-- Stats Cards -->
		<StatsSection
			{stats}
			loading={statsLoading}
			error={statsError}
			onretry={fetchStats}
			{formatCategory}
		/>

		<!-- Filter Controls -->
		<FiltersSection
			{categories}
			{priorities}
			{selectedCategories}
			{selectedPriorities}
			bind:searchQuery
			bind:testTimeout
			bind:maxConcurrent
			{minTimeout}
			{maxTimeout}
			{minConcurrent}
			{maxConcurrentLimit}
			bind:sortBy
			{isRunning}
			filteredTestCount={filteredTests.length}
			{formatCategory}
			{getPriorityClass}
			ontogglecategory={toggleCategory}
			ontogglepriority={togglePriority}
			ontoggleallcategories={toggleAllCategories}
			ontoggleallpriorities={toggleAllPriorities}
			onrunselected={() => runTests(false)}
			onrunall={() => runTests(true)}
		/>

		<!-- Progress Indicator -->
		{#if isRunning}
			<section class="progress-section" in:slide={{ duration: 300 }}>
				<div class="progress-header">
					<span class="progress-title">Running Tests...</span>
					<div class="progress-meta">
						{#if streamingSummary}
							<span class="live-stats">
								<span class="live-passed">
									<CheckCircle2 size={14} />
									{streamingSummary.passed}
								</span>
								<span class="live-failed">
									<XCircle size={14} />
									{streamingSummary.failed}
								</span>
								<span class="live-rate">{streamingSummary.passRate}%</span>
							</span>
						{/if}
						{#if estimatedTimeRemaining !== null && estimatedTimeRemaining > 0}
							<span class="progress-time">
								<Clock size={14} />
								~{estimatedTimeRemaining}s
							</span>
						{/if}
					</div>
				</div>
				<div class="progress-bar">
					<div class="progress-fill" style="width: {progress}%"></div>
				</div>
				<div class="progress-footer">
					<span class="progress-count">{completedCount} / {filteredTests.length} tests</span>
					<span class="progress-percent">{Math.round(progress)}%</span>
				</div>
			</section>
		{/if}

		<!-- Test Results Summary -->
		{#if testReport && reportStats}
			<section class="results-summary" in:fly={{ y: 20, duration: 400 }}>
				<h2 class="section-title">Results</h2>
				<div class="summary-bar">
					<div class="summary-stat total">
						<span class="summary-value">{reportStats?.total}</span>
						<span class="summary-label">Total</span>
					</div>
					<div class="summary-stat passed">
						<CheckCircle2 size={18} />
						<span class="summary-value">{reportStats?.passed}</span>
						<span class="summary-label">Passed</span>
					</div>
					<div class="summary-stat failed">
						<XCircle size={18} />
						<span class="summary-value">{reportStats?.failed}</span>
						<span class="summary-label">Failed</span>
					</div>
					<div class="summary-stat rate" class:success={reportStats!.passRate >= 80}>
						<span class="summary-value">{reportStats?.passRate.toFixed(1)}%</span>
						<span class="summary-label">Pass Rate</span>
					</div>
				</div>

				<!-- Export Options -->
				<div class="export-options">
					<button class="export-btn" onclick={downloadJSON}>
						<FileJson size={16} />
						<span>JSON</span>
					</button>
					<button class="export-btn" onclick={downloadMarkdown}>
						<FileText size={16} />
						<span>Markdown</span>
					</button>
					<button class="export-btn" onclick={copyToClipboard}>
						{#if copiedToClipboard}
							<Check size={16} />
							<span>Copied!</span>
						{:else}
							<Clipboard size={16} />
							<span>Copy</span>
						{/if}
					</button>
				</div>
			</section>
		{/if}

		<!-- Error Display -->
		{#if runError}
			<div class="error-banner" in:fly={{ y: 20, duration: 300 }}>
				<AlertTriangle size={20} />
				<span>{runError}</span>
			</div>
		{/if}

		<!-- Test List -->
		<section class="tests-list-section">
			<h2 class="section-title">
				Tests
				<span class="test-count">({filteredTests.length})</span>
			</h2>

			<div class="tests-table">
				<div class="table-header">
					<span class="col-status">Status</span>
					<span class="col-id">ID</span>
					<span class="col-category">Category</span>
					<span class="col-description">Description</span>
					<span class="col-priority">Priority</span>
					<span class="col-duration">Duration</span>
				</div>

				<div class="table-body">
					{#each filteredTests as test, i (test.id)}
						<TestResultRow
							{test}
							index={i}
							result={getTestResult(test.id)}
							streamResult={getStreamingResult(test.id)}
							{isRunning}
							isExpanded={expandedTestId === test.id}
							ontoggle={() => toggleTestDetails(test.id)}
							{formatCategory}
							{getPriorityClass}
							{formatDuration}
						/>
					{/each}
				</div>
			</div>

			{#if filteredTests.length === 0}
				<div class="empty-state">
					<Search size={32} strokeWidth={1.5} />
					<h3>No tests match your filters</h3>
					<p>Try adjusting your search or filter criteria</p>
				</div>
			{/if}
		</section>
	</div>
</main>

<style>
	.tests-page {
		min-height: 100vh;
		min-height: 100dvh;
		background: transparent;
		padding-bottom: 120px;
	}

	/* Header */
	.page-header {
		position: sticky;
		top: 0;
		z-index: var(--z-sticky);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: var(--space-3) var(--page-padding-x);
		padding-top: calc(var(--space-3) + var(--safe-area-top, 0px));
		background: var(--glass-white-70, rgba(255, 255, 255, 0.7));
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		transition:
			transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
			opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		will-change: transform, opacity;
	}

	.page-header.header-hidden {
		transform: translateY(-100%);
		opacity: 0;
		pointer-events: none;
	}

	.back-btn {
		width: var(--btn-height-md, 40px);
		height: var(--btn-height-md, 40px);
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--glass-white-50);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: none;
		border-radius: var(--radius-button, 14px);
		color: var(--gray-600);
		cursor: pointer;
		transition: all var(--duration-fast) ease;
		flex-shrink: 0;
	}

	.back-btn:hover {
		background: var(--glass-white-70);
		color: var(--gray-900);
	}

	.back-btn:active {
		transform: scale(0.95);
	}

	.header-title-group {
		display: flex;
		align-items: center;
		gap: 10px;
		flex: 1;
		min-width: 0;
	}

	.page-title {
		font-family: var(--font-display, system-ui);
		font-size: 18px;
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		margin: 0;
		letter-spacing: -0.02em;
		white-space: nowrap;
	}

	.dev-badge {
		display: inline-flex;
		align-items: center;
		padding: 4px 10px;
		background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
		border-radius: 100px;
		font-size: 10px;
		font-weight: 700;
		color: white;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.header-count {
		font-size: 13px;
		font-weight: 600;
		color: var(--gray-500);
		white-space: nowrap;
	}

	/* Page Content */
	.page-content {
		padding: var(--page-padding-x, 20px);
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--section-gap, 24px);
	}

	/* Section Title */
	.section-title {
		font-family: var(--font-display, system-ui);
		font-size: 16px;
		font-weight: 700;
		color: var(--gray-900);
		margin: 0 0 16px 0;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.test-count {
		font-size: 14px;
		font-weight: 500;
		color: var(--gray-500);
	}

	/* Stats Section */
	.stats-section {
		margin-bottom: 8px;
	}

	.stats-loading,
	.stats-error {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 32px;
		background: var(--glass-white-50);
		border-radius: var(--radius-xl, 16px);
		color: var(--gray-500);
		font-size: 14px;
	}

	.stats-error {
		color: var(--data-red);
	}

	.stats-error button {
		padding: 6px 14px;
		background: var(--data-red);
		border: none;
		border-radius: 100px;
		color: white;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
	}

	.stat-card {
		padding: 20px;
		background: var(--glass-white-50);
		border-radius: var(--radius-xl, 16px);
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.stat-card.primary {
		background: linear-gradient(135deg, var(--blu-primary, #0066ff) 0%, #0ea5e9 100%);
		color: white;
	}

	.stat-card.primary .stat-icon {
		background: rgba(255, 255, 255, 0.2);
		color: white;
	}

	.stat-icon {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 102, 255, 0.1);
		border-radius: 14px;
		color: var(--blu-primary);
		flex-shrink: 0;
	}

	.stat-info {
		display: flex;
		flex-direction: column;
	}

	.stat-value {
		font-family: var(--font-display);
		font-size: 28px;
		font-weight: 700;
		line-height: 1.1;
	}

	.stat-label {
		font-size: 13px;
		opacity: 0.8;
	}

	.stat-content {
		width: 100%;
	}

	.stat-mini-label {
		font-size: 12px;
		font-weight: 600;
		color: var(--gray-500);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 12px;
		display: block;
	}

	.stat-breakdown {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
	}

	.stat-breakdown.priorities {
		grid-template-columns: repeat(4, 1fr);
	}

	.breakdown-item {
		display: flex;
		flex-direction: column;
		padding: 8px;
		background: var(--glass-white-50);
		border-radius: 8px;
	}

	.breakdown-label {
		font-size: 11px;
		color: var(--gray-500);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.breakdown-value {
		font-family: var(--font-display);
		font-size: 16px;
		font-weight: 700;
		color: var(--gray-900);
	}

	.breakdown-item.critical .breakdown-value {
		color: var(--data-red);
	}

	.breakdown-item.high .breakdown-value {
		color: #f59e0b;
	}

	.breakdown-item.medium .breakdown-value {
		color: var(--blu-primary);
	}

	.breakdown-item.low .breakdown-value {
		color: var(--gray-500);
	}

	/* Filters Section */
	.filters-section {
		padding: 24px;
		background: var(--glass-white-50);
		border-radius: var(--radius-xl, 16px);
	}

	.filters-section .section-title {
		margin-bottom: 20px;
	}

	.search-wrapper {
		position: relative;
		margin-bottom: 20px;
	}

	.search-wrapper :global(.search-icon) {
		position: absolute;
		left: 16px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--gray-400);
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 14px 16px 14px 48px;
		background: white;
		border: 1px solid var(--gray-200);
		border-radius: 12px;
		font-size: 14px;
		color: var(--gray-900);
		transition: all 0.2s ease;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--blu-primary);
		box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
	}

	.search-input::placeholder {
		color: var(--gray-400);
	}

	.filter-group {
		margin-bottom: 20px;
	}

	.filter-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.filter-label {
		font-size: 13px;
		font-weight: 600;
		color: var(--gray-700);
	}

	.toggle-all-btn {
		padding: 4px 12px;
		background: transparent;
		border: 1px solid var(--gray-200);
		border-radius: 100px;
		font-size: 12px;
		font-weight: 500;
		color: var(--gray-600);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.toggle-all-btn:hover {
		background: var(--gray-100);
		border-color: var(--gray-300);
	}

	.checkbox-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 8px;
	}

	.checkbox-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.checkbox-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		background: white;
		border: 1px solid var(--gray-200);
		border-radius: 10px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.checkbox-item:hover {
		border-color: var(--gray-300);
	}

	.checkbox-item:has(input:checked) {
		background: rgba(0, 102, 255, 0.05);
		border-color: var(--blu-primary);
	}

	.checkbox-item input {
		width: 16px;
		height: 16px;
		accent-color: var(--blu-primary);
		cursor: pointer;
	}

	.checkbox-label {
		font-size: 13px;
		color: var(--gray-700);
		text-transform: capitalize;
	}

	.checkbox-item.priority.priority-critical:has(input:checked) {
		background: rgba(239, 68, 68, 0.08);
		border-color: var(--data-red);
	}

	.checkbox-item.priority.priority-high:has(input:checked) {
		background: rgba(245, 158, 11, 0.08);
		border-color: #f59e0b;
	}

	.checkbox-item.priority.priority-medium:has(input:checked) {
		background: rgba(0, 102, 255, 0.05);
		border-color: var(--blu-primary);
	}

	/* Execution Configuration */
	.config-row {
		display: flex;
		gap: 20px;
	}

	.config-half {
		flex: 1;
		margin-bottom: 0 !important;
	}

	/* Timeout Configuration */
	.timeout-slider-wrapper {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.timeout-min,
	.timeout-max {
		font-size: 12px;
		font-weight: 500;
		color: var(--gray-500);
		min-width: 32px;
	}

	.timeout-slider {
		flex: 1;
		height: 6px;
		appearance: none;
		-webkit-appearance: none;
		background: var(--gray-200);
		border-radius: 100px;
		cursor: pointer;
	}

	.timeout-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 20px;
		height: 20px;
		background: var(--blu-primary);
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 102, 255, 0.3);
		transition: transform 0.15s ease;
	}

	.timeout-slider::-webkit-slider-thumb:hover {
		transform: scale(1.1);
	}

	.timeout-slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		background: var(--blu-primary);
		border: none;
		border-radius: 50%;
		cursor: pointer;
	}

	.timeout-value {
		font-size: 13px;
		font-weight: 600;
		color: var(--blu-primary);
	}

	.timeout-hint {
		font-size: 12px;
		color: var(--gray-500);
		margin: 8px 0 0;
	}

	.timeout-slider.concurrent {
		accent-color: #10b981;
	}

	/* Sort Options */
	.sort-options {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.sort-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		background: white;
		border: 1px solid var(--gray-200);
		border-radius: 100px;
		font-size: 13px;
		font-weight: 500;
		color: var(--gray-600);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.sort-btn:hover {
		background: var(--gray-50);
		border-color: var(--gray-300);
	}

	.sort-btn.active {
		background: var(--blu-primary);
		border-color: var(--blu-primary);
		color: white;
	}

	/* Action Buttons */
	.action-buttons {
		display: flex;
		gap: 12px;
		padding-top: 8px;
	}

	.run-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 14px 24px;
		border: none;
		border-radius: 12px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		flex: 1;
	}

	.run-btn.primary {
		background: linear-gradient(135deg, var(--blu-primary) 0%, #0ea5e9 100%);
		color: white;
		box-shadow: 0 4px 12px rgba(0, 102, 255, 0.25);
	}

	.run-btn.primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 102, 255, 0.35);
	}

	.run-btn.secondary {
		background: white;
		color: var(--gray-700);
		border: 1px solid var(--gray-200);
	}

	.run-btn.secondary:hover:not(:disabled) {
		background: var(--gray-50);
		border-color: var(--gray-300);
	}

	.run-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Progress Section */
	.progress-section {
		padding: 20px;
		background: var(--glass-white-50);
		border-radius: var(--radius-xl, 16px);
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.progress-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--gray-900);
	}

	.progress-time {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		color: var(--gray-500);
	}

	.progress-bar {
		height: 8px;
		background: var(--gray-100);
		border-radius: 100px;
		overflow: hidden;
		margin-bottom: 8px;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--blu-primary) 0%, #0ea5e9 100%);
		border-radius: 100px;
		transition: width 0.3s ease;
	}

	.progress-meta {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.live-stats {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.live-passed,
	.live-failed {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 13px;
		font-weight: 600;
	}

	.live-passed {
		color: var(--data-green);
	}

	.live-failed {
		color: var(--data-red);
	}

	.live-rate {
		font-size: 13px;
		font-weight: 600;
		color: var(--gray-600);
		padding: 2px 8px;
		background: var(--glass-white-50);
		border-radius: 100px;
	}

	.progress-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.progress-count {
		font-size: 12px;
		color: var(--gray-500);
	}

	.progress-percent {
		font-size: 12px;
		font-weight: 600;
		color: var(--gray-500);
	}

	/* Results Summary */
	.results-summary {
		padding: 24px;
		background: var(--glass-white-50);
		border-radius: var(--radius-xl, 16px);
	}

	.summary-bar {
		display: flex;
		gap: 16px;
		margin-bottom: 20px;
		flex-wrap: wrap;
	}

	.summary-stat {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 20px;
		background: white;
		border-radius: 12px;
		flex: 1;
		min-width: 100px;
	}

	.summary-stat.passed {
		background: rgba(16, 185, 129, 0.1);
		color: var(--data-green);
	}

	.summary-stat.failed {
		background: rgba(239, 68, 68, 0.1);
		color: var(--data-red);
	}

	.summary-stat.rate {
		background: var(--gray-100);
	}

	.summary-stat.rate.success {
		background: rgba(16, 185, 129, 0.1);
		color: var(--data-green);
	}

	.summary-value {
		font-family: var(--font-display);
		font-size: 20px;
		font-weight: 700;
	}

	.summary-label {
		font-size: 12px;
		opacity: 0.8;
	}

	/* Export Options */
	.export-options {
		display: flex;
		gap: 8px;
	}

	.export-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 16px;
		background: white;
		border: 1px solid var(--gray-200);
		border-radius: 10px;
		font-size: 13px;
		font-weight: 500;
		color: var(--gray-700);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.export-btn:hover {
		background: var(--gray-50);
		border-color: var(--gray-300);
	}

	/* Error Banner */
	.error-banner {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px 20px;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: 12px;
		color: var(--data-red);
		font-size: 14px;
	}

	/* Tests List Section */
	.tests-list-section {
		padding: 24px;
		background: var(--glass-white-50);
		border-radius: var(--radius-xl, 16px);
	}

	.tests-table {
		border: 1px solid var(--gray-200);
		border-radius: 12px;
		overflow: hidden;
	}

	.table-header {
		display: grid;
		grid-template-columns: 60px 80px 140px 1fr 90px 80px 40px;
		gap: 12px;
		padding: 14px 16px;
		background: var(--gray-50);
		font-size: 12px;
		font-weight: 600;
		color: var(--gray-500);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.table-body {
		max-height: 600px;
		overflow-y: auto;
	}

	.test-row {
		border-bottom: 1px solid var(--gray-100);
	}

	.test-row:last-child {
		border-bottom: none;
	}

	.test-row.passed {
		background: rgba(16, 185, 129, 0.03);
	}

	.test-row.failed {
		background: rgba(239, 68, 68, 0.03);
	}

	.test-row-main {
		display: grid;
		grid-template-columns: 60px 80px 140px 1fr 90px 80px 40px;
		gap: 12px;
		padding: 14px 16px;
		width: 100%;
		background: transparent;
		border: none;
		text-align: left;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.test-row-main:hover {
		background: var(--glass-white-50);
	}

	.col-status {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.col-id {
		font-family: var(--font-mono);
		font-size: 12px;
		font-weight: 600;
		color: var(--gray-900);
	}

	.col-category {
		font-size: 12px;
		color: var(--gray-600);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.col-description {
		font-size: 13px;
		color: var(--gray-700);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.col-priority {
		display: flex;
		align-items: center;
	}

	.col-duration {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--gray-500);
	}

	.col-expand {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--gray-400);
	}

	.col-expand :global(.expand-icon) {
		transition: transform 0.2s ease;
	}

	.status-icon {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
	}

	.status-icon.success {
		background: rgba(16, 185, 129, 0.15);
		color: var(--data-green);
	}

	.status-icon.failure {
		background: rgba(239, 68, 68, 0.15);
		color: var(--data-red);
	}

	.status-icon.pending {
		background: var(--gray-100);
	}

	.status-icon.running {
		background: rgba(0, 102, 255, 0.1);
		color: var(--blu-primary);
	}

	.test-row.running {
		background: rgba(0, 102, 255, 0.02);
	}

	.pending-dot {
		width: 8px;
		height: 8px;
		background: var(--gray-300);
		border-radius: 50%;
	}

	.pending-dot.small {
		width: 6px;
		height: 6px;
	}

	.priority-badge {
		display: inline-flex;
		padding: 4px 10px;
		border-radius: 100px;
		font-size: 11px;
		font-weight: 600;
		text-transform: capitalize;
	}

	.priority-badge.priority-critical {
		background: rgba(239, 68, 68, 0.12);
		color: var(--data-red);
	}

	.priority-badge.priority-high {
		background: rgba(245, 158, 11, 0.12);
		color: #f59e0b;
	}

	.priority-badge.priority-medium {
		background: rgba(0, 102, 255, 0.1);
		color: var(--blu-primary);
	}

	.priority-badge.priority-low {
		background: var(--gray-100);
		color: var(--gray-500);
	}

	/* Test Details */
	.test-details {
		padding: 16px 20px 20px;
		background: var(--gray-50);
		border-top: 1px solid var(--gray-100);
	}

	.detail-section {
		margin-bottom: 16px;
	}

	.detail-section:last-child {
		margin-bottom: 0;
	}

	.detail-label {
		font-size: 12px;
		font-weight: 600;
		color: var(--gray-500);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 8px 0;
	}

	.detail-value {
		font-size: 14px;
		color: var(--gray-700);
		margin: 0;
	}

	.detail-value.transcript {
		font-style: italic;
		color: var(--gray-600);
		padding: 12px 16px;
		background: white;
		border-radius: 8px;
		border-left: 3px solid var(--blu-primary);
	}

	.detail-code {
		font-family: var(--font-mono);
		font-size: 12px;
		line-height: 1.6;
		color: var(--gray-700);
		background: white;
		padding: 16px;
		border-radius: 8px;
		overflow-x: auto;
		margin: 0;
		white-space: pre-wrap;
		word-break: break-all;
	}

	.validation-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.validation-item {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		padding: 8px 12px;
		background: white;
		border-radius: 6px;
		font-size: 13px;
	}

	.validation-item.passed {
		color: var(--data-green);
	}

	.validation-item.failed {
		color: var(--data-red);
	}

	.validation-item.pending {
		color: var(--gray-500);
	}

	.validation-message {
		color: var(--gray-700);
	}

	.detail-section.error {
		padding: 12px 16px;
		background: rgba(239, 68, 68, 0.08);
		border-radius: 8px;
	}

	.error-text {
		color: var(--data-red);
	}

	.stream-result-summary {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 18px;
		border-radius: 10px;
		font-size: 14px;
		font-weight: 600;
	}

	.stream-result-summary.passed {
		background: rgba(16, 185, 129, 0.1);
		color: var(--data-green);
	}

	.stream-result-summary.failed {
		background: rgba(239, 68, 68, 0.1);
		color: var(--data-red);
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 24px;
		text-align: center;
		color: var(--gray-400);
	}

	.empty-state h3 {
		font-size: 16px;
		font-weight: 600;
		color: var(--gray-700);
		margin: 16px 0 8px;
	}

	.empty-state p {
		font-size: 14px;
		color: var(--gray-500);
		margin: 0;
	}

	/* Spinner Animation */
	:global(.spinner) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* Responsive */
	@media (max-width: 900px) {
		.table-header,
		.test-row-main {
			grid-template-columns: 50px 70px 1fr 80px 40px;
		}

		.col-category,
		.col-duration {
			display: none;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.stat-breakdown.priorities {
			grid-template-columns: repeat(2, 1fr);
		}

		.summary-bar {
			flex-direction: column;
		}

		.summary-stat {
			justify-content: center;
		}
	}

	@media (max-width: 600px) {
		.header-title-group {
			flex-direction: column;
			align-items: flex-start;
			gap: 4px;
		}

		.page-title {
			font-size: 16px;
		}

		.action-buttons {
			flex-direction: column;
		}

		.table-header,
		.test-row-main {
			grid-template-columns: 40px 1fr 70px 30px;
		}

		.col-id {
			display: none;
		}

		.checkbox-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.export-options {
			flex-wrap: wrap;
		}

		.config-row {
			flex-direction: column;
			gap: 16px;
		}

		.config-half {
			width: 100%;
		}

		.sort-options {
			flex-wrap: wrap;
		}

		.sort-btn {
			font-size: 12px;
			padding: 6px 10px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.page-header,
		.back-btn,
		.run-btn,
		.checkbox-item,
		.test-row-main,
		.export-btn {
			transition: none;
		}

		.page-header.header-hidden {
			transform: none;
			opacity: 1;
			pointer-events: auto;
		}

		:global(.spinner) {
			animation: none;
		}
	}
</style>

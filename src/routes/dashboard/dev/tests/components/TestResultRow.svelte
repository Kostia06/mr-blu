<script lang="ts">
	import { fly, slide } from 'svelte/transition';
	import Check from 'lucide-svelte/icons/check';
	import X from 'lucide-svelte/icons/x';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import type { AITestCase, TestResult, TestPriority } from '$lib/testing/types';

	interface StreamingTestResult {
		testId: string;
		passed: boolean;
		duration: number;
		error?: string;
		validationResults: Array<{ passed: boolean; message: string }>;
	}

	interface Props {
		test: AITestCase;
		index: number;
		result: TestResult | undefined;
		streamResult: StreamingTestResult | undefined;
		isRunning: boolean;
		isExpanded: boolean;
		ontoggle: () => void;
		formatCategory: (category: string) => string;
		getPriorityClass: (priority: TestPriority) => string;
		formatDuration: (ms: number) => string;
	}

	let {
		test,
		index,
		result,
		streamResult,
		isRunning,
		isExpanded,
		ontoggle,
		formatCategory,
		getPriorityClass,
		formatDuration,
	}: Props = $props();

	const displayResult = $derived(result || streamResult);
</script>

<div
	class="test-row"
	class:passed={displayResult?.passed}
	class:failed={displayResult && !displayResult.passed}
	class:running={isRunning && !displayResult}
	class:expanded={isExpanded}
	in:fly={{ y: 10, duration: 200, delay: Math.min(index * 20, 300) }}
>
	<button
		class="test-row-main"
		onclick={ontoggle}
		aria-expanded={isExpanded}
	>
		<span class="col-status">
			{#if displayResult}
				{#if displayResult.passed}
					<span class="status-icon success">
						<Check size={16} strokeWidth={3} />
					</span>
				{:else}
					<span class="status-icon failure">
						<X size={16} strokeWidth={3} />
					</span>
				{/if}
			{:else if isRunning}
				<span class="status-icon running">
					<Loader2 size={16} class="spinner" />
				</span>
			{:else}
				<span class="status-icon pending">
					<span class="pending-dot"></span>
				</span>
			{/if}
		</span>
		<span class="col-id">{test.id}</span>
		<span class="col-category">{formatCategory(test.category)}</span>
		<span class="col-description">{test.description}</span>
		<span class="col-priority">
			<span class="priority-badge {getPriorityClass(test.priority)}">
				{test.priority}
			</span>
		</span>
		<span class="col-duration">
			{#if displayResult}
				{formatDuration(displayResult.duration)}
			{:else}
				-
			{/if}
		</span>
		<span class="col-expand">
			<ChevronDown
				size={16}
				class="expand-icon"
				style="transform: rotate({isExpanded ? 180 : 0}deg)"
			/>
		</span>
	</button>

	{#if isExpanded}
		<div class="test-details" in:slide={{ duration: 200 }}>
			<div class="detail-section">
				<h4 class="detail-label">Input Transcription</h4>
				<p class="detail-value transcript">"{test.input}"</p>
			</div>

			<div class="detail-section">
				<h4 class="detail-label">Expected Data</h4>
				<pre class="detail-code">{JSON.stringify(test.expectedData, null, 2)}</pre>
			</div>

			{#if result}
				<div class="detail-section">
					<h4 class="detail-label">Actual Response</h4>
					<pre class="detail-code">{JSON.stringify(result.actualResponse, null, 2)}</pre>
				</div>

				<div class="detail-section">
					<h4 class="detail-label">Validation Results</h4>
					<div class="validation-list">
						{#each result.validationResults as validation, vi (vi)}
							<div
								class="validation-item"
								class:passed={validation.passed}
								class:failed={!validation.passed}
							>
								{#if validation.passed}
									<Check size={14} strokeWidth={3} />
								{:else}
									<X size={14} strokeWidth={3} />
								{/if}
								<span class="validation-message">{validation.message}</span>
							</div>
						{/each}
					</div>
				</div>

				{#if result.error}
					<div class="detail-section error">
						<h4 class="detail-label">Error</h4>
						<p class="detail-value error-text">{result.error}</p>
					</div>
				{/if}
			{:else if streamResult}
				<div class="detail-section">
					<h4 class="detail-label">Result</h4>
					<div
						class="stream-result-summary"
						class:passed={streamResult.passed}
						class:failed={!streamResult.passed}
					>
						{#if streamResult.passed}
							<CheckCircle2 size={20} />
							<span>Test Passed in {formatDuration(streamResult.duration)}</span>
						{:else}
							<XCircle size={20} />
							<span>Test Failed in {formatDuration(streamResult.duration)}</span>
						{/if}
					</div>
				</div>

				{#if streamResult.validationResults.length > 0}
					<div class="detail-section">
						<h4 class="detail-label">Validation Results</h4>
						<div class="validation-list">
							{#each streamResult.validationResults as validation, vi (vi)}
								<div
									class="validation-item"
									class:passed={validation.passed}
									class:failed={!validation.passed}
								>
									{#if validation.passed}
										<Check size={14} strokeWidth={3} />
									{:else}
										<X size={14} strokeWidth={3} />
									{/if}
									<span class="validation-message">{validation.message}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if streamResult.error}
					<div class="detail-section error">
						<h4 class="detail-label">Error</h4>
						<p class="detail-value error-text">{streamResult.error}</p>
					</div>
				{/if}
			{:else}
				<div class="detail-section">
					<h4 class="detail-label">Validation Rules</h4>
					<div class="validation-list pending">
						{#each test.validationRules as rule, ri (ri)}
							<div class="validation-item pending">
								<span class="pending-dot small"></span>
								<span class="validation-message">
									{rule.field}
									{rule.operator}
									{rule.value !== undefined ? JSON.stringify(rule.value) : ''}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

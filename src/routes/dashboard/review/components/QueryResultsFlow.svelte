<script lang="ts">
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Check from 'lucide-svelte/icons/check';
	import Search from 'lucide-svelte/icons/search';
	import FileText from 'lucide-svelte/icons/file-text';
	import Receipt from 'lucide-svelte/icons/receipt';
	import Mic from 'lucide-svelte/icons/mic';
	import { SummaryCard } from './';

	// Types
	interface QueryDocument {
		id: string;
		type: string;
		documentType: string;
		title: string;
		client: string;
		clientId: string | null;
		date: string;
		amount: number;
		status: string;
		dueDate?: string | null;
	}

	interface ClientSuggestion {
		id: string;
		name: string;
		similarity: number;
	}

	interface QueryResult {
		success: boolean;
		queryType: string;
		documents?: QueryDocument[];
		summary?: {
			count: number;
			totalAmount: number;
			byStatus: Record<string, number>;
			byType: Record<string, number>;
		};
		answer?: string;
		suggestions?: {
			type: 'client';
			searchedFor: string;
			alternatives: ClientSuggestion[];
		};
	}

	interface QueryData {
		query: {
			type: 'list' | 'sum' | 'count' | 'details';
			documentTypes: string[];
			clientName: string | null;
			status: string | null;
			dateRange: {
				start: string | null;
				end: string | null;
				period: string | null;
			};
			sortBy: string | null;
			limit: number | null;
		};
		summary: string;
		naturalLanguageQuery: string;
		confidence: {
			overall: number;
			queryType: number;
			filters: number;
		};
	}

	interface Props {
		queryData: QueryData | null;
		queryResult: QueryResult | null;
		isLoading: boolean;
		onSelectClient: (clientName: string) => void;
	}

	let { queryData, queryResult, isLoading, onSelectClient }: Props = $props();

	// Format currency for query results
	function formatQueryAmount(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Format date for query results
	function formatQueryDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		if (days < 7) return `${days} days ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<div class="content">
	<!-- Query Summary Card -->
	<SummaryCard
		summary={queryData?.naturalLanguageQuery || queryData?.summary || 'Processing your query...'}
		variant="info-query"
		label="Your question"
	/>

	{#if isLoading}
		<!-- Loading Query -->
		<div class="query-loading">
			<Loader2 size={24} class="spinning" />
			<span>{$t('review.searchingDocuments')}</span>
		</div>
	{:else if queryResult}
		<!-- Query Answer -->
		{#if queryResult.answer}
			<div class="query-answer-card">
				<div class="answer-icon">
					<Check size={20} />
				</div>
				<p class="answer-text">{queryResult.answer}</p>
			</div>
		{/if}

		<!-- Query Summary Stats -->
		{#if queryResult.summary}
			<div class="query-stats">
				<div class="stat-card">
					<span class="stat-value">{queryResult.summary.count}</span>
					<span class="stat-label">{$t('review.documents')}</span>
				</div>
				<div class="stat-card">
					<span class="stat-value">{formatQueryAmount(queryResult.summary.totalAmount)}</span>
					<span class="stat-label">{$t('review.totalAmountLabel')}</span>
				</div>
			</div>

			<!-- Status Breakdown -->
			{#if Object.keys(queryResult.summary.byStatus).length > 0}
				<div class="breakdown-section">
					<h4 class="breakdown-title">{$t('review.byStatus')}</h4>
					<div class="breakdown-chips">
						{#each Object.entries(queryResult.summary.byStatus) as [status, value]}
							<span class="breakdown-chip {status}">
								{status}: {queryResult.queryType === 'sum'
									? formatQueryAmount(value as number)
									: value}
							</span>
						{/each}
					</div>
				</div>
			{/if}
		{/if}

		<!-- Document List -->
		{#if queryResult.documents && queryResult.documents.length > 0}
			<div class="query-results-section">
				<h4 class="results-title">{$t('review.documentsFound')}</h4>
				<div class="query-doc-list">
					{#each queryResult.documents as doc}
						<a href="/dashboard/documents/{doc.id}?type={doc.documentType}" class="query-doc-item">
							<div
								class="query-doc-icon"
								class:invoice={doc.type === 'invoice'}
								class:estimate={doc.type === 'estimate'}
							>
								{#if doc.type === 'invoice'}
									<Receipt size={18} />
								{:else if doc.type === 'estimate'}
									<FileText size={18} />
								{:else}
									<FileText size={18} />
								{/if}
							</div>
							<div class="query-doc-info">
								<span class="query-doc-title">{doc.title}</span>
								<span class="query-doc-meta">
									<span class="query-doc-type">{doc.type}</span>
									{doc.client} &middot; {formatQueryDate(doc.date)}
								</span>
							</div>
							<div class="query-doc-end">
								{#if doc.amount > 0}
									<span class="query-doc-amount">{formatQueryAmount(doc.amount)}</span>
								{/if}
								<span class="query-doc-status {doc.status}">{doc.status}</span>
							</div>
						</a>
					{/each}
				</div>
			</div>
		{:else if queryResult.success}
			<div class="no-results">
				<Search size={32} />
				<p>{$t('review.noDocumentsMatch')}</p>
			</div>
		{/if}

		<!-- Client Name Suggestions -->
		{#if queryResult?.suggestions?.alternatives && queryResult.suggestions.alternatives.length > 0}
			<div class="suggestions-section">
				<h4 class="suggestions-title">
					<Search size={16} />
					{queryResult.documents?.length ? $t('review.similarClients') : $t('review.didYouMean')}
				</h4>
				<p class="suggestions-subtitle">
					{#if queryResult.documents?.length}
						{$t('review.speechMisheard')}
					{:else}
						{$t('review.selectClientBelow', { client: queryResult.suggestions.searchedFor })}
					{/if}
				</p>
				<div class="suggestions-list">
					{#each queryResult.suggestions.alternatives as suggestion}
						<button class="suggestion-btn" onclick={() => onSelectClient(suggestion.name)}>
							<span class="suggestion-name">{suggestion.name}</span>
							{#if suggestion.similarity >= 0.8}
								<span class="suggestion-match high">{$t('review.highMatch')}</span>
							{:else if suggestion.similarity >= 0.6}
								<span class="suggestion-match medium">{$t('review.goodMatch')}</span>
							{:else}
								<span class="suggestion-match low">{$t('review.possibleMatch')}</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/if}
	{/if}

	<!-- Actions -->
	<div class="query-actions">
		<button class="btn secondary" onclick={() => goto('/dashboard/documents')}>
			<FileText size={18} />
			View All Documents
		</button>
		<button class="btn primary" onclick={() => goto('/dashboard')}>
			<Mic size={18} />
			New Recording
		</button>
	</div>
</div>

<style>
	.content {
		flex: 1;
		padding: var(--page-padding-x);
		max-width: var(--page-max-width);
		margin: 0 auto;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--section-gap);
	}

	.query-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		padding: 60px var(--page-padding-x, 20px);
		color: var(--gray-500);
	}

	.query-loading :global(.spinning) {
		animation: spin 1s linear infinite;
		color: var(--blu-primary, #0066ff);
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.query-loading span {
		font-size: 14px;
	}

	.query-answer-card {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		background: rgba(16, 185, 129, 0.08);
		border: 1px solid rgba(16, 185, 129, 0.2);
		border-radius: 14px;
	}

	.answer-icon {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(16, 185, 129, 0.15);
		border-radius: 10px;
		color: #34d399;
		flex-shrink: 0;
	}

	.answer-text {
		font-size: 15px;
		line-height: 1.5;
		color: var(--gray-900);
		margin: 0;
		padding-top: 6px;
	}

	.query-stats {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
		margin-top: 16px;
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 18px 14px;
		background: transparent;
		border: 1px solid var(--gray-200);
		border-radius: 14px;
	}

	.stat-value {
		font-size: 22px;
		font-weight: 700;
		color: var(--gray-900);
	}

	.stat-label {
		font-size: 12px;
		color: var(--gray-500);
	}

	.breakdown-section {
		margin-top: 16px;
	}

	.breakdown-title {
		font-size: 12px;
		font-weight: 600;
		color: var(--gray-500);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 10px;
	}

	.breakdown-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.breakdown-chip {
		padding: 6px 12px;
		border-radius: 8px;
		font-size: 12px;
		font-weight: 500;
		text-transform: capitalize;
	}

	.breakdown-chip.draft {
		background: var(--gray-100);
		color: var(--gray-500);
	}

	.breakdown-chip.sent {
		background: rgba(14, 165, 233, 0.15);
		color: #38bdf8;
	}

	.breakdown-chip.pending {
		background: rgba(245, 158, 11, 0.15);
		color: #fbbf24;
	}

	.breakdown-chip.paid {
		background: rgba(16, 185, 129, 0.15);
		color: #34d399;
	}

	.breakdown-chip.overdue {
		background: rgba(239, 68, 68, 0.15);
		color: #f87171;
	}

	.query-results-section {
		margin-top: 20px;
	}

	.results-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--gray-600);
		margin: 0 0 12px;
	}

	.query-doc-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.query-doc-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 16px;
		background: transparent;
		border: 1px solid var(--gray-200);
		border-radius: 14px;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.query-doc-item:hover {
		background: var(--gray-100);
		border-color: #cbd5e1;
		transform: translateY(-1px);
	}

	.query-doc-icon {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(14, 165, 233, 0.1);
		border-radius: 10px;
		color: #0ea5e9;
		flex-shrink: 0;
	}

	.query-doc-icon.invoice {
		background: rgba(16, 185, 129, 0.1);
		color: var(--data-green);
	}

	.query-doc-icon.estimate {
		background: rgba(168, 85, 247, 0.1);
		color: #a855f7;
	}

	.query-doc-info {
		flex: 1;
		min-width: 0;
	}

	.query-doc-title {
		display: block;
		font-size: 14px;
		font-weight: 600;
		color: var(--gray-900);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.query-doc-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: var(--gray-500);
		margin-top: 2px;
	}

	.query-doc-type {
		padding: 2px 6px;
		background: var(--gray-100);
		border-radius: 4px;
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
	}

	.query-doc-end {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 4px;
	}

	.query-doc-amount {
		font-size: 14px;
		font-weight: 600;
		color: var(--data-green);
	}

	.query-doc-status {
		padding: 3px 8px;
		border-radius: 6px;
		font-size: 10px;
		font-weight: 600;
		text-transform: capitalize;
	}

	.query-doc-status.draft {
		background: var(--gray-100);
		color: var(--gray-500);
	}

	.query-doc-status.sent {
		background: rgba(14, 165, 233, 0.15);
		color: #38bdf8;
	}

	.query-doc-status.pending {
		background: rgba(245, 158, 11, 0.15);
		color: #fbbf24;
	}

	.query-doc-status.paid {
		background: rgba(16, 185, 129, 0.15);
		color: #34d399;
	}

	.query-doc-status.overdue {
		background: rgba(239, 68, 68, 0.15);
		color: #f87171;
	}

	.no-results {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 40px 20px;
		color: var(--gray-500);
		text-align: center;
	}

	.no-results p {
		margin: 0;
		font-size: 14px;
	}

	.query-actions {
		display: flex;
		gap: 12px;
		margin-top: 24px;
		padding-top: 20px;
		border-top: 1px solid var(--gray-200);
	}

	.query-actions .btn {
		flex: 1;
	}

	/* Suggestions Styles */
	.suggestions-section {
		margin-top: 20px;
		padding: 16px;
		background: rgba(245, 158, 11, 0.08);
		border: 1px solid rgba(245, 158, 11, 0.2);
		border-radius: 14px;
	}

	.suggestions-title {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		font-weight: 600;
		color: #fbbf24;
		margin: 0 0 6px;
	}

	.suggestions-subtitle {
		font-size: 13px;
		color: var(--gray-500);
		margin: 0 0 14px;
	}

	.suggestions-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.suggestion-btn {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 14px;
		background: transparent;
		border: 1px solid var(--gray-200);
		border-radius: 10px;
		transition: all 0.2s ease;
		text-align: left;
		cursor: pointer;
	}

	.suggestion-btn:hover {
		background: rgba(245, 158, 11, 0.15);
		border-color: rgba(245, 158, 11, 0.3);
		transform: translateY(-1px);
	}

	.suggestion-name {
		font-size: 14px;
		font-weight: 500;
		color: var(--gray-900);
	}

	.suggestion-match {
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		padding: 3px 8px;
		border-radius: 6px;
	}

	.suggestion-match.high {
		background: rgba(16, 185, 129, 0.15);
		color: #34d399;
	}

	.suggestion-match.medium {
		background: rgba(14, 165, 233, 0.15);
		color: #38bdf8;
	}

	.suggestion-match.low {
		background: var(--gray-100);
		color: var(--gray-500);
	}

	/* Button styles */
	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 14px 20px;
		border-radius: 12px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
	}

	.btn.primary {
		background: linear-gradient(135deg, #0066ff, #0052cc);
		color: white;
		box-shadow: 0 4px 12px rgba(0, 102, 255, 0.25);
	}

	.btn.primary:hover {
		transform: translateY(-1px);
		box-shadow: 0 6px 16px rgba(0, 102, 255, 0.35);
	}

	.btn.secondary {
		background: var(--gray-100);
		color: var(--gray-600);
		border: 1px solid var(--gray-200);
	}

	.btn.secondary:hover {
		background: var(--gray-200);
		color: var(--gray-900);
	}
</style>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import FileText from 'lucide-svelte/icons/file-text';
	import Receipt from 'lucide-svelte/icons/receipt';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Loader2 from 'lucide-svelte/icons/loader-2';

	// Types
	interface SourceDocument {
		id: string;
		type: 'invoice' | 'estimate' | 'contract';
		title: string;
		client: string;
		clientId?: string | null;
		clientEmail?: string | null;
		clientPhone?: string | null;
		amount: number;
		date: string;
		status: string;
	}

	interface ClientSuggestion {
		name: string;
		similarity: number;
	}

	interface CloneData {
		sourceClient: string;
		summary: string;
	}

	interface Props {
		cloneData: CloneData | null;
		sourceDocuments: SourceDocument[];
		isSearching: boolean;
		clientSuggestions: ClientSuggestion[];
		onSelectDocument: (doc: SourceDocument) => void;
		onSelectClient: (clientName: string) => void;
	}

	let {
		cloneData,
		sourceDocuments,
		isSearching,
		clientSuggestions,
		onSelectDocument,
		onSelectClient
	}: Props = $props();

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
	<div class="summary-card clone-mode">
		<div class="summary-header">
			<Sparkles size={16} class="summary-icon" />
			<span>{$t('review.cloningDocument')}</span>
		</div>
		<p class="summary-text">{cloneData?.summary || 'Finding document to clone...'}</p>
	</div>

	{#if isSearching}
		<div class="query-loading">
			<Loader2 size={24} class="spinning" />
			<span>{$t('review.searchingFor', { client: cloneData?.sourceClient })}</span>
		</div>
	{:else if sourceDocuments.length > 0}
		<div class="doc-selection">
			<h3 class="selection-title">{$t('review.selectDocumentToClone')}</h3>
			<p class="selection-subtitle">
				{$t('review.foundDocuments', {
					n: sourceDocuments.length,
					client: cloneData?.sourceClient
				})}
			</p>

			<div class="source-doc-list">
				{#each sourceDocuments as doc}
					<button class="source-doc-card" onclick={() => onSelectDocument(doc)}>
						<div
							class="source-doc-icon"
							class:invoice={doc.type === 'invoice'}
							class:estimate={doc.type === 'estimate'}
						>
							{#if doc.type === 'invoice'}
								<Receipt size={20} />
							{:else}
								<FileText size={20} />
							{/if}
						</div>
						<div class="source-doc-info">
							<span class="source-doc-title">{doc.title}</span>
							<span class="source-doc-meta">{doc.client} • {formatQueryDate(doc.date)}</span>
						</div>
						<div class="source-doc-amount">
							{formatQueryAmount(doc.amount)}
						</div>
					</button>
				{/each}
			</div>
		</div>
	{:else}
		<div class="no-docs-found">
			<AlertCircle size={32} />
			<p>{$t('review.noDocumentsFor', { client: cloneData?.sourceClient })}</p>

			<!-- Client suggestions for speech-to-text errors -->
			{#if clientSuggestions.length > 0}
				<div class="clone-suggestions">
					<p class="clone-suggestions-label">{$t('review.speechMisheard')}</p>
					<div class="clone-suggestions-list">
						{#each clientSuggestions as suggestion}
							<button class="clone-suggestion-btn" onclick={() => onSelectClient(suggestion.name)}>
								<span class="suggestion-name">{suggestion.name}</span>
								{#if suggestion.similarity >= 0.7}
									<span class="suggestion-match high">{$t('review.highMatch')}</span>
								{:else if suggestion.similarity >= 0.5}
									<span class="suggestion-match medium">{$t('review.goodMatch')}</span>
								{:else}
									<span class="suggestion-match low">{$t('review.possibleMatch')}</span>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{:else}
				<button class="btn secondary" onclick={() => goto('/dashboard')}>
					Back to Dashboard
				</button>
			{/if}
		</div>
	{/if}
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

	/* Summary Card */
	.summary-card {
		background: var(--glass-primary-5);
		border: 1px solid var(--glass-primary-15);
		border-radius: var(--radius-card);
		padding: var(--space-5);
	}

	.summary-card.clone-mode {
		border-color: rgba(168, 85, 247, 0.2);
		background: rgba(168, 85, 247, 0.05);
	}

	.summary-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-2-5);
		color: #a855f7;
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
	}

	.summary-text {
		font-size: var(--text-base);
		line-height: 1.5;
		color: var(--gray-700);
		margin: 0;
	}

	/* Loading */
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

	/* Document Selection */
	.doc-selection {
		margin-top: 20px;
	}

	.selection-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--gray-900);
		margin: 0 0 6px;
	}

	.selection-subtitle {
		font-size: 13px;
		color: var(--gray-500);
		margin: 0 0 16px;
	}

	.source-doc-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.source-doc-card {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 16px;
		background: transparent;
		border: 1px solid var(--gray-200);
		border-radius: 14px;
		text-align: left;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.source-doc-card:hover {
		background: rgba(168, 85, 247, 0.1);
		border-color: rgba(168, 85, 247, 0.3);
		transform: translateY(-1px);
	}

	.source-doc-icon {
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(168, 85, 247, 0.15);
		border-radius: 12px;
		color: #a855f7;
		flex-shrink: 0;
	}

	.source-doc-icon.invoice {
		background: rgba(16, 185, 129, 0.15);
		color: var(--data-green);
	}

	.source-doc-icon.estimate {
		background: rgba(168, 85, 247, 0.15);
		color: #a855f7;
	}

	.source-doc-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.source-doc-title {
		font-size: 14px;
		font-weight: 500;
		color: var(--gray-900);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.source-doc-meta {
		font-size: 12px;
		color: var(--gray-500);
	}

	.source-doc-amount {
		font-size: 15px;
		font-weight: 600;
		color: var(--data-green);
	}

	/* No docs found */
	.no-docs-found {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 40px 20px;
		text-align: center;
		color: var(--gray-500);
	}

	.no-docs-found p {
		margin: 12px 0 20px;
		font-size: 14px;
	}

	/* Clone client suggestions */
	.clone-suggestions {
		margin-top: 16px;
		width: 100%;
		max-width: 320px;
	}

	.clone-suggestions-label {
		font-size: 13px;
		color: var(--gray-500);
		margin-bottom: 12px;
		text-align: center;
	}

	.clone-suggestions-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.clone-suggestion-btn {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: transparent;
		border: 1px solid var(--gray-200);
		border-radius: 12px;
		color: var(--gray-900);
		font-size: 14px;
		font-weight: 500;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.clone-suggestion-btn:hover {
		background: rgba(14, 165, 233, 0.15);
		border-color: rgba(14, 165, 233, 0.3);
	}

	.clone-suggestion-btn .suggestion-name {
		flex: 1;
		text-align: left;
	}

	.clone-suggestion-btn .suggestion-match {
		font-size: 10px;
		font-weight: 600;
		padding: 3px 8px;
		border-radius: 6px;
		text-transform: uppercase;
	}

	.clone-suggestion-btn .suggestion-match.high {
		background: rgba(16, 185, 129, 0.2);
		color: var(--data-green);
	}

	.clone-suggestion-btn .suggestion-match.medium {
		background: rgba(14, 165, 233, 0.2);
		color: #38bdf8;
	}

	.clone-suggestion-btn .suggestion-match.low {
		background: rgba(245, 158, 11, 0.2);
		color: #fbbf24;
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

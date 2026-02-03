<script lang="ts">
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import FileText from 'lucide-svelte/icons/file-text';
	import Receipt from 'lucide-svelte/icons/receipt';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Check from 'lucide-svelte/icons/check';
	import Plus from 'lucide-svelte/icons/plus';

	// Types
	interface SourceDocument {
		id: string;
		type: 'invoice' | 'estimate' | 'contract';
		title: string;
		client: string;
		clientId?: string | null;
		amount: number;
		date: string;
		status: string;
	}

	interface MergeSourceSelection {
		clientName: string;
		documents: SourceDocument[];
		selectedDoc: SourceDocument | null;
		isSearching: boolean;
	}

	interface MergeData {
		summary: string;
	}

	interface Props {
		mergeData: MergeData | null;
		mergeSourceSelections: MergeSourceSelection[];
		onSelectDocument: (index: number, doc: SourceDocument) => void;
		onConfirmMerge: () => void;
	}

	let { mergeData, mergeSourceSelections, onSelectDocument, onConfirmMerge }: Props = $props();

	// Check if all merge sources have a selection
	const allMergeSourcesSelected = $derived(
		mergeSourceSelections.length > 0 && mergeSourceSelections.every((s) => s.selectedDoc !== null)
	);

	// Count selected documents
	const selectedCount = $derived(mergeSourceSelections.filter((s) => s.selectedDoc).length);

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
	<div class="summary-card merge-mode">
		<div class="summary-header">
			<Sparkles size={16} class="summary-icon" />
			<span>{$t('review.mergingDocuments')}</span>
		</div>
		<p class="summary-text">{mergeData?.summary || $t('review.mergingDocuments')}</p>
	</div>

	<div class="merge-selection">
		<h3 class="selection-title">{$t('review.selectDocsToMerge')}</h3>
		<p class="selection-subtitle">{$t('review.chooseFromEachClient')}</p>

		{#each mergeSourceSelections as sel, index}
			<div class="merge-source-section">
				<h4 class="merge-source-title">
					<span class="merge-source-number">{index + 1}</span>
					Documents from {sel.clientName}
				</h4>

				{#if sel.isSearching}
					<div class="merge-source-loading">
						<Loader2 size={18} class="spinning" />
						<span>{$t('review.searching')}</span>
					</div>
				{:else if sel.documents.length > 0}
					<div class="merge-doc-options">
						{#each sel.documents as doc}
							<button
								class="merge-doc-option"
								class:selected={sel.selectedDoc?.id === doc.id}
								onclick={() => onSelectDocument(index, doc)}
							>
								<div
									class="merge-doc-icon"
									class:invoice={doc.type === 'invoice'}
									class:estimate={doc.type === 'estimate'}
								>
									{#if doc.type === 'invoice'}
										<Receipt size={16} />
									{:else}
										<FileText size={16} />
									{/if}
								</div>
								<div class="merge-doc-info">
									<span class="merge-doc-title">{doc.title}</span>
									<span class="merge-doc-meta">{formatQueryDate(doc.date)}</span>
								</div>
								<div class="merge-doc-amount">
									{formatQueryAmount(doc.amount)}
								</div>
								{#if sel.selectedDoc?.id === doc.id}
									<Check size={16} class="merge-doc-check" />
								{/if}
							</button>
						{/each}
					</div>
				{:else}
					<div class="merge-no-docs">
						<AlertCircle size={18} />
						<span>{$t('review.noDocsForClient', { client: sel.clientName })}</span>
					</div>
				{/if}
			</div>
		{/each}

		<div class="merge-actions">
			<button class="btn primary" disabled={!allMergeSourcesSelected} onclick={onConfirmMerge}>
				<Plus size={18} />
				Merge {selectedCount} Document{selectedCount !== 1 ? 's' : ''}
			</button>
			<button class="btn secondary" onclick={() => goto('/dashboard')}> Cancel </button>
		</div>
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

	/* Summary Card */
	.summary-card {
		background: var(--glass-primary-5);
		border: 1px solid var(--glass-primary-15);
		border-radius: var(--radius-card);
		padding: var(--space-5);
	}

	.summary-card.merge-mode {
		border-color: rgba(14, 165, 233, 0.2);
		background: rgba(14, 165, 233, 0.05);
	}

	.summary-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-2-5);
		color: #38bdf8;
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
	}

	.summary-text {
		font-size: var(--text-base);
		line-height: 1.5;
		color: var(--gray-700);
		margin: 0;
	}

	/* Selection */
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

	.merge-selection {
		margin-top: 20px;
	}

	.merge-source-section {
		margin-bottom: 24px;
		padding: 16px;
		background: transparent;
		border: 1px solid var(--gray-200);
		border-radius: 14px;
	}

	.merge-source-title {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 14px;
		font-weight: 600;
		color: var(--gray-900);
		margin: 0 0 14px;
	}

	.merge-source-number {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(14, 165, 233, 0.2);
		color: #38bdf8;
		border-radius: 50%;
		font-size: 12px;
		font-weight: 700;
	}

	.merge-source-loading {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 16px;
		color: var(--gray-500);
		font-size: 13px;
	}

	.merge-source-loading :global(.spinning) {
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

	.merge-doc-options {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.merge-doc-option {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 14px;
		background: var(--white);
		border: 1px solid var(--gray-200);
		border-radius: 12px;
		text-align: left;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.merge-doc-option:hover {
		background: rgba(14, 165, 233, 0.08);
		border-color: rgba(14, 165, 233, 0.2);
	}

	.merge-doc-option.selected {
		background: rgba(14, 165, 233, 0.15);
		border-color: rgba(14, 165, 233, 0.4);
	}

	.merge-doc-icon {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(14, 165, 233, 0.15);
		border-radius: 10px;
		color: #38bdf8;
		flex-shrink: 0;
	}

	.merge-doc-icon.invoice {
		background: rgba(16, 185, 129, 0.15);
		color: var(--data-green);
	}

	.merge-doc-icon.estimate {
		background: rgba(168, 85, 247, 0.15);
		color: #a855f7;
	}

	.merge-doc-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.merge-doc-title {
		font-size: 13px;
		font-weight: 500;
		color: var(--gray-900);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.merge-doc-meta {
		font-size: 11px;
		color: var(--gray-500);
	}

	.merge-doc-amount {
		font-size: 14px;
		font-weight: 600;
		color: var(--data-green);
	}

	.merge-no-docs {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 16px;
		color: var(--gray-500);
		font-size: 13px;
	}

	.merge-actions {
		display: flex;
		gap: 12px;
		margin-top: 24px;
	}

	.merge-actions .btn {
		flex: 1;
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

	.btn.primary:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 6px 16px rgba(0, 102, 255, 0.35);
	}

	.btn.primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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

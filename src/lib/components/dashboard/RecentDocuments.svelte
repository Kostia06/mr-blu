<script lang="ts">
	import { goto } from '$app/navigation';
	import FileText from 'lucide-svelte/icons/file-text';
	import FileCheck from 'lucide-svelte/icons/file-check';
	import FileQuestion from 'lucide-svelte/icons/file-question';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Inbox from 'lucide-svelte/icons/inbox';
	import { formatCurrency, formatDate } from '$lib/utils/format';
	import Badge from '$lib/components/ui/Badge.svelte';

	interface Document {
		id: string;
		title: string;
		type: string;
		client: string;
		date: string;
		amount: number;
		status: string;
	}

	interface Props {
		title: string;
		documents: Document[];
		type?: 'invoice' | 'estimate' | 'all';
	}

	let { title, documents, type = 'all' }: Props = $props();

	const filteredDocuments = $derived(
		type === 'all' ? documents : documents.filter((doc) => doc.type === type)
	);

	function getDocumentIcon(docType: string) {
		switch (docType) {
			case 'invoice':
				return FileText;
			case 'estimate':
				return FileCheck;
			default:
				return FileQuestion;
		}
	}

	function getStatusVariant(
		status: string
	): 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'signed' {
		const statusMap: Record<string, 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'signed'> =
			{
				draft: 'draft',
				sent: 'sent',
				pending: 'pending',
				paid: 'paid',
				overdue: 'overdue',
				signed: 'signed'
			};
		return statusMap[status.toLowerCase()] || 'draft';
	}

	function handleDocumentClick(doc: Document) {
		goto(`/dashboard/documents/${doc.id}`);
	}
</script>

<div class="recent-documents">
	<div class="section-header">
		<h3 class="section-title">{title}</h3>
		{#if filteredDocuments.length > 0}
			<button class="view-all-btn" onclick={() => goto('/dashboard/documents')}>
				View all
				<ChevronRight size={16} strokeWidth={2} />
			</button>
		{/if}
	</div>

	{#if filteredDocuments.length === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<Inbox size={32} strokeWidth={1.5} />
			</div>
			<p class="empty-text">No documents yet</p>
			<p class="empty-subtext">Create your first document using voice or text input</p>
		</div>
	{:else}
		<ul class="documents-list">
			{#each filteredDocuments as doc (doc.id)}
				{@const DocIcon = getDocumentIcon(doc.type)}
				<li>
					<button class="document-item" onclick={() => handleDocumentClick(doc)}>
						<div
							class="document-icon"
							class:invoice={doc.type === 'invoice'}
							class:estimate={doc.type === 'estimate'}
						>
							<DocIcon size={18} strokeWidth={1.5} />
						</div>

						<div class="document-info">
							<div class="document-header">
								<span class="document-title">{doc.title}</span>
								<Badge status={getStatusVariant(doc.status)} size="sm" />
							</div>
							<div class="document-meta">
								<span class="document-client">{doc.client}</span>
								<span class="document-separator">-</span>
								<span class="document-date">{formatDate(doc.date)}</span>
							</div>
						</div>

						<div class="document-amount">
							{formatCurrency(doc.amount)}
						</div>

						<ChevronRight size={16} strokeWidth={2} class="document-chevron" />
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.recent-documents {
		background: var(--white);
		border: 1px solid var(--blu-border);
		border-radius: var(--radius-xl);
		padding: var(--space-4);
		box-shadow: var(--blu-shadow-card);
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-4);
	}

	.section-title {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		color: var(--gray-900);
		margin: 0;
	}

	.view-all-btn {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1) var(--space-2);
		background: none;
		border: none;
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--blu-primary);
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.view-all-btn:hover {
		background: var(--glass-primary-10);
	}

	.view-all-btn:active {
		transform: scale(0.98);
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-8) var(--space-4);
		text-align: center;
	}

	.empty-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 64px;
		height: 64px;
		background: var(--gray-100);
		border-radius: var(--radius-full);
		color: var(--gray-400);
		margin-bottom: var(--space-4);
	}

	.empty-text {
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		color: var(--gray-700);
		margin: 0 0 var(--space-1) 0;
	}

	.empty-subtext {
		font-size: var(--text-sm);
		color: var(--gray-500);
		margin: 0;
	}

	/* Documents List */
	.documents-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.document-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-3);
		background: var(--gray-50);
		border: 1px solid transparent;
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all var(--duration-fast) ease;
		text-align: left;
	}

	.document-item:hover {
		background: var(--gray-100);
		border-color: var(--blu-border);
	}

	.document-item:active {
		transform: scale(0.99);
	}

	.document-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: var(--gray-200);
		border-radius: var(--radius-md);
		color: var(--gray-600);
		flex-shrink: 0;
	}

	.document-icon.invoice {
		background: var(--glass-primary-10);
		color: var(--blu-primary);
	}

	.document-icon.estimate {
		background: var(--glass-green-10);
		color: var(--data-green);
	}

	.document-info {
		flex: 1;
		min-width: 0;
	}

	.document-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-0-5);
	}

	.document-title {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--gray-900);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.document-meta {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		font-size: var(--text-xs);
		color: var(--gray-500);
	}

	.document-client {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 120px;
	}

	.document-separator {
		color: var(--gray-300);
	}

	.document-date {
		white-space: nowrap;
	}

	.document-amount {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-weight: var(--font-semibold);
		color: var(--gray-900);
		white-space: nowrap;
	}

	.document-item :global(.document-chevron) {
		color: var(--gray-400);
		flex-shrink: 0;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.view-all-btn,
		.document-item {
			transition: none;
		}

		.view-all-btn:active,
		.document-item:active {
			transform: none;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.document-client {
			max-width: 80px;
		}

		.document-amount {
			font-size: var(--text-xs);
		}
	}
</style>

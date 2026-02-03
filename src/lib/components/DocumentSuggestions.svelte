<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import FileText from 'lucide-svelte/icons/file-text';
	import Clock from 'lucide-svelte/icons/clock';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import X from 'lucide-svelte/icons/x';
	import Star from 'lucide-svelte/icons/star';
	import { t } from '$lib/i18n';

	interface RecentDocument {
		id: string;
		document_number: string;
		client_name: string;
		total: number;
		created_at: string;
		document_type: 'invoice' | 'estimate';
	}

	interface Props {
		documents: RecentDocument[];
		onSelect: (document: RecentDocument) => void;
		onDismiss: () => void;
	}

	let { documents, onSelect, onDismiss }: Props = $props();

	// Track hovered document for highlighting
	let hoveredId = $state<string | null>(null);

	function handleSelect(document: RecentDocument) {
		onSelect(document);
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function handleDismiss() {
		onDismiss();
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return $t('time.today');
		if (diffDays === 1) return $t('time.yesterday');
		if (diffDays < 7) return $t('documents.xDaysAgo').replace('{n}', String(diffDays));

		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
</script>

<div class="document-suggestions" transition:fade={{ duration: 200 }}>
	<!-- Header -->
	<header class="panel-header">
		<div class="header-row">
			<div class="header-content">
				<Sparkles size={18} />
				<h3 class="panel-title">{$t('suggestions.needInspiration')}</h3>
			</div>
			<button class="panel-close" onclick={handleDismiss} aria-label={$t('suggestions.dismiss')}>
				<X size={18} />
			</button>
		</div>
		<p class="panel-subtitle">{$t('suggestions.pickUpWhereLeftOff')}</p>
	</header>

	<!-- Documents List -->
	<div class="documents-content">
		{#if documents.length > 0}
			<section class="documents-section" transition:slide={{ duration: 200 }}>
				<h4 class="section-label">{$t('suggestions.recentDocuments')}</h4>
				<div class="documents-list">
					{#each documents as document, i (document.id)}
						{@const isLatest = i === 0}
						<button
							class="document-card"
							class:latest={isLatest}
							class:hovered={hoveredId === document.id}
							onclick={() => handleSelect(document)}
							onmouseenter={() => (hoveredId = document.id)}
							onmouseleave={() => (hoveredId = null)}
							style="animation-delay: {i * 50}ms"
						>
							{#if isLatest}
								<div class="latest-badge">
									<Star size={10} />
									<span>{$t('suggestions.latest')}</span>
								</div>
							{/if}
							<div class="document-icon" class:latest={isLatest}>
								<FileText size={18} />
							</div>
							<div class="document-content">
								<span class="document-title"
									>{document.document_number} - {document.client_name}</span
								>
								<div class="document-meta">
									<span class="document-type">{document.document_type}</span>
									<span class="document-separator">-</span>
									<span class="document-amount">{formatCurrency(document.total)}</span>
									<span class="document-separator">-</span>
									<Clock size={12} />
									<span class="document-date">{formatDate(document.created_at)}</span>
								</div>
							</div>
							<ChevronRight size={16} class="document-arrow" />
						</button>
					{/each}
				</div>
			</section>
		{:else}
			<div class="empty-state">
				<FileText size={32} />
				<p>{$t('suggestions.noRecentDocuments')}</p>
			</div>
		{/if}
	</div>

	<!-- Footer Action -->
	<footer class="panel-footer">
		<button class="ai-suggestion-btn" onclick={handleDismiss}>
			<Sparkles size={16} />
			<span>{$t('suggestions.continueWithAI')}</span>
			<ChevronRight size={16} />
		</button>
	</footer>
</div>

<style>
	.document-suggestions {
		display: flex;
		flex-direction: column;
		background: var(--color-bg-secondary, #dbe8f4);
		border-radius: 16px;
		overflow: hidden;
		border: 1px solid var(--color-border, #e2e8f0);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
	}

	/* Header */
	.panel-header {
		padding: 16px 20px 12px;
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	}

	.header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 4px;
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--color-accent, #0684c7);
	}

	.panel-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--color-text, #0f172a);
		margin: 0;
	}

	.panel-subtitle {
		font-size: 13px;
		color: var(--color-text-secondary, #64748b);
		margin: 0;
	}

	.panel-close {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.04);
		border: none;
		border-radius: 8px;
		color: var(--color-text-secondary, #64748b);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.panel-close:hover {
		background: rgba(0, 0, 0, 0.08);
		color: var(--color-text, #0f172a);
	}

	/* Content */
	.documents-content {
		padding: 12px 16px;
		max-height: 320px;
		overflow-y: auto;
	}

	.section-label {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-secondary, #94a3b8);
		margin: 0 0 10px;
		padding-left: 4px;
	}

	/* Documents List */
	.documents-section {
		margin-bottom: 8px;
	}

	.documents-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.document-card {
		position: relative;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 14px;
		background: rgba(255, 255, 255, 0.6);
		border: 1px solid transparent;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		animation: fadeInUp 0.3s ease forwards;
		opacity: 0;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.document-card:hover,
	.document-card.hovered {
		background: rgba(255, 255, 255, 0.9);
		border-color: rgba(6, 132, 199, 0.2);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
		transform: translateY(-1px);
	}

	.document-card.latest {
		background: linear-gradient(135deg, rgba(6, 132, 199, 0.08) 0%, rgba(14, 165, 233, 0.08) 100%);
		border-color: rgba(6, 132, 199, 0.15);
	}

	.document-card.latest:hover {
		background: linear-gradient(135deg, rgba(6, 132, 199, 0.12) 0%, rgba(14, 165, 233, 0.12) 100%);
		border-color: rgba(6, 132, 199, 0.3);
	}

	.latest-badge {
		position: absolute;
		top: -6px;
		right: 12px;
		display: flex;
		align-items: center;
		gap: 3px;
		padding: 2px 8px;
		background: var(--color-accent, #0684c7);
		border-radius: 10px;
		font-size: 10px;
		font-weight: 600;
		color: white;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.document-icon {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(6, 132, 199, 0.1);
		border-radius: 10px;
		color: var(--color-accent, #0684c7);
		flex-shrink: 0;
	}

	.document-icon.latest {
		background: rgba(6, 132, 199, 0.15);
	}

	.document-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.document-title {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-text, #0f172a);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.document-meta {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 12px;
		color: var(--color-text-secondary, #64748b);
	}

	.document-type {
		font-weight: 500;
		text-transform: capitalize;
	}

	.document-separator {
		opacity: 0.5;
	}

	.document-date {
		opacity: 0.9;
	}

	.document-card :global(.document-arrow) {
		color: var(--color-text-secondary, #cbd5e1);
		flex-shrink: 0;
		transition:
			transform 0.2s ease,
			color 0.2s ease;
	}

	.document-card:hover :global(.document-arrow) {
		color: var(--color-accent, #0684c7);
		transform: translateX(2px);
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 40px 20px;
		color: var(--color-text-secondary, #94a3b8);
	}

	.empty-state p {
		font-size: 14px;
		margin: 0;
	}

	/* Footer */
	.panel-footer {
		padding: 12px 16px 16px;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}

	.ai-suggestion-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 12px 16px;
		background: var(--color-accent, #0684c7);
		border: none;
		border-radius: 12px;
		font-size: 14px;
		font-weight: 500;
		color: white;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.ai-suggestion-btn:hover {
		background: var(--color-primary-600, #056fa6);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(6, 132, 199, 0.3);
	}

	.ai-suggestion-btn:active {
		transform: translateY(0);
	}

	/* Scrollbar */
	.documents-content::-webkit-scrollbar {
		width: 4px;
	}

	.documents-content::-webkit-scrollbar-track {
		background: transparent;
	}

	.documents-content::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.1);
		border-radius: 2px;
	}

	.documents-content::-webkit-scrollbar-thumb:hover {
		background: rgba(0, 0, 0, 0.15);
	}

	/* Dark mode support */
	:global(.dark) .document-suggestions {
		background: var(--color-bg-secondary, #171717);
		border-color: var(--color-border, #262626);
	}

	:global(.dark) .document-card {
		background: rgba(255, 255, 255, 0.05);
	}

	:global(.dark) .document-card:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	:global(.dark) .document-card.latest {
		background: linear-gradient(135deg, rgba(6, 132, 199, 0.15) 0%, rgba(14, 165, 233, 0.15) 100%);
	}

	:global(.dark) .panel-close {
		background: rgba(255, 255, 255, 0.06);
	}

	:global(.dark) .panel-close:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	@media (prefers-reduced-motion: reduce) {
		.document-card {
			animation: none;
			opacity: 1;
		}

		.document-card:hover,
		.document-card.hovered {
			transform: none;
		}

		.ai-suggestion-btn:hover {
			transform: none;
		}
	}

	/* Mobile */
	@media (max-width: 480px) {
		.panel-header {
			padding: 14px 16px 10px;
		}

		.documents-content {
			padding: 10px 12px;
		}

		.document-icon {
			width: 36px;
			height: 36px;
		}

		.panel-footer {
			padding: 10px 12px 14px;
		}
	}
</style>

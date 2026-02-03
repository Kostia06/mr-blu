<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { t } from '$lib/i18n';
	import { isModalOpen } from '$lib/stores/appState';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import X from 'lucide-svelte/icons/x';

	interface DocumentInfo {
		id: string;
		type: 'invoice' | 'estimate' | 'contract';
		title: string;
		client: string;
		amount?: number;
	}

	interface Props {
		open: boolean;
		document: DocumentInfo | null;
		onClose: () => void;
		onConfirm: (documentId: string, documentType: string) => Promise<void>;
	}

	let { open = $bindable(), document, onClose, onConfirm }: Props = $props();

	let isDeleting = $state(false);
	let error = $state<string | null>(null);

	function formatAmount(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function handleClose() {
		if (isDeleting) return;
		error = null;
		open = false;
		onClose();
	}

	async function handleDelete() {
		if (!document || isDeleting) return;

		isDeleting = true;
		error = null;

		try {
			await onConfirm(document.id, document.type);
			handleClose();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete document';
			isDeleting = false;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && !isDeleting) {
			handleClose();
		}
	}

	// Reset state when modal opens and sync with global modal state
	$effect(() => {
		if (open) {
			error = null;
			isDeleting = false;
			isModalOpen.set(true);
		} else {
			isModalOpen.set(false);
		}
	});
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if open && document}
	<!-- Backdrop -->
	<button
		class="modal-backdrop"
		onclick={handleClose}
		aria-label={$t('aria.closeModal')}
		transition:fade={{ duration: 200 }}
	></button>

	<!-- Modal -->
	<div
		class="modal-container"
		role="dialog"
		aria-modal="true"
		aria-labelledby="delete-modal-title"
		transition:fly={{ y: 50, duration: 300, easing: cubicOut }}
	>
		<div class="modal-content">
			<!-- Close button -->
			<button class="close-btn" onclick={handleClose} aria-label={$t('common.close')}>
				<X size={20} />
			</button>

			<div class="modal-step" in:fade={{ duration: 200 }}>
				<div class="icon-wrapper warning">
					<Trash2 size={32} />
				</div>

				<h2 id="delete-modal-title" class="modal-title">
					{$t('delete.title')}
				</h2>

				<div class="warning-box">
					<AlertTriangle size={16} />
					<span>{$t('delete.warning')}</span>
				</div>

				<!-- Document summary -->
				<div class="document-summary">
					<div class="summary-row">
						<span class="summary-label">{$t('documents.client')}</span>
						<span class="summary-value">{document.client}</span>
					</div>
					<div class="summary-row">
						<span class="summary-label">{$t('review.documentType')}</span>
						<span class="summary-value type-badge {document.type}">
							{document.type === 'invoice'
								? $t('review.invoice')
								: document.type === 'estimate'
									? $t('review.estimate')
									: $t('documents.contracts')}
						</span>
					</div>
					{#if document.amount}
						<div class="summary-row">
							<span class="summary-label">{$t('documents.amount')}</span>
							<span class="summary-value amount">{formatAmount(document.amount)}</span>
						</div>
					{/if}
				</div>

				{#if error}
					<div class="error-message">
						<AlertTriangle size={14} />
						<span>{error}</span>
					</div>
				{/if}

				<div class="modal-actions">
					<button class="btn secondary" onclick={handleClose} disabled={isDeleting}>
						{$t('common.cancel')}
					</button>
					<button
						class="btn danger"
						onclick={handleDelete}
						disabled={isDeleting}
					>
						{#if isDeleting}
							<span class="spinner"></span>
							{$t('docDetail.deleting')}
						{:else}
							{$t('common.delete')}
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		z-index: 1000;
		border: none;
		cursor: default;
	}

	.modal-container {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1001;
		padding: 20px;
	}

	.modal-content {
		position: relative;
		background: rgba(255, 255, 255, 0.98);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-radius: var(--radius-lg, 20px);
		padding: 32px 24px 24px;
		max-width: 400px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
	}

	.close-btn {
		position: absolute;
		top: 12px;
		right: 12px;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--gray-100, #f1f5f9);
		border: none;
		border-radius: 50%;
		color: var(--gray-500, #64748b);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.close-btn:hover {
		background: var(--gray-200, #e2e8f0);
		color: var(--gray-700, #334155);
	}

	.modal-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.icon-wrapper {
		width: 72px;
		height: 72px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		margin-bottom: 16px;
	}

	.icon-wrapper.warning {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
	}

	.modal-title {
		font-family: var(--font-display, system-ui);
		font-size: 22px;
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		margin: 0 0 16px;
	}

	.warning-box {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		background: rgba(245, 158, 11, 0.1);
		border-radius: 10px;
		color: #d97706;
		font-size: 14px;
		font-weight: 500;
		margin-bottom: 20px;
		width: 100%;
	}

	.document-summary {
		width: 100%;
		background: var(--gray-50, #f8fafc);
		border-radius: 12px;
		padding: 16px;
		margin-bottom: 24px;
	}

	.summary-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 0;
	}

	.summary-row:not(:last-child) {
		border-bottom: 1px solid var(--gray-100, #f1f5f9);
	}

	.summary-label {
		font-size: 14px;
		color: var(--gray-500, #64748b);
	}

	.summary-value {
		font-size: 14px;
		font-weight: 600;
		color: var(--gray-900, #0f172a);
	}

	.summary-value.amount {
		color: var(--data-green, #10b981);
	}

	.type-badge {
		padding: 4px 10px;
		border-radius: 100px;
		font-size: 12px;
		text-transform: capitalize;
	}

	.type-badge.invoice {
		background: rgba(16, 185, 129, 0.1);
		color: #059669;
	}

	.type-badge.estimate {
		background: rgba(14, 165, 233, 0.1);
		color: #0284c7;
	}

	.type-badge.contract {
		background: rgba(0, 102, 255, 0.1);
		color: var(--blu-primary, #0066ff);
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 14px;
		background: rgba(239, 68, 68, 0.1);
		border-radius: 8px;
		color: #dc2626;
		font-size: 13px;
		margin-bottom: 16px;
		width: 100%;
	}

	.modal-actions {
		display: flex;
		gap: 12px;
		width: 100%;
	}

	.btn {
		flex: 1;
		padding: 14px 20px;
		border: none;
		border-radius: 12px;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.btn.secondary {
		background: var(--gray-100, #f1f5f9);
		color: var(--gray-700, #334155);
	}

	.btn.secondary:hover:not(:disabled) {
		background: var(--gray-200, #e2e8f0);
	}

	.btn.danger {
		background: #ef4444;
		color: white;
	}

	.btn.danger:hover:not(:disabled) {
		background: #dc2626;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

</style>

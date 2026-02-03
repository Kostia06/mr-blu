<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { t } from '$lib/i18n';
	import Users from 'lucide-svelte/icons/users';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Check from 'lucide-svelte/icons/check';
	import X from 'lucide-svelte/icons/x';

	interface ClientData {
		name: string;
		email?: string | null;
		phone?: string | null;
		address?: string | null;
	}

	interface Difference {
		field: string;
		old: string | null;
		new: string | null;
	}

	interface ConflictData {
		existingClient: ClientData;
		newData: ClientData;
		differences: Difference[];
	}

	interface Props {
		open: boolean;
		conflictData: ConflictData | null;
		onClose: () => void;
		onDecision: (decision: 'keep' | 'use_new' | 'update') => void;
	}

	let { open = $bindable(), conflictData, onClose, onDecision }: Props = $props();

	let isProcessing = $state(false);

	function handleClose() {
		if (isProcessing) return;
		open = false;
		onClose();
	}

	function handleDecision(decision: 'keep' | 'use_new' | 'update') {
		if (isProcessing) return;
		isProcessing = true;
		onDecision(decision);
		// The parent component should close this modal after processing
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && !isProcessing) {
			handleClose();
		}
	}

	function formatFieldLabel(field: string): string {
		const labels: Record<string, string> = {
			email: 'Email',
			phone: 'Phone',
			address: 'Address'
		};
		return labels[field] || field;
	}

	// Reset state when modal opens
	$effect(() => {
		if (open) {
			isProcessing = false;
		}
	});
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if open && conflictData}
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
		aria-labelledby="merge-modal-title"
		transition:fly={{ y: 50, duration: 300, easing: cubicOut }}
	>
		<div class="modal-content">
			<!-- Close button -->
			<button class="close-btn" onclick={handleClose} aria-label={$t('common.close')}>
				<X size={20} />
			</button>

			<div class="modal-step">
				<div class="icon-wrapper">
					<Users size={28} />
				</div>

				<h2 id="merge-modal-title" class="modal-title">
					{$t('merge.title')}
				</h2>

				<p class="modal-description">
					{$t('merge.description').replace('{name}', conflictData.existingClient.name)}
				</p>

				<!-- Differences display -->
				<div class="differences-list">
					{#each conflictData.differences as diff}
						<div class="difference-item">
							<span class="diff-label">{formatFieldLabel(diff.field)}</span>
							<div class="diff-values">
								<span class="diff-old">
									{diff.old || '—'}
								</span>
								<ArrowRight size={14} class="diff-arrow" />
								<span class="diff-new">
									{diff.new || '—'}
								</span>
							</div>
						</div>
					{/each}
				</div>

				<!-- Action buttons -->
				<div class="action-options">
					<button class="option-btn" onclick={() => handleDecision('keep')} disabled={isProcessing}>
						<div class="option-icon keep">
							<Check size={18} />
						</div>
						<div class="option-text">
							<span class="option-title">{$t('merge.keepExisting')}</span>
							<span class="option-desc">Use existing client data, ignore new</span>
						</div>
					</button>

					<button
						class="option-btn"
						onclick={() => handleDecision('use_new')}
						disabled={isProcessing}
					>
						<div class="option-icon use-new">
							<ArrowRight size={18} />
						</div>
						<div class="option-text">
							<span class="option-title">{$t('merge.useNew')}</span>
							<span class="option-desc">Use new data for this document only</span>
						</div>
					</button>

					<button
						class="option-btn highlight"
						onclick={() => handleDecision('update')}
						disabled={isProcessing}
					>
						<div class="option-icon update">
							<Users size={18} />
						</div>
						<div class="option-text">
							<span class="option-title">{$t('merge.updateBoth')}</span>
							<span class="option-desc">Update client record with new data</span>
						</div>
					</button>
				</div>

				<button class="cancel-btn" onclick={handleClose} disabled={isProcessing}>
					{$t('common.cancel')}
				</button>
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
		align-items: flex-end;
		justify-content: center;
		z-index: 1001;
		padding: 0;
		overflow-y: auto;
	}

	.modal-content {
		position: relative;
		background: rgba(255, 255, 255, 0.98);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		padding: 32px 24px calc(24px + var(--safe-area-bottom, 0px));
		max-width: 400px;
		width: 100%;
		max-height: calc(100vh - 40px);
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
	}

	.modal-content::before {
		content: '';
		position: absolute;
		top: 8px;
		left: 50%;
		transform: translateX(-50%);
		width: 36px;
		height: 5px;
		background: #D1D1D6;
		border-radius: 3px;
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
		background: rgba(245, 158, 11, 0.1);
		color: #f59e0b;
	}

	.modal-title {
		font-family: var(--font-display, system-ui);
		font-size: 22px;
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		margin: 0 0 8px;
	}

	.modal-description {
		font-size: 14px;
		color: var(--gray-500, #64748b);
		margin: 0 0 20px;
		line-height: 1.5;
	}

	.differences-list {
		width: 100%;
		background: var(--gray-50, #f8fafc);
		border-radius: 12px;
		padding: 12px;
		margin-bottom: 20px;
	}

	.difference-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 10px;
		border-radius: 8px;
		background: white;
	}

	.difference-item:not(:last-child) {
		margin-bottom: 8px;
	}

	.diff-label {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--gray-400, #9ca3af);
	}

	.diff-values {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.diff-old {
		flex: 1;
		font-size: 13px;
		color: var(--gray-500, #64748b);
		text-decoration: line-through;
		text-align: left;
		word-break: break-word;
	}

	:global(.diff-arrow) {
		color: var(--gray-300, #cbd5e1);
		flex-shrink: 0;
	}

	.diff-new {
		flex: 1;
		font-size: 13px;
		font-weight: 600;
		color: var(--gray-900, #0f172a);
		text-align: right;
		word-break: break-word;
	}

	.action-options {
		display: flex;
		flex-direction: column;
		gap: 10px;
		width: 100%;
		margin-bottom: 16px;
	}

	.option-btn {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 14px 16px;
		background: white;
		border: 2px solid var(--gray-100, #f1f5f9);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
	}

	.option-btn:hover:not(:disabled) {
		border-color: var(--gray-200, #e2e8f0);
		background: var(--gray-50, #f8fafc);
	}

	.option-btn.highlight {
		border-color: rgba(0, 102, 255, 0.2);
		background: rgba(0, 102, 255, 0.02);
	}

	.option-btn.highlight:hover:not(:disabled) {
		border-color: var(--blu-primary, #0066ff);
		background: rgba(0, 102, 255, 0.05);
	}

	.option-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.option-icon {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		flex-shrink: 0;
	}

	.option-icon.keep {
		background: var(--gray-100, #f1f5f9);
		color: var(--gray-600, #475569);
	}

	.option-icon.use-new {
		background: rgba(245, 158, 11, 0.1);
		color: #f59e0b;
	}

	.option-icon.update {
		background: rgba(0, 102, 255, 0.1);
		color: var(--blu-primary, #0066ff);
	}

	.option-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.option-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--gray-900, #0f172a);
	}

	.option-desc {
		font-size: 12px;
		color: var(--gray-500, #64748b);
	}

	.cancel-btn {
		padding: 12px 20px;
		background: transparent;
		border: none;
		color: var(--gray-500, #64748b);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.cancel-btn:hover:not(:disabled) {
		color: var(--gray-700, #334155);
	}

	.cancel-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

</style>

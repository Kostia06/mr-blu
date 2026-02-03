<script lang="ts">
	import { t } from '$lib/i18n';
	import X from 'lucide-svelte/icons/x';
	import Link from 'lucide-svelte/icons/link';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import HelpCircle from 'lucide-svelte/icons/help-circle';

	interface Props {
		open: boolean;
		linkUrl: string | null;
		documentType: 'invoice' | 'estimate';
		onClose: () => void;
	}

	let { open, linkUrl, documentType, onClose }: Props = $props();

	let copied = $state(false);

	async function copyLink() {
		if (linkUrl) {
			try {
				await navigator.clipboard.writeText(linkUrl);
				copied = true;
				setTimeout(() => (copied = false), 3000);
			} catch {
				console.error('Failed to copy link');
			}
		}
	}

	function openPreview() {
		if (linkUrl) {
			window.open(linkUrl, '_blank');
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={onClose} role="presentation">
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_interactive_supports_focus -->
		<div
			class="modal-content view-link-modal"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<button class="modal-close" onclick={onClose}>
				<X size={20} />
			</button>

			<div class="modal-header">
				<Link size={24} class="modal-icon" />
				<h3>{$t('review.shareLinkCreated')}</h3>
			</div>

			<div class="modal-body">
				<p class="modal-description">{$t('review.anyoneCanView', { type: documentType })}</p>

				<div class="link-display">
					<input type="text" readonly value={linkUrl || ''} class="link-input" />
				</div>

				<div class="modal-actions">
					<button class="modal-btn secondary" onclick={copyLink}>
						{#if copied}
							<Check size={16} />
							{$t('common.copied')}
						{:else}
							<Copy size={16} />
							{$t('review.copyLink')}
						{/if}
					</button>
					<button class="modal-btn primary" onclick={openPreview}>
						<ExternalLink size={16} />
						{$t('review.openPreview')}
					</button>
				</div>
			</div>

			<p class="modal-footer-note">
				<HelpCircle size={14} />
				{$t('review.noLoginRequired')}
			</p>
		</div>
	</div>
{/if}

<style>
	/* View Link Modal */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 20px;
	}

	.modal-content {
		background: var(--white);
		border-radius: 16px;
		padding: 24px;
		max-width: 480px;
		width: 100%;
		position: relative;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
	}

	.modal-close {
		position: absolute;
		top: 16px;
		right: 16px;
		background: none;
		border: none;
		color: var(--gray-500);
		cursor: pointer;
		padding: 4px;
		border-radius: 6px;
		transition: all 0.15s ease;
	}

	.modal-close:hover {
		background: var(--gray-100);
		color: #334155;
	}

	.modal-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
	}

	.modal-header :global(.modal-icon) {
		color: #3b82f6;
	}

	.modal-header h3 {
		font-size: 18px;
		font-weight: 600;
		color: #1e293b;
		margin: 0;
	}

	.modal-body {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.modal-description {
		font-size: 14px;
		color: var(--gray-500);
		margin: 0;
	}

	.link-display {
		background: transparent;
		border: 1px solid var(--gray-200);
		border-radius: 8px;
		padding: 4px;
	}

	.link-input {
		width: 100%;
		border: none;
		background: transparent;
		padding: 10px 12px;
		font-size: 13px;
		color: #1e293b;
		font-family: ui-monospace, monospace;
	}

	.link-input:focus {
		outline: none;
	}

	.modal-actions {
		display: flex;
		gap: 10px;
	}

	.modal-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 12px 16px;
		border-radius: 10px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.modal-btn.secondary {
		background: var(--gray-100);
		border: 1px solid var(--gray-200);
		color: var(--gray-600);
	}

	.modal-btn.secondary:hover {
		background: var(--gray-200);
	}

	.modal-btn.primary {
		background: #3b82f6;
		border: none;
		color: white;
	}

	.modal-btn.primary:hover {
		background: #2563eb;
	}

	.modal-footer-note {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: var(--gray-400);
		margin: 16px 0 0;
		padding-top: 16px;
		border-top: 1px solid #f1f5f9;
	}
</style>

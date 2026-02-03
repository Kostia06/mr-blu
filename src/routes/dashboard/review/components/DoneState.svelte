<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import Download from 'lucide-svelte/icons/download';
	import { t } from '$lib/i18n';
	import { goto } from '$app/navigation';

	interface Props {
		title?: string;
		message?: string;
		documentId?: string | null;
		documentType?: 'invoice' | 'estimate';
		onViewDocuments?: () => void;
		onDownload?: () => void;
		onNewRecording: () => void;
	}

	let {
		title,
		message,
		documentId = null,
		documentType = 'invoice',
		onViewDocuments,
		onDownload,
		onNewRecording
	}: Props = $props();

	function handleViewDocument() {
		if (documentId) {
			goto(`/dashboard/documents/${documentId}?type=${documentType}`);
		} else if (onViewDocuments) {
			onViewDocuments();
		} else {
			goto('/dashboard/documents');
		}
	}
</script>

<div class="done-state">
	<div class="done-icon">
		<Check size={48} strokeWidth={2} />
	</div>
	<h2>{title || $t('review.allDone')}</h2>
	<p>{message || $t('review.allActionsCompleted')}</p>
	<div class="done-actions">
		<button class="btn primary" onclick={handleViewDocument}>
			{documentId ? $t('review.viewDocument') : $t('review.viewDocuments')}
		</button>
		{#if onDownload}
			<button class="btn secondary" onclick={onDownload}>
				<Download size={18} />
				{$t('review.downloadPdf')}
			</button>
		{/if}
		<button class="btn secondary" onclick={onNewRecording}>
			{$t('review.newRecording')}
		</button>
	</div>
</div>

<style>
	.done-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		text-align: center;
	}

	.done-icon {
		width: 80px;
		height: 80px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(16, 185, 129, 0.15);
		border-radius: 50%;
		color: #34d399;
		margin-bottom: 24px;
		animation: done-pop 0.5s ease;
	}

	@keyframes done-pop {
		0% {
			transform: scale(0);
			opacity: 0;
		}
		50% {
			transform: scale(1.1);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	h2 {
		font-size: 24px;
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		margin: 0 0 8px;
	}

	p {
		font-size: 15px;
		color: var(--gray-500, #64748b);
		margin: 0 0 32px;
	}

	.done-actions {
		display: flex;
		flex-direction: column;
		gap: 12px;
		width: 100%;
		max-width: 280px;
	}

	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 14px 24px;
		border: none;
		border-radius: 14px;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
		min-height: 52px;
	}

	.btn.primary {
		background: var(--blu-primary, #0066ff);
		color: white;
	}

	.btn.primary:hover {
		background: #0052cc;
	}

	.btn.secondary {
		background: rgba(255, 255, 255, 0.7);
		border: 1px solid rgba(0, 0, 0, 0.08);
		color: var(--gray-700, #334155);
	}

	.btn.secondary:hover {
		background: rgba(255, 255, 255, 0.9);
		border-color: var(--blu-primary, #0066ff);
		color: var(--blu-primary, #0066ff);
	}

	.btn:active {
		transform: scale(0.98);
	}

	@media (prefers-reduced-motion: reduce) {
		.done-icon {
			animation: none;
		}

		.btn:active {
			transform: none;
		}
	}
</style>

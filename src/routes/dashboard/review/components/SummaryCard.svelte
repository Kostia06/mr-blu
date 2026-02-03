<script lang="ts">
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import { t } from '$lib/i18n';

	interface Props {
		summary: string;
		variant?: 'default' | 'info-query' | 'clone-mode' | 'send-mode';
		label?: string;
	}

	let { summary, variant = 'default', label }: Props = $props();
</script>

<div
	class="summary-card"
	class:info-query={variant === 'info-query'}
	class:clone-mode={variant === 'clone-mode'}
	class:send-mode={variant === 'send-mode'}
>
	<div class="summary-header">
		<Sparkles size={16} class="summary-icon" />
		<span>{label || $t('review.iUnderstood')}</span>
	</div>
	<p class="summary-text">{summary || $t('review.processingRequest')}</p>
</div>

<style>
	.summary-card {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 16px;
		background: rgba(245, 158, 11, 0.06);
		border: 1px solid rgba(245, 158, 11, 0.2);
		border-radius: 14px;
	}

	.summary-header {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		font-weight: 600;
		color: #d97706;
	}

	.summary-header :global(.summary-icon) {
		flex-shrink: 0;
	}

	.summary-text {
		font-size: 15px;
		line-height: 1.5;
		color: var(--gray-800, #1e293b);
		margin: 0;
	}

	/* Variants */
	.summary-card.info-query {
		background: rgba(168, 85, 247, 0.08);
		border: 1px solid rgba(168, 85, 247, 0.2);
	}

	.summary-card.info-query .summary-header {
		color: #c084fc;
	}

	.summary-card.clone-mode {
		background: rgba(59, 130, 246, 0.08);
		border: 1px solid rgba(59, 130, 246, 0.2);
	}

	.summary-card.clone-mode .summary-header {
		color: #60a5fa;
	}

	.summary-card.send-mode {
		background: rgba(139, 92, 246, 0.08);
		border: 1px solid rgba(139, 92, 246, 0.3);
	}

	.summary-card.send-mode .summary-header {
		color: #a78bfa;
	}
</style>

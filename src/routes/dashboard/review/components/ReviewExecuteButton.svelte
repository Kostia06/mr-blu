<script lang="ts">
	import { t } from '$lib/i18n';
	import Play from 'lucide-svelte/icons/play';
	import Loader2 from 'lucide-svelte/icons/loader-2';

	let {
		isExecuting,
		canExecute,
		onExecute
	}: {
		isExecuting: boolean;
		canExecute: boolean;
		onExecute: () => void;
	} = $props();
</script>

<div class="execute-section">
	<button
		class="execute-btn"
		class:executing={isExecuting}
		onclick={onExecute}
		disabled={!canExecute || isExecuting}
	>
		{#if isExecuting}
			<Loader2 size={20} class="spinning" />
			<span>{$t('review.executing')}</span>
		{:else}
			<Play size={20} />
			<span>{$t('review.executeAll')}</span>
		{/if}
	</button>
</div>

<style>
	.execute-section {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 50;
		padding: var(--space-4) var(--page-padding-x);
		padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom, 0));
		background: linear-gradient(to top, var(--white) 80%, transparent);
	}

	.execute-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2-5);
		width: 100%;
		max-width: var(--page-max-width);
		margin: 0 auto;
		padding: var(--space-4) var(--space-6);
		background: var(--blu-primary);
		border-radius: var(--radius-button);
		color: var(--white);
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		transition: all var(--duration-fast) ease;
		box-shadow: 0 4px 20px var(--glass-primary-25);
	}

	.execute-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 6px 24px rgba(0, 102, 255, 0.35);
	}

	.execute-btn:active:not(:disabled) {
		transform: scale(0.98);
	}

	.execute-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.execute-btn.executing {
		background: var(--gray-400, #94a3b8);
	}

	:global(.spinning) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>

<script lang="ts">
	import { fly } from 'svelte/transition';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import Info from 'lucide-svelte/icons/info';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import X from 'lucide-svelte/icons/x';
	import { t } from '$lib/i18n';

	type ToastType = 'success' | 'error' | 'info' | 'warning';

	interface Toast {
		id: string;
		type: ToastType;
		message: string;
	}

	interface Props {
		toasts: Toast[];
		onDismiss: (id: string) => void;
	}

	let { toasts, onDismiss }: Props = $props();

	const icons: Record<ToastType, typeof CheckCircle> = {
		success: CheckCircle,
		error: XCircle,
		info: Info,
		warning: AlertTriangle
	};

	function getIcon(type: ToastType) {
		return icons[type];
	}
</script>

<div class="toast-container">
	{#each toasts as toast (toast.id)}
		{@const IconComponent = getIcon(toast.type)}
		<div transition:fly={{ y: 20, duration: 200 }} class="toast toast-{toast.type}" role="alert">
			<IconComponent class="toast-icon" />
			<p class="toast-message">{toast.message}</p>
			<button
				onclick={() => onDismiss(toast.id)}
				class="toast-dismiss"
				aria-label={$t('aria.dismissNotification')}
			>
				<X size={16} />
			</button>
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		bottom: calc(var(--bottom-nav-height, 64px) + var(--space-4));
		left: var(--space-4);
		right: var(--space-4);
		z-index: var(--z-toast);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		max-width: 400px;
		margin: 0 auto;
	}

	.toast {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: 14px 20px;
		border-radius: var(--radius-md);
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: none;
		box-shadow: var(--blu-shadow-lg);
	}

	/* Success Toast */
	.toast-success :global(.toast-icon) {
		color: #34C759;
	}

	/* Error Toast */
	.toast-error :global(.toast-icon) {
		color: #FF3B30;
	}

	/* Info Toast */
	.toast-info :global(.toast-icon) {
		color: #0A84FF;
	}

	/* Warning Toast */
	.toast-warning :global(.toast-icon) {
		color: #FF9500;
	}

	:global(.toast-icon) {
		width: var(--icon-md);
		height: var(--icon-md);
		flex-shrink: 0;
	}

	.toast-message {
		flex: 1;
		font-size: var(--text-sm);
		color: white;
		margin: 0;
		line-height: var(--leading-snug);
	}

	.toast-dismiss {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-1);
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		color: rgba(255, 255, 255, 0.6);
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.toast-dismiss:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.toast-dismiss:focus-visible {
		outline: 2px solid var(--blu-primary);
		outline-offset: 2px;
	}
</style>

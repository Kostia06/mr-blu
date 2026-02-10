<script lang="ts">
	import { fly } from 'svelte/transition';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import Info from 'lucide-svelte/icons/info';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import X from 'lucide-svelte/icons/x';
	import { t } from '$lib/i18n';

	function easeOutExpo(t: number): number {
		return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
	}

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
		<div
			transition:fly={{ y: 40, duration: 400, easing: easeOutExpo }}
			class="toast toast-{toast.type}"
			role="alert"
		>
			<div class="toast-accent"></div>
			<div class="toast-body">
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
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		bottom: calc(var(--bottom-nav-height, 64px) + var(--space-4) + var(--safe-area-bottom, 0px));
		left: var(--space-4);
		right: var(--space-4);
		z-index: var(--z-toast);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		max-width: 400px;
		margin: 0 auto;
		pointer-events: none;
	}

	.toast {
		position: relative;
		overflow: hidden;
		border-radius: var(--radius-card);
		background: var(--glass-blu-light-95);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		border: 1px solid var(--blu-border);
		box-shadow: var(--blu-shadow-lg);
		pointer-events: auto;
	}

	.toast-accent {
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		width: 3px;
	}

	.toast-success .toast-accent {
		background: var(--toast-success-text);
	}

	.toast-error .toast-accent {
		background: var(--toast-error-text);
	}

	.toast-info .toast-accent {
		background: var(--toast-info-text);
	}

	.toast-warning .toast-accent {
		background: var(--toast-warning-text);
	}

	.toast-body {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: 14px 16px 14px 20px;
	}

	.toast-success :global(.toast-icon) {
		color: var(--toast-success-text);
	}

	.toast-error :global(.toast-icon) {
		color: var(--toast-error-text);
	}

	.toast-info :global(.toast-icon) {
		color: var(--toast-info-text);
	}

	.toast-warning :global(.toast-icon) {
		color: var(--toast-warning-text);
	}

	:global(.toast-icon) {
		width: var(--icon-md);
		height: var(--icon-md);
		flex-shrink: 0;
	}

	.toast-message {
		flex: 1;
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--gray-800);
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
		border-radius: var(--radius-sm);
		color: var(--gray-400);
		cursor: pointer;
		transition: all var(--duration-fast) ease;
		flex-shrink: 0;
	}

	.toast-dismiss:hover {
		background: var(--glass-black-5);
		color: var(--gray-600);
	}

	.toast-dismiss:focus-visible {
		outline: 2px solid var(--blu-primary);
		outline-offset: 2px;
	}
</style>

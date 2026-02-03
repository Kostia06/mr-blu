<script lang="ts">
	interface Props {
		status?: 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'signed';
		variant?: 'default' | 'outline' | 'dot';
		size?: 'sm' | 'md';
		class?: string;
		children?: import('svelte').Snippet;
	}

	let {
		status,
		variant = 'default',
		size = 'md',
		class: className = '',
		children
	}: Props = $props();

	const statusLabels: Record<string, string> = {
		draft: 'Draft',
		sent: 'Sent',
		pending: 'Pending',
		paid: 'Paid',
		overdue: 'Overdue',
		signed: 'Signed'
	};

	const statusClasses: Record<string, string> = {
		draft: 'badge-draft',
		sent: 'badge-sent',
		pending: 'badge-pending',
		paid: 'badge-paid',
		overdue: 'badge-overdue',
		signed: 'badge-signed'
	};
</script>

<span
	class="badge {variant} {size === 'sm' ? 'badge-sm' : ''} {status
		? statusClasses[status]
		: ''} {className}"
>
	{#if variant === 'dot'}
		<span class="badge-dot"></span>
	{/if}
	{#if children}
		{@render children()}
	{:else if status}
		{statusLabels[status]}
	{/if}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		font-size: 12px;
		font-weight: 600;
		border-radius: var(--radius-chip, 100px);
		white-space: nowrap;
		transition: all 0.2s ease;
	}

	.badge-sm {
		padding: 4px 8px;
		font-size: 11px;
	}

	/* Status colors - Apple HIG aligned */
	.badge-draft {
		background: #F2F2F7;
		color: #8E8E93;
	}

	.badge-sent {
		background: #E6F0FF;
		color: #0066FF;
	}

	.badge-pending {
		background: var(--status-pending-bg, rgba(245, 158, 11, 0.1));
		color: var(--status-pending, #f59e0b);
	}

	.badge-paid {
		background: #E8FAE8;
		color: #34C759;
	}

	.badge-overdue {
		background: #FFF0E6;
		color: #FF9500;
	}

	.badge-signed {
		background: var(--status-signed-bg, rgba(99, 102, 241, 0.1));
		color: var(--status-signed, #6366f1);
	}

	/* Outline variant */
	.badge.outline {
		background: transparent;
		border: 1px solid currentColor;
	}

	.badge.outline.badge-draft {
		border-color: var(--gray-300, #cbd5e1);
	}

	/* Dot variant */
	.badge.dot {
		background: transparent;
		padding: 4px 0;
	}

	.badge-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: currentColor;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.badge {
			transition: none;
		}
	}
</style>

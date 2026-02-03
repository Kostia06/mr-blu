<script lang="ts">
	import ChevronRight from 'lucide-svelte/icons/chevron-right';

	interface Props {
		label: string;
		value?: string;
		href?: string;
		icon?: import('svelte').Snippet;
		trailing?: import('svelte').Snippet;
		showArrow?: boolean;
		destructive?: boolean;
		disabled?: boolean;
		class?: string;
		onclick?: () => void;
	}

	let {
		label,
		value,
		href,
		icon,
		trailing,
		showArrow = true,
		destructive = false,
		disabled = false,
		class: className = '',
		onclick
	}: Props = $props();

	const isInteractive = $derived(!!href || !!onclick);
</script>

{#if href}
	<a {href} class="settings-item {className}" class:destructive class:disabled>
		{#if icon}
			<span class="item-icon">
				{@render icon()}
			</span>
		{/if}

		<span class="item-content">
			<span class="item-label">{label}</span>
			{#if value}
				<span class="item-value">{value}</span>
			{/if}
		</span>

		{#if trailing}
			<span class="item-trailing">
				{@render trailing()}
			</span>
		{:else if showArrow && isInteractive}
			<span class="item-arrow">
				<ChevronRight size={18} strokeWidth={2} />
			</span>
		{/if}
	</a>
{:else}
	<button
		type="button"
		class="settings-item {className}"
		class:destructive
		class:disabled
		{disabled}
		{onclick}
	>
		{#if icon}
			<span class="item-icon">
				{@render icon()}
			</span>
		{/if}

		<span class="item-content">
			<span class="item-label">{label}</span>
			{#if value}
				<span class="item-value">{value}</span>
			{/if}
		</span>

		{#if trailing}
			<span class="item-trailing">
				{@render trailing()}
			</span>
		{:else if showArrow && isInteractive}
			<span class="item-arrow">
				<ChevronRight size={18} strokeWidth={2} />
			</span>
		{/if}
	</button>
{/if}

<style>
	.settings-item {
		display: flex;
		align-items: center;
		gap: 14px;
		width: 100%;
		padding: 16px;
		background: transparent;
		border: none;
		text-decoration: none;
		cursor: pointer;
		transition: background 0.15s ease;
		text-align: left;
	}

	.settings-item:not(:last-child) {
		border-bottom: none;
	}

	.settings-item:hover:not(.disabled) {
		background: var(--gray-50, #f8fafc);
	}

	.settings-item:active:not(.disabled) {
		background: var(--gray-100, #f1f5f9);
	}

	.settings-item.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.settings-item.destructive .item-label,
	.settings-item.destructive .item-icon {
		color: var(--data-red, #ef4444);
	}

	/* Icon */
	.item-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: var(--gray-100, #f1f5f9);
		border-radius: var(--radius-input, 12px);
		color: var(--gray-600, #475569);
		flex-shrink: 0;
	}

	.settings-item.destructive .item-icon {
		background: var(--status-overdue-bg, rgba(239, 68, 68, 0.1));
	}

	/* Content */
	.item-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.item-label {
		font-size: 15px;
		font-weight: 500;
		color: var(--gray-900, #0f172a);
	}

	.item-value {
		font-size: 13px;
		color: var(--gray-500, #64748b);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Trailing */
	.item-trailing {
		flex-shrink: 0;
	}

	/* Arrow */
	.item-arrow {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--gray-400, #94a3b8);
		flex-shrink: 0;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.settings-item {
			transition: none;
		}
	}
</style>

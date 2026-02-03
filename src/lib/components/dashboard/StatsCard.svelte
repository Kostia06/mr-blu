<script lang="ts">
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import TrendingDown from 'lucide-svelte/icons/trending-down';
	import type { Component } from 'svelte';

	interface Props {
		title: string;
		value: number;
		format?: 'currency' | 'number';
		icon?: Component;
		trend?: number;
	}

	let { title, value, format = 'number', icon, trend }: Props = $props();

	const formattedValue = $derived(
		format === 'currency'
			? new Intl.NumberFormat('en-US', {
					style: 'currency',
					currency: 'USD',
					minimumFractionDigits: 0,
					maximumFractionDigits: 0
				}).format(value)
			: new Intl.NumberFormat('en-US').format(value)
	);

	const trendIsPositive = $derived(trend !== undefined && trend > 0);
	const trendIsNegative = $derived(trend !== undefined && trend < 0);
	const formattedTrend = $derived(
		trend !== undefined ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%` : ''
	);
</script>

<div class="stats-card">
	<div class="stats-header">
		{#if icon}
			{@const IconComponent = icon}
			<div class="stats-icon">
				<IconComponent size={20} strokeWidth={1.5} />
			</div>
		{/if}
		<span class="stats-title">{title}</span>
	</div>

	<div class="stats-content">
		<span class="stats-value">{formattedValue}</span>

		{#if trend !== undefined}
			<div class="stats-trend" class:positive={trendIsPositive} class:negative={trendIsNegative}>
				{#if trendIsPositive}
					<TrendingUp size={14} strokeWidth={2} />
				{:else if trendIsNegative}
					<TrendingDown size={14} strokeWidth={2} />
				{/if}
				<span>{formattedTrend}</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.stats-card {
		background: var(--white);
		border: 1px solid var(--blu-border);
		border-radius: var(--radius-xl);
		padding: var(--space-4);
		box-shadow: var(--blu-shadow-card);
		transition: all var(--duration-normal) var(--ease-out-expo);
	}

	.stats-card:hover {
		border-color: var(--blu-border-hover);
		box-shadow: var(--blu-shadow-card-hover);
		transform: translateY(-2px);
	}

	.stats-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-3);
	}

	.stats-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: var(--glass-primary-10);
		border-radius: var(--radius-lg);
		color: var(--blu-primary);
	}

	.stats-title {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--gray-500);
	}

	.stats-content {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--space-2);
	}

	.stats-value {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-weight: var(--font-bold);
		color: var(--gray-900);
		letter-spacing: var(--tracking-tight);
		line-height: var(--leading-none);
	}

	.stats-trend {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-full);
		font-size: var(--text-xs);
		font-weight: var(--font-semibold);
		background: var(--gray-100);
		color: var(--gray-500);
	}

	.stats-trend.positive {
		background: var(--glass-green-10);
		color: var(--data-green);
	}

	.stats-trend.negative {
		background: var(--glass-red-10);
		color: var(--data-red);
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.stats-card {
			transition: none;
		}

		.stats-card:hover {
			transform: none;
		}
	}
</style>

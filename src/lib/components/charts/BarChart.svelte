<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	interface DataPoint {
		label: string;
		value: number;
	}

	interface Props {
		data: DataPoint[];
		height?: number;
		color?: string;
		showValues?: boolean;
	}

	let { data, height = 180, color = '#0066ff', showValues = true }: Props = $props();

	// Get max value for scaling
	const maxValue = $derived(() => {
		const max = Math.max(...data.map((d) => d.value));
		return max > 0 ? max : 100;
	});

	// Format currency for display
	function formatValue(value: number): string {
		if (value >= 1000) {
			return `$${(value / 1000).toFixed(1)}k`;
		}
		return `$${value}`;
	}

	// Get bar height percentage
	function getBarHeight(value: number): number {
		return (value / maxValue()) * 100;
	}
</script>

<div class="bar-chart" style="height: {height}px;">
	{#if data.length > 0}
		<div class="chart-container">
			<div class="bars">
				{#each data as item, i}
					<div
						class="bar-column"
						in:fly={{ y: 20, duration: 300, delay: i * 30, easing: cubicOut }}
					>
						<div class="bar-wrapper">
							{#if showValues && item.value > 0}
								<span class="bar-value">{formatValue(item.value)}</span>
							{/if}
							<div
								class="bar"
								style="height: {getBarHeight(item.value)}%; background: {color};"
							></div>
						</div>
						<span class="bar-label">{item.label}</span>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="empty-chart">
			<span>No data available</span>
		</div>
	{/if}
</div>

<style>
	.bar-chart {
		width: 100%;
	}

	.chart-container {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.bars {
		flex: 1;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 8px;
		padding-bottom: 28px;
	}

	.bar-column {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 0;
		height: 100%;
	}

	.bar-wrapper {
		flex: 1;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
	}

	.bar {
		width: 100%;
		max-width: 32px;
		border-radius: 6px 6px 2px 2px;
		transition: height 0.5s cubic-bezier(0.16, 1, 0.3, 1);
		min-height: 4px;
	}

	.bar-value {
		font-size: 10px;
		font-weight: 600;
		color: var(--gray-600, #475569);
		margin-bottom: 4px;
		white-space: nowrap;
	}

	.bar-label {
		position: absolute;
		bottom: 0;
		font-size: 11px;
		font-weight: 500;
		color: var(--gray-500, #64748b);
		margin-top: 8px;
		white-space: nowrap;
	}

	.bar-column {
		position: relative;
	}

	.bar-label {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
	}

	.empty-chart {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--gray-400, #94a3b8);
		font-size: 14px;
		background: var(--gray-50, #f8fafc);
		border-radius: 12px;
	}
</style>

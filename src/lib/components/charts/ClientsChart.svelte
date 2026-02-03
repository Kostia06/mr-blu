<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	interface ClientData {
		name: string;
		amount: number;
		invoiceCount?: number;
	}

	interface Props {
		data: ClientData[];
		maxItems?: number;
		color?: string;
	}

	let { data, maxItems = 5, color = '#0066ff' }: Props = $props();

	// Get top clients sorted by amount
	const topClients = $derived(() => {
		return [...data].sort((a, b) => b.amount - a.amount).slice(0, maxItems);
	});

	// Get max amount for percentage calculation
	const maxAmount = $derived(() => {
		const clients = topClients();
		return clients.length > 0 ? clients[0].amount : 0;
	});

	// Format currency
	function formatCurrency(value: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(value);
	}

	// Get percentage width
	function getWidth(amount: number): number {
		const max = maxAmount();
		return max > 0 ? (amount / max) * 100 : 0;
	}

	// Generate gradient colors based on rank
	function getBarColor(index: number): string {
		const opacity = 1 - index * 0.15;
		return `rgba(0, 102, 255, ${opacity})`;
	}
</script>

<div class="clients-chart">
	{#if topClients().length > 0}
		<div class="chart-bars">
			{#each topClients() as client, i}
				<div class="bar-row" in:fly={{ x: -20, duration: 300, delay: i * 50, easing: cubicOut }}>
					<div class="bar-info">
						<span class="bar-rank">#{i + 1}</span>
						<span class="bar-name">{client.name}</span>
						<span class="bar-amount">{formatCurrency(client.amount)}</span>
					</div>
					<div class="bar-track">
						<div
							class="bar-fill"
							style="width: {getWidth(client.amount)}%; background: {getBarColor(i)};"
						>
							{#if client.invoiceCount}
								<span class="bar-count">{client.invoiceCount}</span>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty-chart">
			<span>No client data available</span>
		</div>
	{/if}
</div>

<style>
	.clients-chart {
		width: 100%;
	}

	.chart-bars {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.bar-row {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.bar-info {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.bar-rank {
		font-size: 11px;
		font-weight: 600;
		color: var(--gray-400, #94a3b8);
		min-width: 20px;
	}

	.bar-name {
		flex: 1;
		font-size: 14px;
		font-weight: 600;
		color: var(--gray-900, #0f172a);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.bar-amount {
		font-size: 14px;
		font-weight: 700;
		color: var(--data-green, #10b981);
	}

	.bar-track {
		height: 28px;
		background: var(--gray-100, #f1f5f9);
		border-radius: 8px;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding-right: 8px;
		min-width: 40px;
		transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.bar-count {
		font-size: 11px;
		font-weight: 600;
		color: white;
		opacity: 0.9;
	}

	.empty-chart {
		padding: 40px 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--gray-400, #94a3b8);
		font-size: 14px;
		background: var(--gray-50, #f8fafc);
		border-radius: 12px;
	}
</style>

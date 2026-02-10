<script lang="ts">
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import FlaskConical from 'lucide-svelte/icons/flask-conical';

	interface TestStats {
		total: number;
		byCategory: Record<string, number>;
		byPriority: Record<string, number>;
		availableCategories: string[];
		availablePriorities: string[];
	}

	interface Props {
		stats: TestStats | null;
		loading: boolean;
		error: string | null;
		onretry: () => void;
		formatCategory: (category: string) => string;
	}

	let { stats, loading, error, onretry, formatCategory }: Props = $props();
</script>

<section class="stats-section">
	{#if loading}
		<div class="stats-loading">
			<Loader2 size={24} class="spinner" />
			<span>Loading statistics...</span>
		</div>
	{:else if error}
		<div class="stats-error">
			<AlertTriangle size={20} />
			<span>{error}</span>
			<button onclick={onretry}>Retry</button>
		</div>
	{:else if stats}
		<div class="stats-grid">
			<div class="stat-card primary">
				<div class="stat-icon">
					<FlaskConical size={20} strokeWidth={1.5} />
				</div>
				<div class="stat-info">
					<span class="stat-value">{stats.total}</span>
					<span class="stat-label">Total Tests</span>
				</div>
			</div>

			<div class="stat-card">
				<div class="stat-content">
					<span class="stat-mini-label">By Category</span>
					<div class="stat-breakdown">
						{#each Object.entries(stats.byCategory).slice(0, 4) as [cat, count] (cat)}
							<div class="breakdown-item">
								<span class="breakdown-label">{formatCategory(cat).slice(0, 10)}</span>
								<span class="breakdown-value">{count}</span>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<div class="stat-card">
				<div class="stat-content">
					<span class="stat-mini-label">By Priority</span>
					<div class="stat-breakdown priorities">
						<div class="breakdown-item critical">
							<span class="breakdown-label">Critical</span>
							<span class="breakdown-value">{stats.byPriority.critical}</span>
						</div>
						<div class="breakdown-item high">
							<span class="breakdown-label">High</span>
							<span class="breakdown-value">{stats.byPriority.high}</span>
						</div>
						<div class="breakdown-item medium">
							<span class="breakdown-label">Medium</span>
							<span class="breakdown-value">{stats.byPriority.medium}</span>
						</div>
						<div class="breakdown-item low">
							<span class="breakdown-label">Low</span>
							<span class="breakdown-value">{stats.byPriority.low}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</section>

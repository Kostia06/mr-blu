<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		month: string;
		count: number;
	}

	let { month, count }: Props = $props();
</script>

<div class="month-header">
	<span class="month-label">{month}</span>
	<span class="month-count">{count}</span>
</div>

<style>
	.month-header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 4px;
		margin-bottom: 8px;
	}

	.month-label {
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--gray-500, #64748b);
	}

	.month-count {
		font-size: 11px;
		font-weight: 500;
		color: var(--gray-400, #94a3b8);
		background: rgba(148, 163, 184, 0.15);
		padding: 2px 8px;
		border-radius: 10px;
	}
</style>

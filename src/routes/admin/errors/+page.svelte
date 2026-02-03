<script lang="ts">
	import { goto } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Info from 'lucide-svelte/icons/info';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';

	let { data } = $props();

	let expandedErrors = $state<Set<string>>(new Set());

	function toggleError(id: string) {
		if (expandedErrors.has(id)) {
			expandedErrors.delete(id);
		} else {
			expandedErrors.add(id);
		}
		expandedErrors = new Set(expandedErrors);
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getSeverityIcon(severity: string) {
		switch (severity) {
			case 'critical':
			case 'error':
				return AlertCircle;
			case 'warn':
				return AlertTriangle;
			default:
				return Info;
		}
	}

	function getSeverityColor(severity: string) {
		switch (severity) {
			case 'critical':
				return 'var(--data-red, #ef4444)';
			case 'error':
				return 'var(--data-orange, #f59e0b)';
			case 'warn':
				return 'var(--data-amber, #fbbf24)';
			default:
				return 'var(--blu-primary, #0066ff)';
		}
	}

	const severities = ['critical', 'error', 'warn', 'info'];

	function filterBySeverity(severity: string | null) {
		if (severity) {
			goto(`/admin/errors?severity=${severity}`);
		} else {
			goto('/admin/errors');
		}
	}

	const totalPages = $derived(Math.ceil(data.totalCount / data.limit));
</script>

<main class="admin-page">
	<header class="page-header" in:fly={{ y: -20, duration: 400, easing: cubicOut }}>
		<button class="back-btn" onclick={() => goto('/dashboard')} aria-label="Back to dashboard">
			<ChevronLeft size={22} strokeWidth={2} />
		</button>
		<h1 class="page-title">Error Logs</h1>
		<div class="header-spacer"></div>
	</header>

	<div class="page-content" in:fly={{ y: 20, duration: 500, delay: 100, easing: cubicOut }}>
		<!-- Filters -->
		<div class="filters">
			<button
				class="filter-btn"
				class:active={!data.severity}
				onclick={() => filterBySeverity(null)}
			>
				All
			</button>
			{#each severities as sev}
				<button
					class="filter-btn"
					class:active={data.severity === sev}
					onclick={() => filterBySeverity(sev)}
					style:--severity-color={getSeverityColor(sev)}
				>
					{sev}
				</button>
			{/each}
		</div>

		<!-- Stats -->
		<div class="stats">
			<span class="stats-count">{data.totalCount} error{data.totalCount !== 1 ? 's' : ''}</span>
			{#if data.severity}
				<span class="stats-filter">Filtered by: {data.severity}</span>
			{/if}
		</div>

		<!-- Error List -->
		<div class="error-list">
			{#each data.errors as error}
				{@const Icon = getSeverityIcon(error.severity)}
				<div
					class="error-card"
					class:expanded={expandedErrors.has(error.id)}
					in:fly={{ y: 20, duration: 300, easing: cubicOut }}
				>
					<button class="error-header" onclick={() => toggleError(error.id)}>
						<span class="error-icon" style:color={getSeverityColor(error.severity)}>
							<Icon size={20} />
						</span>
						<div class="error-info">
							<span class="error-type">{error.error_type}</span>
							<span class="error-message">{error.message}</span>
							<span class="error-meta">
								{formatDate(error.created_at)} · {error.request_method || 'N/A'}
								{error.request_path || ''}
							</span>
						</div>
						<span class="expand-icon" class:rotated={expandedErrors.has(error.id)}>
							<ChevronDown size={18} />
						</span>
					</button>

					{#if expandedErrors.has(error.id)}
						<div class="error-details" in:fly={{ y: -10, duration: 200, easing: cubicOut }}>
							{#if error.stack}
								<div class="detail-section">
									<h4>Stack Trace</h4>
									<pre class="stack-trace">{error.stack}</pre>
								</div>
							{/if}
							<div class="detail-section">
								<h4>Details</h4>
								<div class="detail-grid">
									<span class="detail-label">User ID:</span>
									<span class="detail-value">{error.user_id || 'N/A'}</span>
									<span class="detail-label">Status Code:</span>
									<span class="detail-value">{error.status_code || 'N/A'}</span>
									<span class="detail-label">Severity:</span>
									<span class="detail-value">{error.severity}</span>
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/each}

			{#if data.errors.length === 0}
				<div class="empty-state">
					<Info size={48} />
					<p>No errors found</p>
				</div>
			{/if}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="pagination">
				{#if data.page > 1}
					<button
						class="page-btn"
						onclick={() =>
							goto(
								`/admin/errors?page=${data.page - 1}${data.severity ? `&severity=${data.severity}` : ''}`
							)}
					>
						Previous
					</button>
				{/if}
				<span class="page-info">Page {data.page} of {totalPages}</span>
				{#if data.page < totalPages}
					<button
						class="page-btn"
						onclick={() =>
							goto(
								`/admin/errors?page=${data.page + 1}${data.severity ? `&severity=${data.severity}` : ''}`
							)}
					>
						Next
					</button>
				{/if}
			</div>
		{/if}
	</div>
</main>

<style>
	.admin-page {
		min-height: 100vh;
		background: transparent;
	}

	.page-header {
		position: sticky;
		top: 0;
		z-index: var(--z-sticky, 100);
		display: flex;
		align-items: center;
		gap: 12px;
		padding: var(--space-3, 12px) var(--page-padding-x, 20px);
		padding-top: calc(var(--space-3, 12px) + var(--safe-area-top, 0px));
		background: transparent;
	}

	.back-btn {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.5);
		backdrop-filter: blur(20px);
		border: none;
		border-radius: var(--radius-md, 14px);
		color: var(--gray-600, #475569);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.back-btn:hover {
		background: rgba(255, 255, 255, 0.7);
	}

	.page-title {
		flex: 1;
		font-size: 20px;
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		margin: 0;
	}

	.header-spacer {
		width: 40px;
	}

	.page-content {
		padding: var(--page-padding-x, 20px);
		max-width: 800px;
		margin: 0 auto;
	}

	.filters {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		margin-bottom: 16px;
	}

	.filter-btn {
		padding: 8px 16px;
		background: rgba(255, 255, 255, 0.5);
		border: none;
		border-radius: 100px;
		font-size: 13px;
		font-weight: 500;
		color: var(--gray-600, #475569);
		cursor: pointer;
		transition: all 0.2s ease;
		text-transform: capitalize;
	}

	.filter-btn:hover {
		background: rgba(255, 255, 255, 0.7);
	}

	.filter-btn.active {
		background: var(--severity-color, var(--blu-primary, #0066ff));
		color: white;
	}

	.stats {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
		font-size: 13px;
		color: var(--gray-500, #64748b);
	}

	.stats-filter {
		color: var(--blu-primary, #0066ff);
	}

	.error-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.error-card {
		background: rgba(255, 255, 255, 0.6);
		backdrop-filter: blur(20px);
		border-radius: var(--radius-lg, 20px);
		overflow: hidden;
	}

	.error-header {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		width: 100%;
		padding: 16px;
		background: transparent;
		border: none;
		text-align: left;
		cursor: pointer;
	}

	.error-icon {
		flex-shrink: 0;
		margin-top: 2px;
	}

	.error-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.error-type {
		font-size: 14px;
		font-weight: 600;
		color: var(--gray-900, #0f172a);
	}

	.error-message {
		font-size: 13px;
		color: var(--gray-600, #475569);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.error-meta {
		font-size: 12px;
		color: var(--gray-400, #94a3b8);
	}

	.expand-icon {
		flex-shrink: 0;
		color: var(--gray-400, #94a3b8);
		transition: transform 0.2s ease;
	}

	.expand-icon.rotated {
		transform: rotate(180deg);
	}

	.error-details {
		padding: 0 16px 16px;
		border-top: 1px solid var(--gray-100, #f1f5f9);
	}

	.detail-section {
		margin-top: 12px;
	}

	.detail-section h4 {
		font-size: 12px;
		font-weight: 600;
		color: var(--gray-500, #64748b);
		margin: 0 0 8px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stack-trace {
		background: var(--gray-900, #0f172a);
		color: var(--gray-100, #f1f5f9);
		padding: 12px;
		border-radius: var(--radius-sm, 10px);
		font-size: 11px;
		font-family: monospace;
		overflow-x: auto;
		white-space: pre-wrap;
		word-break: break-all;
		max-height: 200px;
		margin: 0;
	}

	.detail-grid {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 4px 12px;
		font-size: 13px;
	}

	.detail-label {
		color: var(--gray-500, #64748b);
	}

	.detail-value {
		color: var(--gray-900, #0f172a);
		font-family: monospace;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 48px 24px;
		color: var(--gray-400, #94a3b8);
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 16px;
		margin-top: 24px;
	}

	.page-btn {
		padding: 8px 16px;
		background: var(--blu-primary, #0066ff);
		border: none;
		border-radius: var(--radius-sm, 10px);
		color: white;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.page-btn:hover {
		opacity: 0.9;
	}

	.page-info {
		font-size: 13px;
		color: var(--gray-500, #64748b);
	}
</style>

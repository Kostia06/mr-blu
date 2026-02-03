<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import MessageSquare from 'lucide-svelte/icons/message-square';
	import Bug from 'lucide-svelte/icons/bug';
	import Lightbulb from 'lucide-svelte/icons/lightbulb';
	import Heart from 'lucide-svelte/icons/heart';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Check from 'lucide-svelte/icons/check';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';

	let { data } = $props();

	let expandedFeedback = $state<Set<string>>(new Set());
	let respondingTo = $state<string | null>(null);
	let responseText = $state('');

	function toggleFeedback(id: string) {
		if (expandedFeedback.has(id)) {
			expandedFeedback.delete(id);
		} else {
			expandedFeedback.add(id);
		}
		expandedFeedback = new Set(expandedFeedback);
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getCategoryIcon(category: string) {
		switch (category) {
			case 'bug':
				return Bug;
			case 'feature':
				return Lightbulb;
			case 'praise':
				return Heart;
			case 'complaint':
				return AlertCircle;
			default:
				return MessageSquare;
		}
	}

	function getCategoryColor(category: string) {
		switch (category) {
			case 'bug':
				return 'var(--data-red, #ef4444)';
			case 'feature':
				return 'var(--data-purple, #8b5cf6)';
			case 'praise':
				return 'var(--data-green, #22c55e)';
			case 'complaint':
				return 'var(--data-orange, #f59e0b)';
			default:
				return 'var(--blu-primary, #0066ff)';
		}
	}

	const categories = ['bug', 'feature', 'general', 'praise', 'complaint'];

	function filterByCategory(category: string | null) {
		const params = new URLSearchParams();
		if (category) params.set('category', category);
		if (data.unreadOnly) params.set('unread', 'true');
		goto(`/admin/feedback${params.toString() ? '?' + params.toString() : ''}`);
	}

	function toggleUnread() {
		const params = new URLSearchParams();
		if (data.category) params.set('category', data.category);
		if (!data.unreadOnly) params.set('unread', 'true');
		goto(`/admin/feedback${params.toString() ? '?' + params.toString() : ''}`);
	}

	async function markAsResponded(id: string) {
		const response = await fetch(`/api/feedback/${id}/respond`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ response: responseText })
		});

		if (response.ok) {
			respondingTo = null;
			responseText = '';
			await invalidateAll();
		}
	}

	const totalPages = $derived(Math.ceil(data.totalCount / data.limit));
</script>

<main class="admin-page">
	<header class="page-header" in:fly={{ y: -20, duration: 400, easing: cubicOut }}>
		<button class="back-btn" onclick={() => goto('/dashboard')} aria-label="Back to dashboard">
			<ChevronLeft size={22} strokeWidth={2} />
		</button>
		<h1 class="page-title">Feedback</h1>
		<div class="header-spacer"></div>
	</header>

	<div class="page-content" in:fly={{ y: 20, duration: 500, delay: 100, easing: cubicOut }}>
		<!-- Filters -->
		<div class="filters">
			<button
				class="filter-btn"
				class:active={!data.category}
				onclick={() => filterByCategory(null)}
			>
				All
			</button>
			{#each categories as cat}
				<button
					class="filter-btn"
					class:active={data.category === cat}
					onclick={() => filterByCategory(cat)}
					style:--category-color={getCategoryColor(cat)}
				>
					{cat}
				</button>
			{/each}
			<button class="filter-btn unread-toggle" class:active={data.unreadOnly} onclick={toggleUnread}>
				Unread only
			</button>
		</div>

		<!-- Stats -->
		<div class="stats">
			<span class="stats-count"
				>{data.totalCount} feedback item{data.totalCount !== 1 ? 's' : ''}</span
			>
		</div>

		<!-- Feedback List -->
		<div class="feedback-list">
			{#each data.feedback as item}
				{@const Icon = getCategoryIcon(item.category)}
				<div
					class="feedback-card"
					class:expanded={expandedFeedback.has(item.id)}
					class:responded={item.responded_at}
					in:fly={{ y: 20, duration: 300, easing: cubicOut }}
				>
					<button class="feedback-header" onclick={() => toggleFeedback(item.id)}>
						<span class="feedback-icon" style:color={getCategoryColor(item.category)}>
							<Icon size={20} />
						</span>
						<div class="feedback-info">
							<div class="feedback-meta-row">
								<span class="feedback-category">{item.category}</span>
								{#if item.responded_at}
									<span class="responded-badge">
										<Check size={12} />
										Responded
									</span>
								{/if}
							</div>
							<span class="feedback-comment">{item.comment}</span>
							<span class="feedback-meta">
								{formatDate(item.created_at)} ·
								{item.profiles?.full_name || item.profiles?.email || 'Anonymous'}
							</span>
						</div>
						<span class="expand-icon" class:rotated={expandedFeedback.has(item.id)}>
							<ChevronDown size={18} />
						</span>
					</button>

					{#if expandedFeedback.has(item.id)}
						<div class="feedback-details" in:fly={{ y: -10, duration: 200, easing: cubicOut }}>
							<div class="detail-section">
								<h4>Full Comment</h4>
								<p class="full-comment">{item.comment}</p>
							</div>

							{#if item.page_context}
								<div class="detail-section">
									<h4>Page Context</h4>
									<code class="page-context">{item.page_context}</code>
								</div>
							{/if}

							{#if !item.responded_at}
								<div class="respond-section">
									{#if respondingTo === item.id}
										<textarea
											bind:value={responseText}
											placeholder="Write your response..."
											class="response-input"
										></textarea>
										<div class="respond-actions">
											<button class="btn-secondary" onclick={() => (respondingTo = null)}>
												Cancel
											</button>
											<button class="btn-primary" onclick={() => markAsResponded(item.id)}>
												Mark as Responded
											</button>
										</div>
									{:else}
										<button class="btn-outline" onclick={() => (respondingTo = item.id)}>
											Respond
										</button>
									{/if}
								</div>
							{:else}
								<div class="detail-section">
									<h4>Response</h4>
									<p class="response-text">{item.response || 'Marked as responded'}</p>
									<span class="response-date">Responded: {formatDate(item.responded_at)}</span>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}

			{#if data.feedback.length === 0}
				<div class="empty-state">
					<MessageSquare size={48} />
					<p>No feedback found</p>
				</div>
			{/if}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="pagination">
				{#if data.page > 1}
					<button
						class="page-btn"
						onclick={() => {
							const params = new URLSearchParams();
							params.set('page', String(data.page - 1));
							if (data.category) params.set('category', data.category);
							if (data.unreadOnly) params.set('unread', 'true');
							goto(`/admin/feedback?${params.toString()}`);
						}}
					>
						Previous
					</button>
				{/if}
				<span class="page-info">Page {data.page} of {totalPages}</span>
				{#if data.page < totalPages}
					<button
						class="page-btn"
						onclick={() => {
							const params = new URLSearchParams();
							params.set('page', String(data.page + 1));
							if (data.category) params.set('category', data.category);
							if (data.unreadOnly) params.set('unread', 'true');
							goto(`/admin/feedback?${params.toString()}`);
						}}
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
		background: var(--category-color, var(--blu-primary, #0066ff));
		color: white;
	}

	.filter-btn.unread-toggle {
		margin-left: auto;
	}

	.filter-btn.unread-toggle.active {
		background: var(--data-amber, #fbbf24);
		color: var(--gray-900, #0f172a);
	}

	.stats {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
		font-size: 13px;
		color: var(--gray-500, #64748b);
	}

	.feedback-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.feedback-card {
		background: rgba(255, 255, 255, 0.6);
		backdrop-filter: blur(20px);
		border-radius: var(--radius-lg, 20px);
		overflow: hidden;
	}

	.feedback-card.responded {
		opacity: 0.7;
	}

	.feedback-header {
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

	.feedback-icon {
		flex-shrink: 0;
		margin-top: 2px;
	}

	.feedback-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.feedback-meta-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.feedback-category {
		font-size: 12px;
		font-weight: 600;
		color: var(--gray-600, #475569);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.responded-badge {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
		background: var(--data-green, #22c55e);
		color: white;
		font-size: 10px;
		font-weight: 600;
		border-radius: 100px;
	}

	.feedback-comment {
		font-size: 14px;
		color: var(--gray-900, #0f172a);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.feedback-meta {
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

	.feedback-details {
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

	.full-comment {
		font-size: 14px;
		color: var(--gray-700, #334155);
		line-height: 1.6;
		margin: 0;
		white-space: pre-wrap;
	}

	.page-context {
		display: block;
		background: var(--gray-100, #f1f5f9);
		padding: 8px 12px;
		border-radius: var(--radius-sm, 10px);
		font-size: 12px;
		color: var(--gray-600, #475569);
	}

	.respond-section {
		margin-top: 16px;
		padding-top: 16px;
		border-top: 1px solid var(--gray-100, #f1f5f9);
	}

	.response-input {
		width: 100%;
		min-height: 80px;
		padding: 12px;
		background: white;
		border: 1px solid var(--gray-200, #e2e8f0);
		border-radius: var(--radius-sm, 10px);
		font-size: 14px;
		resize: vertical;
		margin-bottom: 12px;
	}

	.response-input:focus {
		outline: none;
		border-color: var(--blu-primary, #0066ff);
	}

	.respond-actions {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
	}

	.btn-outline,
	.btn-secondary,
	.btn-primary {
		padding: 8px 16px;
		border-radius: var(--radius-sm, 10px);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-outline {
		background: transparent;
		border: 1px solid var(--gray-300, #d1d5db);
		color: var(--gray-600, #475569);
	}

	.btn-outline:hover {
		background: var(--gray-50, #f8fafc);
	}

	.btn-secondary {
		background: var(--gray-100, #f1f5f9);
		border: none;
		color: var(--gray-600, #475569);
	}

	.btn-secondary:hover {
		background: var(--gray-200, #e2e8f0);
	}

	.btn-primary {
		background: var(--blu-primary, #0066ff);
		border: none;
		color: white;
	}

	.btn-primary:hover {
		opacity: 0.9;
	}

	.response-text {
		font-size: 14px;
		color: var(--gray-700, #334155);
		margin: 0;
		font-style: italic;
	}

	.response-date {
		font-size: 12px;
		color: var(--gray-400, #94a3b8);
		margin-top: 4px;
		display: block;
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

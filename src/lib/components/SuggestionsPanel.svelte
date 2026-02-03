<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import FileText from 'lucide-svelte/icons/file-text';
	import Send from 'lucide-svelte/icons/send';
	import Mail from 'lucide-svelte/icons/mail';
	import MessageSquare from 'lucide-svelte/icons/message-square';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Copy from 'lucide-svelte/icons/copy';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Bell from 'lucide-svelte/icons/bell';
	import Search from 'lucide-svelte/icons/search';
	import Users from 'lucide-svelte/icons/users';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import Download from 'lucide-svelte/icons/download';
	import Archive from 'lucide-svelte/icons/archive';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import Heart from 'lucide-svelte/icons/heart';
	import Plus from 'lucide-svelte/icons/plus';
	import Clock from 'lucide-svelte/icons/clock';
	import Zap from 'lucide-svelte/icons/zap';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import X from 'lucide-svelte/icons/x';
	import type { ActionSuggestion, ActionCategory } from '$lib/actions/types';
	import { SUGGESTION_TEMPLATES, getSuggestionsForContext } from '$lib/actions/types';
	import { t } from '$lib/i18n';

	interface Props {
		context?: string;
		onSelectSuggestion: (suggestion: Partial<ActionSuggestion>) => void;
		onClose?: () => void;
		compact?: boolean;
		showCategories?: boolean;
		maxSuggestions?: number;
	}

	let {
		context = 'general',
		onSelectSuggestion,
		onClose,
		compact = false,
		showCategories = true,
		maxSuggestions = 8
	}: Props = $props();

	// Active category filter
	let activeCategory = $state<ActionCategory | 'all'>('all');

	// Icon mapping
	const iconMap: Record<string, typeof FileText> = {
		'file-plus': Plus,
		'file-text': FileText,
		send: Send,
		mail: Mail,
		'message-square': MessageSquare,
		calendar: Calendar,
		copy: Copy,
		'trash-2': Trash2,
		'dollar-sign': DollarSign,
		bell: Bell,
		search: Search,
		users: Users,
		'trending-up': TrendingUp,
		download: Download,
		archive: Archive,
		refresh: RefreshCw,
		heart: Heart,
		clock: Clock,
		receipt: FileText,
		zap: Zap
	};

	function getIcon(iconName: string) {
		return iconMap[iconName] || FileText;
	}

	// Category labels and icons
	const categories = $derived([
		{ id: 'all' as const, label: $t('suggestions.all'), icon: Sparkles },
		{ id: 'document' as ActionCategory, label: $t('suggestions.documents'), icon: FileText },
		{ id: 'communication' as ActionCategory, label: $t('suggestions.send'), icon: Send },
		{ id: 'scheduling' as ActionCategory, label: $t('suggestions.schedule'), icon: Calendar },
		{ id: 'query' as ActionCategory, label: $t('suggestions.find'), icon: Search }
	]);

	// Get suggestions based on context
	const suggestions = $derived.by(() => {
		const contextSuggestions = getSuggestionsForContext(
			context as keyof typeof SUGGESTION_TEMPLATES,
			maxSuggestions
		);

		if (activeCategory === 'all') {
			return contextSuggestions;
		}

		return contextSuggestions.filter((s) => s.category === activeCategory);
	});

	// Group suggestions by category for display
	const groupedSuggestions = $derived.by(() => {
		const groups: Record<string, Partial<ActionSuggestion>[]> = {};

		for (const suggestion of suggestions) {
			const cat = suggestion.category || 'general';
			if (!groups[cat]) {
				groups[cat] = [];
			}
			groups[cat].push(suggestion);
		}

		return groups;
	});

	function handleSelect(suggestion: Partial<ActionSuggestion>) {
		onSelectSuggestion(suggestion);
	}

	// Quick action suggestions that can be executed immediately
	const quickActions = $derived(suggestions.filter((s) => s.quickAction));
	const detailedActions = $derived(suggestions.filter((s) => !s.quickAction));
</script>

<div class="suggestions-panel" class:compact transition:fade={{ duration: 200 }}>
	<!-- Header -->
	{#if !compact}
		<header class="panel-header">
			<div class="header-row">
				<div class="header-content">
					<Sparkles size={18} />
					<h3 class="panel-title">{$t('suggestions.title')}</h3>
				</div>
				{#if onClose}
					<button class="panel-close" onclick={onClose} aria-label={$t('suggestions.close')}>
						<X size={18} />
					</button>
				{/if}
			</div>
			{#if showCategories}
				<div class="category-pills">
					{#each categories as category (category.id)}
						<button
							class="category-pill"
							class:active={activeCategory === category.id}
							onclick={() => (activeCategory = category.id)}
						>
							<category.icon size={14} />
							<span>{category.label}</span>
						</button>
					{/each}
				</div>
			{/if}
		</header>
	{/if}

	<!-- Suggestions Grid -->
	<div class="suggestions-content">
		<!-- Quick Actions -->
		{#if quickActions.length > 0 && !compact}
			<section class="quick-actions-section" transition:slide={{ duration: 200 }}>
				<h4 class="section-label">{$t('suggestions.quickActions')}</h4>
				<div class="quick-actions-grid">
					{#each quickActions as suggestion, i (suggestion.title)}
						{@const SuggestionIcon = getIcon(suggestion.icon || 'file-text')}
						<button
							class="quick-action-card"
							onclick={() => handleSelect(suggestion)}
							style="animation-delay: {i * 50}ms"
						>
							<div class="quick-icon">
								<SuggestionIcon size={16} />
							</div>
							<span class="quick-title">{suggestion.title}</span>
							<Zap size={12} class="quick-badge" />
						</button>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Detailed Suggestions -->
		{#if detailedActions.length > 0}
			<section class="suggestions-section">
				{#if !compact && quickActions.length > 0}
					<h4 class="section-label">{$t('suggestions.moreOptions')}</h4>
				{/if}
				<div class="suggestions-list">
					{#each detailedActions as suggestion, i (suggestion.title)}
						{@const SuggestionIcon = getIcon(suggestion.icon || 'file-text')}
						<button
							class="suggestion-card"
							class:compact
							onclick={() => handleSelect(suggestion)}
							style="animation-delay: {i * 50}ms"
						>
							<div
								class="suggestion-icon"
								class:communication={suggestion.category === 'communication'}
								class:scheduling={suggestion.category === 'scheduling'}
								class:query={suggestion.category === 'query'}
							>
								<SuggestionIcon size={compact ? 16 : 18} />
							</div>
							<div class="suggestion-content">
								<span class="suggestion-title">{suggestion.title}</span>
								{#if !compact}
									<span class="suggestion-desc">{suggestion.description}</span>
								{/if}
							</div>
							<ChevronRight size={16} class="suggestion-arrow" />
						</button>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Empty State -->
		{#if suggestions.length === 0}
			<div class="empty-state">
				<Search size={32} />
				<p>{$t('suggestions.noSuggestions')}</p>
			</div>
		{/if}
	</div>

	<!-- Compact Quick Suggestions -->
	{#if compact && suggestions.length > 0}
		<div class="compact-suggestions">
			{#each suggestions.slice(0, 4) as suggestion (suggestion.title)}
				{@const SuggestionIcon = getIcon(suggestion.icon || 'file-text')}
				<button class="compact-suggestion" onclick={() => handleSelect(suggestion)}>
					<SuggestionIcon size={14} />
					<span>{suggestion.title}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.suggestions-panel {
		display: flex;
		flex-direction: column;
		background: #dbe8f4;
		border-radius: 16px;
		overflow: hidden;
		border: 1px solid #e2e8f0;
	}

	.suggestions-panel.compact {
		background: transparent;
		border: none;
		border-radius: 0;
	}

	/* Header */
	.panel-header {
		padding: 16px 20px;
		border-bottom: 1px solid #f1f5f9;
	}

	.header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #0066ff;
	}

	.panel-title {
		font-size: 15px;
		font-weight: 600;
		color: #0f172a;
		margin: 0;
	}

	.panel-close {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f1f5f9;
		border: none;
		border-radius: 8px;
		color: #64748b;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.panel-close:hover {
		background: #e2e8f0;
		color: #0f172a;
	}

	/* Category Pills */
	.category-pills {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.category-pill {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 6px 12px;
		background: #f8fafc;
		border: 1px solid transparent;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 500;
		color: #64748b;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.category-pill:hover {
		background: #f1f5f9;
		color: #0f172a;
	}

	.category-pill.active {
		background: rgba(0, 102, 255, 0.1);
		border-color: rgba(0, 102, 255, 0.2);
		color: #0066ff;
	}

	/* Content */
	.suggestions-content {
		padding: 16px 20px;
		max-height: 400px;
		overflow-y: auto;
	}

	.suggestions-panel.compact .suggestions-content {
		display: none;
	}

	.section-label {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #94a3b8;
		margin: 0 0 10px;
	}

	/* Quick Actions Grid */
	.quick-actions-section {
		margin-bottom: 20px;
	}

	.quick-actions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 8px;
	}

	.quick-action-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 14px 12px;
		background: linear-gradient(135deg, rgba(0, 102, 255, 0.05) 0%, rgba(14, 165, 233, 0.05) 100%);
		border: 1px solid rgba(0, 102, 255, 0.1);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
		position: relative;
		animation: fadeInUp 0.3s ease forwards;
		opacity: 0;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.quick-action-card:hover {
		background: linear-gradient(135deg, rgba(0, 102, 255, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%);
		border-color: rgba(0, 102, 255, 0.2);
		transform: translateY(-2px);
	}

	.quick-icon {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 102, 255, 0.1);
		border-radius: 10px;
		color: #0066ff;
	}

	.quick-title {
		font-size: 12px;
		font-weight: 500;
		color: #0f172a;
		text-align: center;
	}

	.quick-action-card :global(.quick-badge) {
		position: absolute;
		top: 8px;
		right: 8px;
		color: #f59e0b;
	}

	/* Suggestions List */
	.suggestions-section {
		margin-bottom: 8px;
	}

	.suggestions-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.suggestion-card {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 14px;
		background: #f8fafc;
		border: 1px solid transparent;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		animation: fadeInUp 0.3s ease forwards;
		opacity: 0;
	}

	.suggestion-card:hover {
		background: #dbe8f4;
		border-color: #e2e8f0;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	}

	.suggestion-card.compact {
		padding: 10px 12px;
		gap: 10px;
	}

	.suggestion-icon {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 102, 255, 0.1);
		border-radius: 10px;
		color: #0066ff;
		flex-shrink: 0;
	}

	.suggestion-icon.communication {
		background: rgba(16, 185, 129, 0.1);
		color: #059669;
	}

	.suggestion-icon.scheduling {
		background: rgba(139, 92, 246, 0.1);
		color: #7c3aed;
	}

	.suggestion-icon.query {
		background: rgba(245, 158, 11, 0.1);
		color: #d97706;
	}

	.suggestion-card.compact .suggestion-icon {
		width: 32px;
		height: 32px;
	}

	.suggestion-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.suggestion-title {
		font-size: 14px;
		font-weight: 500;
		color: #0f172a;
	}

	.suggestion-card.compact .suggestion-title {
		font-size: 13px;
	}

	.suggestion-desc {
		font-size: 12px;
		color: #64748b;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.suggestion-card :global(.suggestion-arrow) {
		color: #cbd5e1;
		flex-shrink: 0;
		transition: transform 0.2s ease;
	}

	.suggestion-card:hover :global(.suggestion-arrow) {
		color: #94a3b8;
		transform: translateX(2px);
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 40px 20px;
		color: #94a3b8;
	}

	.empty-state p {
		font-size: 14px;
		margin: 0;
	}

	/* Compact Mode */
	.compact-suggestions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 4px 0;
	}

	.compact-suggestion {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 20px;
		font-size: 13px;
		font-weight: 500;
		color: #64748b;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.compact-suggestion:hover {
		background: #dbe8f4;
		border-color: #0066ff;
		color: #0066ff;
		box-shadow: 0 2px 8px rgba(0, 102, 255, 0.1);
	}

	/* Scrollbar */
	.suggestions-content::-webkit-scrollbar {
		width: 4px;
	}

	.suggestions-content::-webkit-scrollbar-track {
		background: transparent;
	}

	.suggestions-content::-webkit-scrollbar-thumb {
		background: #e2e8f0;
		border-radius: 2px;
	}

	.suggestions-content::-webkit-scrollbar-thumb:hover {
		background: #cbd5e1;
	}

	@media (prefers-reduced-motion: reduce) {
		.quick-action-card,
		.suggestion-card {
			animation: none;
			opacity: 1;
		}

		.quick-action-card:hover {
			transform: none;
		}
	}

	/* Mobile */
	@media (max-width: 480px) {
		.panel-header {
			padding: 14px 16px;
		}

		.suggestions-content {
			padding: 14px 16px;
		}

		.quick-actions-grid {
			grid-template-columns: repeat(3, 1fr);
		}

		.suggestion-icon {
			width: 36px;
			height: 36px;
		}
	}
</style>

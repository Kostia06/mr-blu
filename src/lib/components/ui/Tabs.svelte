<script lang="ts">
	import { tick } from 'svelte';

	interface Tab {
		id: string;
		label: string;
		icon?: import('svelte').Snippet;
		badge?: string | number;
	}

	interface Props {
		tabs: Tab[];
		activeTab?: string;
		variant?: 'underline' | 'pills' | 'cards';
		size?: 'sm' | 'md';
		fullWidth?: boolean;
		class?: string;
		onchange?: (tabId: string) => void;
	}

	let {
		tabs,
		activeTab = $bindable(tabs[0]?.id),
		variant = 'underline',
		size = 'md',
		fullWidth = false,
		class: className = '',
		onchange
	}: Props = $props();

	let tabRefs: Record<string, HTMLButtonElement> = {};
	let indicatorStyle = $state('');

	async function updateIndicator() {
		await tick();
		const activeRef = tabRefs[activeTab];
		if (activeRef && variant === 'underline') {
			indicatorStyle = `left: ${activeRef.offsetLeft}px; width: ${activeRef.offsetWidth}px`;
		}
	}

	$effect(() => {
		activeTab;
		updateIndicator();
	});

	function handleTabClick(tabId: string) {
		activeTab = tabId;
		onchange?.(tabId);
	}
</script>

<div
	class="tabs-container {variant} {size === 'sm' ? 'tabs-sm' : ''} {fullWidth
		? 'full-width'
		: ''} {className}"
>
	<div class="tabs-list" role="tablist">
		{#each tabs as tab (tab.id)}
			<button
				bind:this={tabRefs[tab.id]}
				class="tab-item"
				class:active={activeTab === tab.id}
				role="tab"
				aria-selected={activeTab === tab.id}
				onclick={() => handleTabClick(tab.id)}
			>
				{#if tab.icon}
					<span class="tab-icon">
						{@render tab.icon()}
					</span>
				{/if}
				<span class="tab-label">{tab.label}</span>
				{#if tab.badge !== undefined}
					<span class="tab-badge">{tab.badge}</span>
				{/if}
			</button>
		{/each}

		{#if variant === 'underline'}
			<div class="tab-indicator" style={indicatorStyle}></div>
		{/if}
	</div>
</div>

<style>
	.tabs-container {
		width: 100%;
	}

	.tabs-list {
		display: flex;
		position: relative;
		gap: 4px;
	}

	.tabs-container.full-width .tabs-list {
		width: 100%;
	}

	.tabs-container.full-width .tab-item {
		flex: 1;
	}

	/* Tab item base */
	.tab-item {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 12px 16px;
		font-size: 14px;
		font-weight: 500;
		color: var(--gray-500, #64748b);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
		position: relative;
	}

	.tabs-sm .tab-item {
		padding: 8px 12px;
		font-size: 13px;
	}

	.tab-item:hover {
		color: var(--gray-700, #334155);
	}

	.tab-item.active {
		color: var(--blu-primary, #0066ff);
	}

	/* Tab icon */
	.tab-icon {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Tab badge */
	.tab-badge {
		padding: 2px 6px;
		font-size: 11px;
		font-weight: 600;
		background: var(--gray-100, #f1f5f9);
		color: var(--gray-600, #475569);
		border-radius: var(--radius-chip, 100px);
	}

	.tab-item.active .tab-badge {
		background: rgba(0, 102, 255, 0.1);
		color: var(--blu-primary, #0066ff);
	}

	/* Underline variant */
	.tabs-container.underline .tabs-list {
		border-bottom: 1px solid var(--gray-200, #e2e8f0);
		gap: 0;
	}

	.tabs-container.underline .tab-item {
		padding-bottom: 14px;
		margin-bottom: -1px;
	}

	.tab-indicator {
		position: absolute;
		bottom: 0;
		height: 2px;
		background: var(--blu-primary, #0066ff);
		border-radius: 2px 2px 0 0;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Pills variant */
	.tabs-container.pills .tabs-list {
		background: var(--gray-100, #f1f5f9);
		padding: 4px;
		border-radius: var(--radius-button, 14px);
	}

	.tabs-container.pills .tab-item {
		border-radius: var(--radius-input, 12px);
		padding: 10px 16px;
	}

	.tabs-container.pills .tab-item.active {
		background: var(--white, #dbe8f4);
		color: var(--gray-900, #0f172a);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}

	/* Cards variant */
	.tabs-container.cards .tab-item {
		background: var(--white, #dbe8f4);
		border: 1px solid var(--gray-200, #e2e8f0);
		border-radius: var(--radius-button, 14px);
		padding: 12px 20px;
	}

	.tabs-container.cards .tab-item:hover {
		border-color: var(--gray-300, #cbd5e1);
	}

	.tabs-container.cards .tab-item.active {
		border-color: var(--blu-primary, #0066ff);
		background: rgba(0, 102, 255, 0.04);
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.tab-item,
		.tab-indicator {
			transition: none;
		}
	}
</style>

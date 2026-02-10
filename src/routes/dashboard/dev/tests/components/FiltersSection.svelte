<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import Search from 'lucide-svelte/icons/search';
	import Play from 'lucide-svelte/icons/play';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Clock from 'lucide-svelte/icons/clock';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import ArrowUpDown from 'lucide-svelte/icons/arrow-up-down';
	import type { TestCategory, TestPriority } from '$lib/testing/types';

	type SortOption = 'default' | 'status' | 'duration' | 'category';

	interface Props {
		categories: TestCategory[];
		priorities: TestPriority[];
		selectedCategories: SvelteSet<TestCategory>;
		selectedPriorities: SvelteSet<TestPriority>;
		searchQuery: string;
		testTimeout: number;
		minTimeout: number;
		maxTimeout: number;
		maxConcurrent: number;
		minConcurrent: number;
		maxConcurrentLimit: number;
		sortBy: SortOption;
		isRunning: boolean;
		filteredTestCount: number;
		formatCategory: (category: string) => string;
		getPriorityClass: (priority: TestPriority) => string;
		ontogglecategory: (category: TestCategory) => void;
		ontogglepriority: (priority: TestPriority) => void;
		ontoggleallcategories: () => void;
		ontoggleallpriorities: () => void;
		onrunselected: () => void;
		onrunall: () => void;
	}

	let {
		categories,
		priorities,
		selectedCategories,
		selectedPriorities,
		searchQuery = $bindable(),
		testTimeout = $bindable(),
		maxConcurrent = $bindable(),
		minTimeout,
		maxTimeout,
		minConcurrent,
		maxConcurrentLimit,
		sortBy = $bindable(),
		isRunning,
		filteredTestCount,
		formatCategory,
		getPriorityClass,
		ontogglecategory,
		ontogglepriority,
		ontoggleallcategories,
		ontoggleallpriorities,
		onrunselected,
		onrunall,
	}: Props = $props();
</script>

<section class="filters-section">
	<h2 class="section-title">Filters</h2>

	<!-- Search -->
	<div class="search-wrapper">
		<Search size={18} class="search-icon" />
		<input
			type="text"
			placeholder="Search by ID or description..."
			bind:value={searchQuery}
			class="search-input"
		/>
	</div>

	<!-- Category Filters -->
	<div class="filter-group">
		<div class="filter-header">
			<span class="filter-label">Categories</span>
			<button class="toggle-all-btn" onclick={ontoggleallcategories}>
				{selectedCategories.size === categories.length ? 'Deselect All' : 'Select All'}
			</button>
		</div>
		<div class="checkbox-grid">
			{#each categories as category (category)}
				<label class="checkbox-item">
					<input
						type="checkbox"
						checked={selectedCategories.has(category)}
						onchange={() => ontogglecategory(category)}
					/>
					<span class="checkbox-label">{formatCategory(category)}</span>
				</label>
			{/each}
		</div>
	</div>

	<!-- Priority Filters -->
	<div class="filter-group">
		<div class="filter-header">
			<span class="filter-label">Priorities</span>
			<button class="toggle-all-btn" onclick={ontoggleallpriorities}>
				{selectedPriorities.size === priorities.length ? 'Deselect All' : 'Select All'}
			</button>
		</div>
		<div class="checkbox-row">
			{#each priorities as priority (priority)}
				<label class="checkbox-item priority {getPriorityClass(priority)}">
					<input
						type="checkbox"
						checked={selectedPriorities.has(priority)}
						onchange={() => ontogglepriority(priority)}
					/>
					<span class="checkbox-label">{priority}</span>
				</label>
			{/each}
		</div>
	</div>

	<!-- Execution Configuration -->
	<div class="config-row">
		<div class="filter-group config-half">
			<div class="filter-header">
				<span class="filter-label">Test Timeout</span>
				<span class="timeout-value">{testTimeout}s</span>
			</div>
			<div class="timeout-slider-wrapper">
				<span class="timeout-min">{minTimeout}s</span>
				<input
					type="range"
					min={minTimeout}
					max={maxTimeout}
					step="5"
					bind:value={testTimeout}
					class="timeout-slider"
				/>
				<span class="timeout-max">{maxTimeout}s</span>
			</div>
		</div>

		<div class="filter-group config-half">
			<div class="filter-header">
				<span class="filter-label">Parallel Tests</span>
				<span class="timeout-value">{maxConcurrent} concurrent</span>
			</div>
			<div class="timeout-slider-wrapper">
				<span class="timeout-min">{minConcurrent}</span>
				<input
					type="range"
					min={minConcurrent}
					max={maxConcurrentLimit}
					step="1"
					bind:value={maxConcurrent}
					class="timeout-slider concurrent"
				/>
				<span class="timeout-max">{maxConcurrentLimit}</span>
			</div>
		</div>
	</div>

	<!-- Sort Options -->
	<div class="filter-group">
		<div class="filter-header">
			<span class="filter-label">Sort Results</span>
		</div>
		<div class="sort-options">
			<button class="sort-btn" class:active={sortBy === 'default'} onclick={() => (sortBy = 'default')}>
				Default
			</button>
			<button class="sort-btn" class:active={sortBy === 'status'} onclick={() => (sortBy = 'status')}>
				<XCircle size={14} />
				Failed First
			</button>
			<button class="sort-btn" class:active={sortBy === 'duration'} onclick={() => (sortBy = 'duration')}>
				<Clock size={14} />
				Slowest First
			</button>
			<button class="sort-btn" class:active={sortBy === 'category'} onclick={() => (sortBy = 'category')}>
				<ArrowUpDown size={14} />
				By Category
			</button>
		</div>
	</div>

	<!-- Action Buttons -->
	<div class="action-buttons">
		<button
			class="run-btn secondary"
			onclick={onrunselected}
			disabled={isRunning || filteredTestCount === 0}
		>
			{#if isRunning}
				<Loader2 size={18} class="spinner" />
				<span>Running...</span>
			{:else}
				<Play size={18} />
				<span>Run Selected ({filteredTestCount})</span>
			{/if}
		</button>
		<button class="run-btn primary" onclick={onrunall} disabled={isRunning}>
			{#if isRunning}
				<Loader2 size={18} class="spinner" />
				<span>Running...</span>
			{:else}
				<Play size={18} />
				<span>Run All Tests</span>
			{/if}
		</button>
	</div>
</section>

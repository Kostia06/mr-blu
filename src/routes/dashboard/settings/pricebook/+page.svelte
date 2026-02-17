<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Plus from 'lucide-svelte/icons/plus';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Check from 'lucide-svelte/icons/check';
	import Search from 'lucide-svelte/icons/search';
	import X from 'lucide-svelte/icons/x';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import { t } from '$lib/i18n';
	import { PRICE_CATEGORIES, type PriceItem, type PriceCategory } from '$lib/types/pricing';

	const CATEGORY_COLORS: Record<PriceCategory, string> = {
		material: '#f59e0b',
		labor: '#3b82f6',
		service: '#10b981',
		tools: '#6366f1',
		equipment: '#8b5cf6',
		rental: '#ec4899',
		permit: '#14b8a6',
		disposal: '#ef4444',
		other: '#6b7280'
	};

	const CATEGORY_KEYS: Record<string, string> = {
		all: 'priceBook.all',
		material: 'priceBook.material',
		labor: 'priceBook.labor',
		service: 'priceBook.service',
		tools: 'priceBook.tools',
		equipment: 'priceBook.equipment',
		rental: 'priceBook.rental',
		permit: 'priceBook.permit',
		disposal: 'priceBook.disposal',
		other: 'priceBook.other'
	};

	let items = $state<PriceItem[]>([]);
	let loading = $state(true);
	let searchQuery = $state('');
	let activeCategory = $state<string>('all');
	let expandedItemId = $state<string | null>(null);
	let isAddingNew = $state(false);
	let saving = $state(false);
	let toastMessage = $state('');

	// Add/edit form fields
	let formName = $state('');
	let formRate = $state('');
	let formUnit = $state('');
	let formCategory = $state<PriceCategory>('other');

	const filteredItems = $derived.by(() => {
		let result = items;

		if (activeCategory !== 'all') {
			result = result.filter((item) => item.category === activeCategory);
		}

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			result = result.filter((item) => item.name.toLowerCase().includes(query));
		}

		return result;
	});

	const categories = $derived(['all', ...PRICE_CATEGORIES]);

	function showToast(message: string) {
		toastMessage = message;
		setTimeout(() => {
			toastMessage = '';
		}, 2500);
	}

	function capitalizeFirst(text: string): string {
		if (!text) return '';
		return text.charAt(0).toUpperCase() + text.slice(1);
	}

	function formatRate(price: number, unit: string): string {
		const formatted = `$${price.toFixed(2)}`;
		return `${formatted}/${unit}`;
	}

	function resetForm() {
		formName = '';
		formRate = '';
		formUnit = '';
		formCategory = 'other';
	}

	function openAddForm() {
		expandedItemId = null;
		resetForm();
		isAddingNew = true;
	}

	function closeAddForm() {
		isAddingNew = false;
		resetForm();
	}

	function expandItem(item: PriceItem) {
		if (expandedItemId === item.id) {
			expandedItemId = null;
			resetForm();
			return;
		}

		isAddingNew = false;
		expandedItemId = item.id;
		formName = item.name;
		formRate = item.unit_price.toString();
		formUnit = item.unit;
		formCategory = item.category;
	}

	async function fetchItems() {
		loading = true;
		try {
			const response = await fetch('/api/pricing/items');
			if (!response.ok) throw new Error('Failed to fetch');
			const data = await response.json();
			items = data.items || [];
		} catch {
			items = [];
		} finally {
			loading = false;
		}
	}

	async function handleAdd() {
		const rate = parseFloat(formRate);
		if (!formName.trim() || isNaN(rate) || rate <= 0) return;

		saving = true;
		try {
			const response = await fetch('/api/pricing/items', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: formName.trim(),
					category: formCategory,
					unitPrice: rate,
					unit: formUnit.trim() || 'each'
				})
			});

			if (!response.ok) throw new Error('Failed to create');
			const data = await response.json();

			items = [data.item, ...items];
			closeAddForm();
			showToast($t('priceBook.saved'));
		} catch {
			// Silently fail - user can retry
		} finally {
			saving = false;
		}
	}

	async function handleUpdate(itemId: string) {
		const rate = parseFloat(formRate);
		if (!formName.trim() || isNaN(rate) || rate <= 0) return;

		saving = true;
		try {
			const response = await fetch(`/api/pricing/items/${itemId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: formName.trim(),
					unit_price: rate,
					unit: formUnit.trim() || 'each',
					category: formCategory
				})
			});

			if (!response.ok) throw new Error('Failed to update');
			const data = await response.json();

			items = items.map((item) => (item.id === itemId ? data.item : item));
			expandedItemId = null;
			resetForm();
			showToast($t('priceBook.saved'));
		} catch {
			// Silently fail - user can retry
		} finally {
			saving = false;
		}
	}

	async function handleDelete(itemId: string) {
		// Optimistic delete
		const previousItems = [...items];
		items = items.filter((item) => item.id !== itemId);
		expandedItemId = null;
		resetForm();
		showToast($t('priceBook.deleted'));

		try {
			const response = await fetch(`/api/pricing/items/${itemId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				// Rollback on failure
				items = previousItems;
			}
		} catch {
			items = previousItems;
		}
	}

	onMount(() => {
		fetchItems();
	});
</script>

<main class="pricebook-page">
	<!-- Header -->
	<header class="page-header" in:fly={{ y: -20, duration: 400, easing: cubicOut }}>
		<button
			class="back-btn"
			onclick={() => goto('/dashboard/settings')}
			aria-label={$t('common.backToSettings')}
		>
			<ChevronLeft size={22} strokeWidth={2} />
		</button>
		<h1 class="page-title">{$t('priceBook.title')}</h1>
		<button class="add-btn" onclick={openAddForm} aria-label={$t('priceBook.addItem')}>
			<Plus size={18} strokeWidth={2.5} />
		</button>
	</header>

	<div class="page-content" in:fly={{ y: 20, duration: 500, delay: 100, easing: cubicOut }}>
		<!-- Search -->
		<div class="search-bar">
			<Search size={16} strokeWidth={2} />
			<input
				type="text"
				class="search-input"
				placeholder={$t('priceBook.search')}
				bind:value={searchQuery}
			/>
			{#if searchQuery}
				<button class="search-clear" onclick={() => (searchQuery = '')} aria-label="Clear search">
					<X size={14} strokeWidth={2.5} />
				</button>
			{/if}
		</div>

		<!-- Category chips -->
		<div class="category-chips">
			{#each categories as category (category)}
				<button
					class="chip"
					class:active={activeCategory === category}
					style:--chip-color={category === 'all' ? 'var(--blu-primary, #0066ff)' : CATEGORY_COLORS[category as PriceCategory]}
					onclick={() => (activeCategory = category)}
				>
					{$t(CATEGORY_KEYS[category])}
				</button>
			{/each}
		</div>

		<!-- Add new item form -->
		{#if isAddingNew}
			<div class="item-card form-card" in:fly={{ y: -10, duration: 250, easing: cubicOut }}>
				<div class="form-header">
					<span class="form-title">{$t('priceBook.addNew')}</span>
					<button class="form-close" onclick={closeAddForm} aria-label={$t('common.cancel')}>
						<X size={16} strokeWidth={2.5} />
					</button>
				</div>
				<div class="form-fields">
					<input
						type="text"
						class="field-input"
						placeholder={$t('priceBook.namePlaceholder')}
						bind:value={formName}
					/>
					<div class="form-row">
						<div class="field-group rate-field">
							<span class="field-prefix">$</span>
							<input
								type="number"
								class="field-input"
								placeholder={$t('priceBook.ratePlaceholder')}
								bind:value={formRate}
								step="0.01"
								min="0"
							/>
						</div>
						<input
							type="text"
							class="field-input unit-input"
							placeholder={$t('priceBook.unitPlaceholder')}
							bind:value={formUnit}
						/>
					</div>
					<div class="form-category-chips">
						{#each PRICE_CATEGORIES as cat (cat)}
							<button
								class="mini-chip"
								class:active={formCategory === cat}
								style:--chip-color={CATEGORY_COLORS[cat]}
								onclick={() => (formCategory = cat)}
							>
								{$t(CATEGORY_KEYS[cat])}
							</button>
						{/each}
					</div>
				</div>
				<div class="form-actions">
					<button class="btn-cancel" onclick={closeAddForm}>{$t('common.cancel')}</button>
					<button class="btn-save" onclick={handleAdd} disabled={saving || !formName.trim() || !formRate}>
						{#if saving}
							<Loader2 size={16} class="spin" />
						{:else}
							{$t('common.save')}
						{/if}
					</button>
				</div>
			</div>
		{/if}

		<!-- Loading state -->
		{#if loading}
			<div class="loading-state">
				<Loader2 size={24} class="spin" />
			</div>
		{:else if filteredItems.length === 0}
			<!-- Empty state -->
			<div class="empty-state" in:fly={{ y: 10, duration: 300, easing: cubicOut }}>
				<p class="empty-title">{$t('priceBook.empty')}</p>
				<p class="empty-desc">{$t('priceBook.emptyDesc')}</p>
			</div>
		{:else}
			<!-- Items list -->
			<div class="items-list">
				{#each filteredItems as item (item.id)}
					<div
						class="item-card"
						class:expanded={expandedItemId === item.id}
						in:fly={{ y: 10, duration: 250, easing: cubicOut }}
					>
						<!-- Item summary row -->
						<button class="item-summary" onclick={() => expandItem(item)}>
							<div class="item-info">
								<span class="item-name">{capitalizeFirst(item.name)}</span>
								<div class="item-meta">
									<span
										class="category-badge"
										style:--badge-color={CATEGORY_COLORS[item.category]}
									>
										{$t(CATEGORY_KEYS[item.category])}
									</span>
									{#if item.times_used > 0}
										<span class="times-used">
											{$t('priceBook.timesUsed').replace('{n}', String(item.times_used))}
										</span>
									{/if}
								</div>
							</div>
							<span class="item-rate">{formatRate(item.unit_price, item.unit)}</span>
						</button>

						<!-- Expanded edit form -->
						{#if expandedItemId === item.id}
							<div class="edit-section" in:fly={{ y: -5, duration: 200, easing: cubicOut }}>
								<div class="form-fields">
									<input
										type="text"
										class="field-input"
										placeholder={$t('priceBook.namePlaceholder')}
										bind:value={formName}
									/>
									<div class="form-row">
										<div class="field-group rate-field">
											<span class="field-prefix">$</span>
											<input
												type="number"
												class="field-input"
												placeholder={$t('priceBook.ratePlaceholder')}
												bind:value={formRate}
												step="0.01"
												min="0"
											/>
										</div>
										<input
											type="text"
											class="field-input unit-input"
											placeholder={$t('priceBook.unitPlaceholder')}
											bind:value={formUnit}
										/>
									</div>
									<div class="form-category-chips">
										{#each PRICE_CATEGORIES as cat (cat)}
											<button
												class="mini-chip"
												class:active={formCategory === cat}
												style:--chip-color={CATEGORY_COLORS[cat]}
												onclick={() => (formCategory = cat)}
											>
												{$t(CATEGORY_KEYS[cat])}
											</button>
										{/each}
									</div>
								</div>
								<div class="form-actions">
									<button
										class="btn-delete"
										onclick={() => handleDelete(item.id)}
										aria-label={$t('common.delete')}
									>
										<Trash2 size={16} strokeWidth={2} />
									</button>
									<div class="form-actions-right">
										<button
											class="btn-cancel"
											onclick={() => {
												expandedItemId = null;
												resetForm();
											}}
										>
											{$t('common.cancel')}
										</button>
										<button
											class="btn-save"
											onclick={() => handleUpdate(item.id)}
											disabled={saving || !formName.trim() || !formRate}
										>
											{#if saving}
												<Loader2 size={16} class="spin" />
											{:else}
												{$t('common.save')}
											{/if}
										</button>
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Toast -->
	{#if toastMessage}
		<div class="toast" in:fly={{ y: 20, duration: 250, easing: cubicOut }}>
			<Check size={16} strokeWidth={2.5} />
			<span>{toastMessage}</span>
		</div>
	{/if}
</main>

<style>
	.pricebook-page {
		min-height: 100vh;
		background: transparent;
	}

	/* Header */
	.page-header {
		position: sticky;
		top: 0;
		z-index: var(--z-sticky);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3) var(--page-padding-x);
		padding-top: calc(var(--space-3) + var(--safe-area-top, 0px));
		background: transparent;
	}

	.back-btn {
		width: var(--btn-height-md);
		height: var(--btn-height-md);
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--glass-white-50);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid var(--glass-white-30);
		border-radius: var(--radius-button);
		color: var(--gray-600);
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.back-btn:hover {
		background: var(--glass-white-70);
		color: var(--gray-900);
	}

	.back-btn:active {
		transform: scale(0.95);
	}

	.page-title {
		font-family: var(--font-display, system-ui);
		font-size: 18px;
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		margin: 0;
		letter-spacing: -0.02em;
	}

	.add-btn {
		width: var(--btn-height-md);
		height: var(--btn-height-md);
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--blu-primary, #0066ff);
		border: none;
		border-radius: var(--radius-button);
		color: white;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.add-btn:hover {
		background: var(--blu-primary-hover, #0052cc);
	}

	.add-btn:active {
		transform: scale(0.95);
	}

	/* Page Content */
	.page-content {
		padding: var(--page-padding-x, 20px);
		max-width: var(--page-max-width, 600px);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--section-gap, 24px);
		padding-bottom: 100px;
	}

	/* Search */
	.search-bar {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 14px;
		height: 44px;
		background: var(--glass-white-50);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid var(--glass-white-30);
		border-radius: var(--radius-input, 12px);
		color: var(--gray-400, #94a3b8);
	}

	.search-input {
		flex: 1;
		background: none;
		border: none;
		outline: none;
		font-size: 15px;
		color: var(--gray-900, #0f172a);
		font-family: inherit;
	}

	.search-input::placeholder {
		color: var(--gray-400, #94a3b8);
	}

	.search-clear {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: var(--glass-white-30);
		border: none;
		border-radius: 50%;
		color: var(--gray-500, #64748b);
		cursor: pointer;
		padding: 0;
	}

	/* Category Chips */
	.category-chips {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		padding-bottom: 2px;
	}

	.category-chips::-webkit-scrollbar {
		display: none;
	}

	.chip {
		flex-shrink: 0;
		padding: 6px 14px;
		border-radius: 100px;
		border: 1px solid var(--glass-white-30);
		background: var(--glass-white-50);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		font-size: 13px;
		font-weight: 500;
		color: var(--gray-600, #475569);
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.chip.active {
		background: var(--chip-color);
		color: white;
		border-color: var(--chip-color);
	}

	.chip:not(.active):hover {
		background: var(--glass-white-70);
	}

	/* Item Cards */
	.items-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.item-card {
		background: var(--glass-white-50);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid var(--glass-white-30);
		border-radius: var(--radius-button);
		overflow: hidden;
		transition: border-color 0.2s ease;
	}

	.item-card.expanded {
		border-color: var(--blu-primary, #0066ff);
	}

	.item-card.form-card {
		border-color: var(--blu-primary, #0066ff);
		padding: 16px;
	}

	.item-summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 14px 16px;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		font-family: inherit;
		transition: background 0.15s ease;
	}

	.item-summary:hover {
		background: var(--glass-white-30);
	}

	.item-summary:active {
		background: var(--glass-white-50);
	}

	.item-info {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
		flex: 1;
	}

	.item-name {
		font-size: 15px;
		font-weight: 600;
		color: var(--gray-900, #0f172a);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.item-meta {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.category-badge {
		display: inline-flex;
		align-items: center;
		padding: 2px 8px;
		border-radius: 100px;
		font-size: 11px;
		font-weight: 600;
		color: var(--badge-color);
		background: color-mix(in srgb, var(--badge-color) 12%, transparent);
		letter-spacing: 0.01em;
	}

	.times-used {
		font-size: 12px;
		color: var(--gray-400, #94a3b8);
	}

	.item-rate {
		font-size: 15px;
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		white-space: nowrap;
		flex-shrink: 0;
		margin-left: 12px;
	}

	/* Edit Section */
	.edit-section {
		padding: 0 16px 16px;
		border-top: 1px solid var(--glass-white-30);
	}

	/* Form shared styles */
	.form-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 14px;
	}

	.form-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--gray-900, #0f172a);
	}

	.form-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: var(--glass-white-30);
		border: none;
		border-radius: 50%;
		color: var(--gray-500, #64748b);
		cursor: pointer;
		padding: 0;
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding-top: 12px;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	.field-input {
		width: 100%;
		height: 42px;
		padding: 0 12px;
		background: var(--glass-white-30);
		border: 1px solid var(--glass-white-30);
		border-radius: var(--radius-input, 12px);
		font-size: 14px;
		color: var(--gray-900, #0f172a);
		font-family: inherit;
		outline: none;
		transition: border-color 0.2s ease;
		box-sizing: border-box;
	}

	.field-input:focus {
		border-color: var(--blu-primary, #0066ff);
	}

	.field-input::placeholder {
		color: var(--gray-400, #94a3b8);
	}

	.field-group {
		position: relative;
		display: flex;
		align-items: center;
	}

	.field-prefix {
		position: absolute;
		left: 12px;
		font-size: 14px;
		font-weight: 600;
		color: var(--gray-500, #64748b);
		z-index: 1;
		pointer-events: none;
	}

	.rate-field .field-input {
		padding-left: 24px;
	}

	.unit-input {
		/* inherits from field-input */
	}

	/* Mini category chips for forms */
	.form-category-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.mini-chip {
		padding: 4px 10px;
		border-radius: 100px;
		border: 1px solid var(--glass-white-30);
		background: var(--glass-white-30);
		font-size: 11px;
		font-weight: 600;
		color: var(--gray-500, #64748b);
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.mini-chip.active {
		background: color-mix(in srgb, var(--chip-color) 15%, transparent);
		color: var(--chip-color);
		border-color: color-mix(in srgb, var(--chip-color) 30%, transparent);
	}

	/* Form Actions */
	.form-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-top: 14px;
	}

	.form-actions-right {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.btn-cancel {
		padding: 8px 16px;
		background: var(--glass-white-30);
		border: none;
		border-radius: var(--radius-input, 12px);
		font-size: 13px;
		font-weight: 600;
		color: var(--gray-600, #475569);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-cancel:hover {
		background: var(--glass-white-50);
	}

	.btn-save {
		padding: 8px 20px;
		background: var(--blu-primary, #0066ff);
		border: none;
		border-radius: var(--radius-input, 12px);
		font-size: 13px;
		font-weight: 600;
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		min-width: 64px;
		transition: all 0.2s ease;
	}

	.btn-save:hover:not(:disabled) {
		background: var(--blu-primary-hover, #0052cc);
	}

	.btn-save:active:not(:disabled) {
		transform: scale(0.97);
	}

	.btn-save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-save :global(.spin) {
		animation: spin 1s linear infinite;
	}

	.btn-delete {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: var(--status-overdue-bg, rgba(239, 68, 68, 0.1));
		border: none;
		border-radius: var(--radius-input, 12px);
		color: var(--data-red, #ef4444);
		cursor: pointer;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.btn-delete:hover {
		background: rgba(239, 68, 68, 0.18);
	}

	.btn-delete:active {
		transform: scale(0.95);
	}

	/* Loading */
	.loading-state {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 60px 0;
		color: var(--gray-400, #94a3b8);
	}

	.loading-state :global(.spin) {
		animation: spin 1s linear infinite;
	}

	/* Empty state */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 48px 24px;
		text-align: center;
	}

	.empty-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--gray-900, #0f172a);
		margin: 0 0 8px;
	}

	.empty-desc {
		font-size: 14px;
		color: var(--gray-400, #94a3b8);
		margin: 0;
		line-height: 1.5;
		max-width: 280px;
	}

	/* Toast */
	.toast {
		position: fixed;
		bottom: 100px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 20px;
		background: var(--gray-900, #0f172a);
		color: white;
		border-radius: 100px;
		font-size: 14px;
		font-weight: 500;
		z-index: calc(var(--z-sticky) + 10);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.back-btn,
		.add-btn,
		.chip,
		.mini-chip,
		.btn-save,
		.btn-cancel,
		.btn-delete,
		.item-card {
			transition: none;
		}

		.btn-save :global(.spin),
		.loading-state :global(.spin) {
			animation: none;
		}
	}
</style>

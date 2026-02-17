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
	import { type PriceItem } from '$lib/types/pricing';

	let items = $state<PriceItem[]>([]);
	let loading = $state(true);
	let searchQuery = $state('');
	let expandedItemId = $state<string | null>(null);
	let isAddingNew = $state(false);
	let saving = $state(false);
	let toastMessage = $state('');

	// Add/edit form fields
	let formName = $state('');
	let formRate = $state('');
	let formUnit = $state('');

	const filteredItems = $derived.by(() => {
		if (!searchQuery.trim()) return items;

		const query = searchQuery.toLowerCase().trim();
		return items.filter((item) => item.name.toLowerCase().includes(query));
	});

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
					unit: formUnit.trim() || 'each'
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
							<div class="item-top-row">
								<span class="item-name">{capitalizeFirst(item.name)}</span>
								{#if item.times_used > 0}
									<span class="times-used">
										{$t('priceBook.timesUsed').replace('{n}', String(item.times_used))}
									</span>
								{/if}
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
		font-size: var(--text-lg);
		font-weight: 700;
		color: var(--gray-900);
		margin: 0;
		letter-spacing: -0.02em;
	}

	.add-btn {
		width: var(--btn-height-md);
		height: var(--btn-height-md);
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--blu-primary);
		border: none;
		border-radius: var(--radius-button);
		color: white;
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.add-btn:hover {
		background: var(--blu-primary-hover);
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
		gap: var(--space-2-5);
		padding: 0 var(--space-3-5);
		height: 44px;
		background: var(--glass-white-50);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid var(--glass-white-30);
		border-radius: var(--radius-input);
		color: var(--gray-400);
	}

	.search-input {
		flex: 1;
		background: none;
		border: none;
		outline: none;
		font-size: var(--text-base);
		color: var(--gray-900);
		font-family: inherit;
	}

	.search-input::placeholder {
		color: var(--gray-400);
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
		color: var(--blu-text-muted);
		cursor: pointer;
		padding: 0;
	}

	/* Item Cards */
	.items-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.item-card {
		background: var(--glass-white-50);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid var(--glass-white-30);
		border-radius: var(--radius-button);
		overflow: hidden;
		transition: border-color var(--duration-fast) ease;
	}

	.item-card.expanded {
		border-color: var(--blu-primary);
	}

	.item-card.form-card {
		border-color: var(--blu-primary);
		padding: var(--space-4);
	}

	.item-summary {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		width: 100%;
		padding: var(--space-3-5) var(--space-4);
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		font-family: inherit;
		transition: background var(--duration-fast) ease;
	}

	.item-summary:hover {
		background: var(--glass-white-30);
	}

	.item-summary:active {
		background: var(--glass-white-50);
	}

	.item-top-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		min-width: 0;
	}

	.item-name {
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--gray-900);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.times-used {
		font-size: var(--text-xs);
		color: var(--gray-400);
	}

	.item-rate {
		font-size: var(--text-base);
		font-weight: 700;
		color: var(--gray-900);
		white-space: nowrap;
	}

	/* Edit Section */
	.edit-section {
		padding: 0 var(--space-4) var(--space-4);
		border-top: 1px solid var(--glass-white-30);
	}

	/* Form shared styles */
	.form-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-3-5);
	}

	.form-title {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--gray-900);
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
		color: var(--blu-text-muted);
		cursor: pointer;
		padding: 0;
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: var(--space-2-5);
		padding-top: var(--space-3);
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-2-5);
	}

	.field-input {
		width: 100%;
		height: 42px;
		padding: 0 var(--space-3);
		background: var(--glass-white-30);
		border: 1px solid var(--glass-white-30);
		border-radius: var(--radius-input);
		font-size: var(--text-sm);
		color: var(--gray-900);
		font-family: inherit;
		outline: none;
		transition: border-color var(--duration-fast) ease;
		box-sizing: border-box;
	}

	.field-input:focus {
		border-color: var(--blu-primary);
	}

	.field-input::placeholder {
		color: var(--gray-400);
	}

	.field-group {
		position: relative;
		display: flex;
		align-items: center;
	}

	.field-prefix {
		position: absolute;
		left: var(--space-3);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--blu-text-muted);
		z-index: 1;
		pointer-events: none;
	}

	.rate-field .field-input {
		padding-left: var(--space-6);
	}

	.unit-input {
		/* inherits from field-input */
	}

	/* Form Actions */
	.form-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		margin-top: var(--space-3-5);
	}

	.form-actions-right {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.btn-cancel {
		padding: var(--space-2) var(--space-4);
		background: var(--glass-white-30);
		border: none;
		border-radius: var(--radius-input);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--blu-text-secondary);
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.btn-cancel:hover {
		background: var(--glass-white-50);
	}

	.btn-save {
		padding: var(--space-2) var(--space-5);
		background: var(--blu-primary);
		border: none;
		border-radius: var(--radius-input);
		font-size: var(--text-sm);
		font-weight: 600;
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-1-5);
		min-width: 64px;
		transition: all var(--duration-fast) ease;
	}

	.btn-save:hover:not(:disabled) {
		background: var(--blu-primary-hover);
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
		border-radius: var(--radius-input);
		color: var(--data-red);
		cursor: pointer;
		transition: all var(--duration-fast) ease;
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
		color: var(--gray-400);
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
		padding: 48px var(--space-6);
		text-align: center;
	}

	.empty-title {
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--gray-900);
		margin: 0 0 var(--space-2);
	}

	.empty-desc {
		font-size: var(--text-sm);
		color: var(--gray-400);
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
		gap: var(--space-2);
		padding: var(--space-3) var(--space-5);
		background: var(--gray-900);
		color: white;
		border-radius: var(--radius-chip);
		font-size: var(--text-sm);
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

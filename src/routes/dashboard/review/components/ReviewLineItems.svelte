<script lang="ts">
	import { t } from '$lib/i18n';
	import Plus from 'lucide-svelte/icons/plus';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Check from 'lucide-svelte/icons/check';
	import X from 'lucide-svelte/icons/x';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChevronUp from 'lucide-svelte/icons/chevron-up';
	import Database from 'lucide-svelte/icons/database';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';

	interface LineItem {
		id: string;
		description: string;
		quantity: number;
		unit: string;
		rate: number;
		total: number;
		material?: string | null;
		measurementType?: 'sqft' | 'linear_ft' | 'unit' | 'hour' | 'job' | 'service' | null;
		dimensions?: {
			width: number | null;
			length: number | null;
			unit: 'ft' | 'm' | null;
		} | null;
		suggestedPrice?: number | null;
		pricingConfidence?: number;
		hasPricingSuggestion?: boolean;
	}

	let {
		items = $bindable(),
		taxRate = $bindable(),
		calculatedSubtotal,
		calculatedTaxAmount,
		calculatedTotal,
		formatCurrency,
		onAddItem,
		onRemoveItem,
		onUpdateItemTotal,
		onUpdateDimensionsQuantity,
		onApplySuggestedPrice,
		onDismissPricingSuggestion
	}: {
		items: LineItem[];
		taxRate: number | null;
		calculatedSubtotal: number;
		calculatedTaxAmount: number;
		calculatedTotal: number;
		formatCurrency: (amount: number) => string;
		onAddItem: () => void;
		onRemoveItem: (id: string) => void;
		onUpdateItemTotal: (item: LineItem) => void;
		onUpdateDimensionsQuantity: (item: LineItem) => void;
		onApplySuggestedPrice: (itemId: string) => void;
		onDismissPricingSuggestion: (itemId: string) => void;
	} = $props();

	// Internal state
	let expandedItemId = $state<string | null>(null);

	const measurementChips = [
		{ type: 'service' as const, label: 'Flat Rate' },
		{ type: 'sqft' as const, label: 'Sq Ft' },
		{ type: 'linear_ft' as const, label: 'Linear Ft' },
		{ type: 'unit' as const, label: 'Per Unit' },
		{ type: 'hour' as const, label: 'Hourly' }
	];

	function setMeasurementType(item: LineItem, type: LineItem['measurementType']) {
		item.measurementType = type;
		if (type === 'service' || type === 'job') {
			item.quantity = 1;
			item.unit = 'job';
		} else if (type === 'sqft') {
			item.unit = 'sqft';
			if (!item.dimensions) {
				item.dimensions = { width: null, length: null, unit: 'ft' };
			}
		} else if (type === 'linear_ft') {
			item.unit = 'ft';
		} else if (type === 'unit') {
			item.unit = 'unit';
		} else if (type === 'hour') {
			item.unit = 'hr';
		}
		onUpdateItemTotal(item);
	}

	function formatCollapsedMeta(item: LineItem): string {
		const type = item.measurementType;
		if (type === 'service' || type === 'job') {
			return formatCurrency(item.total);
		}
		if (type === 'sqft' && item.dimensions?.width && item.dimensions?.length) {
			return `${item.dimensions.width} \u00d7 ${item.dimensions.length} ${item.dimensions.unit || 'ft'}`;
		}
		if (type === 'linear_ft') {
			return `${item.quantity} ft`;
		}
		if (type === 'unit') {
			return `${item.quantity} \u00d7 ${formatCurrency(item.rate)}`;
		}
		if (type === 'hour') {
			return `${item.quantity} hrs`;
		}
		// Fallback: existing behavior
		if (item.dimensions?.width && item.dimensions?.length) {
			return `${item.dimensions.width} \u00d7 ${item.dimensions.length} ${item.dimensions.unit || 'ft'}`;
		}
		return `${formatCurrency(item.rate)}${item.unit ? `/${item.unit}` : ''}`;
	}
</script>

<div class="line-items-section">
	<div class="line-items-header">
		<span class="items-label"
			>{items.length !== 1
				? $t('review.lineItemsCount').replace('{n}', String(items.length))
				: $t('review.lineItemCount').replace('{n}', String(items.length))}</span
		>
		{#if items.length === 0}
			<div class="inline-warning" title="At least one line item is required">
				<AlertTriangle size={16} />
			</div>
		{/if}
	</div>

	{#if items.length > 0}
		<div class="line-items-list">
			{#each items as item, index (item.id)}
				{@const isExpanded = expandedItemId === item.id}
				{@const hasSuggestion = item.hasPricingSuggestion && item.suggestedPrice}
				<div
					class="line-item-card"
					class:expanded={isExpanded}
					class:has-suggestion={hasSuggestion}
				>
					<button
						class="line-item-header"
						onclick={() => (expandedItemId = isExpanded ? null : item.id)}
					>
						<span class="line-item-num">{index + 1}</span>
						<div class="line-item-summary">
							<span class="line-item-desc">{item.description || 'Untitled item'}</span>
							<span class="line-item-meta">
								{formatCollapsedMeta(item)}
							</span>
						</div>
						<div class="line-item-total-wrapper">
							<span class="line-item-total" class:needs-price={!item.total || item.total === 0}
								>{formatCurrency(item.total)}</span
							>
							{#if hasSuggestion}
								<span class="pricing-hint" title="Suggested price based on history">
									<Database size={12} />
								</span>
							{/if}
						</div>
						{#if isExpanded}
							<ChevronUp size={16} class="expand-icon" />
						{:else}
							<ChevronDown size={16} class="expand-icon" />
						{/if}
					</button>

					{#if hasSuggestion}
						<div class="pricing-suggestion">
							<div class="suggestion-content">
								<Database size={14} />
								<span>
									{$t('review.suggestedPrice')}:
									<strong>{formatCurrency(item.suggestedPrice!)}</strong>
									{#if item.pricingConfidence && item.pricingConfidence >= 0.8}
										<span class="confidence high">{$t('review.highConfidence')}</span>
									{:else if item.pricingConfidence && item.pricingConfidence >= 0.6}
										<span class="confidence medium">{$t('review.mediumConfidence')}</span>
									{:else}
										<span class="confidence low">{$t('review.lowConfidence')}</span>
									{/if}
								</span>
							</div>
							<div class="suggestion-actions">
								<button class="apply-btn" onclick={() => onApplySuggestedPrice(item.id)}>
									<Check size={14} />
									Apply
								</button>
								<button class="dismiss-btn" onclick={() => onDismissPricingSuggestion(item.id)}>
									<X size={14} />
								</button>
							</div>
						</div>
					{/if}

					{#if isExpanded}
						<div class="line-item-edit">
							<!-- Measurement type chips -->
							<div class="measurement-chips">
								{#each measurementChips as chip (chip.type)}
									<button
										class="measurement-chip"
										class:active={item.measurementType === chip.type}
										onclick={() => setMeasurementType(item, chip.type)}
									>
										{chip.label}
									</button>
								{/each}
							</div>

							<!-- Description (always shown) -->
							<div class="edit-field full">
								<label for="item-desc-{item.id}">{$t('review.description')}</label>
								<input
									id="item-desc-{item.id}"
									type="text"
									bind:value={item.description}
									placeholder={$t('placeholder.description')}
								/>
							</div>

							<!-- Type-specific inputs -->
							{#if item.measurementType === 'service' || item.measurementType === 'job'}
								<!-- Service: no extra fields before total -->
							{:else if item.measurementType === 'sqft'}
								<!-- Area: Width x Length -> auto quantity, Rate/sqft -->
								<div class="dimensions-row">
									<span class="dimensions-label">{$t('review.dimensions')}</span>
									<div class="dimensions-inputs">
										<input
											type="number"
											class="dimension-input"
											value={item.dimensions?.width ?? ''}
											oninput={(e) => {
												if (!item.dimensions) {
													item.dimensions = { width: null, length: null, unit: 'ft' };
												}
												item.dimensions.width =
													parseFloat((e.target as HTMLInputElement).value) || null;
												onUpdateDimensionsQuantity(item);
											}}
											placeholder="W"
											min="0"
											step="0.1"
										/>
										<span class="dimension-separator">&times;</span>
										<input
											type="number"
											class="dimension-input"
											value={item.dimensions?.length ?? ''}
											oninput={(e) => {
												if (!item.dimensions) {
													item.dimensions = { width: null, length: null, unit: 'ft' };
												}
												item.dimensions.length =
													parseFloat((e.target as HTMLInputElement).value) || null;
												onUpdateDimensionsQuantity(item);
											}}
											placeholder="L"
											min="0"
											step="0.1"
										/>
										<span class="dimension-unit">ft</span>
										{#if item.dimensions?.width && item.dimensions?.length}
											<span class="dimension-result">
												= {item.dimensions.width * item.dimensions.length} sqft
											</span>
										{/if}
									</div>
								</div>
								<div class="edit-field full">
									<label for="item-rate-{item.id}">Price /sqft</label>
									<input
										id="item-rate-{item.id}"
										type="number"
										bind:value={item.rate}
										oninput={() => onUpdateItemTotal(item)}
										min="0"
										step="0.01"
									/>
								</div>
							{:else if item.measurementType === 'linear_ft'}
								<!-- Linear: Length + Rate/ft -->
								<div class="edit-row">
									<div class="edit-field">
										<label for="item-qty-{item.id}">Length (ft)</label>
										<input
											id="item-qty-{item.id}"
											type="number"
											bind:value={item.quantity}
											oninput={() => onUpdateItemTotal(item)}
											min="0"
											step="0.1"
										/>
									</div>
									<div class="edit-field">
										<label for="item-rate-{item.id}">Price /ft</label>
										<input
											id="item-rate-{item.id}"
											type="number"
											bind:value={item.rate}
											oninput={() => onUpdateItemTotal(item)}
											min="0"
											step="0.01"
										/>
									</div>
								</div>
							{:else if item.measurementType === 'unit'}
								<!-- Per Unit: Count + Rate/unit -->
								<div class="edit-row">
									<div class="edit-field">
										<label for="item-qty-{item.id}">Quantity</label>
										<input
											id="item-qty-{item.id}"
											type="number"
											bind:value={item.quantity}
											oninput={() => onUpdateItemTotal(item)}
											min="0"
											step="1"
										/>
									</div>
									<div class="edit-field">
										<label for="item-rate-{item.id}">Unit Price</label>
										<input
											id="item-rate-{item.id}"
											type="number"
											bind:value={item.rate}
											oninput={() => onUpdateItemTotal(item)}
											min="0"
											step="0.01"
										/>
									</div>
								</div>
							{:else if item.measurementType === 'hour'}
								<!-- Per Hour: Hours + Rate/hr -->
								<div class="edit-row">
									<div class="edit-field">
										<label for="item-qty-{item.id}">Hours</label>
										<input
											id="item-qty-{item.id}"
											type="number"
											bind:value={item.quantity}
											oninput={() => onUpdateItemTotal(item)}
											min="0"
											step="0.5"
										/>
									</div>
									<div class="edit-field">
										<label for="item-rate-{item.id}">Hourly Rate</label>
										<input
											id="item-rate-{item.id}"
											type="number"
											bind:value={item.rate}
											oninput={() => onUpdateItemTotal(item)}
											min="0"
											step="0.01"
										/>
									</div>
								</div>
							{:else}
								<!-- No type selected: show rate only -->
								<div class="edit-field full">
									<label for="item-rate-{item.id}">Unit Price</label>
									<input
										id="item-rate-{item.id}"
										type="number"
										bind:value={item.rate}
										oninput={() => onUpdateItemTotal(item)}
										min="0"
										step="0.01"
									/>
								</div>
							{/if}

							<!-- Total always on its own row -->
							<div class="edit-field full">
								<label for="item-total-{item.id}">Line Total</label>
								<input
									id="item-total-{item.id}"
									type="number"
									bind:value={item.total}
									min="0"
									step="0.01"
								/>
							</div>

							{#if item.material}
								<div class="material-info">
									<span class="material-tag">
										<Database size={12} />
										{item.material}
										{#if item.measurementType}
											<span class="measurement-type">({item.measurementType})</span>
										{/if}
									</span>
								</div>
							{/if}
							<div class="edit-actions">
								<button class="delete-item-btn" onclick={() => onRemoveItem(item.id)}>
									<Trash2 size={14} />
									Delete
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if items.length > 0}
		<div class="tax-summary">
			<div class="tax-row">
				<span class="tax-label">{$t('review.subtotal')}</span>
				<span class="tax-value">{formatCurrency(calculatedSubtotal)}</span>
			</div>
			<div class="tax-row tax-rate-row">
				<span class="tax-label">{$t('review.tax')}</span>
				<div class="tax-rate-input-wrapper">
					<input
						type="number"
						class="tax-rate-input"
						value={taxRate ?? 0}
						oninput={(e) => {
							const val = parseFloat((e.target as HTMLInputElement).value);
							taxRate = isNaN(val) ? null : val;
						}}
						min="0"
						max="100"
						step="0.1"
					/>
					<span class="tax-percent">%</span>
				</div>
				<span class="tax-value">{formatCurrency(calculatedTaxAmount)}</span>
			</div>
			<div class="tax-row tax-total-row">
				<span class="tax-label">{$t('review.total')}</span>
				<span class="tax-value total">{formatCurrency(calculatedTotal)}</span>
			</div>
		</div>
	{/if}

	<button
		class="add-item-btn"
		onclick={() => {
			onAddItem();
			expandedItemId = `item-${Date.now()}`;
		}}
	>
		<Plus size={16} />
		{$t('review.addLineItem')}
	</button>
</div>

<style>
	.line-items-section {
		padding: var(--space-4);
		background: linear-gradient(135deg, rgba(0, 102, 255, 0.06), rgba(59, 130, 246, 0.04));
		border-radius: var(--radius-card);
	}

	.line-items-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-3);
	}

	.line-items-header .items-label {
		margin-bottom: 0;
	}

	.items-label {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--gray-600);
	}

	.inline-warning {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: rgba(245, 158, 11, 0.12);
		border-radius: 8px;
		color: var(--data-amber);
		flex-shrink: 0;
		margin-left: auto;
	}

	.line-items-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-3);
	}

	.line-item-card {
		background: var(--white);
		border: 1px solid var(--gray-200);
		border-radius: var(--radius-input);
		overflow: hidden;
		transition: all var(--duration-fast) ease;
	}

	.line-item-card.expanded {
		border-color: var(--blu-primary);
		box-shadow: var(--shadow-input-focus);
	}

	.line-item-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-3) var(--space-3-5);
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background var(--duration-fast) ease;
	}

	.line-item-header:hover {
		background: transparent;
	}

	.line-item-num {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--gray-100);
		border-radius: 6px;
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--gray-500);
		flex-shrink: 0;
	}

	.line-item-summary {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-0-5);
	}

	.line-item-desc {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--gray-900);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.line-item-meta {
		font-size: var(--text-xs);
		color: var(--gray-500);
	}

	.line-item-total {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--data-green);
		flex-shrink: 0;
	}

	.line-item-total.needs-price {
		color: var(--data-amber);
	}

	.line-item-total-wrapper {
		display: flex;
		align-items: center;
		gap: var(--space-1-5);
		flex-shrink: 0;
	}


	.pricing-hint {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		background: #dbeafe;
		border-radius: 4px;
		color: #2563eb;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.line-item-card.has-suggestion {
		border-color: #93c5fd;
		background: #f0f9ff;
	}

	.pricing-suggestion {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-2-5) var(--space-3-5);
		background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
		border-top: 1px solid #bfdbfe;
		gap: var(--space-3);
	}

	.suggestion-content {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: #1e40af;
	}

	.suggestion-content strong {
		color: #1d4ed8;
	}

	.suggestion-content .confidence {
		font-size: var(--text-xs);
		padding: var(--space-0-5) var(--space-1-5);
		border-radius: 4px;
		margin-left: var(--space-1);
	}

	.confidence.high {
		background: #dcfce7;
		color: #166534;
	}

	.confidence.medium {
		background: #fef3c7;
		color: #92400e;
	}

	.confidence.low {
		background: #fee2e2;
		color: #991b1b;
	}

	.suggestion-actions {
		display: flex;
		gap: var(--space-1-5);
	}

	.suggestion-actions .apply-btn {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1-5) var(--space-3);
		background: #2563eb;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: var(--text-xs);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.suggestion-actions .apply-btn:hover {
		background: #1d4ed8;
	}

	.suggestion-actions .dismiss-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: transparent;
		color: var(--gray-500);
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.suggestion-actions .dismiss-btn:hover {
		background: var(--gray-100);
		color: var(--gray-600);
	}

	.material-info {
		padding-top: var(--space-2);
		border-top: 1px dashed var(--blu-border);
	}

	.material-tag {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1-5);
		padding: var(--space-1) var(--space-2-5);
		background: #f0f9ff;
		border: 1px solid #bae6fd;
		border-radius: 6px;
		font-size: var(--text-xs);
		color: #0369a1;
	}

	.material-tag .measurement-type {
		color: var(--gray-500);
	}

	.line-item-header :global(.expand-icon) {
		color: var(--gray-400);
		flex-shrink: 0;
	}

	.line-item-edit {
		padding: var(--space-3-5);
		border-top: 1px solid var(--gray-200);
		background: var(--gray-50);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.line-item-edit .edit-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1-5);
	}

	.line-item-edit .edit-field.full {
		width: 100%;
	}

	.line-item-edit .edit-field label {
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--gray-500);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.line-item-edit .edit-field input {
		padding: var(--space-2-5) var(--space-3);
		border: 1px solid var(--gray-200);
		border-radius: 8px;
		font-size: var(--text-sm);
		color: var(--gray-900);
		background: var(--white);
		transition: all var(--duration-fast) ease;
	}

	.line-item-edit .edit-field input:focus {
		outline: none;
		border-color: var(--blu-primary);
		box-shadow: var(--shadow-input-focus);
	}

	.line-item-edit .edit-row {
		display: flex;
		gap: var(--space-2-5);
	}

	.line-item-edit .edit-row .edit-field {
		flex: 1;
	}

	.dimensions-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2-5) 0;
		margin-top: var(--space-1);
		border-top: 1px dashed var(--blu-border);
	}

	.dimensions-label {
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--gray-500);
		white-space: nowrap;
	}

	.dimensions-inputs {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex: 1;
	}

	.dimension-input {
		width: 60px;
		padding: var(--space-1-5) var(--space-2);
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: var(--text-sm);
		text-align: center;
	}

	.dimension-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
	}

	.dimension-separator {
		color: #9ca3af;
		font-weight: 500;
	}

	.dimension-unit {
		font-size: var(--text-xs);
		color: #6b7280;
		margin-left: var(--space-1);
	}

	.dimension-result {
		font-size: var(--text-xs);
		color: var(--data-green);
		font-weight: 500;
		margin-left: var(--space-2);
		padding: var(--space-1) var(--space-2);
		background: #ecfdf5;
		border-radius: 4px;
	}

	.measurement-chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1-5);
		padding-bottom: var(--space-1);
	}

	.measurement-chip {
		padding: 5px var(--space-3);
		border: 1px solid var(--gray-200);
		border-radius: var(--radius-card);
		background: var(--gray-100);
		color: var(--gray-600);
		font-size: var(--text-xs);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--duration-fast) ease;
		white-space: nowrap;
	}

	.measurement-chip:hover {
		border-color: var(--gray-300);
		background: var(--gray-200);
	}

	.measurement-chip.active {
		background: var(--blu-primary);
		color: var(--white);
		border-color: var(--blu-primary);
	}

	.measurement-chip.active:hover {
		background: var(--blu-primary-hover);
		border-color: var(--blu-primary-hover);
	}

	.line-item-edit .edit-actions {
		display: flex;
		justify-content: flex-end;
		padding-top: var(--space-2);
		border-top: 1px solid var(--gray-200);
	}

	.delete-item-btn {
		display: flex;
		align-items: center;
		gap: var(--space-1-5);
		padding: var(--space-2) var(--space-3);
		background: transparent;
		border: 1px solid #fecaca;
		border-radius: 8px;
		color: var(--data-red-hover);
		font-size: var(--text-sm);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.delete-item-btn:hover {
		background: rgba(220, 38, 38, 0.08);
	}

	.tax-summary {
		background: var(--white);
		border: 1px solid var(--gray-200);
		border-radius: var(--radius-input);
		padding: var(--space-3) var(--space-3-5);
		margin-bottom: var(--space-3);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.tax-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.tax-label {
		font-size: var(--text-sm);
		color: var(--gray-500);
		font-weight: 500;
	}

	.tax-value {
		font-size: var(--text-sm);
		color: var(--gray-700);
		font-weight: 500;
		text-align: right;
	}

	.tax-value.total {
		font-size: var(--text-base);
		font-weight: 700;
		color: var(--data-green);
	}

	.tax-rate-row {
		gap: var(--space-2);
	}

	.tax-rate-input-wrapper {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		margin-left: auto;
		margin-right: var(--space-3);
	}

	.tax-rate-input {
		width: 60px;
		padding: var(--space-1-5) var(--space-2);
		border: 1px solid var(--gray-200);
		border-radius: 8px;
		font-size: var(--text-sm);
		text-align: center;
		color: var(--gray-900);
		background: var(--gray-50);
		transition: all var(--duration-fast) ease;
	}

	.tax-rate-input:focus {
		outline: none;
		border-color: var(--blu-primary);
		box-shadow: var(--shadow-input-focus);
		background: var(--white);
	}

	.tax-percent {
		font-size: var(--text-xs);
		color: var(--gray-400);
		font-weight: 500;
	}

	.tax-total-row {
		padding-top: var(--space-2);
		border-top: 1px solid var(--gray-200);
	}

	.add-item-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-3);
		background: rgba(0, 102, 255, 0.06);
		border: 1px dashed rgba(0, 102, 255, 0.3);
		border-radius: var(--radius-sm);
		color: var(--blu-primary);
		font-size: var(--text-sm);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.add-item-btn:hover {
		background: var(--glass-primary-10);
		border-color: var(--blu-primary);
	}
</style>

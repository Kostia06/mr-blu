import { useState, useRef } from 'preact/hooks';
import { useI18nStore } from '@/lib/i18n';
import {
  Plus,
  Trash2,
  Check,
  X,
  Database,
  AlertTriangle,
  Search,
  Loader2,
} from 'lucide-react';
import { ReviewModal } from '@/components/review/ReviewModal';
import type { PriceSearchResult } from '@/lib/api/pricing';

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

interface ReviewLineItemsProps {
  items: LineItem[];
  onItemsChange: (items: LineItem[]) => void;
  taxRate: number | null;
  onTaxRateChange: (rate: number | null) => void;
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
  onAddItemFromPriceBook?: (item: PriceSearchResult) => void;
  onSearchPriceItems?: (query: string) => Promise<PriceSearchResult[]>;
}

const TAX_PRESETS = [
  { label: 'None', rate: 0 },
  { label: 'GST', rate: 5 },
  { label: 'HST', rate: 13 },
  { label: 'PST', rate: 7 },
  { label: 'Custom', rate: null },
] as const;

const MEASUREMENT_CHIPS = [
  { type: 'service' as const, label: 'Service' },
  { type: 'sqft' as const, label: 'Area' },
  { type: 'linear_ft' as const, label: 'Linear' },
  { type: 'unit' as const, label: 'Per Unit' },
  { type: 'hour' as const, label: 'Per Hour' },
];

export function ReviewLineItems({
  items,
  onItemsChange,
  taxRate,
  onTaxRateChange,
  calculatedSubtotal,
  calculatedTaxAmount,
  calculatedTotal,
  formatCurrency,
  onAddItem,
  onRemoveItem,
  onUpdateItemTotal,
  onUpdateDimensionsQuantity,
  onApplySuggestedPrice,
  onDismissPricingSuggestion,
  onAddItemFromPriceBook,
  onSearchPriceItems,
}: ReviewLineItemsProps) {
  const { t } = useI18nStore();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showAddSearch, setShowAddSearch] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [addSearchResults, setAddSearchResults] = useState<PriceSearchResult[]>([]);
  const [isSearchingPriceBook, setIsSearchingPriceBook] = useState(false);
  const [showCustomTaxInput, setShowCustomTaxInput] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  function updateItem(itemId: string, updates: Partial<LineItem>) {
    const updated = items.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    onItemsChange(updated);
  }

  function setMeasurementType(item: LineItem, type: LineItem['measurementType']) {
    const updates: Partial<LineItem> = { measurementType: type };

    if (type === 'service' || type === 'job') {
      updates.quantity = 1;
      updates.unit = 'job';
    } else if (type === 'sqft') {
      updates.unit = 'sqft';
      if (!item.dimensions) {
        updates.dimensions = { width: null, length: null, unit: 'ft' };
      }
    } else if (type === 'linear_ft') {
      updates.unit = 'ft';
    } else if (type === 'unit') {
      updates.unit = 'unit';
    } else if (type === 'hour') {
      updates.unit = 'hr';
    }

    const updatedItem = { ...item, ...updates };
    const updatedItems = items.map((i) => (i.id === item.id ? updatedItem : i));
    onItemsChange(updatedItems);
    onUpdateItemTotal(updatedItem);
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
    if (item.dimensions?.width && item.dimensions?.length) {
      return `${item.dimensions.width} \u00d7 ${item.dimensions.length} ${item.dimensions.unit || 'ft'}`;
    }
    return `${formatCurrency(item.rate)}${item.unit ? `/${item.unit}` : ''}`;
  }

  function handleDimensionWidthInput(item: LineItem, value: string) {
    const width = parseFloat(value) || null;
    const dimensions = item.dimensions
      ? { ...item.dimensions, width }
      : { width, length: null, unit: 'ft' as const };
    const updatedItem = { ...item, dimensions };
    const updatedItems = items.map((i) => (i.id === item.id ? updatedItem : i));
    onItemsChange(updatedItems);
    onUpdateDimensionsQuantity(updatedItem);
  }

  function handleDimensionLengthInput(item: LineItem, value: string) {
    const length = parseFloat(value) || null;
    const dimensions = item.dimensions
      ? { ...item.dimensions, length }
      : { width: null, length, unit: 'ft' as const };
    const updatedItem = { ...item, dimensions };
    const updatedItems = items.map((i) => (i.id === item.id ? updatedItem : i));
    onItemsChange(updatedItems);
    onUpdateDimensionsQuantity(updatedItem);
  }

  function handleFieldChange(item: LineItem, field: keyof LineItem, value: unknown) {
    const updatedItem = { ...item, [field]: value };
    const updatedItems = items.map((i) => (i.id === item.id ? updatedItem : i));
    onItemsChange(updatedItems);
    return updatedItem;
  }

  function handleFieldChangeWithTotal(item: LineItem, field: keyof LineItem, value: unknown) {
    const updatedItem = handleFieldChange(item, field, value);
    onUpdateItemTotal(updatedItem);
  }

  function handleAddItem() {
    if (onSearchPriceItems && onAddItemFromPriceBook) {
      setShowAddSearch(true);
      setAddSearchQuery('');
      setAddSearchResults([]);
      return;
    }
    onAddItem();
    setEditingItemId(`item-${Date.now()}`);
  }

  function handleAddSearchInput(value: string) {
    setAddSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (value.length < 2 || !onSearchPriceItems) {
      setAddSearchResults([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingPriceBook(true);
      try {
        const results = await onSearchPriceItems(value);
        setAddSearchResults(results);
      } catch {
        setAddSearchResults([]);
      } finally {
        setIsSearchingPriceBook(false);
      }
    }, 300);
  }

  function handleSelectPriceItem(item: PriceSearchResult) {
    onAddItemFromPriceBook?.(item);
    setShowAddSearch(false);
    setAddSearchQuery('');
    setAddSearchResults([]);
  }

  function handleAddCustomItem() {
    onAddItem();
    setShowAddSearch(false);
    setAddSearchQuery('');
    setAddSearchResults([]);
    setEditingItemId(`item-${Date.now()}`);
  }

  function dismissAddSearch() {
    setShowAddSearch(false);
    setAddSearchQuery('');
    setAddSearchResults([]);
  }

  function isPresetTaxRate(rate: number | null): boolean {
    if (rate === null || rate === 0) return true;
    return TAX_PRESETS.some((p) => p.rate === rate);
  }

  function renderMeasurementInputs(item: LineItem) {
    const type = item.measurementType;

    if (type === 'service' || type === 'job') {
      return (
        <div class="edit-row">
          <div class="edit-field" style={{ flex: 1 }}>
            <label for={`item-total-${item.id}`}>{t('review.total')}</label>
            <input
              id={`item-total-${item.id}`}
              type="number"
              value={item.total}
              onInput={(e) =>
                handleFieldChange(item, 'total', parseFloat((e.target as HTMLInputElement).value) || 0)
              }
              min="0"
              step="0.01"
            />
          </div>
        </div>
      );
    }

    if (type === 'sqft') {
      return (
        <>
          <div class="dimensions-row">
            <span class="dimensions-label">{t('review.dimensions')}</span>
            <div class="dimensions-inputs">
              <input
                type="number"
                class="dimension-input"
                value={item.dimensions?.width ?? ''}
                onInput={(e) =>
                  handleDimensionWidthInput(item, (e.target as HTMLInputElement).value)
                }
                placeholder="W"
                min="0"
                step="0.1"
              />
              <span class="dimension-separator">{'\u00d7'}</span>
              <input
                type="number"
                class="dimension-input"
                value={item.dimensions?.length ?? ''}
                onInput={(e) =>
                  handleDimensionLengthInput(item, (e.target as HTMLInputElement).value)
                }
                placeholder="L"
                min="0"
                step="0.1"
              />
              <span class="dimension-unit">ft</span>
              {item.dimensions?.width && item.dimensions?.length && (
                <span class="dimension-result">
                  = {item.dimensions.width * item.dimensions.length} sqft
                </span>
              )}
            </div>
          </div>
          <div class="edit-row">
            <div class="edit-field">
              <label for={`item-rate-${item.id}`}>{t('review.rate')} /sqft</label>
              <input
                id={`item-rate-${item.id}`}
                type="number"
                value={item.rate}
                onInput={(e) =>
                  handleFieldChangeWithTotal(
                    item,
                    'rate',
                    parseFloat((e.target as HTMLInputElement).value) || 0
                  )
                }
                min="0"
                step="0.01"
              />
            </div>
            <div class="edit-field">
              <label for={`item-total-${item.id}`}>{t('review.total')}</label>
              <input
                id={`item-total-${item.id}`}
                type="number"
                value={item.total}
                onInput={(e) =>
                  handleFieldChange(item, 'total', parseFloat((e.target as HTMLInputElement).value) || 0)
                }
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </>
      );
    }

    if (type === 'linear_ft') {
      return (
        <div class="edit-row">
          <div class="edit-field">
            <label for={`item-qty-${item.id}`}>Length (ft)</label>
            <input
              id={`item-qty-${item.id}`}
              type="number"
              value={item.quantity}
              onInput={(e) =>
                handleFieldChangeWithTotal(
                  item,
                  'quantity',
                  parseFloat((e.target as HTMLInputElement).value) || 0
                )
              }
              min="0"
              step="0.1"
            />
          </div>
          <div class="edit-field">
            <label for={`item-rate-${item.id}`}>{t('review.rate')} /ft</label>
            <input
              id={`item-rate-${item.id}`}
              type="number"
              value={item.rate}
              onInput={(e) =>
                handleFieldChangeWithTotal(
                  item,
                  'rate',
                  parseFloat((e.target as HTMLInputElement).value) || 0
                )
              }
              min="0"
              step="0.01"
            />
          </div>
          <div class="edit-field">
            <label for={`item-total-${item.id}`}>{t('review.total')}</label>
            <input
              id={`item-total-${item.id}`}
              type="number"
              value={item.total}
              onInput={(e) =>
                handleFieldChange(item, 'total', parseFloat((e.target as HTMLInputElement).value) || 0)
              }
              min="0"
              step="0.01"
            />
          </div>
        </div>
      );
    }

    if (type === 'unit') {
      return (
        <div class="edit-row">
          <div class="edit-field">
            <label for={`item-qty-${item.id}`}>Count</label>
            <input
              id={`item-qty-${item.id}`}
              type="number"
              value={item.quantity}
              onInput={(e) =>
                handleFieldChangeWithTotal(
                  item,
                  'quantity',
                  parseFloat((e.target as HTMLInputElement).value) || 0
                )
              }
              min="0"
              step="1"
            />
          </div>
          <div class="edit-field">
            <label for={`item-rate-${item.id}`}>{t('review.rate')} /unit</label>
            <input
              id={`item-rate-${item.id}`}
              type="number"
              value={item.rate}
              onInput={(e) =>
                handleFieldChangeWithTotal(
                  item,
                  'rate',
                  parseFloat((e.target as HTMLInputElement).value) || 0
                )
              }
              min="0"
              step="0.01"
            />
          </div>
          <div class="edit-field">
            <label for={`item-total-${item.id}`}>{t('review.total')}</label>
            <input
              id={`item-total-${item.id}`}
              type="number"
              value={item.total}
              onInput={(e) =>
                handleFieldChange(item, 'total', parseFloat((e.target as HTMLInputElement).value) || 0)
              }
              min="0"
              step="0.01"
            />
          </div>
        </div>
      );
    }

    if (type === 'hour') {
      return (
        <div class="edit-row">
          <div class="edit-field">
            <label for={`item-qty-${item.id}`}>Hours</label>
            <input
              id={`item-qty-${item.id}`}
              type="number"
              value={item.quantity}
              onInput={(e) =>
                handleFieldChangeWithTotal(
                  item,
                  'quantity',
                  parseFloat((e.target as HTMLInputElement).value) || 0
                )
              }
              min="0"
              step="0.5"
            />
          </div>
          <div class="edit-field">
            <label for={`item-rate-${item.id}`}>{t('review.rate')} /hr</label>
            <input
              id={`item-rate-${item.id}`}
              type="number"
              value={item.rate}
              onInput={(e) =>
                handleFieldChangeWithTotal(
                  item,
                  'rate',
                  parseFloat((e.target as HTMLInputElement).value) || 0
                )
              }
              min="0"
              step="0.01"
            />
          </div>
          <div class="edit-field">
            <label for={`item-total-${item.id}`}>{t('review.total')}</label>
            <input
              id={`item-total-${item.id}`}
              type="number"
              value={item.total}
              onInput={(e) =>
                handleFieldChange(item, 'total', parseFloat((e.target as HTMLInputElement).value) || 0)
              }
              min="0"
              step="0.01"
            />
          </div>
        </div>
      );
    }

    // No type selected: show rate + total (original default)
    return (
      <div class="edit-row">
        <div class="edit-field">
          <label for={`item-rate-${item.id}`}>{t('review.rate')}</label>
          <input
            id={`item-rate-${item.id}`}
            type="number"
            value={item.rate}
            onInput={(e) =>
              handleFieldChangeWithTotal(
                item,
                'rate',
                parseFloat((e.target as HTMLInputElement).value) || 0
              )
            }
            min="0"
            step="0.01"
          />
        </div>
        <div class="edit-field">
          <label for={`item-total-${item.id}`}>{t('review.total')}</label>
          <input
            id={`item-total-${item.id}`}
            type="number"
            value={item.total}
            onInput={(e) =>
              handleFieldChange(item, 'total', parseFloat((e.target as HTMLInputElement).value) || 0)
            }
            min="0"
            step="0.01"
          />
        </div>
      </div>
    );
  }

  const itemCountLabel =
    items.length !== 1
      ? t('review.lineItemsCount').replace('{n}', String(items.length))
      : t('review.lineItemCount').replace('{n}', String(items.length));

  return (
    <>
      <style>{componentStyles}</style>
      <div class="line-items-section">
        <div class="line-items-header">
          <span class="items-label">{itemCountLabel}</span>
          {items.length === 0 && (
            <div class="inline-warning" title="At least one line item is required">
              <AlertTriangle size={16} />
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div class="line-items-list">
            {items.map((item, index) => {
              const hasSuggestion = item.hasPricingSuggestion && item.suggestedPrice;

              return (
                <div
                  key={item.id}
                  class={`line-item-card${hasSuggestion ? ' has-suggestion' : ''}`}
                >
                  <button
                    class="line-item-header"
                    onClick={() => setEditingItemId(item.id)}
                  >
                    <span class="line-item-num">{index + 1}</span>
                    <div class="line-item-summary">
                      <span class="line-item-desc">
                        {item.description || 'Untitled item'}
                      </span>
                      <span class="line-item-meta">{formatCollapsedMeta(item)}</span>
                    </div>
                    <div class="line-item-total-wrapper">
                      <span
                        class={`line-item-total${!item.total || item.total === 0 ? ' needs-price' : ''}`}
                      >
                        {formatCurrency(item.total)}
                      </span>
                      {hasSuggestion && (
                        <span class="pricing-hint" title="Suggested price based on history">
                          <Database size={12} />
                        </span>
                      )}
                    </div>
                  </button>

                  {hasSuggestion && (
                    <div class="pricing-suggestion">
                      <div class="suggestion-content">
                        <Database size={14} />
                        <span>
                          {t('review.suggestedPrice')}:{' '}
                          <strong>{formatCurrency(item.suggestedPrice!)}</strong>
                          {item.pricingConfidence && item.pricingConfidence >= 0.8 ? (
                            <span class="confidence high">{t('review.highConfidence')}</span>
                          ) : item.pricingConfidence && item.pricingConfidence >= 0.6 ? (
                            <span class="confidence medium">
                              {t('review.mediumConfidence')}
                            </span>
                          ) : (
                            <span class="confidence low">{t('review.lowConfidence')}</span>
                          )}
                        </span>
                      </div>
                      <div class="suggestion-actions">
                        <button
                          class="apply-btn"
                          onClick={() => onApplySuggestedPrice(item.id)}
                        >
                          <Check size={14} />
                          Apply
                        </button>
                        <button
                          class="dismiss-btn"
                          onClick={() => onDismissPricingSuggestion(item.id)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        )}

        {/* Line item edit modal */}
        {(() => {
          const editItem = editingItemId
            ? items.find((i) => i.id === editingItemId)
            : undefined;
          if (!editItem) return null;
          return (
            <ReviewModal
              open={true}
              title={editItem.description || 'Edit Item'}
              onClose={() => setEditingItemId(null)}
            >
              <div class="line-item-edit">
                <div class="measurement-chips">
                  {MEASUREMENT_CHIPS.map((chip) => (
                    <button
                      key={chip.type}
                      class={`measurement-chip${editItem.measurementType === chip.type ? ' active' : ''}`}
                      onClick={() => setMeasurementType(editItem, chip.type)}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <div class="edit-field full">
                  <label for={`item-desc-${editItem.id}`}>{t('review.description')}</label>
                  <input
                    id={`item-desc-${editItem.id}`}
                    type="text"
                    value={editItem.description}
                    onInput={(e) =>
                      updateItem(editItem.id, {
                        description: (e.target as HTMLInputElement).value,
                      })
                    }
                    placeholder={t('placeholder.description')}
                  />
                </div>

                {renderMeasurementInputs(editItem)}

                {editItem.material && (
                  <div class="material-info">
                    <span class="material-tag">
                      <Database size={12} />
                      {editItem.material}
                      {editItem.measurementType && (
                        <span class="measurement-type">({editItem.measurementType})</span>
                      )}
                    </span>
                  </div>
                )}

                <div class="edit-actions">
                  <button
                    class="delete-item-btn"
                    onClick={() => {
                      onRemoveItem(editItem.id);
                      setEditingItemId(null);
                    }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </ReviewModal>
          );
        })()}

        {items.length > 0 && (
          <div class="tax-summary">
            <div class="tax-row">
              <span class="tax-label">{t('review.subtotal')}</span>
              <span class="tax-value">{formatCurrency(calculatedSubtotal)}</span>
            </div>
            <div class="tax-row tax-rate-row">
              <span class="tax-label">{t('review.tax')}</span>
              <span class="tax-value">{formatCurrency(calculatedTaxAmount)}</span>
            </div>
            <div class="tax-chips-row">
              {TAX_PRESETS.map((preset) => {
                const isActive =
                  preset.rate === null
                    ? showCustomTaxInput || !isPresetTaxRate(taxRate)
                    : (taxRate ?? 0) === preset.rate && !showCustomTaxInput;
                return (
                  <button
                    key={preset.label}
                    class={`tax-chip${isActive ? ' active' : ''}`}
                    onClick={() => {
                      if (preset.rate === null) {
                        setShowCustomTaxInput(true);
                      } else {
                        setShowCustomTaxInput(false);
                        onTaxRateChange(preset.rate);
                      }
                    }}
                  >
                    {preset.label}
                    {preset.rate !== null && <span class="tax-chip-rate">{preset.rate}%</span>}
                  </button>
                );
              })}
            </div>
            {showCustomTaxInput && (
              <div class="tax-custom-input-row">
                <div class="tax-rate-input-wrapper">
                  <input
                    type="number"
                    class="tax-rate-input"
                    value={taxRate ?? 0}
                    onInput={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value);
                      onTaxRateChange(isNaN(val) ? null : val);
                    }}
                    min="0"
                    max="100"
                    step="0.1"
                    autoFocus
                  />
                  <span class="tax-percent">%</span>
                </div>
              </div>
            )}
            <div class="tax-row tax-total-row">
              <span class="tax-label">{t('review.total')}</span>
              <span class="tax-value total">{formatCurrency(calculatedTotal)}</span>
            </div>
          </div>
        )}

        {showAddSearch ? (
          <div class="add-item-search">
            <div class="add-search-input-wrapper">
              <Search size={14} class="add-search-icon" />
              <input
                class="add-search-input"
                type="text"
                value={addSearchQuery}
                onInput={(e) => handleAddSearchInput((e.target as HTMLInputElement).value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') dismissAddSearch();
                }}
                placeholder="Search price book..."
                autoFocus
              />
              <button class="add-search-close" onClick={dismissAddSearch}>
                <X size={14} />
              </button>
            </div>

            {isSearchingPriceBook && (
              <div class="add-search-loading">
                <Loader2 size={16} class="spinning" />
                <span>Searching...</span>
              </div>
            )}

            {!isSearchingPriceBook && addSearchResults.length > 0 && (
              <div class="add-search-results">
                {addSearchResults.map((item) => (
                  <button
                    key={item.id}
                    class="add-search-result-item"
                    onClick={() => handleSelectPriceItem(item)}
                  >
                    <span class="result-item-name">{item.name}</span>
                    <span class="result-item-price">
                      {formatCurrency(item.unit_price)}/{item.unit}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {!isSearchingPriceBook && addSearchQuery.length >= 2 && addSearchResults.length === 0 && (
              <div class="add-search-empty">No items found</div>
            )}

            <button class="add-custom-item-btn" onClick={handleAddCustomItem}>
              <Plus size={14} />
              Add custom item
            </button>
          </div>
        ) : (
          <button class="add-item-btn" onClick={handleAddItem}>
            <Plus size={16} />
            {t('review.addLineItem')}
          </button>
        )}
      </div>
    </>
  );
}

const componentStyles = `
  .line-items-section {
    padding: 16px;
    background: linear-gradient(135deg, rgba(0, 102, 255, 0.06), rgba(59, 130, 246, 0.04));
    border-radius: var(--radius-card);
  }

  .line-items-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .line-items-header .items-label {
    margin-bottom: 0;
  }

  .items-label {
    font-size: 13px;
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
    gap: 8px;
    margin-bottom: 12px;
  }

  .line-item-card {
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .line-item-card:hover {
    border-color: var(--gray-300, #cbd5e1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .line-item-header {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 14px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s ease;
  }

  .line-item-header:hover {
    background: var(--gray-50, #f8fafc);
  }

  .line-item-header:active {
    background: var(--gray-100, #f1f5f9);
    transform: scale(0.99);
  }

  .line-item-num {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--gray-100);
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--gray-500);
    flex-shrink: 0;
  }

  .line-item-summary {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .line-item-desc {
    font-size: 14px;
    font-weight: 500;
    color: var(--gray-900);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .line-item-meta {
    font-size: 12px;
    color: var(--gray-500);
  }

  .line-item-total {
    font-size: 14px;
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
    gap: 6px;
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
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .line-item-card.has-suggestion {
    border-color: #93c5fd;
    background: #f0f9ff;
  }

  .pricing-suggestion {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border-top: 1px solid #bfdbfe;
    gap: 12px;
  }

  .suggestion-content {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #1e40af;
  }

  .suggestion-content strong {
    color: #1d4ed8;
  }

  .suggestion-content .confidence {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    margin-left: 4px;
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
    gap: 6px;
  }

  .suggestion-actions .apply-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
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
    transition: all 0.15s ease;
  }

  .suggestion-actions .dismiss-btn:hover {
    background: var(--gray-100);
    color: var(--gray-600);
  }

  .material-info {
    padding-top: 8px;
    border-top: 1px dashed #e2e8f0;
  }

  .material-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 6px;
    font-size: 12px;
    color: #0369a1;
  }

  .material-tag .measurement-type {
    color: var(--gray-500);
  }

  .line-item-edit {
    padding: 4px 0 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .line-item-edit .edit-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .line-item-edit .edit-field.full {
    width: 100%;
  }

  .line-item-edit .edit-field label {
    font-size: 11px;
    font-weight: 500;
    color: var(--gray-500);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .line-item-edit .edit-field input {
    padding: 10px 12px;
    border: 1px solid var(--gray-200);
    border-radius: 8px;
    font-size: 14px;
    color: var(--gray-900);
    background: var(--white);
    transition: all 0.2s ease;
  }

  .line-item-edit .edit-field input:focus {
    outline: none;
    border-color: var(--blu-primary, #0066ff);
    box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.08);
    background: var(--white);
  }

  .line-item-edit .edit-row {
    display: flex;
    gap: 10px;
  }

  .line-item-edit .edit-row .edit-field {
    flex: 1;
  }

  .dimensions-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    margin-top: 4px;
    border-top: 1px dashed #e2e8f0;
  }

  .dimensions-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--gray-500);
    white-space: nowrap;
  }

  .dimensions-inputs {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }

  .dimension-input {
    width: 60px;
    padding: 6px 8px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 13px;
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
    font-size: 12px;
    color: #6b7280;
    margin-left: 4px;
  }

  .dimension-result {
    font-size: 12px;
    color: var(--data-green);
    font-weight: 500;
    margin-left: 8px;
    padding: 4px 8px;
    background: #ecfdf5;
    border-radius: 4px;
  }

  .measurement-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding-bottom: 4px;
  }

  .measurement-chip {
    padding: 8px 14px;
    border: 1px solid var(--gray-200);
    border-radius: 20px;
    background: var(--gray-100);
    color: var(--gray-600);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .measurement-chip:hover {
    border-color: var(--gray-300);
    background: var(--gray-200);
  }

  .measurement-chip.active {
    background: var(--blu-primary, #0066ff);
    color: var(--white);
    border-color: var(--blu-primary, #0066ff);
  }

  .measurement-chip.active:hover {
    background: #0052cc;
    border-color: #0052cc;
  }

  .line-item-edit .edit-actions {
    display: flex;
    justify-content: flex-end;
    padding-top: 8px;
    border-top: 1px solid var(--gray-200);
  }

  .delete-item-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    background: transparent;
    border: 1px solid #fecaca;
    border-radius: 10px;
    color: #dc2626;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .delete-item-btn:hover {
    background: rgba(220, 38, 38, 0.08);
    border-color: #f87171;
  }

  .delete-item-btn:active {
    transform: scale(0.97);
    background: rgba(220, 38, 38, 0.12);
  }

  .tax-summary {
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: 12px;
    padding: 12px 14px;
    margin-bottom: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .tax-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .tax-label {
    font-size: 13px;
    color: var(--gray-500);
    font-weight: 500;
  }

  .tax-value {
    font-size: 13px;
    color: var(--gray-700);
    font-weight: 500;
    text-align: right;
  }

  .tax-value.total {
    font-size: 15px;
    font-weight: 700;
    color: var(--data-green);
  }

  .tax-rate-row {
    gap: 8px;
  }

  .tax-rate-input-wrapper {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
    margin-right: 12px;
  }

  .tax-rate-input {
    width: 64px;
    padding: 10px 8px;
    border: 1px solid var(--gray-200);
    border-radius: 8px;
    font-size: 14px;
    text-align: center;
    color: var(--gray-900);
    background: var(--gray-50);
    transition: all 0.2s ease;
  }

  .tax-rate-input:focus {
    outline: none;
    border-color: var(--blu-primary, #0066ff);
    box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.08);
    background: var(--white);
  }

  .tax-percent {
    font-size: 12px;
    color: var(--gray-400);
    font-weight: 500;
  }

  .tax-total-row {
    padding-top: 8px;
    border-top: 1px solid var(--gray-200);
  }

  .add-item-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 14px;
    background: rgba(0, 102, 255, 0.04);
    border: 1.5px dashed rgba(0, 102, 255, 0.25);
    border-radius: 12px;
    color: var(--blu-primary, #0066ff);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .add-item-btn:hover {
    background: rgba(0, 102, 255, 0.08);
    border-color: var(--blu-primary, #0066ff);
  }

  .add-item-btn:active {
    transform: scale(0.98);
    background: rgba(0, 102, 255, 0.12);
  }

  .tax-chips-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tax-chip {
    padding: 6px 12px;
    border: 1px solid var(--gray-200);
    border-radius: 20px;
    background: var(--gray-100);
    color: var(--gray-600);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .tax-chip:hover {
    border-color: var(--gray-300);
    background: var(--gray-200);
  }

  .tax-chip.active {
    background: var(--blu-primary, #0066ff);
    color: var(--white);
    border-color: var(--blu-primary, #0066ff);
  }

  .tax-chip.active:hover {
    background: #0052cc;
    border-color: #0052cc;
  }

  .tax-chip-rate {
    font-size: 11px;
    opacity: 0.8;
  }

  .tax-custom-input-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .add-item-search {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: var(--white);
    border: 1px solid var(--blu-primary, #0066ff);
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.08);
  }

  .add-search-input-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .add-search-icon {
    color: var(--gray-400);
    flex-shrink: 0;
  }

  .add-search-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 14px;
    color: var(--gray-900);
    background: transparent;
    font-family: inherit;
  }

  .add-search-input::placeholder {
    color: var(--gray-400);
  }

  .add-search-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: var(--gray-100);
    border: none;
    border-radius: 6px;
    color: var(--gray-500);
    cursor: pointer;
    flex-shrink: 0;
  }

  .add-search-close:hover {
    background: var(--gray-200);
  }

  .add-search-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    color: var(--gray-500);
    font-size: 13px;
  }

  .add-search-results {
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--gray-100);
    max-height: 200px;
    overflow-y: auto;
  }

  .add-search-result-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 8px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--gray-100);
    cursor: pointer;
    text-align: left;
    transition: background 0.15s ease;
  }

  .add-search-result-item:hover {
    background: var(--gray-50);
  }

  .add-search-result-item:last-child {
    border-bottom: none;
  }

  .result-item-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--gray-900);
  }

  .result-item-price {
    font-size: 13px;
    color: var(--data-green);
    font-weight: 500;
    white-space: nowrap;
  }

  .add-search-empty {
    padding: 12px;
    text-align: center;
    color: var(--gray-400);
    font-size: 13px;
  }

  .add-custom-item-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px;
    background: transparent;
    border: 1px dashed var(--gray-300);
    border-radius: 8px;
    color: var(--gray-500);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .add-custom-item-btn:hover {
    background: var(--gray-50);
    border-color: var(--gray-400);
    color: var(--gray-700);
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

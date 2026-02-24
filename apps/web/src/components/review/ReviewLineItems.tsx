import { useState, useRef } from 'preact/hooks';
import { cn } from '@/lib/utils';
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
    const fieldClass = 'flex flex-col gap-1.5';
    const labelClass = 'text-[11px] font-medium text-[var(--gray-500)] uppercase tracking-wide';
    const inputClass = 'px-3 py-2.5 border border-[var(--gray-200)] rounded-lg text-sm text-[var(--gray-900)] bg-[var(--white)] transition-all duration-200 focus:outline-none focus:border-[var(--blu-primary,#0066ff)] focus:shadow-[0_0_0_3px_rgba(0,102,255,0.08)] focus:bg-[var(--white)]';

    if (type === 'service' || type === 'job') {
      return (
        <div class="flex gap-2.5">
          <div class={cn(fieldClass, 'flex-1')}>
            <label for={`item-total-${item.id}`} class={labelClass}>{t('review.total')}</label>
            <input id={`item-total-${item.id}`} type="number" value={item.total} onInput={(e) => handleFieldChange(item, 'total', parseFloat((e.target as HTMLInputElement).value) || 0)} min="0" step="0.01" class={inputClass} />
          </div>
        </div>
      );
    }

    if (type === 'sqft') {
      return (
        <>
          <div class="flex items-center gap-3 py-2.5 mt-1 border-t border-dashed border-slate-200">
            <span class="text-xs font-medium text-[var(--gray-500)] whitespace-nowrap">{t('review.dimensions')}</span>
            <div class="flex items-center gap-2 flex-1">
              <input type="number" class="w-[60px] px-2 py-1.5 border border-gray-300 rounded-md text-[13px] text-center focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.1)]" value={item.dimensions?.width ?? ''} onInput={(e) => handleDimensionWidthInput(item, (e.target as HTMLInputElement).value)} placeholder="W" min="0" step="0.1" />
              <span class="text-gray-400 font-medium">{'\u00d7'}</span>
              <input type="number" class="w-[60px] px-2 py-1.5 border border-gray-300 rounded-md text-[13px] text-center focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.1)]" value={item.dimensions?.length ?? ''} onInput={(e) => handleDimensionLengthInput(item, (e.target as HTMLInputElement).value)} placeholder="L" min="0" step="0.1" />
              <span class="text-xs text-gray-500 ml-1">ft</span>
              {item.dimensions?.width && item.dimensions?.length && (
                <span class="text-xs text-[var(--data-green)] font-medium ml-2 px-2 py-1 bg-emerald-50 rounded">
                  = {item.dimensions.width * item.dimensions.length} sqft
                </span>
              )}
            </div>
          </div>
          <div class="flex gap-2.5">
            <div class={cn(fieldClass, 'flex-1')}>
              <label for={`item-rate-${item.id}`} class={labelClass}>{t('review.rate')} /sqft</label>
              <input id={`item-rate-${item.id}`} type="number" value={item.rate} onInput={(e) => handleFieldChangeWithTotal(item, 'rate', parseFloat((e.target as HTMLInputElement).value) || 0)} min="0" step="0.01" class={inputClass} />
            </div>
            <div class={cn(fieldClass, 'flex-1')}>
              <label for={`item-total-${item.id}`} class={labelClass}>{t('review.total')}</label>
              <input id={`item-total-${item.id}`} type="number" value={item.total} onInput={(e) => handleFieldChange(item, 'total', parseFloat((e.target as HTMLInputElement).value) || 0)} min="0" step="0.01" class={inputClass} />
            </div>
          </div>
        </>
      );
    }

    const rateLabel = type === 'linear_ft' ? '/ft' : type === 'unit' ? '/unit' : type === 'hour' ? '/hr' : '';
    const qtyLabel = type === 'linear_ft' ? 'Length (ft)' : type === 'unit' ? 'Count' : type === 'hour' ? 'Hours' : '';
    const qtyStep = type === 'hour' ? '0.5' : type === 'unit' ? '1' : '0.1';

    if (type === 'linear_ft' || type === 'unit' || type === 'hour') {
      return (
        <div class="flex gap-2.5">
          <div class={cn(fieldClass, 'flex-1')}>
            <label for={`item-qty-${item.id}`} class={labelClass}>{qtyLabel}</label>
            <input id={`item-qty-${item.id}`} type="number" value={item.quantity} onInput={(e) => handleFieldChangeWithTotal(item, 'quantity', parseFloat((e.target as HTMLInputElement).value) || 0)} min="0" step={qtyStep} class={inputClass} />
          </div>
          <div class={cn(fieldClass, 'flex-1')}>
            <label for={`item-rate-${item.id}`} class={labelClass}>{t('review.rate')} {rateLabel}</label>
            <input id={`item-rate-${item.id}`} type="number" value={item.rate} onInput={(e) => handleFieldChangeWithTotal(item, 'rate', parseFloat((e.target as HTMLInputElement).value) || 0)} min="0" step="0.01" class={inputClass} />
          </div>
          <div class={cn(fieldClass, 'flex-1')}>
            <label for={`item-total-${item.id}`} class={labelClass}>{t('review.total')}</label>
            <input id={`item-total-${item.id}`} type="number" value={item.total} onInput={(e) => handleFieldChange(item, 'total', parseFloat((e.target as HTMLInputElement).value) || 0)} min="0" step="0.01" class={inputClass} />
          </div>
        </div>
      );
    }

    return (
      <div class="flex gap-2.5">
        <div class={cn(fieldClass, 'flex-1')}>
          <label for={`item-rate-${item.id}`} class={labelClass}>{t('review.rate')}</label>
          <input id={`item-rate-${item.id}`} type="number" value={item.rate} onInput={(e) => handleFieldChangeWithTotal(item, 'rate', parseFloat((e.target as HTMLInputElement).value) || 0)} min="0" step="0.01" class={inputClass} />
        </div>
        <div class={cn(fieldClass, 'flex-1')}>
          <label for={`item-total-${item.id}`} class={labelClass}>{t('review.total')}</label>
          <input id={`item-total-${item.id}`} type="number" value={item.total} onInput={(e) => handleFieldChange(item, 'total', parseFloat((e.target as HTMLInputElement).value) || 0)} min="0" step="0.01" class={inputClass} />
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
      <style>{`@keyframes rliPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } } .rli-pulse { animation: rliPulse 2s ease-in-out infinite; } @keyframes rliSpin { to { transform: rotate(360deg); } } .rli-spinning { animation: rliSpin 1s linear infinite; }`}</style>
      <div class="p-4 bg-gradient-to-br from-[rgba(0,102,255,0.06)] to-blue-500/[0.04] rounded-[var(--radius-card)]">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-[13px] font-semibold text-[var(--gray-600)]">{itemCountLabel}</span>
          {items.length === 0 && (
            <div class="flex items-center justify-center w-7 h-7 bg-amber-500/[0.12] rounded-lg text-[var(--data-amber)] shrink-0 ml-auto" title="At least one line item is required">
              <AlertTriangle size={16} />
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div class="flex flex-col gap-2 mb-3">
            {items.map((item, index) => {
              const hasSuggestion = item.hasPricingSuggestion && item.suggestedPrice;

              return (
                <div
                  key={item.id}
                  class={cn(
                    'bg-[var(--white)] border border-[var(--gray-200)] rounded-xl overflow-hidden transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-[var(--gray-300,#cbd5e1)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
                    hasSuggestion && 'border-blue-300 bg-sky-50'
                  )}
                >
                  <button
                    class="flex items-center gap-3 w-full px-3.5 py-3 bg-transparent border-none cursor-pointer text-left transition-[background] duration-200 hover:bg-[var(--gray-50,#f8fafc)] active:bg-[var(--gray-100,#f1f5f9)] active:scale-[0.99]"
                    onClick={() => setEditingItemId(item.id)}
                  >
                    <span class="w-6 h-6 flex items-center justify-center bg-[var(--gray-100)] rounded-md text-xs font-semibold text-[var(--gray-500)] shrink-0">
                      {index + 1}
                    </span>
                    <div class="flex-1 min-w-0 flex flex-col gap-0.5">
                      <span class="text-sm font-medium text-[var(--gray-900)] overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.description || 'Untitled item'}
                      </span>
                      <span class="text-xs text-[var(--gray-500)]">{formatCollapsedMeta(item)}</span>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <span
                        class={cn(
                          'text-sm font-semibold text-[var(--data-green)] shrink-0',
                          (!item.total || item.total === 0) && 'text-[var(--data-amber)]'
                        )}
                      >
                        {formatCurrency(item.total)}
                      </span>
                      {hasSuggestion && (
                        <span class="flex items-center justify-center w-[18px] h-[18px] bg-blue-100 rounded text-blue-600 rli-pulse" title="Suggested price based on history">
                          <Database size={12} />
                        </span>
                      )}
                    </div>
                  </button>

                  {hasSuggestion && (
                    <div class="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-br from-blue-50 to-blue-100 border-t border-blue-200 gap-3">
                      <div class="flex items-center gap-2 text-[13px] text-blue-800">
                        <Database size={14} />
                        <span>
                          {t('review.suggestedPrice')}:{' '}
                          <strong class="text-blue-700">{formatCurrency(item.suggestedPrice!)}</strong>
                          {item.pricingConfidence && item.pricingConfidence >= 0.8 ? (
                            <span class="text-[11px] px-1.5 py-0.5 rounded ml-1 bg-green-100 text-green-800">{t('review.highConfidence')}</span>
                          ) : item.pricingConfidence && item.pricingConfidence >= 0.6 ? (
                            <span class="text-[11px] px-1.5 py-0.5 rounded ml-1 bg-amber-100 text-amber-800">{t('review.mediumConfidence')}</span>
                          ) : (
                            <span class="text-[11px] px-1.5 py-0.5 rounded ml-1 bg-red-100 text-red-900">{t('review.lowConfidence')}</span>
                          )}
                        </span>
                      </div>
                      <div class="flex gap-1.5">
                        <button
                          class="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white border-none rounded-md text-xs font-medium cursor-pointer transition-all duration-150 hover:bg-blue-700"
                          onClick={() => onApplySuggestedPrice(item.id)}
                        >
                          <Check size={14} />
                          Apply
                        </button>
                        <button
                          class="flex items-center justify-center w-7 h-7 bg-transparent text-[var(--gray-500)] border border-slate-300 rounded-md cursor-pointer transition-all duration-150 hover:bg-[var(--gray-100)] hover:text-[var(--gray-600)]"
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
              <div class="flex flex-col gap-3.5 pt-1">
                <div class="flex flex-wrap gap-1.5 pb-1">
                  {MEASUREMENT_CHIPS.map((chip) => (
                    <button
                      key={chip.type}
                      class={cn(
                        'px-3.5 py-2 border border-[var(--gray-200)] rounded-full bg-[var(--gray-100)] text-[var(--gray-600)] text-[13px] font-medium cursor-pointer transition-all duration-150 whitespace-nowrap hover:border-[var(--gray-300)] hover:bg-[var(--gray-200)]',
                        editItem.measurementType === chip.type && 'bg-[var(--blu-primary,#0066ff)] text-[var(--white)] border-[var(--blu-primary,#0066ff)] hover:bg-[#0052cc] hover:border-[#0052cc]'
                      )}
                      onClick={() => setMeasurementType(editItem, chip.type)}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <div class="flex flex-col gap-1.5 w-full">
                  <label for={`item-desc-${editItem.id}`} class="text-[11px] font-medium text-[var(--gray-500)] uppercase tracking-wide">
                    {t('review.description')}
                  </label>
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
                    class="px-3 py-2.5 border border-[var(--gray-200)] rounded-lg text-sm text-[var(--gray-900)] bg-[var(--white)] transition-all duration-200 focus:outline-none focus:border-[var(--blu-primary,#0066ff)] focus:shadow-[0_0_0_3px_rgba(0,102,255,0.08)] focus:bg-[var(--white)]"
                  />
                </div>

                {renderMeasurementInputs(editItem)}

                {editItem.material && (
                  <div class="pt-2 border-t border-dashed border-slate-200">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 border border-sky-200 rounded-md text-xs text-sky-700">
                      <Database size={12} />
                      {editItem.material}
                      {editItem.measurementType && (
                        <span class="text-[var(--gray-500)]">({editItem.measurementType})</span>
                      )}
                    </span>
                  </div>
                )}

                <div class="flex justify-end pt-2 border-t border-[var(--gray-200)]">
                  <button
                    class="flex items-center gap-1.5 px-4 py-2.5 bg-transparent border border-red-200 rounded-[10px] text-red-600 text-[13px] font-medium cursor-pointer transition-all duration-150 hover:bg-red-500/[0.08] hover:border-red-400 active:scale-[0.97] active:bg-red-500/[0.12]"
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
          <div class="bg-[var(--white)] border border-[var(--gray-200)] rounded-xl px-3.5 py-3 mb-3 flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <span class="text-[13px] text-[var(--gray-500)] font-medium">{t('review.subtotal')}</span>
              <span class="text-[13px] text-[var(--gray-700)] font-medium text-right">{formatCurrency(calculatedSubtotal)}</span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-[13px] text-[var(--gray-500)] font-medium">{t('review.tax')}</span>
              <span class="text-[13px] text-[var(--gray-700)] font-medium text-right">{formatCurrency(calculatedTaxAmount)}</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              {TAX_PRESETS.map((preset) => {
                const isActive =
                  preset.rate === null
                    ? showCustomTaxInput || !isPresetTaxRate(taxRate)
                    : (taxRate ?? 0) === preset.rate && !showCustomTaxInput;
                return (
                  <button
                    key={preset.label}
                    class={cn(
                      'flex items-center gap-1 px-3 py-1.5 border border-[var(--gray-200)] rounded-full bg-[var(--gray-100)] text-[var(--gray-600)] text-xs font-medium cursor-pointer transition-all duration-150 hover:border-[var(--gray-300)] hover:bg-[var(--gray-200)]',
                      isActive && 'bg-[var(--blu-primary,#0066ff)] text-[var(--white)] border-[var(--blu-primary,#0066ff)] hover:bg-[#0052cc] hover:border-[#0052cc]'
                    )}
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
                    {preset.rate !== null && <span class="text-[11px] opacity-80">{preset.rate}%</span>}
                  </button>
                );
              })}
            </div>
            {showCustomTaxInput && (
              <div class="flex items-center gap-2">
                <div class="flex items-center gap-1 ml-auto mr-3">
                  <input
                    type="number"
                    class="w-16 px-2 py-2.5 border border-[var(--gray-200)] rounded-lg text-sm text-center text-[var(--gray-900)] bg-[var(--gray-50)] transition-all duration-200 focus:outline-none focus:border-[var(--blu-primary,#0066ff)] focus:shadow-[0_0_0_3px_rgba(0,102,255,0.08)] focus:bg-[var(--white)]"
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
                  <span class="text-xs text-[var(--gray-400)] font-medium">%</span>
                </div>
              </div>
            )}
            <div class="flex items-center justify-between pt-2 border-t border-[var(--gray-200)]">
              <span class="text-[13px] text-[var(--gray-500)] font-medium">{t('review.total')}</span>
              <span class="text-[15px] font-bold text-[var(--data-green)] text-right">{formatCurrency(calculatedTotal)}</span>
            </div>
          </div>
        )}

        {showAddSearch ? (
          <div class="flex flex-col gap-2 bg-[var(--white)] border border-[var(--blu-primary,#0066ff)] rounded-xl p-3 shadow-[0_0_0_3px_rgba(0,102,255,0.08)]">
            <div class="flex items-center gap-2">
              <Search size={14} class="text-[var(--gray-400)] shrink-0" />
              <input
                class="flex-1 border-none outline-none text-sm text-[var(--gray-900)] bg-transparent font-inherit placeholder:text-[var(--gray-400)]"
                type="text"
                value={addSearchQuery}
                onInput={(e) => handleAddSearchInput((e.target as HTMLInputElement).value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') dismissAddSearch();
                }}
                placeholder="Search price book..."
                autoFocus
              />
              <button
                class="flex items-center justify-center w-6 h-6 bg-[var(--gray-100)] border-none rounded-md text-[var(--gray-500)] cursor-pointer shrink-0 hover:bg-[var(--gray-200)]"
                onClick={dismissAddSearch}
              >
                <X size={14} />
              </button>
            </div>

            {isSearchingPriceBook && (
              <div class="flex items-center justify-center gap-2 p-3 text-[var(--gray-500)] text-[13px]">
                <Loader2 size={16} class="rli-spinning" />
                <span>Searching...</span>
              </div>
            )}

            {!isSearchingPriceBook && addSearchResults.length > 0 && (
              <div class="flex flex-col border-t border-[var(--gray-100)] max-h-[200px] overflow-y-auto">
                {addSearchResults.map((item) => (
                  <button
                    key={item.id}
                    class="flex items-center justify-between px-2 py-2.5 bg-transparent border-none border-b border-[var(--gray-100)] cursor-pointer text-left transition-[background] duration-150 hover:bg-[var(--gray-50)] last:border-b-0"
                    onClick={() => handleSelectPriceItem(item)}
                  >
                    <span class="text-sm font-medium text-[var(--gray-900)]">{item.name}</span>
                    <span class="text-[13px] text-[var(--data-green)] font-medium whitespace-nowrap">
                      {formatCurrency(item.unit_price)}/{item.unit}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {!isSearchingPriceBook && addSearchQuery.length >= 2 && addSearchResults.length === 0 && (
              <div class="p-3 text-center text-[var(--gray-400)] text-[13px]">No items found</div>
            )}

            <button
              class="flex items-center justify-center gap-1.5 p-2.5 bg-transparent border border-dashed border-[var(--gray-300)] rounded-lg text-[var(--gray-500)] text-[13px] font-medium cursor-pointer transition-all duration-150 hover:bg-[var(--gray-50)] hover:border-[var(--gray-400)] hover:text-[var(--gray-700)]"
              onClick={handleAddCustomItem}
            >
              <Plus size={14} />
              Add custom item
            </button>
          </div>
        ) : (
          <button
            class="flex items-center justify-center gap-2 w-full py-3.5 bg-[rgba(0,102,255,0.04)] border-[1.5px] border-dashed border-[rgba(0,102,255,0.25)] rounded-xl text-[var(--blu-primary,#0066ff)] text-sm font-medium cursor-pointer transition-all duration-150 hover:bg-[rgba(0,102,255,0.08)] hover:border-[var(--blu-primary,#0066ff)] active:scale-[0.98] active:bg-[rgba(0,102,255,0.12)]"
            onClick={handleAddItem}
          >
            <Plus size={16} />
            {t('review.addLineItem')}
          </button>
        )}
      </div>
    </>
  );
}

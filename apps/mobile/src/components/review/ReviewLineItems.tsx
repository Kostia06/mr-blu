import { useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Plus, ChevronDown, ChevronUp, Tag } from 'lucide-react-native';
import { LineItemEditor } from './LineItemEditor';
import type { LineItem, ItemSuggestion } from '@/lib/review/review-types';

interface ReviewLineItemsProps {
  items: LineItem[];
  onUpdateItems: (items: LineItem[]) => void;
  taxRate: number | null;
  onUpdateTaxRate: (rate: number) => void;
  itemSuggestions: ItemSuggestion[];
}

const TAX_PRESETS = [
  { label: 'None', rate: 0 },
  { label: 'GST 5%', rate: 5 },
  { label: 'HST 13%', rate: 13 },
  { label: 'PST 7%', rate: 7 },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function ReviewLineItems({
  items,
  onUpdateItems,
  taxRate,
  onUpdateTaxRate,
  itemSuggestions,
}: ReviewLineItemsProps) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [showTaxPicker, setShowTaxPicker] = useState(false);

  const toggleExpand = useCallback((id: string) => {
    setExpandedItemId((prev) => (prev === id ? null : id));
  }, []);

  const updateItem = useCallback(
    (id: string, updates: Partial<LineItem>) => {
      const updated = items.map((item) => {
        if (item.id !== id) return item;
        const merged = { ...item, ...updates };
        if (updates.rate !== undefined || updates.quantity !== undefined) {
          merged.total = (merged.quantity || 1) * (merged.rate || 0);
        }
        return merged;
      });
      onUpdateItems(updated);
    },
    [items, onUpdateItems]
  );

  const removeItem = useCallback(
    (id: string) => {
      onUpdateItems(items.filter((item) => item.id !== id));
      if (expandedItemId === id) setExpandedItemId(null);
    },
    [items, onUpdateItems, expandedItemId]
  );

  const addItem = useCallback(() => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      unit: 'unit',
      rate: 0,
      total: 0,
    };
    onUpdateItems([...items, newItem]);
    setExpandedItemId(newItem.id);
  }, [items, onUpdateItems]);

  const applySuggestion = useCallback(
    (itemId: string, suggestion: ItemSuggestion) => {
      updateItem(itemId, {
        rate: suggestion.rate,
        total: (items.find((i) => i.id === itemId)?.quantity || 1) * suggestion.rate,
      });
    },
    [updateItem, items]
  );

  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const currentTaxRate = taxRate || 0;
  const taxAmount = subtotal * (currentTaxRate / 100);
  const total = subtotal + taxAmount;

  return (
    <View>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-semibold text-gray-700">
          Line Items ({items.length})
        </Text>
        <Pressable onPress={addItem} className="flex-row items-center gap-1" hitSlop={8}>
          <Plus size={16} color="#0066FF" />
          <Text className="text-sm font-medium text-blu-primary">Add</Text>
        </Pressable>
      </View>

      {items.map((item) => {
        const isExpanded = expandedItemId === item.id;
        const suggestion = itemSuggestions.find(
          (s) => s.description.toLowerCase() === item.description?.toLowerCase()
        );
        const hasPricingSuggestion =
          item.hasPricingSuggestion ||
          (suggestion && suggestion.rate !== item.rate && suggestion.rate > 0);

        return (
          <View
            key={item.id}
            className="border border-gray-100 rounded-xl mb-2 overflow-hidden"
            style={{ backgroundColor: 'rgba(255,255,255,0.55)' }}
          >
            <Pressable
              onPress={() => toggleExpand(item.id)}
              className="flex-row items-center p-4"
            >
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                  {item.description || 'New Item'}
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  {item.quantity || 1} x {formatCurrency(item.rate || 0)} ={' '}
                  {formatCurrency(item.total || 0)}
                </Text>
              </View>
              {hasPricingSuggestion && <Tag size={14} color="#D97706" style={{ marginRight: 8 }} />}
              {isExpanded ? (
                <ChevronUp size={18} color="#9CA3AF" />
              ) : (
                <ChevronDown size={18} color="#9CA3AF" />
              )}
            </Pressable>

            {isExpanded && (
              <View className="px-4 pb-4 border-t border-gray-50">
                <LineItemEditor
                  item={item}
                  onUpdate={(updates) => updateItem(item.id, updates)}
                  onRemove={() => removeItem(item.id)}
                  suggestion={suggestion}
                  onApplySuggestion={(s) => applySuggestion(item.id, s)}
                />
              </View>
            )}
          </View>
        );
      })}

      <View className="mt-4 border border-gray-100 rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.55)' }}>
        <TotalRow label="Subtotal" value={subtotal} />

        <Pressable
          onPress={() => setShowTaxPicker(!showTaxPicker)}
          className="flex-row items-center justify-between py-2"
        >
          <Text className="text-sm text-gray-600">
            Tax {currentTaxRate > 0 ? `(${currentTaxRate}%)` : ''}
          </Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-sm text-gray-900">{formatCurrency(taxAmount)}</Text>
            <ChevronDown size={14} color="#9CA3AF" />
          </View>
        </Pressable>

        {showTaxPicker && (
          <View className="flex-row flex-wrap gap-2 py-2">
            {TAX_PRESETS.map((preset) => (
              <Pressable
                key={preset.label}
                onPress={() => {
                  onUpdateTaxRate(preset.rate);
                  setShowTaxPicker(false);
                }}
                className={`px-3 py-1.5 rounded-full border ${
                  currentTaxRate === preset.rate
                    ? 'bg-blu-primary border-blu-primary'
                    : 'bg-white border-gray-200'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    currentTaxRate === preset.rate ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {preset.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View className="border-t border-gray-100 mt-2 pt-2">
          <TotalRow label="Total" value={total} isBold />
        </View>
      </View>
    </View>
  );
}

function TotalRow({
  label,
  value,
  isBold,
}: {
  label: string;
  value: number;
  isBold?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className={`text-sm ${isBold ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
        {label}
      </Text>
      <Text className={`text-sm ${isBold ? 'font-bold text-gray-900' : 'text-gray-900'}`}>
        {formatCurrency(value)}
      </Text>
    </View>
  );
}


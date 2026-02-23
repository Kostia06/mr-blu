import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { Trash2, Tag } from 'lucide-react-native';
import type { LineItem, ItemSuggestion } from '@/lib/review/review-types';

type MeasurementType = 'sqft' | 'linear_ft' | 'unit' | 'hour' | 'job' | 'service';

const measurementLabels: Record<MeasurementType, string> = {
  service: 'Service',
  sqft: 'Area (sqft)',
  linear_ft: 'Linear (ft)',
  unit: 'Per Unit',
  hour: 'Per Hour',
  job: 'Flat Rate',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

interface LineItemEditorProps {
  item: LineItem;
  onUpdate: (updates: Partial<LineItem>) => void;
  onRemove: () => void;
  suggestion?: ItemSuggestion;
  onApplySuggestion: (s: ItemSuggestion) => void;
}

export function LineItemEditor({
  item,
  onUpdate,
  onRemove,
  suggestion,
  onApplySuggestion,
}: LineItemEditorProps) {
  const measurementType = (item.measurementType || 'service') as MeasurementType;
  const hasSuggestion = suggestion && suggestion.rate !== item.rate && suggestion.rate > 0;

  return (
    <View className="pt-3 gap-3">
      <View>
        <Text className="text-xs font-medium text-gray-500 mb-1">Description</Text>
        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
          value={item.description}
          onChangeText={(text) => onUpdate({ description: text })}
          placeholder="Item description"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View>
        <Text className="text-xs font-medium text-gray-500 mb-1">Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {(Object.keys(measurementLabels) as MeasurementType[]).map((type) => (
              <Pressable
                key={type}
                onPress={() => onUpdate({ measurementType: type })}
                className={`px-3 py-1.5 rounded-full border ${
                  measurementType === type
                    ? 'bg-blu-primary border-blu-primary'
                    : 'bg-white border-gray-200'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    measurementType === type ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {measurementLabels[type]}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {(measurementType === 'sqft' || measurementType === 'linear_ft') && (
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="text-xs font-medium text-gray-500 mb-1">Width</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
              value={String(item.dimensions?.width || '')}
              onChangeText={(text) => {
                const width = parseFloat(text) || 0;
                onUpdate({
                  dimensions: {
                    width,
                    length: item.dimensions?.length || 0,
                    unit: item.dimensions?.unit || 'ft',
                  },
                });
              }}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#94A3B8"
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-medium text-gray-500 mb-1">Length</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
              value={String(item.dimensions?.length || '')}
              onChangeText={(text) => {
                const length = parseFloat(text) || 0;
                onUpdate({
                  dimensions: {
                    width: item.dimensions?.width || 0,
                    length,
                    unit: item.dimensions?.unit || 'ft',
                  },
                });
              }}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>
      )}

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="text-xs font-medium text-gray-500 mb-1">Qty</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
            value={String(item.quantity || '')}
            onChangeText={(text) => onUpdate({ quantity: parseFloat(text) || 0 })}
            keyboardType="decimal-pad"
            placeholder="1"
            placeholderTextColor="#94A3B8"
          />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-medium text-gray-500 mb-1">Rate</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
            value={String(item.rate || '')}
            onChangeText={(text) => onUpdate({ rate: parseFloat(text) || 0 })}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#94A3B8"
          />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-medium text-gray-500 mb-1">Total</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
            value={String(item.total || '')}
            onChangeText={(text) => onUpdate({ total: parseFloat(text) || 0 })}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      {hasSuggestion && (
        <View className="flex-row items-center bg-amber-50 rounded-lg p-3">
          <Tag size={14} color="#D97706" />
          <Text className="text-xs text-amber-800 ml-2 flex-1">
            Price book: {formatCurrency(suggestion.rate)}/{suggestion.unit}
          </Text>
          <Pressable
            onPress={() => onApplySuggestion(suggestion)}
            className="px-2 py-1 rounded bg-amber-100"
          >
            <Text className="text-xs font-medium text-amber-800">Apply</Text>
          </Pressable>
        </View>
      )}

      <Pressable
        onPress={onRemove}
        className="flex-row items-center justify-center py-2"
        hitSlop={8}
      >
        <Trash2 size={14} color="#EF4444" />
        <Text className="text-xs text-red-500 ml-1">Remove Item</Text>
      </Pressable>
    </View>
  );
}

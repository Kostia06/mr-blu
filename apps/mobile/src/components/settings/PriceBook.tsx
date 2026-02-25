import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Trash2, Pencil, Check, X, BookOpen, DollarSign, Plus } from 'lucide-react-native';
import { useI18nStore } from '@/lib/i18n';
import { listPricing, deletePricing, updatePricing, addPricing } from '@/lib/api/pricing';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { GlassBackground } from '@/components/layout/GlassBackground';

interface PricingEntry {
  id: string;
  material: string;
  measurement_type: string;
  rate_per_unit: number;
  base_quantity: number;
  base_rate: number;
  usage_count: number;
  last_used_at: string;
}

const MEASUREMENT_LABELS: Record<string, string> = {
  sqft: 'sq ft',
  linear_ft: 'linear ft',
  hour: 'hour',
  job: 'job',
  unit: 'unit',
};

function formatRate(rate: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(rate);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function PriceBook() {
  const { t } = useI18nStore();
  const insets = useSafeAreaInsets();

  const [entries, setEntries] = useState<PricingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addUnit, setAddUnit] = useState('unit');
  const [addRate, setAddRate] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listPricing();
      if (result.items) setEntries(result.items);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const filtered = entries.filter(
    (e) =>
      e.material.toLowerCase().includes(search.toLowerCase()) ||
      e.measurement_type.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete', 'Remove this price entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(id);
          try {
            await deletePricing(id);
            setEntries((prev) => prev.filter((e) => e.id !== id));
          } catch {
            // silently fail
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  }, []);

  function startEdit(entry: PricingEntry) {
    setEditingId(entry.id);
    setEditRate(String(entry.rate_per_unit));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditRate('');
  }

  const handleAdd = useCallback(async () => {
    const rate = parseFloat(addRate);
    if (!addName.trim() || isNaN(rate) || rate <= 0) return;

    setAdding(true);
    try {
      const entry = await addPricing({
        name: addName.trim(),
        unit: addUnit,
        unitPrice: rate,
      });
      if (entry) {
        setEntries((prev) => [entry, ...prev]);
        setAddName('');
        setAddUnit('unit');
        setAddRate('');
        setShowAddForm(false);
      }
    } catch {
      // silently fail
    } finally {
      setAdding(false);
    }
  }, [addName, addUnit, addRate]);

  function cancelAdd() {
    setShowAddForm(false);
    setAddName('');
    setAddUnit('unit');
    setAddRate('');
  }

  async function saveEdit(id: string) {
    const rate = parseFloat(editRate);
    if (isNaN(rate) || rate <= 0) return;
    try {
      await updatePricing(id, { rate_per_unit: rate });
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, rate_per_unit: rate } : e))
      );
    } catch {
      // silently fail
    } finally {
      setEditingId(null);
      setEditRate('');
    }
  }

  const renderItem = useCallback(({ item }: { item: PricingEntry }) => {
    const isEditing = editingId === item.id;
    const measureLabel = MEASUREMENT_LABELS[item.measurement_type] || item.measurement_type;

    return (
      <View className="bg-white rounded-2xl p-4 shadow-sm mb-2.5">
        <View className="flex-row items-center justify-between mb-2.5">
          <View className="flex-row items-center gap-2 flex-1 mr-2">
            <DollarSign size={16} color="#0066FF" />
            <Text className="text-[15px] font-semibold text-gray-900 capitalize" numberOfLines={1}>
              {item.material}
            </Text>
            <View className="bg-blue-50 px-2 py-0.5 rounded-full">
              <Text className="text-[11px] font-medium text-blu-primary">{measureLabel}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-1">
            {isEditing ? (
              <>
                <Pressable onPress={() => saveEdit(item.id)} className="w-8 h-8 items-center justify-center" hitSlop={8}>
                  <Check size={16} color="#10B981" />
                </Pressable>
                <Pressable onPress={cancelEdit} className="w-8 h-8 items-center justify-center" hitSlop={8}>
                  <X size={16} color="#94A3B8" />
                </Pressable>
              </>
            ) : (
              <>
                <Pressable onPress={() => startEdit(item)} className="w-8 h-8 items-center justify-center" hitSlop={8}>
                  <Pencil size={14} color="#64748B" />
                </Pressable>
                <Pressable onPress={() => handleDelete(item.id)} className="w-8 h-8 items-center justify-center" hitSlop={8}>
                  {deletingId === item.id ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <Trash2 size={14} color="#EF4444" />
                  )}
                </Pressable>
              </>
            )}
          </View>
        </View>

        {isEditing ? (
          <View className="flex-row items-center gap-2.5 mb-2">
            <Text className="text-[13px] text-gray-500">Rate per {measureLabel}:</Text>
            <View className="flex-row items-center flex-1 bg-gray-50 border-2 border-blu-primary rounded-xl px-2.5 py-1.5">
              <Text className="text-[15px] font-semibold text-gray-500 mr-1">$</Text>
              <TextInput
                value={editRate}
                onChangeText={setEditRate}
                keyboardType="decimal-pad"
                className="flex-1 text-[15px] font-semibold text-gray-900"
                autoFocus
                onSubmitEditing={() => saveEdit(item.id)}
              />
            </View>
          </View>
        ) : (
          <View className="flex-row items-baseline gap-1 mb-2">
            <Text className="text-[22px] font-bold text-gray-900 tracking-tight">
              {formatRate(item.rate_per_unit)}
            </Text>
            <Text className="text-[13px] text-gray-500">/ {measureLabel}</Text>
          </View>
        )}

        <View className="flex-row items-center gap-2">
          <Text className="text-xs text-gray-400">Used {item.usage_count}x</Text>
          {item.last_used_at && (
            <>
              <View className="w-[3px] h-[3px] rounded-full bg-gray-300" />
              <Text className="text-xs text-gray-400">{formatDate(item.last_used_at)}</Text>
            </>
          )}
        </View>
      </View>
    );
  }, [editingId, editRate, deletingId, handleDelete]);

  const addButton = (
    <Pressable
      onPress={() => setShowAddForm(true)}
      className="w-10 h-10 rounded-button bg-white items-center justify-center shadow-sm"
    >
      <Plus size={20} color="#0066FF" strokeWidth={2.5} />
    </Pressable>
  );

  return (
    <GlassBackground>
      <ScreenHeader title={t('settings.priceBook') || 'Price Book'} showBack rightAction={addButton} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-5">
          <View className="flex-row items-center gap-2.5 bg-white rounded-button px-3.5 py-2.5 mb-4 shadow-sm">
            <Search size={16} color="#94A3B8" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('settings.priceBookSearch') || 'Search materials...'}
              placeholderTextColor="#94A3B8"
              className="flex-1 text-[15px] text-gray-900"
            />
          </View>

          {showAddForm && (
            <View className="bg-white rounded-2xl p-4 shadow-sm mb-3 border-2 border-blu-primary">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-bold text-blu-primary">
                  {t('settings.priceBookAdd') || 'Add Item'}
                </Text>
                <View className="flex-row gap-1">
                  <Pressable
                    onPress={handleAdd}
                    disabled={adding || !addName.trim() || !addRate}
                    className="w-8 h-8 items-center justify-center"
                    hitSlop={8}
                  >
                    {adding ? (
                      <ActivityIndicator size="small" color="#10B981" />
                    ) : (
                      <Check size={16} color="#10B981" />
                    )}
                  </Pressable>
                  <Pressable onPress={cancelAdd} className="w-8 h-8 items-center justify-center" hitSlop={8}>
                    <X size={16} color="#94A3B8" />
                  </Pressable>
                </View>
              </View>
              <TextInput
                value={addName}
                onChangeText={setAddName}
                placeholder={t('settings.priceBookName') || 'Material name'}
                placeholderTextColor="#94A3B8"
                className="bg-gray-50 border-2 border-blu-primary rounded-xl px-3 py-2.5 text-[15px] font-semibold text-gray-900 mb-2"
                autoFocus
                onSubmitEditing={handleAdd}
              />
              <View className="flex-row items-center gap-2 mb-2">
                <BookOpen size={14} color="#94A3B8" />
                <View className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <Pressable
                    onPress={() => {
                      const units = Object.keys(MEASUREMENT_LABELS);
                      const currentIdx = units.indexOf(addUnit);
                      const nextIdx = (currentIdx + 1) % units.length;
                      setAddUnit(units[nextIdx]);
                    }}
                  >
                    <Text className="text-[13px] text-gray-900">
                      {MEASUREMENT_LABELS[addUnit] || addUnit}
                    </Text>
                  </Pressable>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <DollarSign size={14} color="#94A3B8" />
                <TextInput
                  value={addRate}
                  onChangeText={setAddRate}
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-gray-900"
                  keyboardType="decimal-pad"
                  onSubmitEditing={handleAdd}
                />
              </View>
            </View>
          )}

          {loading ? (
            <View className="flex-1 items-center justify-center py-16">
              <ActivityIndicator size="large" color="#0066FF" />
            </View>
          ) : filtered.length === 0 ? (
            <View className="flex-1 items-center justify-center py-16">
              <BookOpen size={40} color="#CBD5E1" />
              <Text className="text-[15px] font-medium text-gray-500 mt-3">
                {search
                  ? t('settings.priceBookNoResults') || 'No matching materials'
                  : t('settings.priceBookEmpty') || 'No saved prices yet'}
              </Text>
              <Text className="text-[13px] text-gray-400 mt-1 text-center max-w-[280px]">
                {t('settings.priceBookHint') || 'Prices are saved automatically when you approve documents'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                <Text className="text-center text-xs text-gray-400 mt-4">
                  {filtered.length} {filtered.length === 1 ? 'material' : 'materials'}
                </Text>
              }
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </GlassBackground>
  );
}

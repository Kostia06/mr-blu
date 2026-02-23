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
import { router } from 'expo-router';
import {
  Search,
  Trash2,
  Wrench,
  Plus,
  ChevronRight,
  Check,
  X,
} from 'lucide-react-native';
import { useToastStore } from '@/stores/toastStore';
import { listServices, deleteService, createService } from '@/lib/api/services';
import type { Service } from '@/lib/api/services';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { GlassBackground } from '@/components/layout/GlassBackground';

function countMaterialOptions(items: Service['items']): number {
  return items.reduce((sum, item) => sum + item.materialOptions.length, 0);
}

export function ServiceBook() {
  const toast = useToastStore();
  const insets = useSafeAreaInsets();

  const [entries, setEntries] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listServices();
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

  const filtered = entries.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = useCallback((id: string, name: string) => {
    Alert.alert('Delete Service', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(id);
          try {
            await deleteService(id);
            setEntries((prev) => prev.filter((e) => e.id !== id));
          } catch {
            toast.error('Failed to delete service');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  }, [toast]);

  const handleCreate = useCallback(async () => {
    if (!createName.trim()) return;
    setCreating(true);
    try {
      const service = await createService({ name: createName.trim() });
      if (service) {
        setEntries((prev) => [service, ...prev]);
      }
      setCreateName('');
      setShowCreate(false);
    } catch {
      toast.error('Failed to create service');
    } finally {
      setCreating(false);
    }
  }, [createName, toast]);

  function cancelCreate() {
    setShowCreate(false);
    setCreateName('');
  }

  const addButton = (
    <Pressable
      onPress={() => setShowCreate(true)}
      className="w-10 h-10 rounded-button bg-white items-center justify-center shadow-sm"
    >
      <Plus size={20} color="#0066FF" strokeWidth={2.5} />
    </Pressable>
  );

  const renderItem = useCallback(({ item }: { item: Service }) => {
    const itemCount = item.items.length;
    const optionCount = countMaterialOptions(item.items);

    return (
      <Pressable
        onPress={() => router.push(`/(tabs)/settings/service-book/${item.id}` as any)}
        className="bg-white rounded-2xl p-4 shadow-sm mb-2.5 active:opacity-90"
      >
        <View className="flex-row items-center justify-between mb-2.5">
          <View className="flex-row items-center gap-2.5 flex-1 mr-2">
            <View className="w-9 h-9 rounded-full bg-blue-50 items-center justify-center">
              <Wrench size={16} color="#0066FF" />
            </View>
            <Text className="text-[15px] font-semibold text-gray-900" numberOfLines={1}>
              {item.name}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                handleDelete(item.id, item.name);
              }}
              className="w-8 h-8 items-center justify-center"
              hitSlop={8}
            >
              {deletingId === item.id ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Trash2 size={14} color="#EF4444" />
              )}
            </Pressable>
            <ChevronRight size={16} color="#CBD5E1" />
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="bg-blue-50 px-2 py-0.5 rounded-full">
            <Text className="text-[11px] font-medium text-blu-primary">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
          </View>
          {optionCount > 0 && (
            <View className="bg-emerald-50 px-2 py-0.5 rounded-full">
              <Text className="text-[11px] font-medium text-emerald-500">
                {optionCount} {optionCount === 1 ? 'option' : 'options'}
              </Text>
            </View>
          )}
        </View>

        {item.description && (
          <Text className="text-[13px] text-gray-400 mt-2" numberOfLines={1}>
            {item.description}
          </Text>
        )}
      </Pressable>
    );
  }, [deletingId, handleDelete]);

  return (
    <GlassBackground>
      <ScreenHeader title="Service Book" showBack rightAction={addButton} />
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
              placeholder="Search services..."
              placeholderTextColor="#94A3B8"
              className="flex-1 text-[15px] text-gray-900"
            />
          </View>

          {showCreate && (
            <View className="bg-white rounded-2xl p-4 shadow-sm mb-3 border-2 border-blu-primary">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-bold text-blu-primary">New Service</Text>
                <View className="flex-row gap-1">
                  <Pressable onPress={handleCreate} disabled={creating || !createName.trim()} className="w-8 h-8 items-center justify-center" hitSlop={8}>
                    {creating ? (
                      <ActivityIndicator size="small" color="#10B981" />
                    ) : (
                      <Check size={16} color="#10B981" />
                    )}
                  </Pressable>
                  <Pressable onPress={cancelCreate} className="w-8 h-8 items-center justify-center" hitSlop={8}>
                    <X size={16} color="#94A3B8" />
                  </Pressable>
                </View>
              </View>
              <TextInput
                value={createName}
                onChangeText={setCreateName}
                placeholder="Service name (e.g. Build Fence)"
                placeholderTextColor="#94A3B8"
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-gray-900"
                autoFocus
                onSubmitEditing={handleCreate}
              />
            </View>
          )}

          {loading ? (
            <View className="flex-1 items-center justify-center py-16">
              <ActivityIndicator size="large" color="#0066FF" />
            </View>
          ) : filtered.length === 0 ? (
            <View className="flex-1 items-center justify-center py-16">
              <Wrench size={40} color="#CBD5E1" />
              <Text className="text-[15px] font-medium text-gray-500 mt-3">
                {search ? 'No matching services' : 'No services yet'}
              </Text>
              <Text className="text-[13px] text-gray-400 mt-1 text-center max-w-[280px]">
                Create reusable job templates with line items and material options
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
                  {filtered.length} {filtered.length === 1 ? 'service' : 'services'}
                </Text>
              }
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </GlassBackground>
  );
}

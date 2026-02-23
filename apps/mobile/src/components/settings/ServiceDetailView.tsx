import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Check, Plus, Trash2, X } from 'lucide-react-native';
import { useToastStore } from '@/stores/toastStore';
import { getService, updateService, deleteService } from '@/lib/api/services';
import type { Service, ServiceItem, MaterialOption } from '@/lib/api/services';
import { FormInput } from '@/components/forms/FormInput';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { GlassBackground } from '@/components/layout/GlassBackground';
import { Button } from '@/components/ui/Button';

interface ServiceDetailViewProps {
  id: string;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function ServiceDetailView({ id }: ServiceDetailViewProps) {
  const toast = useToastStore();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<ServiceItem[]>([]);

  useEffect(() => {
    async function loadService() {
      try {
        const service = await getService(id);
        if (!service) {
          toast.error('Service not found');
          router.back();
          return;
        }
        setName(service.name);
        setDescription(service.description ?? '');
        setItems(service.items ?? []);
      } catch {
        toast.error('Failed to load service');
      } finally {
        setLoading(false);
      }
    }
    loadService();
  }, [id, toast]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateService(id, {
        name: name.trim(),
        description: description.trim() || undefined,
        items,
      });
      setSaved(true);
      toast.success('Service updated');
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error('Failed to update service');
    } finally {
      setSaving(false);
    }
  }, [id, name, description, items, toast]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteService(id);
              toast.success('Service deleted');
              router.back();
            } catch {
              toast.error('Failed to delete service');
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [id, name, toast]);

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: generateId(),
        description: '',
        unit: 'service',
        defaultRate: 0,
        materialOptions: [],
      },
    ]);
  }

  function updateItem(itemId: string, field: keyof ServiceItem, value: string | number) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  }

  function removeItem(itemId: string) {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }

  function addMaterialOption(itemId: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              materialOptions: [
                ...item.materialOptions,
                { name: '', rate: 0 },
              ],
            }
          : item
      )
    );
  }

  function updateMaterialOption(
    itemId: string,
    optionIndex: number,
    field: keyof MaterialOption,
    value: string | number
  ) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const options = [...item.materialOptions];
        options[optionIndex] = { ...options[optionIndex], [field]: value };
        return { ...item, materialOptions: options };
      })
    );
  }

  function removeMaterialOption(itemId: string, optionIndex: number) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const options = item.materialOptions.filter((_, i) => i !== optionIndex);
        return { ...item, materialOptions: options };
      })
    );
  }

  const saveButton = (
    <Pressable
      onPress={handleSave}
      disabled={saving || !name.trim()}
      className={`px-4 py-2 rounded-xl ${saved ? 'bg-emerald-500' : 'bg-blu-primary'} ${saving ? 'opacity-70' : ''}`}
    >
      {saving ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : saved ? (
        <Check size={16} color="#fff" strokeWidth={2.5} />
      ) : (
        <Text className="text-sm font-semibold text-white">Save</Text>
      )}
    </Pressable>
  );

  if (loading) {
    return (
      <GlassBackground>
        <ScreenHeader title="Service" showBack />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0066FF" />
        </View>
      </GlassBackground>
    );
  }

  return (
    <GlassBackground>
      <ScreenHeader title={name || 'Service'} showBack rightAction={saveButton} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-white rounded-card p-4 shadow-sm mb-6">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Service Info
            </Text>
            <FormInput
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Service name"
            />
            <FormInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Optional description..."
              multiline
              numberOfLines={2}
            />
          </View>

          <View className="bg-white rounded-card p-4 shadow-sm mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Line Items ({items.length})
              </Text>
              <Pressable onPress={addItem} className="flex-row items-center gap-1" hitSlop={8}>
                <Plus size={16} color="#0066FF" />
                <Text className="text-sm font-medium text-blu-primary">Add</Text>
              </Pressable>
            </View>

            {items.length === 0 && (
              <Text className="text-[13px] text-gray-400 text-center py-6">
                No line items yet. Tap "Add" to create one.
              </Text>
            )}

            {items.map((item, itemIndex) => (
              <View
                key={item.id}
                className={`py-4 ${itemIndex < items.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <View className="flex-row items-start justify-between mb-2">
                  <Text className="text-sm font-semibold text-gray-700">
                    Item {itemIndex + 1}
                  </Text>
                  <Pressable onPress={() => removeItem(item.id)} hitSlop={8}>
                    <Trash2 size={14} color="#EF4444" />
                  </Pressable>
                </View>

                <TextInput
                  value={item.description}
                  onChangeText={(val) => updateItem(item.id, 'description', val)}
                  placeholder="Description"
                  placeholderTextColor="#94A3B8"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 mb-2"
                />

                <View className="flex-row gap-2 mb-2">
                  <TextInput
                    value={item.unit}
                    onChangeText={(val) => updateItem(item.id, 'unit', val)}
                    placeholder="Unit"
                    placeholderTextColor="#94A3B8"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900"
                  />
                  <View className="flex-1 flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                    <Text className="text-sm text-gray-500 mr-1">$</Text>
                    <TextInput
                      value={item.defaultRate ? String(item.defaultRate) : ''}
                      onChangeText={(val) => updateItem(item.id, 'defaultRate', parseFloat(val) || 0)}
                      placeholder="Rate"
                      placeholderTextColor="#94A3B8"
                      keyboardType="decimal-pad"
                      className="flex-1 text-sm text-gray-900"
                    />
                  </View>
                </View>

                {item.materialOptions.length > 0 && (
                  <View className="ml-3 mt-1">
                    <Text className="text-xs font-medium text-gray-500 mb-1.5">
                      Material Options
                    </Text>
                    {item.materialOptions.map((opt, optIndex) => (
                      <View key={optIndex} className="flex-row items-center gap-2 mb-1.5">
                        <TextInput
                          value={opt.name}
                          onChangeText={(val) => updateMaterialOption(item.id, optIndex, 'name', val)}
                          placeholder="Material"
                          placeholderTextColor="#94A3B8"
                          className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 text-xs text-gray-900"
                        />
                        <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5">
                          <Text className="text-xs text-gray-500 mr-0.5">$</Text>
                          <TextInput
                            value={opt.rate ? String(opt.rate) : ''}
                            onChangeText={(val) => updateMaterialOption(item.id, optIndex, 'rate', parseFloat(val) || 0)}
                            placeholder="0"
                            placeholderTextColor="#94A3B8"
                            keyboardType="decimal-pad"
                            className="text-xs text-gray-900 w-14"
                          />
                        </View>
                        <Pressable onPress={() => removeMaterialOption(item.id, optIndex)} hitSlop={8}>
                          <X size={12} color="#94A3B8" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}

                <Pressable
                  onPress={() => addMaterialOption(item.id)}
                  className="flex-row items-center gap-1 mt-1.5 ml-3"
                  hitSlop={8}
                >
                  <Plus size={12} color="#94A3B8" />
                  <Text className="text-xs text-gray-400">Material option</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <View className="bg-white rounded-card p-4 shadow-sm mb-6">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Danger Zone
            </Text>
            <Button
              onPress={handleDelete}
              variant="danger"
              loading={deleting}
              fullWidth
              icon={!deleting ? <Trash2 size={16} color="#fff" /> : undefined}
            >
              Delete Service
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GlassBackground>
  );
}

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
  Users,
  Mail,
  Phone,
  Plus,
  ChevronRight,
  Check,
  X,
  Loader2,
} from 'lucide-react-native';
import { useI18nStore } from '@/lib/i18n';
import { useToastStore } from '@/stores/toastStore';
import { listClients, deleteClient, createClient } from '@/lib/api/clients';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { GlassBackground } from '@/components/layout/GlassBackground';

interface ClientEntry {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
}

export function ClientBook() {
  const { t } = useI18nStore();
  const toast = useToastStore();
  const insets = useSafeAreaInsets();

  const [entries, setEntries] = useState<ClientEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listClients();
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
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (e.phone?.includes(search) ?? false)
  );

  const handleDelete = useCallback((id: string, name: string) => {
    Alert.alert('Delete Client', `Remove "${name}" from your clients?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(id);
          try {
            await deleteClient(id);
            setEntries((prev) => prev.filter((e) => e.id !== id));
          } catch {
            toast.error('Failed to delete client');
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
      const client = await createClient({
        name: createName.trim(),
        email: createEmail.trim() || undefined,
        phone: createPhone.trim() || undefined,
      });
      if (client) {
        setEntries((prev) => [client, ...prev]);
      }
      setCreateName('');
      setCreateEmail('');
      setCreatePhone('');
      setShowCreate(false);
    } catch {
      toast.error('Failed to create client');
    } finally {
      setCreating(false);
    }
  }, [createName, createEmail, createPhone, toast]);

  function cancelCreate() {
    setShowCreate(false);
    setCreateName('');
    setCreateEmail('');
    setCreatePhone('');
  }

  const addButton = (
    <Pressable
      onPress={() => setShowCreate(true)}
      className="w-10 h-10 rounded-button bg-white items-center justify-center shadow-sm"
    >
      <Plus size={20} color="#0066FF" strokeWidth={2.5} />
    </Pressable>
  );

  const renderItem = useCallback(({ item }: { item: ClientEntry }) => (
    <Pressable
      onPress={() => router.push(`/(tabs)/settings/clients/${item.id}` as any)}
      className="bg-white rounded-2xl p-4 shadow-sm mb-2.5 active:opacity-90"
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2.5 flex-1 mr-2">
          <View className="w-9 h-9 rounded-full bg-blue-50 items-center justify-center">
            <Text className="text-[15px] font-bold text-blu-primary">
              {item.name.charAt(0).toUpperCase()}
            </Text>
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

      <View className="gap-1.5">
        {item.email && (
          <View className="flex-row items-center gap-2">
            <Mail size={14} color="#94A3B8" />
            <Text className="text-[13px] text-gray-500" numberOfLines={1}>{item.email}</Text>
          </View>
        )}
        {item.phone && (
          <View className="flex-row items-center gap-2">
            <Phone size={14} color="#94A3B8" />
            <Text className="text-[13px] text-gray-500">{item.phone}</Text>
          </View>
        )}
        {!item.email && !item.phone && (
          <Text className="text-[13px] text-gray-400 italic">
            {t('clients.noContactInfo')}
          </Text>
        )}
      </View>
    </Pressable>
  ), [deletingId, handleDelete, t]);

  return (
    <GlassBackground>
      <ScreenHeader title={t('clients.title')} showBack rightAction={addButton} />
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
              placeholder={t('clients.search')}
              placeholderTextColor="#94A3B8"
              className="flex-1 text-[15px] text-gray-900"
            />
          </View>

          {showCreate && (
            <View className="bg-white rounded-2xl p-4 shadow-sm mb-3 border-2 border-blu-primary">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-bold text-blu-primary">
                  {t('clients.newClient')}
                </Text>
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
                placeholder={t('clients.namePlaceholder')}
                placeholderTextColor="#94A3B8"
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-gray-900 mb-2"
                autoFocus
                onSubmitEditing={handleCreate}
              />
              <View className="flex-row items-center gap-2 mb-2">
                <Mail size={14} color="#94A3B8" />
                <TextInput
                  value={createEmail}
                  onChangeText={setCreateEmail}
                  placeholder="Email"
                  placeholderTextColor="#94A3B8"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-gray-900"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View className="flex-row items-center gap-2">
                <Phone size={14} color="#94A3B8" />
                <TextInput
                  value={createPhone}
                  onChangeText={setCreatePhone}
                  placeholder="Phone"
                  placeholderTextColor="#94A3B8"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-gray-900"
                  keyboardType="phone-pad"
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
              <Users size={40} color="#CBD5E1" />
              <Text className="text-[15px] font-medium text-gray-500 mt-3">
                {search ? t('clients.noMatch') : t('clients.empty')}
              </Text>
              <Text className="text-[13px] text-gray-400 mt-1 text-center max-w-[280px]">
                {t('clients.emptyHint')}
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
                  {filtered.length} {filtered.length === 1 ? 'client' : 'clients'}
                </Text>
              }
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </GlassBackground>
  );
}

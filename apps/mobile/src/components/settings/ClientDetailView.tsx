import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Check, Trash2 } from 'lucide-react-native';
import { useI18nStore } from '@/lib/i18n';
import { useToastStore } from '@/stores/toastStore';
import { listClients, updateClient, deleteClient, fetchClientDocuments } from '@/lib/api/clients';
import { FormInput } from '@/components/forms/FormInput';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { GlassBackground } from '@/components/layout/GlassBackground';
import { Button } from '@/components/ui/Button';

interface ClientDetailViewProps {
  id: string;
}

interface ClientDocument {
  id: string;
  document_type: string;
  document_number: string;
  total: number;
  status: string;
  created_at: string;
}

export function ClientDetailView({ id }: ClientDetailViewProps) {
  const { t } = useI18nStore();
  const toast = useToastStore();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [documents, setDocuments] = useState<ClientDocument[]>([]);

  useEffect(() => {
    async function loadClient() {
      try {
        const result = await listClients();
        const client = result.items.find((c) => c.id === id);
        if (!client) {
          toast.error('Client not found');
          router.back();
          return;
        }
        setName(client.name);
        setEmail(client.email ?? '');
        setPhone(client.phone ?? '');
        setAddress(client.address ?? '');
        setNotes(client.notes ?? '');

        const docs = await fetchClientDocuments(id);
        setDocuments(docs);
      } catch {
        toast.error('Failed to load client');
      } finally {
        setLoading(false);
      }
    }
    loadClient();
  }, [id, toast]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateClient(id, {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setSaved(true);
      toast.success('Client updated');
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error('Failed to update client');
    } finally {
      setSaving(false);
    }
  }, [id, name, email, phone, notes, toast]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Client',
      `Are you sure you want to delete "${name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteClient(id);
              toast.success('Client deleted');
              router.back();
            } catch {
              toast.error('Failed to delete client');
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [id, name, toast]);

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
        <Text className="text-sm font-semibold text-white">{t('common.save')}</Text>
      )}
    </Pressable>
  );

  if (loading) {
    return (
      <GlassBackground>
        <ScreenHeader title="Client" showBack />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0066FF" />
        </View>
      </GlassBackground>
    );
  }

  return (
    <GlassBackground>
      <ScreenHeader title={name || 'Client'} showBack rightAction={saveButton} />
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
              Contact Info
            </Text>
            <FormInput
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Client name"
            />
            <FormInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="client@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <FormInput
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="(555) 123-4567"
              keyboardType="phone-pad"
            />
            <FormInput
              label="Address"
              value={address}
              onChangeText={setAddress}
              placeholder="Street address"
            />
            <FormInput
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              multiline
              numberOfLines={3}
            />
          </View>

          {documents.length > 0 && (
            <View className="bg-white rounded-card p-4 shadow-sm mb-6">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Documents ({documents.length})
              </Text>
              {documents.slice(0, 5).map((doc) => (
                <View key={doc.id} className="flex-row items-center justify-between py-2.5 border-b border-gray-50">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900">
                      {doc.document_type === 'invoice' ? 'Invoice' : 'Estimate'} #{doc.document_number}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm font-semibold text-gray-900">
                      ${doc.total.toFixed(2)}
                    </Text>
                    <Text className={`text-xs capitalize ${doc.status === 'paid' ? 'text-emerald-500' : 'text-gray-400'}`}>
                      {doc.status}
                    </Text>
                  </View>
                </View>
              ))}
              {documents.length > 5 && (
                <Text className="text-xs text-gray-400 text-center mt-2">
                  +{documents.length - 5} more
                </Text>
              )}
            </View>
          )}

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
              Delete Client
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GlassBackground>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert, Platform, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { BlurView } from 'expo-blur';
import { Trash2, Send, Share2, Copy } from 'lucide-react-native';
import { fetchDocument, deleteDocument, shareDocument, sendDocument } from '@/lib/api/documents';
import { useI18nStore } from '@/lib/i18n';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { GlassBackground } from '@/components/layout/GlassBackground';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useToastStore } from '@/stores/toastStore';

interface DocumentDetailProps {
  documentId: string;
}

export function DocumentDetail({ documentId }: DocumentDetailProps) {
  const insets = useSafeAreaInsets();
  const { t } = useI18nStore();
  const toast = useToastStore();
  const queryClient = useQueryClient();
  const [doc, setDoc] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  async function loadDocument() {
    try {
      const data = await fetchDocument(documentId);
      setDoc(data);
    } catch (error) {
      console.error('Load document error:', error);
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    Alert.alert(
      t('documents.deleteConfirm'),
      t('documents.deleteConfirmDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocument(documentId, doc?.document_type || 'invoice');
              queryClient.invalidateQueries({ queryKey: ['documents'] });
              toast.success(t('documents.deleted'));
              router.back();
            } catch {
              toast.error(t('errors.generic'));
            }
          },
        },
      ]
    );
  }

  const handleSend = useCallback(async () => {
    if (!doc) return;
    const clientData = doc.clients as Record<string, any> | null;
    const email = clientData?.email;
    if (!email) {
      toast.error('No client email');
      return;
    }
    setSending(true);
    try {
      await sendDocument(
        documentId,
        doc.document_type || 'invoice',
        'email',
        { email },
      );
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document sent');
      loadDocument();
    } catch {
      toast.error('Failed to send');
    } finally {
      setSending(false);
    }
  }, [documentId, doc, queryClient, toast]);

  const handleShare = useCallback(async () => {
    if (!doc) return;
    setSharing(true);
    try {
      const result = await shareDocument(documentId, doc.document_type || 'invoice');
      const url = result?.shareUrl;
      if (url) {
        await Share.share({ url, message: `View ${doc.document_type}: ${url}` });
      }
    } catch {
      toast.error('Failed to share');
    } finally {
      setSharing(false);
    }
  }, [documentId, doc, toast]);

  if (loading) return <Spinner fullScreen />;
  if (!doc) return null;

  const lineItems = (doc.line_items as Array<Record<string, any>>) || [];
  const client = doc.clients as Record<string, any> | null;

  return (
    <GlassBackground>
      <ScreenHeader
        title={doc.document_number || 'Document'}
        showBack
      />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Status & Type */}
        <View className="flex-row items-center gap-2 mb-4">
          <Badge status={(doc.status || 'draft') as any} dot>
            {doc.status || 'draft'}
          </Badge>
          <Badge variant="info">{doc.document_type || 'invoice'}</Badge>
        </View>

        {/* Client */}
        {client && (
          <Card variant="glass" className="mb-4">
            <Text className="text-xs text-gray-500 mb-1">Client</Text>
            <Text className="text-base font-semibold text-gray-900">{client.name}</Text>
            {client.email && <Text className="text-sm text-gray-500">{client.email}</Text>}
            {client.phone && <Text className="text-sm text-gray-500">{client.phone}</Text>}
          </Card>
        )}

        {/* Line Items */}
        <Card variant="glass" className="mb-4">
          <Text className="text-xs text-gray-500 mb-3">Items</Text>
          {lineItems.map((item, i) => (
            <View key={i} className="flex-row justify-between py-2 border-b border-gray-50">
              <View className="flex-1">
                <Text className="text-sm text-gray-900">{item.description}</Text>
                <Text className="text-xs text-gray-500">
                  {item.quantity} × {formatCurrency(item.rate || 0)}
                </Text>
              </View>
              <Text className="text-sm font-medium text-gray-900">
                {formatCurrency(item.total || 0)}
              </Text>
            </View>
          ))}

          <View className="mt-3 pt-3 border-t border-gray-100">
            {doc.subtotal > 0 && (
              <View className="flex-row justify-between mb-1">
                <Text className="text-sm text-gray-500">Subtotal</Text>
                <Text className="text-sm text-gray-700">{formatCurrency(doc.subtotal)}</Text>
              </View>
            )}
            {doc.tax_amount > 0 && (
              <View className="flex-row justify-between mb-1">
                <Text className="text-sm text-gray-500">Tax ({doc.tax_rate}%)</Text>
                <Text className="text-sm text-gray-700">{formatCurrency(doc.tax_amount)}</Text>
              </View>
            )}
            <View className="flex-row justify-between">
              <Text className="text-base font-semibold text-gray-900">Total</Text>
              <Text className="text-base font-bold text-gray-900">
                {formatCurrency(doc.total || 0)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Dates */}
        <Card variant="glass" className="mb-4">
          <View className="flex-row justify-between">
            <View>
              <Text className="text-xs text-gray-500">Created</Text>
              <Text className="text-sm text-gray-900">{formatDate(doc.created_at)}</Text>
            </View>
            {doc.due_date && (
              <View>
                <Text className="text-xs text-gray-500">Due</Text>
                <Text className="text-sm text-gray-900">{formatDate(doc.due_date)}</Text>
              </View>
            )}
          </View>
        </Card>
      </ScrollView>

      {/* Bottom Action Bar */}
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={60}
          tint="light"
          className="flex-row items-center gap-2 px-5 pt-3 pb-2 border-t border-white/30"
          style={{ paddingBottom: Math.max(insets.bottom, 8) }}
        >
          <View className="flex-1">
            <Button onPress={handleSend} loading={sending} fullWidth icon={<Send size={16} color="#fff" />}>
              Send
            </Button>
          </View>
          <View className="flex-1">
            <Button onPress={handleShare} variant="secondary" loading={sharing} fullWidth icon={<Share2 size={16} color="#374151" />}>
              Share
            </Button>
          </View>
          <Button onPress={handleDelete} variant="ghost" size="sm">
            <Trash2 size={20} color="#EF4444" />
          </Button>
        </BlurView>
      ) : (
        <View
          className="flex-row items-center gap-2 px-5 pt-3 pb-2"
          style={{ paddingBottom: Math.max(insets.bottom, 8), backgroundColor: 'rgba(255,255,255,0.85)' }}
        >
          <View className="flex-1">
            <Button onPress={handleSend} loading={sending} fullWidth icon={<Send size={16} color="#fff" />}>
              Send
            </Button>
          </View>
          <View className="flex-1">
            <Button onPress={handleShare} variant="secondary" loading={sharing} fullWidth icon={<Share2 size={16} color="#374151" />}>
              Share
            </Button>
          </View>
          <Button onPress={handleDelete} variant="ghost" size="sm">
            <Trash2 size={20} color="#EF4444" />
          </Button>
        </View>
      )}
    </GlassBackground>
  );
}

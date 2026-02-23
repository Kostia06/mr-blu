import { useState, useCallback } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import {
  Send,
  Mail,
  Phone,
  MessageSquare,
  FileText,
  Pencil,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { SummaryCard } from './SummaryCard';
import { AlertCard } from './AlertCard';
import type { SendData, SourceDocument, LineItem } from '@/lib/review/review-types';

interface SendDocumentFlowProps {
  sendData: SendData | null;
  sendDocument: SourceDocument | null;
  isSending: boolean;
  sendError: string | null;
  sendSuccess: boolean;
  editableSendEmail: string;
  editableSendPhone: string;
  onEmailChange: (email: string) => void;
  onPhoneChange: (phone: string) => void;
  onExecuteSend: () => void;
  isEditingDocument: boolean;
  sendDocumentItems: LineItem[];
  sendDocumentSubtotal: number;
  sendDocumentTaxRate: number;
  sendDocumentTotal: number;
  onLoadForEditing: () => void;
  onSaveChanges: () => void;
  onCancelEditing: () => void;
  onUpdateSendItem: (item: LineItem) => void;
  onRemoveSendItem: (id: string) => void;
  onAddSendItem: () => void;
  isSavingDocument: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

const deliveryIcons: Record<string, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  whatsapp: Phone,
};

export function SendDocumentFlow({
  sendData,
  sendDocument,
  isSending,
  sendError,
  sendSuccess,
  editableSendEmail,
  editableSendPhone,
  onEmailChange,
  onPhoneChange,
  onExecuteSend,
  isEditingDocument,
  sendDocumentItems,
  sendDocumentSubtotal,
  sendDocumentTotal,
  onLoadForEditing,
  onSaveChanges,
  onCancelEditing,
  onUpdateSendItem,
  onRemoveSendItem,
  onAddSendItem,
  isSavingDocument,
}: SendDocumentFlowProps) {
  if (!sendData) return null;

  if (sendSuccess) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-16 h-16 rounded-full bg-emerald-100 items-center justify-center mb-4">
          <Check size={32} color="#059669" />
        </View>
        <Text className="text-xl font-bold text-gray-900 text-center mb-2">Sent!</Text>
        <Text className="text-sm text-gray-500 text-center">
          Document has been sent via {sendData.deliveryMethod}.
        </Text>
      </View>
    );
  }

  if (isSending && !sendDocument) {
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner />
        <Text className="text-sm text-gray-500 mt-3">Finding document...</Text>
      </View>
    );
  }

  const DeliveryIcon = deliveryIcons[sendData.deliveryMethod] || Mail;
  const isEmail = sendData.deliveryMethod === 'email';

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <SummaryCard summary={sendData.summary} label="Send" variant="send-mode" />

      {sendError && (
        <View className="mt-4">
          <AlertCard title="Error" message={sendError} variant="error" />
        </View>
      )}

      {sendDocument && (
        <View className="mt-4 gap-4">
          <Card>
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <FileText size={16} color="#374151" />
                <Text className="text-sm font-semibold text-gray-900">
                  {sendDocument.title || 'Document'}
                </Text>
              </View>
              <Badge variant="info">{sendDocument.type}</Badge>
            </View>
            <Text className="text-xs text-gray-500">{sendDocument.client}</Text>
            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-xs text-gray-400">
                {new Date(sendDocument.date).toLocaleDateString()}
              </Text>
              <Text className="text-base font-bold text-gray-900">
                {formatCurrency(sendDocument.amount)}
              </Text>
            </View>

            {!isEditingDocument && (
              <Pressable
                onPress={onLoadForEditing}
                className="flex-row items-center justify-center mt-3 pt-3 border-t border-gray-100"
              >
                <Pencil size={14} color="#0066FF" />
                <Text className="text-sm font-medium text-blu-primary ml-1">Edit Document</Text>
              </Pressable>
            )}
          </Card>

          {isEditingDocument && (
            <SendDocumentEditor
              items={sendDocumentItems}
              subtotal={sendDocumentSubtotal}
              total={sendDocumentTotal}
              onUpdateItem={onUpdateSendItem}
              onRemoveItem={onRemoveSendItem}
              onAddItem={onAddSendItem}
              onSave={onSaveChanges}
              onCancel={onCancelEditing}
              isSaving={isSavingDocument}
            />
          )}

          <Card>
            <View className="flex-row items-center gap-2 mb-3">
              <DeliveryIcon size={16} color="#374151" />
              <Text className="text-sm font-semibold text-gray-900">
                Send via {sendData.deliveryMethod}
              </Text>
            </View>

            {isEmail ? (
              <View>
                <Text className="text-xs font-medium text-gray-500 mb-1">Email</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900"
                  value={editableSendEmail}
                  onChangeText={onEmailChange}
                  placeholder="recipient@email.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            ) : (
              <View>
                <Text className="text-xs font-medium text-gray-500 mb-1">Phone</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900"
                  value={editableSendPhone}
                  onChangeText={onPhoneChange}
                  placeholder="Phone number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>
            )}
          </Card>

          <Button
            onPress={onExecuteSend}
            variant="primary"
            fullWidth
            loading={isSending}
            icon={<Send size={18} color="#fff" />}
          >
            {isSending ? 'Sending...' : `Send via ${sendData.deliveryMethod}`}
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

function SendDocumentEditor({
  items,
  subtotal,
  total,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
  onSave,
  onCancel,
  isSaving,
}: {
  items: LineItem[];
  subtotal: number;
  total: number;
  onUpdateItem: (item: LineItem) => void;
  onRemoveItem: (id: string) => void;
  onAddItem: () => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  return (
    <Card>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-semibold text-gray-900">Edit Items</Text>
        <Pressable onPress={onAddItem} className="flex-row items-center gap-1" hitSlop={8}>
          <Plus size={14} color="#0066FF" />
          <Text className="text-xs font-medium text-blu-primary">Add</Text>
        </Pressable>
      </View>

      {items.map((item) => (
        <View key={item.id} className="border-b border-gray-50 pb-3 mb-3">
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 mb-2"
            value={item.description}
            onChangeText={(text) => onUpdateItem({ ...item, description: text })}
            placeholder="Description"
            placeholderTextColor="#94A3B8"
          />
          <View className="flex-row gap-2 items-center">
            <TextInput
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
              value={String(item.quantity || '')}
              onChangeText={(text) => {
                const qty = parseFloat(text) || 0;
                onUpdateItem({ ...item, quantity: qty, total: qty * item.rate });
              }}
              keyboardType="decimal-pad"
              placeholder="Qty"
              placeholderTextColor="#94A3B8"
            />
            <TextInput
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
              value={String(item.rate || '')}
              onChangeText={(text) => {
                const rate = parseFloat(text) || 0;
                onUpdateItem({ ...item, rate, total: item.quantity * rate });
              }}
              keyboardType="decimal-pad"
              placeholder="Rate"
              placeholderTextColor="#94A3B8"
            />
            <Pressable onPress={() => onRemoveItem(item.id)} hitSlop={8}>
              <Trash2 size={16} color="#EF4444" />
            </Pressable>
          </View>
        </View>
      ))}

      <View className="flex-row items-center justify-between mb-3 pt-2 border-t border-gray-100">
        <Text className="text-sm font-bold text-gray-900">Total</Text>
        <Text className="text-sm font-bold text-gray-900">{formatCurrency(total)}</Text>
      </View>

      <View className="flex-row gap-2">
        <Button onPress={onSave} variant="primary" size="sm" loading={isSaving}>
          Save
        </Button>
        <Button onPress={onCancel} variant="ghost" size="sm">
          Cancel
        </Button>
      </View>
    </Card>
  );
}

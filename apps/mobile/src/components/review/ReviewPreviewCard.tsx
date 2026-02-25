import { useState, useCallback } from 'react';
import { View, Text, Pressable, TextInput, Modal } from 'react-native';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
  ChevronDown,
  X,
  Search,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { ParsedData, ClientSuggestionFull } from '@/lib/review/review-types';

interface ReviewPreviewCardProps {
  data: ParsedData;
  onUpdateData: (updates: Partial<ParsedData>) => void;
  clientSuggestions: ClientSuggestionFull[];
  isSearchingClients: boolean;
  onSearchClients: (query: string) => void;
  onSelectClient: (client: ClientSuggestionFull) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function ReviewPreviewCard({
  data,
  onUpdateData,
  clientSuggestions,
  isSearchingClients,
  onSearchClients,
  onSelectClient,
}: ReviewPreviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(data.client?.name || '');
  const [editEmail, setEditEmail] = useState(data.client?.email || '');
  const [editPhone, setEditPhone] = useState(data.client?.phone || '');
  const [editAddress, setEditAddress] = useState(data.client?.address || '');

  const openEditor = useCallback(() => {
    setEditName(data.client?.name || '');
    setEditEmail(data.client?.email || '');
    setEditPhone(data.client?.phone || '');
    setEditAddress(data.client?.address || '');
    setIsEditing(true);
  }, [data.client]);

  const saveEdits = useCallback(() => {
    onUpdateData({
      client: {
        ...data.client,
        name: editName,
        email: editEmail,
        phone: editPhone,
        address: editAddress,
      },
    });
    setIsEditing(false);
  }, [editName, editEmail, editPhone, editAddress, data.client, onUpdateData]);

  const docType = data.documentType || 'invoice';
  const total = data.total || 0;

  return (
    <>
      <Card variant="glass" onPress={openEditor}>
        <View className="flex-row items-center justify-between mb-3">
          <Badge variant={docType === 'estimate' ? 'warning' : 'info'}>
            {docType.charAt(0).toUpperCase() + docType.slice(1)}
          </Badge>
          {data.dueDate && (
            <View className="flex-row items-center gap-1">
              <Calendar size={14} color="#6B7280" />
              <Text className="text-xs text-gray-500">{data.dueDate}</Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center mb-2">
          <User size={16} color="#374151" />
          <Text className="text-base font-semibold text-gray-900 ml-2" numberOfLines={1}>
            {data.client?.name || 'No client'}
          </Text>
        </View>

        {data.client?.email && (
          <View className="flex-row items-center mb-1">
            <Mail size={14} color="#9CA3AF" />
            <Text className="text-sm text-gray-500 ml-2">{data.client.email}</Text>
          </View>
        )}

        {data.client?.phone && (
          <View className="flex-row items-center mb-1">
            <Phone size={14} color="#9CA3AF" />
            <Text className="text-sm text-gray-500 ml-2">{data.client.phone}</Text>
          </View>
        )}

        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <View className="flex-row items-center gap-1">
            <Hash size={14} color="#9CA3AF" />
            <Text className="text-sm text-gray-500">
              {(data as Record<string, unknown>).documentNumber as string || 'Auto'}
            </Text>
          </View>
          <Text className="text-lg font-bold text-gray-900">{formatCurrency(total)}</Text>
        </View>
      </Card>

      <Modal visible={isEditing} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
            <Pressable onPress={() => setIsEditing(false)} hitSlop={8}>
              <X size={24} color="#374151" />
            </Pressable>
            <Text className="text-lg font-semibold text-gray-900">Edit Client</Text>
            <Pressable onPress={saveEdits} hitSlop={8}>
              <Text className="text-base font-semibold text-blu-primary">Save</Text>
            </Pressable>
          </View>

          <View className="px-4 pt-4">
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Client Name</Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3">
                <Search size={16} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-2 text-base text-gray-900"
                  value={editName}
                  onChangeText={(text) => {
                    setEditName(text);
                    onSearchClients(text);
                  }}
                  placeholder="Client name"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              {isSearchingClients && <Spinner size="small" />}
              {clientSuggestions.length > 0 && (
                <View className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
                  {clientSuggestions.slice(0, 5).map((client) => (
                    <Pressable
                      key={client.id}
                      onPress={() => {
                        onSelectClient(client);
                        setEditName(client.name);
                        setEditEmail(client.email || '');
                        setEditPhone(client.phone || '');
                        setEditAddress(client.address || '');
                      }}
                      className="px-4 py-3 border-b border-gray-100 active:bg-gray-50"
                    >
                      <Text className="text-sm font-medium text-gray-900">{client.name}</Text>
                      {client.email && (
                        <Text className="text-xs text-gray-500 mt-0.5">{client.email}</Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <EditField
              label="Email"
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="client@email.com"
              keyboardType="email-address"
            />
            <EditField
              label="Phone"
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="Phone number"
              keyboardType="phone-pad"
            />
            <EditField
              label="Address"
              value={editAddress}
              onChangeText={setEditAddress}
              placeholder="Address"
              multiline
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

function EditField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  multiline?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1.5">{label}</Text>
      <TextInput
        className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

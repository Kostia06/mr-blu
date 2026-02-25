import { useState, useCallback } from 'react';
import { View, Text, Pressable, TextInput, Modal, ScrollView } from 'react-native';
import {
  FileText,
  Send,
  Check,
  AlertCircle,
  Loader,
  Pencil,
  X,
  ChevronDown,
} from 'lucide-react-native';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { ActionStep, ParsedData } from '@/lib/review/review-types';

interface ReviewActionsProps {
  actions: ActionStep[];
  data: ParsedData;
  onUpdateActions: (actions: ActionStep[]) => void;
  onUpdateData: (updates: Partial<ParsedData>) => void;
  hasProfile: boolean;
}

const actionIcons: Record<string, typeof FileText> = {
  create_document: FileText,
  send_email: Send,
};

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'default',
  in_progress: 'info',
  completed: 'success',
  failed: 'error',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'Running',
  completed: 'Done',
  failed: 'Failed',
};

function getActionLabel(action: ActionStep): string {
  if (action.type === 'create_document') return 'Create Document';
  if (action.type === 'send_email') return 'Send Email';
  return action.type;
}

function getActionDescription(action: ActionStep): string {
  if (action.type === 'send_email' && action.details?.recipient) {
    return `To: ${action.details.recipient}`;
  }
  return '';
}

export function ReviewActions({
  actions,
  data,
  onUpdateActions,
  onUpdateData,
  hasProfile,
}: ReviewActionsProps) {
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editRecipient, setEditRecipient] = useState('');

  const handleEditAction = useCallback((action: ActionStep) => {
    setEditingActionId(action.id);
    setEditRecipient(action.details?.recipient || data.client?.email || '');
  }, [data.client?.email]);

  const handleSaveAction = useCallback(() => {
    if (!editingActionId) return;
    const updated = actions.map((a) => {
      if (a.id === editingActionId && a.type === 'send_email') {
        return { ...a, details: { ...a.details, recipient: editRecipient } };
      }
      return a;
    });
    onUpdateActions(updated);
    setEditingActionId(null);
  }, [editingActionId, editRecipient, actions, onUpdateActions]);

  const handleRemoveAction = useCallback((actionId: string) => {
    onUpdateActions(actions.filter((a) => a.id !== actionId));
  }, [actions, onUpdateActions]);

  const handleToggleDocType = useCallback(() => {
    const newType = data.documentType === 'invoice' ? 'estimate' : 'invoice';
    onUpdateData({ documentType: newType });
  }, [data.documentType, onUpdateData]);

  return (
    <View className="gap-3">
      {!hasProfile && (
        <View className="flex-row items-center p-3 rounded-xl bg-amber-50 border border-amber-200">
          <AlertCircle size={16} color="#D97706" />
          <Text className="text-sm text-amber-800 ml-2 flex-1">
            Complete your profile for professional documents.
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-sm font-semibold text-gray-700">Actions</Text>
        <Pressable onPress={handleToggleDocType} className="flex-row items-center gap-1">
          <Text className="text-xs text-blu-primary font-medium">
            {data.documentType === 'invoice' ? 'Invoice' : 'Estimate'}
          </Text>
          <ChevronDown size={14} color="#0066FF" />
        </Pressable>
      </View>

      {actions.map((action, index) => {
        const IconComponent = actionIcons[action.type] || FileText;
        const description = getActionDescription(action);
        const isEditing = editingActionId === action.id;

        return (
          <View
            key={action.id}
            className="border border-gray-100 rounded-xl p-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.55)' }}
          >
            <View className="flex-row items-center">
              <View className="w-7 h-7 rounded-full bg-blue-50 items-center justify-center mr-3">
                <Text className="text-xs font-bold text-blu-primary">{index + 1}</Text>
              </View>
              <IconComponent size={18} color="#374151" />
              <Text className="text-sm font-medium text-gray-900 ml-2 flex-1">
                {getActionLabel(action)}
              </Text>
              <Badge variant={statusVariants[action.status] || 'default'}>
                {statusLabels[action.status] || action.status}
              </Badge>
            </View>

            {description && !isEditing && (
              <Text className="text-xs text-gray-500 mt-2 ml-12">{description}</Text>
            )}

            {action.error && (
              <Text className="text-xs text-red-500 mt-2 ml-12">{action.error}</Text>
            )}

            {!isEditing && action.type === 'send_email' && action.status === 'pending' && (
              <View className="flex-row gap-2 mt-3 ml-12">
                <Pressable onPress={() => handleEditAction(action)} className="p-1" hitSlop={4}>
                  <Pencil size={14} color="#6B7280" />
                </Pressable>
                <Pressable onPress={() => handleRemoveAction(action.id)} className="p-1" hitSlop={4}>
                  <X size={14} color="#EF4444" />
                </Pressable>
              </View>
            )}

            {isEditing && (
              <View className="mt-3 ml-12">
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                  value={editRecipient}
                  onChangeText={setEditRecipient}
                  placeholder="Recipient email"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <View className="flex-row gap-2 mt-2">
                  <Button onPress={handleSaveAction} size="sm" variant="primary">
                    Save
                  </Button>
                  <Button onPress={() => setEditingActionId(null)} size="sm" variant="ghost">
                    Cancel
                  </Button>
                </View>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

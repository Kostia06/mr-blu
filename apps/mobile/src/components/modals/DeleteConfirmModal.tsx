import { View, Text, Modal, Pressable, ActivityIndicator } from 'react-native';
import { Trash2, AlertTriangle, X } from 'lucide-react-native';
import { useI18nStore } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';

interface DeleteConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  loading?: boolean;
}

export function DeleteConfirmModal({
  visible,
  onClose,
  onConfirm,
  title,
  description,
  loading = false,
}: DeleteConfirmModalProps) {
  const { t } = useI18nStore();

  const displayTitle = title || t('delete.title');
  const displayDescription = description || t('delete.warning');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center px-6"
        onPress={loading ? undefined : onClose}
      >
        {/* Modal content - stop propagation */}
        <Pressable className="w-full max-w-sm" onPress={() => {}}>
          <View className="bg-white rounded-3xl px-6 pt-8 pb-6 items-center">
            {/* Close button */}
            <Pressable
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
              onPress={loading ? undefined : onClose}
              hitSlop={8}
            >
              <X size={18} color="#64748B" />
            </Pressable>

            {/* Warning icon */}
            <View className="w-[72px] h-[72px] rounded-full bg-red-50 items-center justify-center mb-4">
              <Trash2 size={32} color="#EF4444" />
            </View>

            {/* Title */}
            <Text className="text-[22px] font-bold text-gray-900 text-center mb-4">
              {displayTitle}
            </Text>

            {/* Warning box */}
            <View className="flex-row items-center gap-2 bg-amber-50 rounded-xl px-4 py-3 mb-5 w-full">
              <AlertTriangle size={16} color="#D97706" />
              <Text className="text-sm font-medium text-amber-700 flex-1">
                {displayDescription}
              </Text>
            </View>

            {/* Action buttons */}
            <View className="flex-row gap-3 w-full">
              <View className="flex-1">
                <Button
                  onPress={onClose}
                  variant="secondary"
                  size="lg"
                  fullWidth
                  disabled={loading}
                >
                  {t('common.cancel')}
                </Button>
              </View>
              <View className="flex-1">
                <Button
                  onPress={onConfirm}
                  variant="danger"
                  size="lg"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                >
                  {t('common.delete')}
                </Button>
              </View>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

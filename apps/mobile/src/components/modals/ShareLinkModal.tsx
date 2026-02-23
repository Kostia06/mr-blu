import { useState, useEffect, useCallback } from 'react';
import { View, Text, Modal, Pressable, ActivityIndicator } from 'react-native';
import { Link, Copy, Check, ExternalLink, HelpCircle, X } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useI18nStore } from '@/lib/i18n';
import { useToastStore } from '@/stores/toastStore';
import { Button } from '@/components/ui/Button';

interface ShareLinkModalProps {
  visible: boolean;
  onClose: () => void;
  shareUrl: string | null;
  documentType?: 'invoice' | 'estimate' | 'contract';
}

export function ShareLinkModal({
  visible,
  onClose,
  shareUrl,
  documentType = 'invoice',
}: ShareLinkModalProps) {
  const { t } = useI18nStore();
  const toast = useToastStore();
  const [isCopied, setIsCopied] = useState(false);

  const isLoading = !shareUrl;

  useEffect(() => {
    if (visible) setIsCopied(false);
  }, [visible]);

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await Clipboard.setStringAsync(shareUrl);
      setIsCopied(true);
      toast.success(t('common.copied'));
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      toast.error('Failed to copy link');
    }
  }, [shareUrl, t, toast]);

  const handleOpenInBrowser = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await Linking.openURL(shareUrl);
    } catch {
      toast.error('Failed to open link');
    }
  }, [shareUrl, toast]);

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
        onPress={onClose}
      >
        {/* Modal content */}
        <Pressable className="w-full max-w-sm" onPress={() => {}}>
          <View className="bg-white rounded-2xl p-6">
            {/* Close button */}
            <Pressable
              className="absolute top-4 right-4 p-1 z-10"
              onPress={onClose}
              hitSlop={8}
            >
              <X size={20} color="#64748B" />
            </Pressable>

            {/* Header */}
            <View className="flex-row items-center gap-3 mb-4">
              <Link size={24} color="#3B82F6" />
              <Text className="text-lg font-semibold text-gray-900">
                {t('review.shareLinkCreated')}
              </Text>
            </View>

            {/* Body */}
            {isLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color="#0066FF" />
                <Text className="text-sm text-gray-500 mt-3">Generating link...</Text>
              </View>
            ) : (
              <View className="gap-4">
                {/* Description */}
                <Text className="text-sm text-gray-500">
                  {t('review.anyoneCanView', { type: documentType })}
                </Text>

                {/* Link display */}
                <View className="bg-gray-50 rounded-lg border border-gray-200 px-3 py-3">
                  <Text className="text-[13px] text-gray-900 font-mono" numberOfLines={2}>
                    {shareUrl}
                  </Text>
                </View>

                {/* Actions */}
                <View className="flex-row gap-2.5">
                  <View className="flex-1">
                    <Button
                      onPress={handleCopy}
                      variant="secondary"
                      size="md"
                      fullWidth
                      icon={
                        isCopied
                          ? <Check size={16} color="#059669" />
                          : <Copy size={16} color="#475569" />
                      }
                    >
                      {isCopied ? t('common.copied') : t('review.copyLink')}
                    </Button>
                  </View>
                  <View className="flex-1">
                    <Button
                      onPress={handleOpenInBrowser}
                      variant="primary"
                      size="md"
                      fullWidth
                      icon={<ExternalLink size={16} color="#FFFFFF" />}
                    >
                      {t('review.openPreview')}
                    </Button>
                  </View>
                </View>
              </View>
            )}

            {/* Footer note */}
            <View className="flex-row items-center gap-1.5 mt-4 pt-4 border-t border-gray-100">
              <HelpCircle size={14} color="#94A3B8" />
              <Text className="text-xs text-gray-400">
                {t('review.noLoginRequired')}
              </Text>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

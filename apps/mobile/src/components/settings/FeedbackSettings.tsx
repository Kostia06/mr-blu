import { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, CheckCircle } from 'lucide-react-native';
import { useI18nStore } from '@/lib/i18n';
import { useToastStore } from '@/stores/toastStore';
import { submitFeedback } from '@/lib/api/external';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { GlassBackground } from '@/components/layout/GlassBackground';
import { Button } from '@/components/ui/Button';

type Category = 'bug' | 'feature' | 'general' | 'praise';

const MAX_CHARS = 2000;
const CATEGORIES: Category[] = ['bug', 'feature', 'general', 'praise'];

export function FeedbackSettings() {
  const { t } = useI18nStore();
  const toast = useToastStore();
  const insets = useSafeAreaInsets();

  const [comment, setComment] = useState('');
  const [category, setCategory] = useState<Category>('general');
  const [isSending, setIsSending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const charCount = comment.length;
  const isOverLimit = charCount > MAX_CHARS;
  const canSubmit = useMemo(
    () => comment.trim().length > 0 && !isOverLimit && !isSending,
    [comment, isOverLimit, isSending]
  );

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setIsSending(true);
    try {
      await submitFeedback({
        comment: comment.trim(),
        category,
        pageContext: 'mobile/settings/feedback',
      });
      setIsSubmitted(true);
    } catch {
      toast.error('Failed to send feedback');
    } finally {
      setIsSending(false);
    }
  }, [canSubmit, comment, category, toast]);

  if (isSubmitted) {
    return (
      <GlassBackground>
        <ScreenHeader title={t('feedback.title')} showBack />
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-[88px] h-[88px] rounded-full bg-blue-50 items-center justify-center mb-5">
            <CheckCircle size={48} color="#0066FF" />
          </View>
          <Text className="text-base font-medium text-gray-600 text-center leading-6">
            {t('feedback.thanks')}
          </Text>
        </View>
      </GlassBackground>
    );
  }

  return (
    <GlassBackground>
      <ScreenHeader title={t('feedback.title')} showBack />
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
          <View className="flex-row flex-wrap gap-2 mb-6">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-full border ${
                    isSelected
                      ? 'bg-blu-primary border-blu-primary'
                      : 'border-gray-200'
                  }`}
                  style={!isSelected ? { backgroundColor: 'rgba(255,255,255,0.5)' } : undefined}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isSelected ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {t(`feedback.${cat}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="relative mb-6">
            <TextInput
              className={`border rounded-xl px-4 py-4 text-[15px] text-gray-900 min-h-[160px] ${
                isOverLimit ? 'border-red-400' : 'border-gray-200'
              }`}
              style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
              value={comment}
              onChangeText={setComment}
              placeholder={t('feedback.placeholder')}
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
              maxLength={MAX_CHARS + 100}
            />
            <Text
              className={`absolute bottom-3 right-3 text-xs ${
                isOverLimit ? 'text-red-500' : 'text-gray-400'
              }`}
            >
              {charCount}/{MAX_CHARS}
            </Text>
          </View>

          <Button
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={isSending}
            fullWidth
            icon={!isSending ? <Send size={18} color="#fff" /> : undefined}
          >
            {isSending ? t('feedback.sending') : t('feedback.submit')}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </GlassBackground>
  );
}

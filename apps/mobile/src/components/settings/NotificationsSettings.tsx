import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Receipt, FileText, Mail, BellRing, Check, Info } from 'lucide-react-native';
import { useI18nStore } from '@/lib/i18n';
import { useToastStore } from '@/stores/toastStore';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from '@/lib/api/user';
import { FormToggle } from '@/components/forms/FormToggle';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { GlassBackground } from '@/components/layout/GlassBackground';
import { GlassCard } from '@/components/ui/GlassCard';

const ICON_MAP = {
  emailOnInvoiceSent: Receipt,
  emailOnEstimateSent: FileText,
  emailConfirmation: Mail,
} as const;

export function NotificationsSettings() {
  const { t } = useI18nStore();
  const toast = useToastStore();
  const insets = useSafeAreaInsets();

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailOnInvoiceSent: true,
    emailOnEstimateSent: true,
    emailConfirmation: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const enabledCount = useMemo(
    () => Object.values(preferences).filter(Boolean).length,
    [preferences]
  );

  const notificationOptions = useMemo(() => [
    {
      key: 'emailOnInvoiceSent' as keyof NotificationPreferences,
      label: t('settings.notifInvoiceSent'),
      description: t('settings.notifInvoiceSentDesc'),
    },
    {
      key: 'emailOnEstimateSent' as keyof NotificationPreferences,
      label: t('settings.notifEstimateSent'),
      description: t('settings.notifEstimateSentDesc'),
    },
    {
      key: 'emailConfirmation' as keyof NotificationPreferences,
      label: t('settings.notifConfirmation'),
      description: t('settings.notifConfirmationDesc'),
    },
  ], [t]);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const prefs = await getNotificationPreferences();
        setPreferences(prefs);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    loadPreferences();
  }, []);

  const savePreferences = useCallback(async (updated: NotificationPreferences) => {
    setSaving(true);
    try {
      await updateNotificationPreferences(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  }, [toast]);

  const togglePreference = useCallback((key: keyof NotificationPreferences) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      savePreferences(updated);
      return updated;
    });
  }, [savePreferences]);

  const headerStatus = saving ? (
    <ActivityIndicator size="small" color="#64748B" />
  ) : saved ? (
    <View className="w-8 h-8 rounded-full bg-emerald-100 items-center justify-center">
      <Check size={16} color="#10B981" strokeWidth={2.5} />
    </View>
  ) : null;

  return (
    <GlassBackground>
      <ScreenHeader title={t('settings.notifications')} showBack rightAction={headerStatus} />
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center py-8">
          <View className={`relative w-[88px] h-[88px] rounded-full bg-blue-50 border border-gray-200 items-center justify-center ${enabledCount > 0 ? 'shadow-lg shadow-blue-500/10' : ''}`}>
            <BellRing size={32} color={enabledCount > 0 ? '#0066FF' : '#94A3B8'} />
            {enabledCount > 0 && (
              <View className="absolute top-1 right-1 min-w-[22px] h-[22px] rounded-full bg-blu-primary border-2 border-blue-50 items-center justify-center px-1.5">
                <Text className="text-[11px] font-bold text-white">{enabledCount}</Text>
              </View>
            )}
          </View>
          <Text className="mt-4 text-sm font-medium text-gray-600">
            {loading
              ? t('common.loading')
              : enabledCount === 0
                ? t('settings.notifAllDisabled')
                : t('settings.notifEnabledCount', { count: enabledCount })}
          </Text>
        </View>

        {loading ? (
          <View className="py-16 items-center">
            <ActivityIndicator size="large" color="#0066FF" />
          </View>
        ) : (
          <GlassCard className="mb-6">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {t('settings.emailNotificationsTitle')}
            </Text>
            <Text className="text-xs text-gray-400 mb-3">
              {t('settings.emailNotificationsDesc')}
            </Text>

            {notificationOptions.map((option) => (
              <FormToggle
                key={option.key}
                label={option.label}
                description={option.description}
                value={preferences[option.key]}
                onToggle={() => togglePreference(option.key)}
              />
            ))}
          </GlassCard>
        )}

        <GlassCard className="flex-row gap-3">
          <Info size={18} color="#64748B" />
          <Text className="flex-1 text-[13px] text-gray-500 leading-5">
            {t('settings.notifAutoSave')}
          </Text>
        </GlassCard>
      </ScrollView>
    </GlassBackground>
  );
}

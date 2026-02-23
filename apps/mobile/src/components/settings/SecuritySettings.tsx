import { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { History, AlertTriangle, ChevronRight } from 'lucide-react-native';
import { useI18nStore } from '@/lib/i18n';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { deleteAccount } from '@/lib/api/user';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { GlassBackground } from '@/components/layout/GlassBackground';

function formatLastSignIn(dateString: string | undefined, locale: string): string {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString(
    locale === 'es' ? 'es-ES' : 'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }
  );
}

export function SecuritySettings() {
  const { t, locale } = useI18nStore();
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore();
  const insets = useSafeAreaInsets();

  const [isDeleting, setIsDeleting] = useState(false);

  const lastSignIn = useMemo(
    () => formatLastSignIn(user?.last_sign_in_at, locale),
    [user?.last_sign_in_at, locale]
  );

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      t('security.deleteConfirmTitle'),
      t('security.deleteConfirmDesc'),
      [
        { text: t('security.cancel'), style: 'cancel' },
        {
          text: t('security.deleteButton'),
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteAccount();
              router.replace('/login' as any);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Failed to delete account');
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [t, toast]);

  return (
    <GlassBackground>
      <ScreenHeader title={t('security.title')} showBack />
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-white rounded-card overflow-hidden shadow-sm mb-6">
          <View className="px-4 pt-4 pb-2">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t('settings.sessionsTitle')}
            </Text>
          </View>
          <View className="flex-row items-center px-4 py-4">
            <View className="w-11 h-11 rounded-xl bg-blue-50 items-center justify-center mr-3.5">
              <History size={18} color="#0066FF" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-medium text-gray-900">
                {t('security.lastSignIn')}
              </Text>
              <Text className="text-[13px] text-gray-500">{lastSignIn}</Text>
            </View>
          </View>
        </View>

        <View className="bg-white rounded-card overflow-hidden shadow-sm">
          <View className="px-4 pt-4 pb-2">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t('settings.dangerZoneTitle')}
            </Text>
          </View>
          <Pressable
            onPress={handleDeleteAccount}
            disabled={isDeleting}
            className="flex-row items-center px-4 py-4 active:bg-red-50"
          >
            <View className="w-11 h-11 rounded-xl bg-red-50 items-center justify-center mr-3.5">
              {isDeleting ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <AlertTriangle size={18} color="#EF4444" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-medium text-red-500">
                {t('security.deleteAccount')}
              </Text>
              <Text className="text-[13px] text-gray-500">
                {t('security.deleteAccountDesc')}
              </Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </Pressable>
        </View>
      </ScrollView>
    </GlassBackground>
  );
}

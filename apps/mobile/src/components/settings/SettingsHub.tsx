import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  User as UserIcon,
  Building2,
  LogOut,
  Globe,
  BellRing,
  MessageCircle,
  BookOpen,
  Shield,
  Users,
  Wrench,
  ChevronRight,
} from 'lucide-react-native';
import { useState } from 'react';
import { useI18nStore } from '@/lib/i18n';
import { useAuthStore } from '@/stores/authStore';
import { logout } from '@/lib/api/auth';
import { GlassBackground } from '@/components/layout/GlassBackground';
import { ScreenHeader } from '@/components/layout/ScreenHeader';

interface SectionItem {
  icon: React.ReactNode;
  label: string;
  description: string;
  route: string;
}

interface Section {
  title: string;
  items: SectionItem[];
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
        {title}
      </Text>
      <View className="bg-white rounded-card overflow-hidden shadow-sm">
        {children}
      </View>
    </View>
  );
}

function SettingsItem({ icon, label, description, route, isLast }: SectionItem & { isLast: boolean }) {
  return (
    <Pressable
      onPress={() => router.push(route as any)}
      className={`flex-row items-center px-4 py-3.5 active:bg-gray-50 ${!isLast ? 'border-b border-gray-100' : ''}`}
    >
      <View className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center mr-3">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-medium text-gray-900">{label}</Text>
        <Text className="text-[13px] text-gray-500" numberOfLines={1}>{description}</Text>
      </View>
      <ChevronRight size={18} color="#94A3B8" />
    </Pressable>
  );
}

export function SettingsHub() {
  const { t } = useI18nStore();
  const [signingOut, setSigningOut] = useState(false);
  const insets = useSafeAreaInsets();

  const sections: Section[] = [
    {
      title: t('settings.account'),
      items: [
        {
          icon: <UserIcon size={18} color="#475569" />,
          label: t('settings.profile'),
          description: t('settings.nameEmail'),
          route: '/(tabs)/settings/profile',
        },
        {
          icon: <Building2 size={18} color="#475569" />,
          label: t('settings.business'),
          description: t('settings.companyInfoBranding'),
          route: '/(tabs)/settings/business',
        },
        {
          icon: <Users size={18} color="#475569" />,
          label: 'Clients',
          description: 'Saved client info',
          route: '/(tabs)/settings/clients',
        },
        {
          icon: <BookOpen size={18} color="#475569" />,
          label: t('settings.priceBook') || 'Price Book',
          description: t('settings.priceBookDesc') || 'Saved material rates',
          route: '/(tabs)/settings/price-book',
        },
        {
          icon: <Wrench size={18} color="#475569" />,
          label: 'Service Book',
          description: 'Reusable job templates',
          route: '/(tabs)/settings/service-book',
        },
        {
          icon: <Shield size={18} color="#475569" />,
          label: t('security.title') || 'Security',
          description: t('security.settingsDesc') || 'Sessions & account',
          route: '/(tabs)/settings/security',
        },
      ],
    },
    {
      title: t('settings.preferences'),
      items: [
        {
          icon: <BellRing size={18} color="#475569" />,
          label: t('settings.notifications'),
          description: t('settings.notificationsDesc'),
          route: '/(tabs)/settings/notifications',
        },
        {
          icon: <Globe size={18} color="#475569" />,
          label: t('settings.language'),
          description: t('settings.appLanguage'),
          route: '/(tabs)/settings/language',
        },
        {
          icon: <MessageCircle size={18} color="#475569" />,
          label: t('settings.feedback'),
          description: t('settings.feedbackDesc'),
          route: '/(tabs)/settings/feedback',
        },
      ],
    },
  ];

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logout();
      router.replace('/login' as any);
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <GlassBackground>
      <ScreenHeader title={t('settings.title')} />
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section) => (
          <SettingsSection key={section.title} title={section.title}>
            {section.items.map((item, index) => (
              <SettingsItem
                key={item.route}
                {...item}
                isLast={index === section.items.length - 1}
              />
            ))}
          </SettingsSection>
        ))}

        <Pressable
          onPress={handleSignOut}
          disabled={signingOut}
          className="flex-row items-center justify-center gap-2.5 py-4 mt-2"
        >
          {signingOut ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <>
              <LogOut size={18} color="#EF4444" />
              <Text className="text-[15px] font-semibold text-red-500">
                {t('settings.signOut')}
              </Text>
            </>
          )}
        </Pressable>

        <Text className="text-center text-xs text-gray-400 mt-2">
          {t('settings.versionNumber')}
        </Text>
      </ScrollView>
    </GlassBackground>
  );
}

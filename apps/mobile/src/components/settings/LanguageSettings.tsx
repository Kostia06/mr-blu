import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Globe, Info } from 'lucide-react-native';
import { useI18nStore } from '@/lib/i18n';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { GlassBackground } from '@/components/layout/GlassBackground';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'es', name: 'Espa\u00F1ol', native: 'Spanish', flag: '\u{1F1EA}\u{1F1F8}' },
];

export function LanguageSettings() {
  const { locale, t, setLocale } = useI18nStore();
  const insets = useSafeAreaInsets();

  const selectedLanguage = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  return (
    <GlassBackground>
      <ScreenHeader title={t('settings.languageTitle')} showBack />
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center py-8">
          <View className="relative w-[88px] h-[88px] rounded-full bg-blue-50 border border-gray-200 items-center justify-center">
            <Globe size={32} color="#0066FF" />
            <View className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-white border-2 border-gray-50 items-center justify-center shadow-sm">
              <Text className="text-xl">{selectedLanguage.flag}</Text>
            </View>
          </View>
          <Text className="mt-4 text-sm font-medium text-gray-600">
            {selectedLanguage.name}
          </Text>
        </View>

        <View className="bg-white rounded-card overflow-hidden shadow-sm mb-6">
          <View className="px-4 pt-4 pb-2">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t('settings.selectLanguage')}
            </Text>
            <Text className="text-xs text-gray-400 mt-0.5">
              {t('settings.languageDesc')}
            </Text>
          </View>

          {LANGUAGES.map((lang, index) => {
            const isSelected = locale === lang.code;
            const isLast = index === LANGUAGES.length - 1;

            return (
              <Pressable
                key={lang.code}
                onPress={() => setLocale(lang.code)}
                className={`flex-row items-center px-4 py-4 ${isSelected ? 'bg-blue-50/50' : ''} ${!isLast ? 'border-b border-gray-100' : ''}`}
              >
                <View className={`w-12 h-12 rounded-xl items-center justify-center mr-3.5 ${isSelected ? 'bg-blue-100/80' : 'bg-gray-100'}`}>
                  <Text className="text-2xl">{lang.flag}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-medium text-gray-900">{lang.name}</Text>
                  <Text className="text-[13px] text-gray-500">{lang.native}</Text>
                </View>
                {isSelected && (
                  <View className="w-6 h-6 rounded-full bg-blu-primary items-center justify-center">
                    <Check size={14} color="#fff" strokeWidth={3} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View className="flex-row bg-gray-100 rounded-button p-4 gap-3">
          <Info size={18} color="#64748B" />
          <Text className="flex-1 text-[13px] text-gray-500 leading-5">
            {t('settings.languageHint')}
          </Text>
        </View>
      </ScrollView>
    </GlassBackground>
  );
}

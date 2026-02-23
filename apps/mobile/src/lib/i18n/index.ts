import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { translations } from './translations';

export type TranslateFn = (
  key: string,
  params?: Record<string, string | number | null | undefined>
) => string;

interface I18nState {
  locale: string;
  t: TranslateFn;
  setLocale: (lang: string) => void;
}

function createTranslateFn(locale: string): TranslateFn {
  return (key, params) => {
    let value = translations[locale]?.[key] || translations['en']?.[key] || key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v ?? ''));
      }
    }
    return value;
  };
}

function getInitialLocale(): string {
  try {
    const locales = getLocales();
    const lang = locales?.[0]?.languageCode ?? 'es';
    return translations[lang] ? lang : 'es';
  } catch {
    return 'es';
  }
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => {
      const initialLocale = getInitialLocale();
      return {
        locale: initialLocale,
        t: createTranslateFn(initialLocale),
        setLocale: (lang: string) => {
          if (!translations[lang]) return;
          set({ locale: lang, t: createTranslateFn(lang) });
        },
      };
    },
    {
      name: 'locale',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state?: I18nState) => {
        if (state?.locale) {
          state.t = createTranslateFn(state.locale);
        }
      },
    }
  )
);

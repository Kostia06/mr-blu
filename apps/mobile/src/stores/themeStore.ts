import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  colorScheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  initialize: () => void;
}

function resolveColorScheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  }
  return theme;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system' as Theme,
      colorScheme: resolveColorScheme('system'),
      setTheme: (theme: Theme) => {
        set({ theme, colorScheme: resolveColorScheme(theme) });
      },
      initialize: () => {
        const { theme } = get();
        set({ colorScheme: resolveColorScheme(theme) });

        Appearance.addChangeListener(({ colorScheme }: { colorScheme: ColorSchemeName }) => {
          const current = get().theme;
          if (current === 'system') {
            set({ colorScheme: colorScheme === 'dark' ? 'dark' : 'light' });
          }
        });
      },
    }),
    {
      name: 'theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

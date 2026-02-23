import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  initialize: () => void;
}

function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system' as Theme,
      setTheme: (theme: Theme) => {
        applyTheme(theme);
        set({ theme });
      },
      initialize: () => {
        if (typeof window === 'undefined') return;
        const { theme } = get();
        applyTheme(theme);

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
          const current = get().theme;
          if (current === 'system') {
            applyTheme('system');
          }
        });
      },
    }),
    {
      name: 'theme',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

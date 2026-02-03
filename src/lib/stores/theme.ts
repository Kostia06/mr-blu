import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';

function getInitialTheme(): Theme {
	if (!browser) return 'system';
	const saved = localStorage.getItem('theme') as Theme | null;
	return saved || 'system';
}

function createThemeStore() {
	const { subscribe, set, update } = writable<Theme>(getInitialTheme());

	function applyTheme(theme: Theme) {
		if (!browser) return;

		const isDark =
			theme === 'dark' ||
			(theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

		if (isDark) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	return {
		subscribe,
		setTheme: (theme: Theme) => {
			if (browser) {
				if (theme === 'system') {
					localStorage.removeItem('theme');
				} else {
					localStorage.setItem('theme', theme);
				}
				applyTheme(theme);
			}
			set(theme);
		},
		initialize: () => {
			if (browser) {
				const theme = getInitialTheme();
				applyTheme(theme);
				set(theme);

				// Listen for system preference changes
				window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
					const currentTheme = localStorage.getItem('theme') as Theme | null;
					if (!currentTheme || currentTheme === 'system') {
						applyTheme('system');
					}
				});
			}
		}
	};
}

export const theme = createThemeStore();

import { create } from 'zustand';
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
	if (typeof window === 'undefined') return 'es';
	const saved = localStorage.getItem('locale');
	if (saved && translations[saved]) return saved;
	const lang = navigator.language.split('-')[0];
	return translations[lang] ? lang : 'es';
}

export const useI18nStore = create<I18nState>((set) => {
	const initialLocale = getInitialLocale();
	return {
		locale: initialLocale,
		t: createTranslateFn(initialLocale),
		setLocale: (lang: string) => {
			if (!translations[lang]) return;
			if (typeof window !== 'undefined') {
				localStorage.setItem('locale', lang);
			}
			set({ locale: lang, t: createTranslateFn(lang) });
		},
	};
});

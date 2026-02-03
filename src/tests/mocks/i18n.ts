import { vi } from 'vitest';
import { readable, writable } from 'svelte/store';

// Mock translation function that returns the key (for testing)
export const mockT = (key: string) => key;

// Mock locale store
export const mockLocale = writable('en');

// Mock the i18n module
vi.mock('$lib/i18n/index', () => ({
	locale: mockLocale,
	t: readable(mockT),
	setLocale: vi.fn((lang: string) => mockLocale.set(lang))
}));

// Helper to get translation key in tests
export function getTranslationKey(key: string): string {
	return key;
}

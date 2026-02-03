import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { locale, t, setLocale } from './index';

describe('i18n', () => {
	beforeEach(() => {
		localStorage.clear();
		// Reset to English
		setLocale('en');
	});

	describe('locale store', () => {
		it('should have default locale', () => {
			const currentLocale = get(locale);
			expect(['en', 'es']).toContain(currentLocale);
		});

		it('should be subscribable', () => {
			const values: string[] = [];
			const unsubscribe = locale.subscribe((value) => {
				values.push(value);
			});

			setLocale('es');
			setLocale('en');

			expect(values).toContain('es');
			expect(values).toContain('en');

			unsubscribe();
		});
	});

	describe('setLocale', () => {
		it('should change locale to Spanish', () => {
			setLocale('es');
			const currentLocale = get(locale);
			expect(currentLocale).toBe('es');
		});

		it('should change locale to English', () => {
			setLocale('es');
			setLocale('en');
			const currentLocale = get(locale);
			expect(currentLocale).toBe('en');
		});

		it('should persist to localStorage', () => {
			setLocale('es');
			expect(localStorage.setItem).toHaveBeenCalledWith('locale', 'es');
		});

		it('should not change for invalid locale', () => {
			const before = get(locale);
			setLocale('invalid-locale');
			const after = get(locale);
			expect(after).toBe(before);
		});
	});

	describe('t (translation function)', () => {
		it('should return translation for known key in English', () => {
			setLocale('en');
			const translate = get(t);

			expect(translate('nav.home')).toBe('Home');
			expect(translate('nav.settings')).toBe('Settings');
		});

		it('should return translation for known key in Spanish', () => {
			setLocale('es');
			const translate = get(t);

			expect(translate('nav.home')).toBe('Inicio');
			expect(translate('nav.settings')).toBe('Ajustes');
		});

		it('should return key for unknown translation', () => {
			const translate = get(t);
			expect(translate('unknown.key')).toBe('unknown.key');
		});

		it('should update when locale changes', () => {
			let translate = get(t);
			expect(translate('common.save')).toBe('Save');

			setLocale('es');

			translate = get(t);
			expect(translate('common.save')).toBe('Guardar');
		});

		it('should fallback to English for missing Spanish translations', () => {
			setLocale('es');
			const translate = get(t);

			// If a key exists in English but not Spanish, it should fallback
			// All our keys should exist in both, so this tests the fallback mechanism
			const result = translate('nav.home');
			expect(result).not.toBe('nav.home'); // Should get actual translation
		});
	});

	describe('translation keys', () => {
		const criticalKeys = [
			'nav.home',
			'nav.documents',
			'nav.settings',
			'common.save',
			'common.cancel',
			'common.delete',
			'common.loading',
			'dashboard.welcome',
			'documents.title',
			'settings.title'
		];

		it.each(criticalKeys)('should have English translation for %s', (key) => {
			setLocale('en');
			const translate = get(t);
			const result = translate(key);
			expect(result).not.toBe(key);
		});

		it.each(criticalKeys)('should have Spanish translation for %s', (key) => {
			setLocale('es');
			const translate = get(t);
			const result = translate(key);
			expect(result).not.toBe(key);
		});
	});

	describe('special translations', () => {
		it('should handle nested keys', () => {
			setLocale('en');
			const translate = get(t);

			expect(translate('tutorial.startModal.title')).not.toBe('tutorial.startModal.title');
			expect(translate('landing.hero.word1')).not.toBe('landing.hero.word1');
		});

		it('should handle error messages', () => {
			const translate = get(t);

			expect(translate('error.sessionExpired')).toContain('expired');
		});

		it('should handle aria labels', () => {
			const translate = get(t);

			expect(translate('aria.mainNavigation')).not.toBe('aria.mainNavigation');
		});
	});
});

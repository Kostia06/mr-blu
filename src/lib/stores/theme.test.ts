import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { theme } from './theme';

// Mock document.documentElement.classList
const mockClassList = {
	add: vi.fn(),
	remove: vi.fn(),
	contains: vi.fn()
};

Object.defineProperty(document, 'documentElement', {
	value: {
		classList: mockClassList
	},
	writable: true
});

describe('theme store', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	describe('default values', () => {
		it('should default to system theme', () => {
			const currentTheme = get(theme);
			expect(currentTheme).toBe('system');
		});
	});

	describe('setTheme', () => {
		it('should update theme to light', () => {
			theme.setTheme('light');
			const currentTheme = get(theme);
			expect(currentTheme).toBe('light');
		});

		it('should update theme to dark', () => {
			theme.setTheme('dark');
			const currentTheme = get(theme);
			expect(currentTheme).toBe('dark');
		});

		it('should update theme to system', () => {
			theme.setTheme('dark');
			theme.setTheme('system');
			const currentTheme = get(theme);
			expect(currentTheme).toBe('system');
		});

		it('should persist light/dark to localStorage', () => {
			theme.setTheme('dark');
			expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
		});

		it('should remove from localStorage when set to system', () => {
			theme.setTheme('system');
			expect(localStorage.removeItem).toHaveBeenCalledWith('theme');
		});

		it('should add dark class for dark theme', () => {
			theme.setTheme('dark');
			expect(mockClassList.add).toHaveBeenCalledWith('dark');
		});

		it('should remove dark class for light theme', () => {
			theme.setTheme('light');
			expect(mockClassList.remove).toHaveBeenCalledWith('dark');
		});
	});

	describe('initialize', () => {
		it('should be callable without error', () => {
			expect(() => theme.initialize()).not.toThrow();
		});
	});
});

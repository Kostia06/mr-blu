import '@testing-library/svelte/vitest';
import { vi } from 'vitest';

// Mock $app/environment so browser=true in tests (esm-env resolves to false in Node)
vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	building: false,
	version: 'test'
}));

// localStorage mock with vi.fn() spies backed by real in-memory storage
let store: Record<string, string> = {};

const localStorageMock = {
	getItem: vi.fn((key: string): string | null => store[key] ?? null),
	setItem: vi.fn((key: string, value: string): void => {
		store[key] = String(value);
	}),
	removeItem: vi.fn((key: string): void => {
		delete store[key];
	}),
	clear: vi.fn((): void => {
		store = {};
	}),
	get length(): number {
		return Object.keys(store).length;
	},
	key: vi.fn((index: number): string | null => Object.keys(store)[index] ?? null)
};

Object.defineProperty(globalThis, 'localStorage', {
	value: localStorageMock,
	writable: true,
	configurable: true
});

// matchMedia mock (not implemented in jsdom, needed by theme store)
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	configurable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

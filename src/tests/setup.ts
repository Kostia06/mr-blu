import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock SvelteKit's $app/environment
vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	building: false,
	version: 'test'
}));

// Mock SvelteKit's $app/navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn(),
	preloadData: vi.fn(),
	preloadCode: vi.fn(),
	beforeNavigate: vi.fn(),
	afterNavigate: vi.fn(),
	onNavigate: vi.fn()
}));

// Mock SvelteKit's $app/stores
vi.mock('$app/stores', () => {
	const { readable, writable } = require('svelte/store');
	return {
		page: readable({
			url: new URL('http://localhost:5173'),
			params: {},
			route: { id: '/' },
			status: 200,
			error: null,
			data: {},
			form: null
		}),
		navigating: readable(null),
		updated: {
			subscribe: readable(false).subscribe,
			check: vi.fn()
		}
	};
});

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		}),
		get length() {
			return Object.keys(store).length;
		},
		key: vi.fn((index: number) => Object.keys(store)[index] || null)
	};
})();

Object.defineProperty(globalThis, 'localStorage', {
	value: localStorageMock
});

// Mock crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
	value: {
		randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(7)
	}
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
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

// Reset mocks between tests
beforeEach(() => {
	localStorageMock.clear();
	vi.clearAllMocks();
});

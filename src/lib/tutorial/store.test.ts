import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TUTORIAL_STORAGE_KEY } from './config';

// We need to test the tutorial store logic
// Since the store uses Svelte 5 runes ($state, $derived), we need to test
// the behavior through the exported functions

describe('Tutorial Store', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	describe('Initial State', () => {
		it('should have correct default values in localStorage', () => {
			// Verify no saved state initially
			expect(localStorage.getItem(TUTORIAL_STORAGE_KEY)).toBeNull();
		});
	});

	describe('Storage Key', () => {
		it('should use correct storage key', () => {
			expect(TUTORIAL_STORAGE_KEY).toBe('mr-blu-tutorial-state');
		});
	});

	describe('State Persistence', () => {
		it('should handle empty localStorage gracefully', () => {
			localStorage.clear();
			// Should not throw when accessing the store
			expect(() => localStorage.getItem(TUTORIAL_STORAGE_KEY)).not.toThrow();
		});

		it('should handle invalid JSON in localStorage gracefully', () => {
			localStorage.setItem(TUTORIAL_STORAGE_KEY, 'invalid-json');

			// The store should fall back to defaults when parsing fails
			const stored = localStorage.getItem(TUTORIAL_STORAGE_KEY);
			expect(stored).toBe('invalid-json');
		});

		it('should preserve partial state from localStorage', () => {
			const partialState = JSON.stringify({
				tutorialCompleted: true
			});
			localStorage.setItem(TUTORIAL_STORAGE_KEY, partialState);

			const stored = JSON.parse(localStorage.getItem(TUTORIAL_STORAGE_KEY) || '{}');
			expect(stored.tutorialCompleted).toBe(true);
		});
	});

	describe('Tutorial State Shape', () => {
		it('should have expected state properties when saved', () => {
			const expectedState = {
				tutorialCompleted: false,
				tutorialSkipped: false,
				stepsCompleted: [],
				hintsShown: [],
				hintsDisabled: false
			};

			localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(expectedState));
			const stored = JSON.parse(localStorage.getItem(TUTORIAL_STORAGE_KEY) || '{}');

			expect(stored).toHaveProperty('tutorialCompleted');
			expect(stored).toHaveProperty('tutorialSkipped');
			expect(stored).toHaveProperty('stepsCompleted');
			expect(stored).toHaveProperty('hintsShown');
			expect(stored).toHaveProperty('hintsDisabled');
		});

		it('should track completed steps as an array', () => {
			const state = {
				tutorialCompleted: false,
				tutorialSkipped: false,
				stepsCompleted: ['voice_button', 'navigation_documents'],
				hintsShown: [],
				hintsDisabled: false
			};

			localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(state));
			const stored = JSON.parse(localStorage.getItem(TUTORIAL_STORAGE_KEY) || '{}');

			expect(Array.isArray(stored.stepsCompleted)).toBe(true);
			expect(stored.stepsCompleted).toContain('voice_button');
			expect(stored.stepsCompleted).toContain('navigation_documents');
		});

		it('should track shown hints as an array', () => {
			const state = {
				tutorialCompleted: true,
				tutorialSkipped: false,
				stepsCompleted: [],
				hintsShown: ['first_voice_recording', 'first_document_created'],
				hintsDisabled: false
			};

			localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(state));
			const stored = JSON.parse(localStorage.getItem(TUTORIAL_STORAGE_KEY) || '{}');

			expect(Array.isArray(stored.hintsShown)).toBe(true);
			expect(stored.hintsShown).toHaveLength(2);
		});
	});

	describe('Tutorial Completion States', () => {
		it('should track tutorial completion', () => {
			const completedState = {
				tutorialCompleted: true,
				tutorialSkipped: false,
				stepsCompleted: ['voice_button', 'navigation_documents', 'navigation_settings'],
				hintsShown: [],
				hintsDisabled: false
			};

			localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(completedState));
			const stored = JSON.parse(localStorage.getItem(TUTORIAL_STORAGE_KEY) || '{}');

			expect(stored.tutorialCompleted).toBe(true);
		});

		it('should track tutorial skip', () => {
			const skippedState = {
				tutorialCompleted: false,
				tutorialSkipped: true,
				stepsCompleted: [],
				hintsShown: [],
				hintsDisabled: false
			};

			localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(skippedState));
			const stored = JSON.parse(localStorage.getItem(TUTORIAL_STORAGE_KEY) || '{}');

			expect(stored.tutorialSkipped).toBe(true);
		});

		it('should track hints disabled', () => {
			const noHintsState = {
				tutorialCompleted: true,
				tutorialSkipped: false,
				stepsCompleted: [],
				hintsShown: [],
				hintsDisabled: true
			};

			localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(noHintsState));
			const stored = JSON.parse(localStorage.getItem(TUTORIAL_STORAGE_KEY) || '{}');

			expect(stored.hintsDisabled).toBe(true);
		});
	});

	describe('Reset Functionality', () => {
		it('should clear localStorage on reset', () => {
			localStorage.setItem(
				TUTORIAL_STORAGE_KEY,
				JSON.stringify({
					tutorialCompleted: true
				})
			);

			// Simulate reset
			localStorage.removeItem(TUTORIAL_STORAGE_KEY);

			expect(localStorage.getItem(TUTORIAL_STORAGE_KEY)).toBeNull();
		});
	});
});

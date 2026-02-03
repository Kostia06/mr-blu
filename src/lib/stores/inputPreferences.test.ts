import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { inputPreferences } from './inputPreferences';

describe('inputPreferences store', () => {
	beforeEach(() => {
		localStorage.clear();
		inputPreferences.reset();
	});

	describe('default values', () => {
		it('should have voice as default mode', () => {
			const prefs = get(inputPreferences);
			expect(prefs.mode).toBe('voice');
		});

		it('should have autoSubmitVoice enabled by default', () => {
			const prefs = get(inputPreferences);
			expect(prefs.autoSubmitVoice).toBe(true);
		});

		it('should have showTranscript enabled by default', () => {
			const prefs = get(inputPreferences);
			expect(prefs.showTranscript).toBe(true);
		});
	});

	describe('setMode', () => {
		it('should update mode to text', () => {
			inputPreferences.setMode('text');
			const prefs = get(inputPreferences);
			expect(prefs.mode).toBe('text');
		});

		it('should update mode to voice', () => {
			inputPreferences.setMode('text');
			inputPreferences.setMode('voice');
			const prefs = get(inputPreferences);
			expect(prefs.mode).toBe('voice');
		});

		it('should persist to localStorage', () => {
			inputPreferences.setMode('text');
			expect(localStorage.setItem).toHaveBeenCalled();
		});
	});

	describe('setAutoSubmitVoice', () => {
		it('should update autoSubmitVoice', () => {
			inputPreferences.setAutoSubmitVoice(false);
			const prefs = get(inputPreferences);
			expect(prefs.autoSubmitVoice).toBe(false);
		});

		it('should persist to localStorage', () => {
			inputPreferences.setAutoSubmitVoice(false);
			expect(localStorage.setItem).toHaveBeenCalled();
		});
	});

	describe('setShowTranscript', () => {
		it('should update showTranscript', () => {
			inputPreferences.setShowTranscript(false);
			const prefs = get(inputPreferences);
			expect(prefs.showTranscript).toBe(false);
		});

		it('should persist to localStorage', () => {
			inputPreferences.setShowTranscript(false);
			expect(localStorage.setItem).toHaveBeenCalled();
		});
	});

	describe('reset', () => {
		it('should reset all values to defaults', () => {
			inputPreferences.setMode('text');
			inputPreferences.setAutoSubmitVoice(false);
			inputPreferences.setShowTranscript(false);

			inputPreferences.reset();

			const prefs = get(inputPreferences);
			expect(prefs.mode).toBe('voice');
			expect(prefs.autoSubmitVoice).toBe(true);
			expect(prefs.showTranscript).toBe(true);
		});

		it('should remove from localStorage', () => {
			inputPreferences.reset();
			expect(localStorage.removeItem).toHaveBeenCalled();
		});
	});

	describe('persistence', () => {
		it('should preserve other settings when updating one', () => {
			inputPreferences.setMode('text');
			inputPreferences.setAutoSubmitVoice(false);

			const prefs = get(inputPreferences);
			expect(prefs.mode).toBe('text');
			expect(prefs.autoSubmitVoice).toBe(false);
			expect(prefs.showTranscript).toBe(true); // unchanged
		});
	});
});

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type InputMode = 'voice' | 'text';

export interface InputPreferences {
	mode: InputMode;
	autoSubmitVoice: boolean; // Auto-submit after voice recording ends
	showTranscript: boolean; // Show transcript while recording
}

const STORAGE_KEY = 'input-preferences';

const defaultPreferences: InputPreferences = {
	mode: 'voice',
	autoSubmitVoice: true,
	showTranscript: true
};

function getInitialPreferences(): InputPreferences {
	if (!browser) return defaultPreferences;
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			return { ...defaultPreferences, ...JSON.parse(saved) };
		}
	} catch {
		// Ignore parse errors
	}
	return defaultPreferences;
}

function createInputPreferencesStore() {
	const { subscribe, set, update } = writable<InputPreferences>(getInitialPreferences());

	return {
		subscribe,
		setMode: (mode: InputMode) => {
			update((prefs) => {
				const newPrefs = { ...prefs, mode };
				if (browser) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
				}
				return newPrefs;
			});
		},
		setAutoSubmitVoice: (autoSubmitVoice: boolean) => {
			update((prefs) => {
				const newPrefs = { ...prefs, autoSubmitVoice };
				if (browser) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
				}
				return newPrefs;
			});
		},
		setShowTranscript: (showTranscript: boolean) => {
			update((prefs) => {
				const newPrefs = { ...prefs, showTranscript };
				if (browser) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
				}
				return newPrefs;
			});
		},
		reset: () => {
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
			set(defaultPreferences);
		},
		initialize: () => {
			if (browser) {
				const prefs = getInitialPreferences();
				set(prefs);
			}
		}
	};
}

export const inputPreferences = createInputPreferencesStore();

import { writable } from 'svelte/store';

/**
 * Global app state store for cross-component communication
 */

// Recording mode state - when true, hides the BottomNav
export const isRecordingMode = writable(false);

// Modal visibility state - when true, hides the BottomNav
export const isModalOpen = writable(false);

// Processing transition state - persists across page navigation
// Used to show unified loader from dashboard -> review transition
export const processingTransition = writable(false);

// Tutorial Store - Svelte 5 Runes
import { browser } from '$app/environment';
import { TUTORIAL_STEPS, CONTEXTUAL_HINTS, TUTORIAL_STORAGE_KEY } from './config';
import type { TutorialState, TutorialStep, ContextualHint } from './types';

// Default state
const defaultState: TutorialState = {
	tutorialCompleted: false,
	tutorialSkipped: false,
	currentStep: 0,
	stepsCompleted: [],
	hintsShown: [],
	hintsDisabled: false,
	isActive: false,
	showStartModal: false,
	showCompleteModal: false
};

// Load state from localStorage
function loadState(): TutorialState {
	if (!browser) return defaultState;

	try {
		const stored = localStorage.getItem(TUTORIAL_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return { ...defaultState, ...parsed };
		}
	} catch (e) {
		console.error('Failed to load tutorial state:', e);
	}

	return defaultState;
}

// Save state to localStorage
function saveState(state: TutorialState): void {
	if (!browser) return;

	try {
		// Only persist the necessary fields
		const toSave = {
			tutorialCompleted: state.tutorialCompleted,
			tutorialSkipped: state.tutorialSkipped,
			stepsCompleted: state.stepsCompleted,
			hintsShown: state.hintsShown,
			hintsDisabled: state.hintsDisabled
		};
		localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(toSave));
	} catch (e) {
		console.error('Failed to save tutorial state:', e);
	}
}

// Create tutorial store
function createTutorialStore() {
	let state = $state<TutorialState>(loadState());
	let activeHint = $state<ContextualHint | null>(null);

	// Derived values
	const currentStepData = $derived<TutorialStep | null>(
		state.isActive ? (TUTORIAL_STEPS[state.currentStep] ?? null) : null
	);

	const totalSteps = TUTORIAL_STEPS.length;

	const shouldShowTutorial = $derived(
		!state.tutorialCompleted && !state.tutorialSkipped && browser
	);

	const isLastStep = $derived(state.currentStep >= totalSteps - 1);

	// Actions
	function initialize() {
		if (browser && shouldShowTutorial) {
			state.showStartModal = true;
		}
	}

	async function startTutorial(name?: string) {
		state.showStartModal = false;
		state.isActive = true;
		state.currentStep = 0;

		// If a name was provided, update the user's profile
		if (name && name.trim()) {
			try {
				const response = await fetch('/api/user/profile', {
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						first_name: name.trim(),
						full_name: name.trim()
					})
				});

				if (!response.ok) {
					console.error('Failed to save name from tutorial');
				}
			} catch (error) {
				console.error('Error saving name from tutorial:', error);
			}
		}
	}

	function skipTutorial() {
		state.showStartModal = false;
		state.isActive = false;
		state.tutorialSkipped = true;
		saveState(state);
	}

	function nextStep() {
		const currentStep = TUTORIAL_STEPS[state.currentStep];
		if (currentStep) {
			state.stepsCompleted = [...state.stepsCompleted, currentStep.id];
		}

		if (state.currentStep < totalSteps - 1) {
			state.currentStep++;
		} else {
			// Tutorial complete
			completeTutorial();
		}
		saveState(state);
	}

	function prevStep() {
		if (state.currentStep > 0) {
			state.currentStep--;
		}
	}

	function completeTutorial() {
		state.isActive = false;
		state.tutorialCompleted = true;
		state.showCompleteModal = true;
		saveState(state);
	}

	function closeCompleteModal() {
		state.showCompleteModal = false;
	}

	function endTutorial() {
		state.isActive = false;
		state.tutorialCompleted = true;
		saveState(state);
	}

	// Contextual hints
	function showHint(hintId: string) {
		if (state.hintsDisabled) return;
		if (state.hintsShown.includes(hintId)) return;
		if (state.isActive) return; // Don't show hints during main tutorial

		const hint = CONTEXTUAL_HINTS[hintId];
		if (hint) {
			activeHint = hint;
		}
	}

	function dismissHint(hintId: string) {
		activeHint = null;
		if (!state.hintsShown.includes(hintId)) {
			state.hintsShown = [...state.hintsShown, hintId];
			saveState(state);
		}
	}

	function hasSeenHint(hintId: string): boolean {
		return state.hintsShown.includes(hintId);
	}

	function disableAllHints() {
		activeHint = null;
		state.hintsDisabled = true;
		saveState(state);
	}

	// Reset for testing
	function reset() {
		state = { ...defaultState };
		activeHint = null;
		if (browser) {
			localStorage.removeItem(TUTORIAL_STORAGE_KEY);
		}
	}

	return {
		// State getters
		get state() {
			return state;
		},
		get currentStepData() {
			return currentStepData;
		},
		get totalSteps() {
			return totalSteps;
		},
		get shouldShowTutorial() {
			return shouldShowTutorial;
		},
		get isLastStep() {
			return isLastStep;
		},
		get activeHint() {
			return activeHint;
		},

		// Actions
		initialize,
		startTutorial,
		skipTutorial,
		nextStep,
		prevStep,
		completeTutorial,
		closeCompleteModal,
		endTutorial,
		showHint,
		dismissHint,
		hasSeenHint,
		disableAllHints,
		reset
	};
}

// Export singleton instance
export const tutorialStore = createTutorialStore();

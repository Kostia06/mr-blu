// Tutorial System Types

export interface TutorialStep {
	id: string;
	targetSelector: string; // CSS selector for element to highlight
	title: string; // i18n key
	description: string; // i18n key
	position: 'top' | 'bottom' | 'left' | 'right' | 'center';
	spotlightPadding?: number; // Extra padding around highlighted element
	showSkip?: boolean; // Show skip button for this step
	requiredRoute?: string; // Route user must be on
}

export interface TutorialState {
	// Main tutorial
	tutorialCompleted: boolean;
	tutorialSkipped: boolean;
	currentStep: number;
	stepsCompleted: string[];

	// Contextual hints
	hintsShown: string[];
	hintsDisabled: boolean;

	// UI state
	isActive: boolean;
	showStartModal: boolean;
	showCompleteModal: boolean;
}

export interface ContextualHint {
	id: string;
	targetSelector: string;
	title: string;
	description: string;
	position: 'top' | 'bottom' | 'left' | 'right' | 'center';
	spotlightPadding?: number;
}

// Tutorial Steps Configuration
import type { TutorialStep, ContextualHint } from './types';

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'voice_button',
    targetSelector: '[data-tutorial="voice-button"]',
    title: 'tutorial.steps.voiceButton.title',
    description: 'tutorial.steps.voiceButton.description',
    position: 'top',
    spotlightPadding: 20,
    showSkip: true,
    requiredRoute: '/dashboard',
  },
  {
    id: 'navigation_documents',
    targetSelector: '[data-tutorial="nav-documents"]',
    title: 'tutorial.steps.navDocuments.title',
    description: 'tutorial.steps.navDocuments.description',
    position: 'top',
    spotlightPadding: 8,
    showSkip: true,
  },
  {
    id: 'navigation_settings',
    targetSelector: '[data-tutorial="nav-settings"]',
    title: 'tutorial.steps.navSettings.title',
    description: 'tutorial.steps.navSettings.description',
    position: 'top',
    spotlightPadding: 8,
    showSkip: true,
  },
];

// Feature-specific hints (shown contextually, not in main tutorial)
export const CONTEXTUAL_HINTS: Record<string, ContextualHint> = {
  first_voice_recording: {
    id: 'first_voice_recording',
    targetSelector: '[data-tutorial="voice-recorder"]',
    title: 'tutorial.hints.firstVoiceRecording.title',
    description: 'tutorial.hints.firstVoiceRecording.description',
    position: 'bottom',
    spotlightPadding: 16,
  },
  first_document_created: {
    id: 'first_document_created',
    targetSelector: '[data-tutorial="document-actions"]',
    title: 'tutorial.hints.firstDocumentCreated.title',
    description: 'tutorial.hints.firstDocumentCreated.description',
    position: 'left',
    spotlightPadding: 8,
  },
  review_screen_intro: {
    id: 'review_screen_intro',
    targetSelector: '[data-tutorial="review-form"]',
    title: 'tutorial.hints.reviewScreenIntro.title',
    description: 'tutorial.hints.reviewScreenIntro.description',
    position: 'center',
  },
};

// Local storage key for tutorial state
export const TUTORIAL_STORAGE_KEY = 'mr-blu-tutorial-state';

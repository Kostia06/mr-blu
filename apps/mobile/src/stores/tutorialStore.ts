import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simplified tutorial for mobile — no DOM overlays, step-based only
interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string;
}

interface ContextualHint {
  id: string;
  title: string;
  description: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  { id: 'record', title: 'Record', description: 'Tap the mic to dictate a document', target: 'record-button' },
  { id: 'review', title: 'Review', description: 'Review and edit parsed content', target: 'review-screen' },
  { id: 'save', title: 'Save', description: 'Save or send your document', target: 'save-button' },
];

const TUTORIAL_STORAGE_KEY = 'mrblu-tutorial';

interface TutorialState {
  tutorialCompleted: boolean;
  tutorialSkipped: boolean;
  currentStep: number;
  stepsCompleted: string[];
  hintsShown: string[];
  hintsDisabled: boolean;
  isActive: boolean;
  showStartModal: boolean;
  showCompleteModal: boolean;
}

interface TutorialStore extends TutorialState {
  activeHint: ContextualHint | null;
  currentStepData: TutorialStep | null;
  totalSteps: number;
  shouldShowTutorial: boolean;
  isLastStep: boolean;

  initialize: () => void;
  startTutorial: (name?: string) => void;
  skipTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  completeTutorial: () => void;
  closeCompleteModal: () => void;
  endTutorial: () => void;
  showHint: (hintId: string) => void;
  dismissHint: (hintId: string) => void;
  hasSeenHint: (hintId: string) => boolean;
  disableAllHints: () => void;
  reset: () => void;
}

const defaultState: TutorialState = {
  tutorialCompleted: false,
  tutorialSkipped: false,
  currentStep: 0,
  stepsCompleted: [],
  hintsShown: [],
  hintsDisabled: false,
  isActive: false,
  showStartModal: false,
  showCompleteModal: false,
};

export const useTutorialStore = create<TutorialStore>()(
  persist(
    (set, get) => ({
      ...defaultState,
      activeHint: null,
      currentStepData: null,
      totalSteps: TUTORIAL_STEPS.length,
      shouldShowTutorial: true,
      isLastStep: false,

      initialize: () => {
        const { tutorialCompleted, tutorialSkipped } = get();
        const shouldShow = !tutorialCompleted && !tutorialSkipped;
        if (shouldShow) {
          set({ showStartModal: true, shouldShowTutorial: shouldShow });
        }
      },

      startTutorial: () => {
        const stepData = TUTORIAL_STEPS[0] ?? null;
        set({
          showStartModal: false,
          isActive: true,
          currentStep: 0,
          currentStepData: stepData,
          isLastStep: TUTORIAL_STEPS.length <= 1,
        });
      },

      skipTutorial: () => {
        set({
          showStartModal: false,
          isActive: false,
          tutorialSkipped: true,
          currentStepData: null,
          shouldShowTutorial: false,
        });
      },

      nextStep: () => {
        const { currentStep, stepsCompleted } = get();
        const currentStepConfig = TUTORIAL_STEPS[currentStep];
        const newCompleted = currentStepConfig
          ? [...stepsCompleted, currentStepConfig.id]
          : stepsCompleted;

        if (currentStep < TUTORIAL_STEPS.length - 1) {
          const nextIndex = currentStep + 1;
          set({
            currentStep: nextIndex,
            stepsCompleted: newCompleted,
            currentStepData: TUTORIAL_STEPS[nextIndex] ?? null,
            isLastStep: nextIndex >= TUTORIAL_STEPS.length - 1,
          });
        } else {
          get().completeTutorial();
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          const prevIndex = currentStep - 1;
          set({
            currentStep: prevIndex,
            currentStepData: TUTORIAL_STEPS[prevIndex] ?? null,
            isLastStep: false,
          });
        }
      },

      completeTutorial: () => {
        set({
          isActive: false,
          tutorialCompleted: true,
          showCompleteModal: true,
          currentStepData: null,
          shouldShowTutorial: false,
        });
      },

      closeCompleteModal: () => set({ showCompleteModal: false }),

      endTutorial: () => {
        set({
          isActive: false,
          tutorialCompleted: true,
          currentStepData: null,
          shouldShowTutorial: false,
        });
      },

      showHint: (hintId: string) => {
        const { hintsDisabled, hintsShown, isActive } = get();
        if (hintsDisabled || hintsShown.includes(hintId) || isActive) return;
        set({ activeHint: { id: hintId, title: '', description: '' } });
      },

      dismissHint: (hintId: string) => {
        const { hintsShown } = get();
        const newHintsShown = hintsShown.includes(hintId)
          ? hintsShown
          : [...hintsShown, hintId];
        set({ activeHint: null, hintsShown: newHintsShown });
      },

      hasSeenHint: (hintId: string) => get().hintsShown.includes(hintId),

      disableAllHints: () => set({ activeHint: null, hintsDisabled: true }),

      reset: () => {
        set({
          ...defaultState,
          activeHint: null,
          currentStepData: null,
          totalSteps: TUTORIAL_STEPS.length,
          shouldShowTutorial: true,
          isLastStep: false,
        });
      },
    }),
    {
      name: TUTORIAL_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tutorialCompleted: state.tutorialCompleted,
        tutorialSkipped: state.tutorialSkipped,
        stepsCompleted: state.stepsCompleted,
        hintsShown: state.hintsShown,
        hintsDisabled: state.hintsDisabled,
      }),
    }
  )
);

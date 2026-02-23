import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TUTORIAL_STEPS, CONTEXTUAL_HINTS, TUTORIAL_STORAGE_KEY } from '@/lib/tutorial/config';
import type { TutorialState, TutorialStep, ContextualHint } from '@/lib/tutorial/types';
import { updateProfile } from '@/lib/api/user';

interface TutorialStore extends TutorialState {
  activeHint: ContextualHint | null;

  // Derived
  currentStepData: TutorialStep | null;
  totalSteps: number;
  shouldShowTutorial: boolean;
  isLastStep: boolean;

  // Actions
  initialize: () => void;
  startTutorial: (name?: string) => Promise<void>;
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

      // Derived (computed on access via getters pattern isn't native in Zustand,
      // so we compute them as properties that update with set())
      currentStepData: null,
      totalSteps: TUTORIAL_STEPS.length,
      shouldShowTutorial: !defaultState.tutorialCompleted && !defaultState.tutorialSkipped,
      isLastStep: false,

      initialize: () => {
        const { tutorialCompleted, tutorialSkipped } = get();
        const shouldShow = !tutorialCompleted && !tutorialSkipped;
        if (shouldShow) {
          set({ showStartModal: true, shouldShowTutorial: shouldShow });
        }
      },

      startTutorial: async (name?: string) => {
        const stepData = TUTORIAL_STEPS[0] ?? null;
        set({
          showStartModal: false,
          isActive: true,
          currentStep: 0,
          currentStepData: stepData,
          isLastStep: TUTORIAL_STEPS.length <= 1,
        });

        if (name?.trim()) {
          try {
            await updateProfile({
              first_name: name.trim(),
              full_name: name.trim(),
            });
          } catch (error) {
            console.error('Error saving name from tutorial:', error);
          }
        }
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

      closeCompleteModal: () => {
        set({ showCompleteModal: false });
      },

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

        const hint = CONTEXTUAL_HINTS[hintId];
        if (hint) {
          set({ activeHint: hint });
        }
      },

      dismissHint: (hintId: string) => {
        const { hintsShown } = get();
        const newHintsShown = hintsShown.includes(hintId)
          ? hintsShown
          : [...hintsShown, hintId];
        set({ activeHint: null, hintsShown: newHintsShown });
      },

      hasSeenHint: (hintId: string) => {
        return get().hintsShown.includes(hintId);
      },

      disableAllHints: () => {
        set({ activeHint: null, hintsDisabled: true });
      },

      reset: () => {
        set({
          ...defaultState,
          activeHint: null,
          currentStepData: null,
          totalSteps: TUTORIAL_STEPS.length,
          shouldShowTutorial: true,
          isLastStep: false,
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem(TUTORIAL_STORAGE_KEY);
        }
      },
    }),
    {
      name: TUTORIAL_STORAGE_KEY,
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

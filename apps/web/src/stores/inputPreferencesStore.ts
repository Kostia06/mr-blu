import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type InputMode = 'voice' | 'text';

interface InputPreferences {
  mode: InputMode;
  autoSubmitVoice: boolean;
  showTranscript: boolean;
}

interface InputPreferencesState extends InputPreferences {
  setMode: (mode: InputMode) => void;
  setAutoSubmitVoice: (value: boolean) => void;
  setShowTranscript: (value: boolean) => void;
  reset: () => void;
}

const defaults: InputPreferences = {
  mode: 'voice',
  autoSubmitVoice: true,
  showTranscript: true,
};

export const useInputPreferencesStore = create<InputPreferencesState>()(
  persist(
    (set) => ({
      ...defaults,
      setMode: (mode) => set({ mode }),
      setAutoSubmitVoice: (autoSubmitVoice) => set({ autoSubmitVoice }),
      setShowTranscript: (showTranscript) => set({ showTranscript }),
      reset: () => set(defaults),
    }),
    {
      name: 'input-preferences',
    }
  )
);

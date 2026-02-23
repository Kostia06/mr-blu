import { create } from 'zustand';

interface AppState {
  isRecordingMode: boolean;
  isModalOpen: boolean;
  processingTransition: boolean;
  setRecordingMode: (value: boolean) => void;
  setModalOpen: (value: boolean) => void;
  setProcessingTransition: (value: boolean) => void;
}

export const useAppStateStore = create<AppState>((set) => ({
  isRecordingMode: false,
  isModalOpen: false,
  processingTransition: false,
  setRecordingMode: (value) => set({ isRecordingMode: value }),
  setModalOpen: (value) => set({ isModalOpen: value }),
  setProcessingTransition: (value) => set({ processingTransition: value }),
}));

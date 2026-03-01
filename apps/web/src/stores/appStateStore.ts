import { create } from 'zustand';
import { useEffect } from 'preact/hooks';

interface AppState {
  isRecordingMode: boolean;
  modalCount: number;
  isSelectMode: boolean;
  processingTransition: boolean;
  setRecordingMode: (value: boolean) => void;
  openModal: () => void;
  closeModal: () => void;
  setSelectMode: (value: boolean) => void;
  setProcessingTransition: (value: boolean) => void;
}

export const useAppStateStore = create<AppState>((set) => ({
  isRecordingMode: false,
  modalCount: 0,
  isSelectMode: false,
  processingTransition: false,
  setRecordingMode: (value) => set({ isRecordingMode: value }),
  openModal: () => set((s) => ({ modalCount: s.modalCount + 1 })),
  closeModal: () => set((s) => ({ modalCount: Math.max(0, s.modalCount - 1) })),
  setSelectMode: (value) => set({ isSelectMode: value }),
  setProcessingTransition: (value) => set({ processingTransition: value }),
}));

/** Syncs a modal's open state with the global store so BottomNav hides */
export function useModalState(open: boolean) {
  const { openModal, closeModal } = useAppStateStore();
  useEffect(() => {
    if (open) openModal();
    return () => {
      if (open) closeModal();
    };
  }, [open, openModal, closeModal]);
}

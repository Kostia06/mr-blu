import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastState {
  toasts: Toast[];
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => {
  function add(type: Toast['type'], message: string, duration = 5000): string {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }

    return id;
  }

  return {
    toasts: [],
    success: (message, duration) => add('success', message, duration),
    error: (message, duration) => add('error', message, duration),
    info: (message, duration) => add('info', message, duration),
    dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  };
});

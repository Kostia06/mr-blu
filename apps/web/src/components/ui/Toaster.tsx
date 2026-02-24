import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useToastStore } from '@/stores/toastStore';

type ToastType = 'success' | 'error' | 'info';

const TOAST_CONFIG: Record<ToastType, { Icon: typeof CheckCircle; accent: string; bg: string }> = {
  success: {
    Icon: CheckCircle,
    accent: '#10b981',
    bg: 'rgba(16, 185, 129, 0.08)',
  },
  error: {
    Icon: XCircle,
    accent: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.08)',
  },
  info: {
    Icon: Info,
    accent: '#0066ff',
    bg: 'rgba(0, 102, 255, 0.08)',
  },
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <>
      <div class="toaster-container">
        {toasts.map((toast) => {
          const { Icon, accent, bg } = TOAST_CONFIG[toast.type];

          return (
            <div key={toast.id} class="toast-item" role="alert" style={{ '--toast-accent': accent, '--toast-bg': bg } as any}>
              <div class="toast-icon">
                <Icon size={18} strokeWidth={2} />
              </div>
              <span class="toast-message">{toast.message}</span>
              <button
                type="button"
                class="toast-dismiss"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        .toaster-container {
          position: fixed;
          top: calc(16px + env(safe-area-inset-top, 0px));
          left: 50%;
          transform: translateX(-50%);
          z-index: 900;
          width: calc(100% - 32px);
          max-width: 380px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          pointer-events: none;
        }

        .toast-item {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 14px;
          box-shadow:
            0 4px 20px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
          animation: toast-enter 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .toast-icon {
          flex-shrink: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: var(--toast-bg);
          color: var(--toast-accent);
        }

        .toast-message {
          flex: 1;
          font-size: 13.5px;
          font-weight: 500;
          line-height: 1.35;
          color: #1a1a2e;
          letter-spacing: -0.01em;
        }

        .toast-dismiss {
          flex-shrink: 0;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          padding: 0;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .toast-dismiss:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #475569;
        }

        @keyframes toast-enter {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .toast-item { animation: none; }
        }
      `}</style>
    </>
  );
}

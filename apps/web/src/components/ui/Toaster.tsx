import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useToastStore } from '@/stores/toastStore'

type ToastType = 'success' | 'error' | 'info'

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
}

export function Toaster() {
  const { toasts, dismiss } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <>
      <div class="fixed top-[calc(16px+env(safe-area-inset-top,0px))] left-1/2 -translate-x-1/2 z-[900] w-[calc(100%-32px)] max-w-[380px] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const { Icon, accent, bg } = TOAST_CONFIG[toast.type]

          return (
            <div
              key={toast.id}
              class="pointer-events-auto flex items-center gap-2.5 px-3 py-2.5 bg-white/82 backdrop-blur-[20px] backdrop-saturate-[180%] border border-white/60 rounded-[14px] shadow-[0_4px_20px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5)] animate-[toast-enter_0.35s_cubic-bezier(0.16,1,0.3,1)_forwards] motion-reduce:animate-none"
              role="alert"
              style={{ '--toast-accent': accent, '--toast-bg': bg } as any}
            >
              <div
                class="shrink-0 w-[30px] h-[30px] flex items-center justify-center rounded-[9px]"
                style={{ background: bg, color: accent }}
              >
                <Icon size={18} strokeWidth={2} />
              </div>
              <span class="flex-1 text-[13.5px] font-medium leading-[1.35] text-[#1a1a2e] tracking-[-0.01em]">
                {toast.message}
              </span>
              <button
                type="button"
                class="shrink-0 w-[26px] h-[26px] flex items-center justify-center rounded-lg border-none bg-transparent text-slate-400 cursor-pointer p-0 transition-[background,color] duration-150 ease-out hover:bg-black/5 hover:text-slate-600"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>
          )
        })}
      </div>

      <style>{`
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
      `}</style>
    </>
  )
}

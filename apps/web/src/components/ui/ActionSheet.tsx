import { useEffect, useCallback } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface ActionSheetAction {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  icon?: preact.ComponentChildren;
}

interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
  actions: ActionSheetAction[];
  title?: string;
  message?: string;
  cancelLabel?: string;
}

export function ActionSheet({
  open,
  onClose,
  actions,
  title,
  message,
  cancelLabel = 'Cancel',
}: ActionSheetProps) {
  const dismiss = useCallback(() => {
    haptic('light');
    onClose();
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, dismiss]);

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[var(--z-modal-backdrop)] animate-[asFadeIn_150ms_ease-out]"
        onClick={dismiss}
      />

      {/* Sheet */}
      <div
        class="fixed bottom-0 left-2 right-2 z-[var(--z-modal)] animate-[asSlideUp_200ms_cubic-bezier(0.16,1,0.3,1)]"
        style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))' }}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Actions'}
      >
        {/* Action group */}
        <div class="bg-white/95 backdrop-blur-[20px] rounded-[14px] overflow-hidden shadow-[0_-4px_20px_rgba(0,0,0,0.1)] mb-2">
          {(title || message) && (
            <div class="px-4 py-3 text-center border-b border-black/[0.06]">
              {title && (
                <p class="text-[13px] font-semibold text-[var(--gray-500,#64748b)] m-0">{title}</p>
              )}
              {message && (
                <p class="text-[12px] text-[var(--gray-400,#94a3b8)] m-0 mt-0.5">{message}</p>
              )}
            </div>
          )}

          {actions.map((action, i) => (
            <button
              key={i}
              class={cn(
                'w-full min-h-[56px] flex items-center justify-center gap-2.5 px-4',
                'text-[17px] font-normal border-none bg-transparent cursor-pointer',
                'active:bg-black/[0.04] transition-colors duration-100',
                i < actions.length - 1 && 'border-b border-black/[0.06]',
                action.destructive
                  ? 'text-[var(--data-red,#ef4444)]'
                  : 'text-[var(--blu-primary,#0066ff)]',
              )}
              onClick={() => {
                haptic(action.destructive ? 'warning' : 'light');
                action.onClick();
                onClose();
              }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>

        {/* Cancel */}
        <div class="bg-white/95 backdrop-blur-[20px] rounded-[14px] overflow-hidden shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          <button
            class="w-full min-h-[56px] flex items-center justify-center text-[17px] font-semibold text-[var(--blu-primary,#0066ff)] border-none bg-transparent cursor-pointer active:bg-black/[0.04] transition-colors duration-100"
            onClick={dismiss}
          >
            {cancelLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes asFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes asSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>,
    document.body,
  );
}

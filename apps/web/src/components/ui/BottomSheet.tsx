import { useEffect, useRef, useCallback } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import type { ComponentChildren } from 'preact';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ComponentChildren;
  title?: string;
  className?: string;
}

export function BottomSheet({ open, onClose, children, title, className }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentTranslate = useRef(0);
  const isDragging = useRef(false);

  const dismiss = useCallback(() => {
    haptic('light');
    onClose();
  }, [onClose]);

  // Drag to dismiss
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || !open) return;

    function handleTouchStart(e: TouchEvent) {
      // Only drag from the handle area (top 48px)
      const touch = e.touches[0];
      const rect = sheet!.getBoundingClientRect();
      if (touch.clientY - rect.top > 48) return;

      startY.current = touch.clientY;
      isDragging.current = true;
      sheet!.style.transition = 'none';
    }

    function handleTouchMove(e: TouchEvent) {
      if (!isDragging.current) return;

      const diff = e.touches[0].clientY - startY.current;
      if (diff < 0) return; // don't drag up beyond origin

      currentTranslate.current = diff;
      sheet!.style.transform = `translateY(${diff}px)`;
    }

    function handleTouchEnd() {
      if (!isDragging.current) return;
      isDragging.current = false;
      sheet!.style.transition = '';

      if (currentTranslate.current > 100) {
        dismiss();
      } else {
        sheet!.style.transform = '';
      }
      currentTranslate.current = 0;
    }

    sheet.addEventListener('touchstart', handleTouchStart, { passive: true });
    sheet.addEventListener('touchmove', handleTouchMove, { passive: true });
    sheet.addEventListener('touchend', handleTouchEnd);

    return () => {
      sheet.removeEventListener('touchstart', handleTouchStart);
      sheet.removeEventListener('touchmove', handleTouchMove);
      sheet.removeEventListener('touchend', handleTouchEnd);
    };
  }, [open, dismiss]);

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
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[var(--z-modal-backdrop)] animate-[fadeIn_150ms_ease-out]"
        onClick={dismiss}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        class={cn(
          'fixed bottom-0 left-0 right-0 z-[var(--z-modal)]',
          'bg-white/95 backdrop-blur-[20px] border-t border-white/60',
          'rounded-t-[20px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)]',
          'animate-[slideUp_200ms_cubic-bezier(0.16,1,0.3,1)]',
          className,
        )}
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Handle */}
        <div class="flex justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing">
          <div class="w-9 h-1 bg-black/10 rounded-full" />
        </div>

        {/* Title */}
        {title && (
          <h2 class="text-[17px] font-semibold text-[var(--gray-900,#0f172a)] text-center px-5 pb-3 m-0">
            {title}
          </h2>
        )}

        {/* Content */}
        <div class="px-5 pb-2 max-h-[70dvh] overflow-y-auto [-webkit-overflow-scrolling:touch]">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>,
    document.body,
  );
}

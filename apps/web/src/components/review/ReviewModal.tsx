import { useEffect, useRef } from 'preact/hooks';
import { X } from 'lucide-react';
import type { ComponentChildren } from 'preact';

interface ReviewModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ComponentChildren;
}

export function ReviewModal({ open, title, onClose, children }: ReviewModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div class="review-modal-overlay" onClick={onClose} role="presentation">
      <style>{modalStyles}</style>
      <div
        ref={contentRef}
        class="review-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div class="review-modal-header">
          <h3 class="review-modal-title">{title}</h3>
          <button class="review-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div class="review-modal-body">{children}</div>
      </div>
    </div>
  );
}

const modalStyles = `
  .review-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 1000;
    padding: 0;
    animation: rmOverlayIn 0.2s ease;
  }

  @media (min-width: 481px) {
    .review-modal-overlay {
      align-items: center;
      padding: 20px;
    }
  }

  @keyframes rmOverlayIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .review-modal-content {
    background: var(--white, #fff);
    border-radius: 20px 20px 0 0;
    max-width: 480px;
    width: 100%;
    max-height: 92dvh;
    max-height: 92vh;
    display: flex;
    flex-direction: column;
    position: relative;
    box-shadow: 0 -4px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04);
    animation: rmSheetUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @media (min-width: 481px) {
    .review-modal-content {
      border-radius: 20px;
      max-height: calc(100dvh - 40px);
      max-height: calc(100vh - 40px);
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04);
      animation: rmSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
  }

  @keyframes rmSheetUp {
    from {
      opacity: 0;
      transform: translateY(100%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes rmSlideUp {
    from {
      opacity: 0;
      transform: translateY(16px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .review-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 20px 0;
    flex-shrink: 0;
  }

  .review-modal-header::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 36px;
    height: 4px;
    background: var(--gray-300, #cbd5e1);
    border-radius: 2px;
  }

  @media (min-width: 481px) {
    .review-modal-header::before {
      display: none;
    }
    .review-modal-header {
      padding: 24px 24px 0;
    }
  }

  .review-modal-title {
    font-size: 17px;
    font-weight: 650;
    color: var(--gray-900);
    margin: 0;
    letter-spacing: -0.01em;
  }

  .review-modal-close {
    background: var(--gray-100, #f1f5f9);
    border: none;
    color: var(--gray-500);
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .review-modal-close:hover {
    background: var(--gray-200);
    color: var(--gray-700);
  }

  .review-modal-close:active {
    transform: scale(0.92);
  }

  .review-modal-body {
    padding: 16px 20px 24px;
    padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  @media (min-width: 481px) {
    .review-modal-body {
      padding: 16px 24px 24px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .review-modal-overlay,
    .review-modal-content {
      animation: none !important;
    }
  }
`;

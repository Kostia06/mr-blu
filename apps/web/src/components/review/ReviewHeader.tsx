import { ChevronLeft } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';

interface ReviewHeaderProps {
  title?: string;
  onBack: () => void;
}

export function ReviewHeader({ title, onBack }: ReviewHeaderProps) {
  const { t } = useI18nStore();

  return (
    <>
      <style>{componentStyles}</style>
      <header class="review-header">
        <button class="review-header-back" onClick={onBack} aria-label={t('review.back')}>
          <ChevronLeft size={22} strokeWidth={2.2} />
        </button>
        <h1 class="review-header-title">{title || t('review.review')}</h1>
        <div class="review-header-spacer" />
      </header>
    </>
  );
}

const componentStyles = `
  .review-header {
    position: sticky;
    top: 0;
    z-index: var(--z-sticky, 40);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3, 12px) var(--page-padding-x, 20px);
    padding-top: calc(var(--space-3, 12px) + env(safe-area-inset-top, 0px));
    background: transparent;
  }

  .review-header-back {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--glass-white-50, rgba(255, 255, 255, 0.5));
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    color: var(--gray-600, #475569);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .review-header-back:hover {
    background: var(--glass-white-70, rgba(255, 255, 255, 0.7));
    color: var(--gray-900, #0f172a);
  }

  .review-header-back:active {
    transform: scale(0.93);
  }

  .review-header-title {
    font-family: var(--font-display, system-ui);
    font-size: 18px;
    font-weight: 700;
    color: var(--gray-900, #0f172a);
    margin: 0;
    letter-spacing: -0.02em;
  }

  .review-header-spacer {
    width: 44px;
  }
`;

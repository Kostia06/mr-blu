import { useEffect, useState } from 'preact/hooks';
import { Lightbulb, X } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { useTutorialStore } from '@/stores/tutorialStore';

export function HintTooltip() {
  const t = useI18nStore((s) => s.t);
  const activeHint = useTutorialStore((s) => s.activeHint);
  const dismissHint = useTutorialStore((s) => s.dismissHint);
  const disableAllHints = useTutorialStore((s) => s.disableAllHints);

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  function calculatePosition(rect: DOMRect) {
    if (!activeHint) return;

    const padding = activeHint.spotlightPadding || 8;
    const tooltipWidth = 280;
    const tooltipHeight = 140;
    const gap = 12;

    let x = 0;
    let y = 0;

    switch (activeHint.position) {
      case 'top':
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.top - tooltipHeight - gap - padding;
        break;
      case 'bottom':
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.bottom + gap + padding;
        break;
      case 'left':
        x = rect.left - tooltipWidth - gap - padding;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
      case 'right':
        x = rect.right + gap + padding;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
      case 'center':
        x = window.innerWidth / 2 - tooltipWidth / 2;
        y = window.innerHeight / 2 - tooltipHeight / 2;
        break;
    }

    x = Math.max(16, Math.min(x, window.innerWidth - tooltipWidth - 16));
    y = Math.max(16, Math.min(y, window.innerHeight - tooltipHeight - 16));

    setPosition({ x, y });
  }

  useEffect(() => {
    if (!activeHint) {
      setTargetRect(null);
      setIsVisible(false);
      return;
    }

    const findTarget = () => {
      const target = document.querySelector(activeHint.targetSelector);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
        calculatePosition(rect);
      } else {
        setPosition({
          x: window.innerWidth / 2 - 140,
          y: window.innerHeight / 2 - 80,
        });
      }
    };

    // Small delay to let UI settle
    const timer = setTimeout(() => {
      findTarget();
      setIsVisible(true);
    }, 100);

    window.addEventListener('resize', findTarget);
    window.addEventListener('scroll', findTarget, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', findTarget);
      window.removeEventListener('scroll', findTarget, true);
    };
  }, [activeHint]);

  function handleDismiss() {
    if (activeHint) {
      dismissHint(activeHint.id);
    }
  }

  function handleDisableAll() {
    disableAllHints();
  }

  if (!activeHint) return null;

  const spotlightPadding = activeHint.spotlightPadding || 8;

  return (
    <>
      {targetRect && (
        <div
          class={`hint-highlight ${isVisible ? 'hint-highlight--visible' : ''}`}
          style={{
            left: `${targetRect.left - spotlightPadding}px`,
            top: `${targetRect.top - spotlightPadding}px`,
            width: `${targetRect.width + spotlightPadding * 2}px`,
            height: `${targetRect.height + spotlightPadding * 2}px`,
          }}
        />
      )}

      <div
        class={`hint-tooltip ${isVisible ? 'hint-tooltip--visible' : ''}`}
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      >
        <button
          class="hint-close-btn"
          onClick={handleDismiss}
          aria-label={t('common.close')}
        >
          <X size={14} />
        </button>

        <div class="hint-content">
          <div class="hint-icon">
            <Lightbulb size={16} />
          </div>
          <div class="hint-text">
            <h4 class="hint-title">{t(activeHint.title)}</h4>
            <p class="hint-description">{t(activeHint.description)}</p>
          </div>
        </div>

        <div class="hint-actions">
          <button class="hint-disable-btn" onClick={handleDisableAll}>
            {t('tutorial.hints.dontShowAgain')}
          </button>
          <button class="hint-got-it-btn" onClick={handleDismiss}>
            {t('tutorial.hints.gotIt')}
          </button>
        </div>
      </div>

      <style>{`
        .hint-highlight {
          position: fixed;
          border-radius: 12px;
          box-shadow:
            0 0 0 4px rgba(0, 102, 255, 0.25),
            0 0 24px rgba(0, 102, 255, 0.15);
          pointer-events: none;
          z-index: 998;
          opacity: 0;
          transition: opacity 0.2s ease;
          animation: hint-pulse-highlight 2s ease-in-out infinite;
        }

        .hint-highlight--visible {
          opacity: 1;
        }

        @keyframes hint-pulse-highlight {
          0%, 100% {
            box-shadow:
              0 0 0 4px rgba(0, 102, 255, 0.25),
              0 0 24px rgba(0, 102, 255, 0.15);
          }
          50% {
            box-shadow:
              0 0 0 6px rgba(0, 102, 255, 0.35),
              0 0 32px rgba(0, 102, 255, 0.25);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hint-highlight {
            animation: none;
          }
        }

        .hint-tooltip {
          position: fixed;
          background: white;
          border-radius: 14px;
          padding: 16px;
          width: 280px;
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 0 0 1px rgba(0, 0, 0, 0.05);
          z-index: 999;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .hint-tooltip--visible {
          opacity: 1;
          transform: translateY(0);
        }

        .hint-close-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.05);
          border: none;
          border-radius: 6px;
          color: var(--gray-400, #94a3b8);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .hint-close-btn:hover {
          background: rgba(0, 0, 0, 0.1);
          color: var(--gray-600, #475569);
        }

        .hint-content {
          display: flex;
          gap: 12px;
        }

        .hint-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 102, 255, 0.1);
          border-radius: 8px;
          color: var(--blu-primary, #0066ff);
          flex-shrink: 0;
        }

        .hint-text {
          flex: 1;
          min-width: 0;
        }

        .hint-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-900, #0f172a);
          margin: 0 0 4px;
        }

        .hint-description {
          font-size: 13px;
          color: var(--gray-600, #475569);
          line-height: 1.5;
          margin: 0;
        }

        .hint-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid var(--gray-100, #f1f5f9);
        }

        .hint-disable-btn {
          background: none;
          border: none;
          color: var(--gray-400, #94a3b8);
          font-size: 12px;
          cursor: pointer;
          padding: 4px;
          transition: color 0.15s ease;
        }

        .hint-disable-btn:hover {
          color: var(--gray-600, #475569);
        }

        .hint-got-it-btn {
          background: none;
          border: none;
          color: var(--blu-primary, #0066ff);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
          transition: opacity 0.15s ease;
        }

        .hint-got-it-btn:hover {
          opacity: 0.8;
        }
      `}</style>
    </>
  );
}

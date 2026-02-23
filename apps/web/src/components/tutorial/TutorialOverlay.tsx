import { useEffect, useState, useRef, useMemo } from 'preact/hooks';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { useTutorialStore } from '@/stores/tutorialStore';

export function TutorialOverlay() {
  const t = useI18nStore((s) => s.t);
  const isActive = useTutorialStore((s) => s.isActive);
  const currentStep = useTutorialStore((s) => s.currentStep);
  const currentStepData = useTutorialStore((s) => s.currentStepData);
  const totalSteps = useTutorialStore((s) => s.totalSteps);
  const isLastStep = useTutorialStore((s) => s.isLastStep);
  const nextStep = useTutorialStore((s) => s.nextStep);
  const prevStep = useTutorialStore((s) => s.prevStep);
  const skipTutorial = useTutorialStore((s) => s.skipTutorial);
  const endTutorial = useTutorialStore((s) => s.endTutorial);

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  function calculateTooltipPosition(rect: DOMRect, position: string) {
    const padding = currentStepData?.spotlightPadding || 8;
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const gap = 16;

    let x = 0;
    let y = 0;

    switch (position) {
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

    setTooltipPosition({ x, y });
  }

  useEffect(() => {
    if (!isActive || !currentStepData) {
      setTargetRect(null);
      setIsVisible(false);
      return;
    }

    const findTarget = () => {
      const target = document.querySelector(currentStepData.targetSelector);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
        calculateTooltipPosition(rect, currentStepData.position);
      } else {
        setTargetRect(null);
        setTooltipPosition({
          x: window.innerWidth / 2 - 160,
          y: window.innerHeight / 2 - 100,
        });
      }
    };

    findTarget();
    // Trigger visibility after a small delay for animation
    requestAnimationFrame(() => setIsVisible(true));

    window.addEventListener('resize', findTarget);
    window.addEventListener('scroll', findTarget, true);

    return () => {
      window.removeEventListener('resize', findTarget);
      window.removeEventListener('scroll', findTarget, true);
    };
  }, [isActive, currentStepData, currentStep]);

  // Reset visibility on step change for re-animation
  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [currentStep]);

  if (!isActive || !currentStepData) return null;

  const spotlightPadding = currentStepData.spotlightPadding || 8;

  return (
    <div class="tutorial-overlay">
      <svg class="spotlight-svg">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - spotlightPadding}
                y={targetRect.top - spotlightPadding}
                width={targetRect.width + spotlightPadding * 2}
                height={targetRect.height + spotlightPadding * 2}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>

        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
        />

        {targetRect && (
          <rect
            x={targetRect.left - spotlightPadding}
            y={targetRect.top - spotlightPadding}
            width={targetRect.width + spotlightPadding * 2}
            height={targetRect.height + spotlightPadding * 2}
            rx="12"
            fill="none"
            stroke="#0066FF"
            stroke-width="2"
            class="spotlight-border"
          />
        )}
      </svg>

      <div
        ref={tooltipRef}
        class={`tutorial-tooltip ${isVisible ? 'tutorial-tooltip--visible' : ''}`}
        style={{ left: `${tooltipPosition.x}px`, top: `${tooltipPosition.y}px` }}
      >
        <div class="progress-row">
          <div class="progress-dots">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                class={`progress-dot ${i <= currentStep ? 'active' : ''} ${i === currentStep ? 'current' : ''}`}
              />
            ))}
          </div>
          <span class="progress-text">
            {currentStep + 1} / {totalSteps}
          </span>
        </div>

        <h3 class="tooltip-title">{t(currentStepData.title)}</h3>
        <p class="tooltip-description">{t(currentStepData.description)}</p>

        <div class="tooltip-actions">
          <div class="action-left">
            {currentStep > 0 && (
              <button class="nav-btn back" onClick={prevStep}>
                <ChevronLeft size={16} />
                {t('tutorial.navigation.back')}
              </button>
            )}
            {currentStepData.showSkip && (
              <button class="skip-btn" onClick={skipTutorial}>
                {t('tutorial.navigation.skipAll')}
              </button>
            )}
          </div>

          <button
            class="nav-btn next"
            onClick={isLastStep ? endTutorial : nextStep}
          >
            {isLastStep ? t('tutorial.navigation.finish') : t('tutorial.navigation.next')}
            {!isLastStep && <ChevronRight size={16} />}
          </button>
        </div>
      </div>

      <style>{`
        .tutorial-overlay {
          position: fixed;
          inset: 0;
          z-index: 999;
          pointer-events: none;
        }

        .spotlight-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: auto;
        }

        .spotlight-border {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
            filter: drop-shadow(0 0 8px rgba(0, 102, 255, 0.5));
          }
          50% {
            opacity: 0.8;
            filter: drop-shadow(0 0 16px rgba(0, 102, 255, 0.8));
          }
        }

        .tutorial-tooltip {
          position: absolute;
          background: white;
          border-radius: 16px;
          padding: 20px;
          width: 320px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
          pointer-events: auto;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .tutorial-tooltip--visible {
          opacity: 1;
          transform: translateY(0);
        }

        .progress-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .progress-dots {
          display: flex;
          gap: 6px;
        }

        .progress-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--gray-200, #e2e8f0);
          transition: all 0.2s ease;
        }

        .progress-dot.active {
          background: var(--blu-primary, #0066ff);
        }

        .progress-dot.current {
          width: 20px;
          border-radius: 4px;
        }

        .progress-text {
          font-size: 12px;
          color: var(--gray-400, #94a3b8);
        }

        .tooltip-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--gray-900, #0f172a);
          margin: 0 0 8px;
          letter-spacing: -0.01em;
        }

        .tooltip-description {
          font-size: 14px;
          color: var(--gray-600, #475569);
          line-height: 1.6;
          margin: 0 0 20px;
        }

        .tooltip-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .action-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 10px 16px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .nav-btn.back {
          background: rgba(0, 0, 0, 0.05);
          color: var(--gray-600, #475569);
        }

        .nav-btn.back:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .nav-btn.next {
          background: var(--blu-primary, #0066ff);
          color: white;
        }

        .nav-btn.next:hover {
          background: #0052cc;
        }

        .skip-btn {
          background: none;
          border: none;
          color: var(--gray-400, #94a3b8);
          font-size: 12px;
          cursor: pointer;
          padding: 4px 8px;
          transition: color 0.15s ease;
        }

        .skip-btn:hover {
          color: var(--gray-600, #475569);
        }

        @media (prefers-reduced-motion: reduce) {
          .spotlight-border {
            animation: none;
          }

          .progress-dot {
            transition: none;
          }

          .tutorial-tooltip {
            transition: none;
          }
        }

        @media (max-width: 480px) {
          .tutorial-tooltip {
            width: calc(100vw - 32px);
            max-width: 320px;
          }

          .tooltip-actions {
            flex-direction: column-reverse;
            gap: 12px;
          }

          .action-left {
            width: 100%;
            justify-content: space-between;
          }

          .nav-btn.next {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

import { Sparkles } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';

interface ReviewLoadingStateProps {
  message?: string;
  currentStep?: number;
}

export function ReviewLoadingState({ message, currentStep = 0 }: ReviewLoadingStateProps) {
  const { t } = useI18nStore();

  const steps = [
    t('dashboard.parsingRequest'),
    t('dashboard.identifyingType'),
    t('dashboard.extractingDetails'),
  ];

  return (
    <>
      <style>{componentStyles}</style>
      <div class="rl-container" role="status" aria-live="polite">
        <div class="rl-visual">
          <div class="rl-ring" />
          <div class="rl-ring rl-ring-inner" />
          <div class="rl-icon">
            <Sparkles size={28} strokeWidth={1.5} />
          </div>
        </div>

        <h2 class="rl-title">{t('dashboard.processing')}</h2>
        <p class="rl-desc">{message || t('dashboard.aiUnderstanding')}</p>

        <div class="rl-steps">
          {steps.map((label, index) => {
            const isDone = currentStep > index;
            const isActive = currentStep === index;
            return (
              <div
                key={index}
                class={`rl-step${isDone ? ' done' : ''}${isActive ? ' active' : ''}`}
              >
                <div class="rl-step-dot" />
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

const componentStyles = `
  @keyframes rlSpin {
    to { transform: rotate(360deg); }
  }

  @keyframes rlDotPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.4); opacity: 0.7; }
  }

  @media (prefers-reduced-motion: reduce) {
    .rl-ring, .rl-step-dot {
      animation: none !important;
    }
  }

  .rl-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px var(--page-padding-x, 20px);
    text-align: center;
  }

  .rl-visual {
    position: relative;
    width: 100px;
    height: 100px;
    margin-bottom: 28px;
  }

  .rl-ring {
    position: absolute;
    inset: 0;
    border: 2.5px solid transparent;
    border-top-color: var(--blu-primary, #0066ff);
    border-radius: 50%;
    animation: rlSpin 1.2s linear infinite;
  }

  .rl-ring.rl-ring-inner {
    inset: 14px;
    border-top-color: rgba(0, 102, 255, 0.25);
    animation-direction: reverse;
    animation-duration: 0.9s;
  }

  .rl-icon {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--blu-primary, #0066ff);
  }

  .rl-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--gray-900, #0f172a);
    margin: 0 0 6px;
    letter-spacing: -0.02em;
  }

  .rl-desc {
    font-size: 14px;
    color: var(--gray-500, #64748b);
    margin: 0 0 32px;
  }

  .rl-steps {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .rl-step {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    font-weight: 500;
    color: var(--gray-400, #94a3b8);
    transition: color 0.3s ease;
  }

  .rl-step.active {
    color: var(--blu-primary, #0066ff);
  }

  .rl-step.done {
    color: var(--data-green, #10b981);
  }

  .rl-step-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--gray-300, #cbd5e1);
    transition: background 0.3s ease, transform 0.3s ease;
    flex-shrink: 0;
  }

  .rl-step.active .rl-step-dot {
    background: var(--blu-primary, #0066ff);
    animation: rlDotPulse 1.2s ease-in-out infinite;
  }

  .rl-step.done .rl-step-dot {
    background: var(--data-green, #10b981);
  }
`;

import { Rocket, Loader2, Lock } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';

interface ReviewExecuteButtonProps {
  isExecuting: boolean;
  canExecute: boolean;
  onExecute: () => void;
  onLockedClick?: () => void;
  documentType?: string;
  total?: string;
  actionCount?: number;
}

export function ReviewExecuteButton({
  isExecuting,
  canExecute,
  onExecute,
  onLockedClick,
  documentType,
  total,
  actionCount = 1,
}: ReviewExecuteButtonProps) {
  const { t } = useI18nStore();

  function handleClick() {
    if (isExecuting) return;
    if (!canExecute) {
      onLockedClick?.();
      return;
    }
    onExecute();
  }

  const isLocked = !canExecute && !isExecuting;
  const label = documentType
    ? `${t('review.create')} ${documentType}`
    : t('review.executeAll');

  return (
    <>
      <style>{styles}</style>
      <div class="exec-wrapper">
        <button
          class={`exec-btn${isExecuting ? ' executing' : ''}${isLocked ? ' locked' : ''}`}
          onClick={handleClick}
          disabled={isExecuting}
        >
          <div class="exec-inner">
            <div class="exec-left">
              <div class={`exec-icon-wrap${isLocked ? ' icon-locked' : ''}`}>
                {isExecuting ? (
                  <Loader2 size={18} strokeWidth={2.5} class="exec-spin" />
                ) : isLocked ? (
                  <Lock size={16} strokeWidth={2.5} />
                ) : (
                  <Rocket size={18} strokeWidth={2.5} />
                )}
              </div>
              <div class="exec-label-group">
                <span class="exec-label">
                  {isExecuting ? t('review.executing') : label}
                </span>
                {isLocked && (
                  <span class="exec-hint">Fix errors above</span>
                )}
              </div>
            </div>

            {total && !isExecuting && (
              <div class={`exec-badge${isLocked ? ' badge-locked' : ''}`}>
                {total}
              </div>
            )}
          </div>
        </button>
      </div>
    </>
  );
}

const styles = `
  @keyframes execSpin {
    to { transform: rotate(360deg); }
  }

  .exec-wrapper {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    display: flex;
    justify-content: center;
    padding: 12px 20px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
    background: linear-gradient(to top, var(--white, rgba(219,232,244,0.98)) 60%, transparent);
    pointer-events: none;
  }

  .exec-btn {
    display: flex;
    width: 100%;
    max-width: var(--page-max-width, 600px);
    margin: 0 auto;
    padding: 0 20px;
    height: 56px;
    background: var(--blu-primary, #0066ff);
    border-radius: var(--radius-button, 14px);
    border: none;
    color: white;
    cursor: pointer;
    pointer-events: auto;
    transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 8px 32px rgba(0, 102, 255, 0.3), 0 2px 8px rgba(0, 102, 255, 0.15);
  }

  .exec-btn:active:not(:disabled):not(.locked) {
    transform: scale(0.98);
    box-shadow: 0 4px 16px rgba(0, 102, 255, 0.25);
  }

  .exec-btn.locked {
    background: var(--gray-300, #cbd5e1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    cursor: pointer;
  }

  .exec-btn.locked:active {
    transform: scale(0.98);
  }

  .exec-btn.executing {
    background: var(--gray-500, #64748b);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: not-allowed;
  }

  .exec-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 12px;
  }

  .exec-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .exec-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
  }

  .exec-icon-wrap.icon-locked {
    background: rgba(255, 255, 255, 0.25);
  }

  .exec-spin {
    animation: execSpin 1s linear infinite;
  }

  .exec-label-group {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .exec-label {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .exec-hint {
    font-size: 11px;
    font-weight: 400;
    opacity: 0.7;
  }

  .exec-badge {
    padding: 5px 14px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.2);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -0.02em;
    flex-shrink: 0;
  }

  .exec-badge.badge-locked {
    background: rgba(255, 255, 255, 0.3);
  }

  @media (prefers-reduced-motion: reduce) {
    .exec-spin { animation: none !important; }
    .exec-btn { transition: none !important; }
  }
`;

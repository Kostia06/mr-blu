import { useState, useEffect } from 'preact/hooks';
import { Users, ArrowRight, Check, X } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';

interface ClientData {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface Difference {
  field: string;
  old: string | null;
  new: string | null;
}

interface ConflictData {
  existingClient: ClientData;
  newData: ClientData;
  differences: Difference[];
}

interface ContactMergeModalProps {
  open: boolean;
  conflictData: ConflictData | null;
  onClose: () => void;
  onDecision: (decision: 'keep' | 'use_new' | 'update') => void;
}

function formatFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
  };
  return labels[field] || field;
}

export function ContactMergeModal({
  open,
  conflictData,
  onClose,
  onDecision,
}: ContactMergeModalProps) {
  const t = useI18nStore((s) => s.t);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setIsProcessing(false);
    }
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isProcessing) {
        handleClose();
      }
    }

    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, isProcessing]);

  function handleClose() {
    if (isProcessing) return;
    onClose();
  }

  function handleDecision(decision: 'keep' | 'use_new' | 'update') {
    if (isProcessing) return;
    setIsProcessing(true);
    onDecision(decision);
  }

  if (!open || !conflictData) return null;

  return (
    <>
      <button
        class="merge-modal-backdrop"
        onClick={handleClose}
        aria-label={t('aria.closeModal')}
      />

      <div
        class="merge-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="merge-modal-title"
      >
        <div class="merge-modal-content">
          <button
            class="merge-close-btn"
            onClick={handleClose}
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>

          <div class="merge-modal-step">
            <div class="merge-icon-wrapper">
              <Users size={28} />
            </div>

            <h2 id="merge-modal-title" class="merge-modal-title">
              {t('merge.title')}
            </h2>

            <p class="merge-modal-description">
              {t('merge.description').replace('{name}', conflictData.existingClient.name)}
            </p>

            <div class="merge-differences-list">
              {conflictData.differences.map((diff) => (
                <div key={diff.field} class="merge-difference-item">
                  <span class="merge-diff-label">{formatFieldLabel(diff.field)}</span>
                  <div class="merge-diff-values">
                    <span class="merge-diff-old">{diff.old || '\u2014'}</span>
                    <ArrowRight size={14} class="merge-diff-arrow" />
                    <span class="merge-diff-new">{diff.new || '\u2014'}</span>
                  </div>
                </div>
              ))}
            </div>

            <div class="merge-action-options">
              <button
                class="merge-option-btn"
                onClick={() => handleDecision('keep')}
                disabled={isProcessing}
              >
                <div class="merge-option-icon keep">
                  <Check size={18} />
                </div>
                <div class="merge-option-text">
                  <span class="merge-option-title">{t('merge.keepExisting')}</span>
                  <span class="merge-option-desc">Use existing client data, ignore new</span>
                </div>
              </button>

              <button
                class="merge-option-btn"
                onClick={() => handleDecision('use_new')}
                disabled={isProcessing}
              >
                <div class="merge-option-icon use-new">
                  <ArrowRight size={18} />
                </div>
                <div class="merge-option-text">
                  <span class="merge-option-title">{t('merge.useNew')}</span>
                  <span class="merge-option-desc">Use new data for this document only</span>
                </div>
              </button>

              <button
                class="merge-option-btn highlight"
                onClick={() => handleDecision('update')}
                disabled={isProcessing}
              >
                <div class="merge-option-icon update">
                  <Users size={18} />
                </div>
                <div class="merge-option-text">
                  <span class="merge-option-title">{t('merge.updateBoth')}</span>
                  <span class="merge-option-desc">Update client record with new data</span>
                </div>
              </button>
            </div>

            <button
              class="merge-cancel-btn"
              onClick={handleClose}
              disabled={isProcessing}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .merge-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 1000;
          border: none;
          cursor: default;
          animation: merge-fade-in 0.2s ease forwards;
        }

        .merge-modal-container {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 1001;
          padding: 0;
          overflow-y: auto;
          animation: merge-fly-in 0.3s cubic-bezier(0.33, 1, 0.68, 1) forwards;
        }

        .merge-modal-content {
          position: relative;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: var(--radius-lg, 16px) var(--radius-lg, 16px) 0 0;
          padding: 32px 24px calc(24px + var(--safe-area-bottom, 0px));
          max-width: 400px;
          width: 100%;
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .merge-modal-content::before {
          content: '';
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 36px;
          height: 5px;
          background: #D1D1D6;
          border-radius: 3px;
        }

        .merge-close-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gray-100, #f1f5f9);
          border: none;
          border-radius: 50%;
          color: var(--gray-500, #64748b);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .merge-close-btn:hover {
          background: var(--gray-200, #e2e8f0);
          color: var(--gray-700, #334155);
        }

        .merge-modal-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .merge-icon-wrapper {
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          margin-bottom: 16px;
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .merge-modal-title {
          font-family: var(--font-display, system-ui);
          font-size: 22px;
          font-weight: 700;
          color: var(--gray-900, #0f172a);
          margin: 0 0 8px;
        }

        .merge-modal-description {
          font-size: 14px;
          color: var(--gray-500, #64748b);
          margin: 0 0 20px;
          line-height: 1.5;
        }

        .merge-differences-list {
          width: 100%;
          background: var(--gray-50, #f8fafc);
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 20px;
        }

        .merge-difference-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 10px;
          border-radius: 8px;
          background: white;
        }

        .merge-difference-item:not(:last-child) {
          margin-bottom: 8px;
        }

        .merge-diff-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--gray-400, #9ca3af);
        }

        .merge-diff-values {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .merge-diff-old {
          flex: 1;
          font-size: 13px;
          color: var(--gray-500, #64748b);
          text-decoration: line-through;
          text-align: left;
          word-break: break-word;
        }

        .merge-diff-arrow {
          color: var(--gray-300, #cbd5e1);
          flex-shrink: 0;
        }

        .merge-diff-new {
          flex: 1;
          font-size: 13px;
          font-weight: 600;
          color: var(--gray-900, #0f172a);
          text-align: right;
          word-break: break-word;
        }

        .merge-action-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          margin-bottom: 16px;
        }

        .merge-option-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 14px 16px;
          background: white;
          border: 2px solid var(--gray-100, #f1f5f9);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .merge-option-btn:hover:not(:disabled) {
          border-color: var(--gray-200, #e2e8f0);
          background: var(--gray-50, #f8fafc);
        }

        .merge-option-btn.highlight {
          border-color: rgba(0, 102, 255, 0.2);
          background: rgba(0, 102, 255, 0.02);
        }

        .merge-option-btn.highlight:hover:not(:disabled) {
          border-color: var(--blu-primary, #0066ff);
          background: rgba(0, 102, 255, 0.05);
        }

        .merge-option-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .merge-option-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          flex-shrink: 0;
        }

        .merge-option-icon.keep {
          background: var(--gray-100, #f1f5f9);
          color: var(--gray-600, #475569);
        }

        .merge-option-icon.use-new {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .merge-option-icon.update {
          background: rgba(0, 102, 255, 0.1);
          color: var(--blu-primary, #0066ff);
        }

        .merge-option-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .merge-option-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--gray-900, #0f172a);
        }

        .merge-option-desc {
          font-size: 12px;
          color: var(--gray-500, #64748b);
        }

        .merge-cancel-btn {
          padding: 12px 20px;
          background: transparent;
          border: none;
          color: var(--gray-500, #64748b);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .merge-cancel-btn:hover:not(:disabled) {
          color: var(--gray-700, #334155);
        }

        .merge-cancel-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes merge-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes merge-fly-in {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

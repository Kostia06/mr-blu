import { Check, Download, ArrowRight, Plus } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { navigateTo } from '@/lib/navigation';

interface DoneStateProps {
  title?: string;
  message?: string;
  documentId?: string | null;
  documentType?: 'invoice' | 'estimate';
  onViewDocuments?: () => void;
  onDownload?: () => void;
  onNewRecording: () => void;
}

export function DoneState({
  title,
  message,
  documentId = null,
  documentType = 'invoice',
  onViewDocuments,
  onDownload,
  onNewRecording,
}: DoneStateProps) {
  const { t } = useI18nStore();

  function handleViewDocument() {
    if (documentId) {
      navigateTo(`/dashboard/documents/${documentId}?type=${documentType}`);
    } else if (onViewDocuments) {
      onViewDocuments();
    } else {
      navigateTo('/dashboard/documents');
    }
  }

  return (
    <>
      <style>{componentStyles}</style>
      <div class="done-state">
        <div class="done-icon-ring">
          <div class="done-icon">
            <Check size={40} strokeWidth={2.5} />
          </div>
        </div>
        <h2 class="done-heading">{title || t('review.allDone')}</h2>
        <p class="done-description">{message || t('review.allActionsCompleted')}</p>
        <div class="done-actions">
          <button class="done-btn primary" onClick={handleViewDocument}>
            <span>{documentId ? t('review.viewDocument') : t('review.viewDocuments')}</span>
            <ArrowRight size={18} />
          </button>
          {onDownload && (
            <button class="done-btn secondary" onClick={onDownload}>
              <Download size={18} />
              <span>{t('review.downloadPdf')}</span>
            </button>
          )}
          <button class="done-btn ghost" onClick={onNewRecording}>
            <Plus size={18} />
            <span>{t('review.newRecording')}</span>
          </button>
        </div>
      </div>
    </>
  );
}

const componentStyles = `
  @keyframes doneIconPop {
    0% { transform: scale(0); opacity: 0; }
    60% { transform: scale(1.08); }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes doneRingPulse {
    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.3); }
    70% { box-shadow: 0 0 0 16px rgba(16, 185, 129, 0); }
    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .done-icon-ring, .done-icon {
      animation: none !important;
    }
  }

  .done-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 24px;
    text-align: center;
  }

  .done-icon-ring {
    width: 88px;
    height: 88px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.1);
    margin-bottom: 24px;
    animation: doneRingPulse 2s ease-out 0.5s;
  }

  .done-icon {
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    animation: doneIconPop 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
  }

  .done-heading {
    font-size: 24px;
    font-weight: 700;
    color: var(--gray-900, #0f172a);
    margin: 0 0 8px;
    letter-spacing: -0.02em;
  }

  .done-description {
    font-size: 15px;
    color: var(--gray-500, #64748b);
    margin: 0 0 36px;
    max-width: 280px;
  }

  .done-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    max-width: 300px;
  }

  .done-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 24px;
    height: 48px;
    border: none;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .done-btn:active {
    transform: scale(0.97);
  }

  .done-btn.primary {
    background: var(--blu-primary, #0066ff);
    color: white;
    box-shadow: 0 4px 16px rgba(0, 102, 255, 0.25);
  }

  .done-btn.primary:hover {
    box-shadow: 0 6px 20px rgba(0, 102, 255, 0.35);
  }

  .done-btn.secondary {
    background: var(--white, #fff);
    border: 1px solid var(--gray-200, #e2e8f0);
    color: var(--gray-700, #334155);
  }

  .done-btn.secondary:hover {
    background: var(--gray-50, #f8fafc);
    border-color: var(--gray-300);
  }

  .done-btn.ghost {
    background: transparent;
    color: var(--gray-500, #64748b);
  }

  .done-btn.ghost:hover {
    color: var(--gray-700);
    background: var(--gray-100);
  }
`;

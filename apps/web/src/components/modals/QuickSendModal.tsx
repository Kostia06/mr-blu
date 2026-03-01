import { useState, useEffect, useCallback } from 'preact/hooks';
import { Send, Mail, Check, X, AlertCircle, Loader2, MessageSquare } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { useModalState } from '@/stores/appStateStore';
import { sendDocument } from '@/lib/api/documents';

interface DocumentInfo {
  id: string;
  type: 'invoice' | 'estimate' | 'contract';
  title: string;
  client: string;
  clientEmail?: string | null;
  amount?: number;
}

interface QuickSendModalProps {
  open: boolean;
  document: DocumentInfo | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getEmailClass(email: string, isValid: boolean): string {
  if (email.length === 0) return 'sm-input';
  return isValid ? 'sm-input valid' : 'sm-input invalid';
}

export function QuickSendModal({ open, document, onClose, onSuccess }: QuickSendModalProps) {
  const { t } = useI18nStore();
  useModalState(open);
  const [email, setEmail] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isEmailValid = EMAIL_REGEX.test(email);

  useEffect(() => {
    if (open) {
      setCustomMessage('');
      setError(null);
      setSuccess(false);
      setIsSending(false);
      setEmail(document?.clientEmail || '');
    }
  }, [open, document?.clientEmail]);

  useEffect(() => {
    if (!open) return;
    window.document.body.style.overflow = 'hidden';
    return () => {
      window.document.body.style.overflow = '';
    };
  }, [open]);

  const handleClose = useCallback(() => {
    if (isSending) return;
    setEmail('');
    setCustomMessage('');
    setError(null);
    setSuccess(false);
    onClose();
  }, [isSending, onClose]);

  const handleSend = useCallback(async () => {
    if (!document || !isEmailValid || isSending) return;
    setIsSending(true);
    setError(null);

    try {
      const result = await sendDocument(
        document.id,
        document.type as 'invoice' | 'estimate',
        'email',
        { email, name: document.client },
        customMessage || undefined
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to send document');
      }

      setSuccess(true);
      setTimeout(() => {
        handleClose();
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send document');
      setIsSending(false);
    }
  }, [document, email, customMessage, isEmailValid, isSending, handleClose, onSuccess]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSending) handleClose();
      if (e.key === 'Enter' && isEmailValid && !isSending && !success) handleSend();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isSending, isEmailValid, success, handleClose, handleSend]);

  if (!open || !document) return null;

  const typeLabel =
    document.type === 'invoice'
      ? t('review.invoice')
      : document.type === 'estimate'
        ? t('review.estimate')
        : t('documents.contracts');

  return (
    <div class="sm-overlay" onClick={handleClose} role="presentation">
      <style>{smStyles}</style>
      <div
        class="sm-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-modal-title"
        tabIndex={-1}
      >
        <div class="sm-header">
          <div class="sm-header-left">
            <div class="sm-header-icon">
              <Send size={18} />
            </div>
            <div>
              <h2 id="send-modal-title" class="sm-title">
                {t('docDetail.sendToClient')}
              </h2>
              <p class="sm-subtitle">
                {typeLabel} &middot; {document.client}
              </p>
            </div>
          </div>
          <button class="sm-close" onClick={handleClose} aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div class="sm-success">
            <div class="sm-success-icon">
              <Check size={32} strokeWidth={1.5} />
            </div>
            <h2 class="sm-success-title">{t('review.sent')}</h2>
            <p class="sm-success-text">
              {t('review.sentToRecipient', { recipient: email })}
            </p>
          </div>
        ) : (
          <div class="sm-body">
            <div class="sm-info">
              <div class="sm-info-icon">
                <Mail size={18} />
              </div>
              <div class="sm-info-text">
                <p class="sm-info-title">{document.title}</p>
                <p class="sm-info-subtitle">
                  {document.client}
                  {document.amount ? ` \u2014 ${formatAmount(document.amount)}` : ''}
                </p>
              </div>
            </div>

            <div class="sm-field">
              <label for="recipient-email" class="sm-label">
                <Mail size={13} />
                {t('review.recipientEmail')}
              </label>
              <input
                id="recipient-email"
                type="email"
                class={getEmailClass(email, isEmailValid)}
                value={email}
                onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                placeholder={t('docDetail.emailPlaceholder')}
                disabled={isSending}
              />
            </div>

            <div class="sm-field">
              <label for="custom-message" class="sm-label">
                <MessageSquare size={13} />
                {t('review.customMessage')}
              </label>
              <textarea
                id="custom-message"
                class="sm-input sm-textarea"
                value={customMessage}
                onInput={(e) => setCustomMessage((e.target as HTMLTextAreaElement).value)}
                placeholder={t('placeholder.addNote')}
                rows={3}
                disabled={isSending}
              />
            </div>

            {error && (
              <div class="sm-error">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <div class="sm-actions">
              <button
                class="sm-btn sm-btn-cancel"
                onClick={handleClose}
                disabled={isSending}
              >
                {t('common.cancel')}
              </button>
              <button
                class="sm-btn sm-btn-send"
                onClick={handleSend}
                disabled={!isEmailValid || isSending}
              >
                {isSending ? (
                  <>
                    <Loader2 size={16} class="sm-spin" />
                    {t('docDetail.sending')}
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    {t('docDetail.sendEmail')}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const smStyles = `
  .sm-overlay {
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
    animation: smOverlayIn 0.2s ease;
  }

  @media (min-width: 481px) {
    .sm-overlay {
      align-items: center;
      padding: 20px;
    }
  }

  @keyframes smOverlayIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .sm-content {
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
    animation: smSheetUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @media (min-width: 481px) {
    .sm-content {
      border-radius: 20px;
      max-height: calc(100dvh - 40px);
      max-height: calc(100vh - 40px);
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04);
      animation: smSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
  }

  @keyframes smSheetUp {
    from { opacity: 0; transform: translateY(100%); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes smSlideUp {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* Header */
  .sm-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 20px 16px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--gray-100, #f1f5f9);
  }

  .sm-header::before {
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
    .sm-header::before {
      display: none;
    }
  }

  .sm-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .sm-header-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: rgba(0, 102, 255, 0.08);
    color: var(--blu-primary, #0066ff);
    flex-shrink: 0;
  }

  .sm-title {
    font-size: 17px;
    font-weight: 700;
    color: var(--gray-900, #0f172a);
    margin: 0;
    letter-spacing: -0.01em;
  }

  .sm-subtitle {
    font-size: 13px;
    color: var(--gray-400, #94a3b8);
    margin: 2px 0 0;
  }

  .sm-close {
    background: var(--gray-100, #f1f5f9);
    border: none;
    color: var(--gray-500, #64748b);
    cursor: pointer;
    width: 30px;
    height: 30px;
    padding: 0;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .sm-close:hover {
    background: var(--gray-200, #e2e8f0);
    color: var(--gray-700, #334155);
  }

  .sm-close:active {
    transform: scale(0.92);
  }

  /* Body */
  .sm-body {
    padding: 20px;
    padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Document info card */
  .sm-info {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    background: var(--gray-50, #f8fafc);
    border: 1px solid var(--gray-100, #f1f5f9);
    border-radius: 12px;
    margin-bottom: 20px;
  }

  .sm-info-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: rgba(0, 102, 255, 0.06);
    color: var(--blu-primary, #0066ff);
    flex-shrink: 0;
  }

  .sm-info-text {
    min-width: 0;
    flex: 1;
  }

  .sm-info-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--gray-900, #0f172a);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sm-info-subtitle {
    font-size: 13px;
    color: var(--gray-400, #94a3b8);
    margin: 2px 0 0;
  }

  /* Form fields */
  .sm-field {
    margin-bottom: 16px;
  }

  .sm-field:last-of-type {
    margin-bottom: 20px;
  }

  .sm-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--gray-600, #475569);
    margin-bottom: 8px;
  }

  .sm-label svg {
    color: var(--gray-400, #94a3b8);
  }

  .sm-input {
    width: 100%;
    padding: 14px 16px;
    border-radius: 14px;
    font-size: 15px;
    font-family: inherit;
    color: var(--gray-900, #0f172a);
    background: var(--gray-50, #f8fafc);
    border: 1.5px solid var(--gray-200, #e2e8f0);
    outline: none;
    box-sizing: border-box;
    transition: border-color 150ms ease;
  }

  .sm-input:focus {
    border-color: var(--blu-primary, #0066ff);
  }

  .sm-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .sm-input::placeholder {
    color: var(--gray-400, #94a3b8);
  }

  .sm-input.valid {
    border-color: #34d399;
  }

  .sm-input.invalid {
    border-color: #f87171;
  }

  .sm-textarea {
    resize: none;
    font-family: inherit;
  }

  /* Error */
  .sm-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    background: rgba(239, 68, 68, 0.08);
    color: #dc2626;
    border-radius: 12px;
    font-size: 13px;
    margin-bottom: 20px;
  }

  .sm-error svg {
    flex-shrink: 0;
  }

  /* Actions */
  .sm-actions {
    display: flex;
    gap: 12px;
  }

  .sm-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 48px;
    padding: 14px 16px;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 600;
    font-family: inherit;
    border: none;
    cursor: pointer;
    transition: transform 100ms ease;
  }

  .sm-btn:active {
    transform: scale(0.98);
  }

  .sm-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .sm-btn:disabled:active {
    transform: none;
  }

  .sm-btn-cancel {
    background: var(--gray-100, #f1f5f9);
    color: var(--gray-700, #334155);
  }

  .sm-btn-send {
    background: var(--blu-primary, #0066ff);
    color: #fff;
  }

  /* Success state */
  .sm-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 40px 24px;
    padding-bottom: calc(40px + env(safe-area-inset-bottom, 0px));
  }

  .sm-success-icon {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.12);
    color: #10b981;
    margin-bottom: 16px;
    animation: smSuccessPop 0.4s ease-out;
  }

  .sm-success-title {
    font-size: 20px;
    font-weight: 700;
    color: #059669;
    margin: 0 0 8px;
  }

  .sm-success-text {
    font-size: 14px;
    color: var(--gray-500, #64748b);
    margin: 0;
  }

  @keyframes smSuccessPop {
    0% { transform: scale(0.5); opacity: 0; }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }

  /* Spinner */
  @keyframes smSpin {
    to { transform: rotate(360deg); }
  }

  .sm-spin {
    animation: smSpin 0.8s linear infinite;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .sm-overlay,
    .sm-content,
    .sm-success-icon {
      animation: none !important;
    }
  }
`;

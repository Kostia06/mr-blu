import { useState, useEffect, useCallback } from 'preact/hooks';
import { Send, Mail, Check, X, AlertCircle } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
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

export function QuickSendModal({ open, document, onClose, onSuccess }: QuickSendModalProps) {
  const { t } = useI18nStore();
  const [email, setEmail] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isEmailValid = EMAIL_REGEX.test(email);

  // Pre-fill email and reset state when modal opens
  useEffect(() => {
    if (open) {
      setCustomMessage('');
      setError(null);
      setSuccess(false);
      setIsSending(false);
      if (document?.clientEmail) {
        setEmail(document.clientEmail);
      } else {
        setEmail('');
      }
    }
  }, [open, document?.clientEmail]);

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

  const emailInputBorder =
    email.length === 0
      ? '2px solid var(--gray-200, #e2e8f0)'
      : isEmailValid
        ? '2px solid #10b981'
        : '2px solid #ef4444';

  return (
    <>
      <style>{animationKeyframes}</style>
      {/* Backdrop */}
      <button
        style={styles.backdrop}
        onClick={handleClose}
        aria-label={t('aria.closeModal')}
      />

      {/* Modal */}
      <div
        style={styles.container}
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-modal-title"
      >
        <div style={styles.content}>

          <button style={styles.closeBtn} onClick={handleClose} aria-label={t('common.close')}>
            <X size={20} />
          </button>

          {success ? (
            <div style={styles.step}>
              <div style={styles.iconWrapperSuccess}>
                <Check size={36} />
              </div>
              <h2 style={{ ...styles.title, color: '#10b981' }}>{t('review.sent')}</h2>
              <p style={styles.successMessage}>
                {t('review.sentToRecipient', { recipient: email })}
              </p>
            </div>
          ) : (
            <div style={styles.step}>
              <div style={styles.iconWrapperSend}>
                <Send size={28} />
              </div>

              <h2 id="send-modal-title" style={styles.title}>
                {t('docDetail.sendToClient')}
              </h2>

              {/* Document info */}
              <div style={styles.documentInfo}>
                <span style={styles.docTitle}>{document.title}</span>
                {document.amount ? (
                  <span style={styles.docAmount}>{formatAmount(document.amount)}</span>
                ) : null}
              </div>

              {/* Email input */}
              <div style={styles.inputGroup}>
                <label for="recipient-email" style={styles.inputLabel}>
                  <Mail size={16} />
                  {t('review.recipientEmail')}
                </label>
                <input
                  id="recipient-email"
                  type="email"
                  style={{ ...styles.emailInput, border: emailInputBorder }}
                  value={email}
                  onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                  placeholder={t('docDetail.emailPlaceholder')}
                  disabled={isSending}
                />
              </div>

              {/* Optional message */}
              <div style={styles.inputGroup}>
                <label for="custom-message" style={styles.inputLabelOptional}>
                  {t('review.customMessage')}
                </label>
                <textarea
                  id="custom-message"
                  style={styles.messageInput}
                  value={customMessage}
                  onInput={(e) => setCustomMessage((e.target as HTMLTextAreaElement).value)}
                  placeholder={t('placeholder.addNote')}
                  rows={2}
                  disabled={isSending}
                />
              </div>

              {error && (
                <div style={styles.errorMessage}>
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <div style={styles.actions}>
                <button style={styles.btnSecondary} onClick={handleClose} disabled={isSending}>
                  {t('common.cancel')}
                </button>
                <button
                  style={{
                    ...styles.btnPrimary,
                    opacity: !isEmailValid || isSending ? '0.5' : '1',
                    cursor: !isEmailValid || isSending ? 'not-allowed' : 'pointer',
                  }}
                  onClick={handleSend}
                  disabled={!isEmailValid || isSending}
                >
                  {isSending ? (
                    <>
                      <span style={styles.spinner} />
                      {t('docDetail.sending')}
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      {t('docDetail.sendEmail')}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const animationKeyframes = `
@keyframes sendModalSpin {
  to { transform: rotate(360deg); }
}
@keyframes sendModalSuccessPop {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
`;

const styles: Record<string, Record<string, string>> = {
  backdrop: {
    position: 'fixed',
    inset: '0',
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    zIndex: '1000',
    border: 'none',
    cursor: 'default',
  },
  container: {
    position: 'fixed',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '1001',
    padding: '16px',
    pointerEvents: 'none',
  },
  content: {
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 'var(--radius-lg, 20px)',
    padding: '32px 24px 24px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
    pointerEvents: 'auto',
  },
  dragHandle: {
    position: 'absolute',
    top: '8px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '36px',
    height: '5px',
    background: '#D1D1D6',
    borderRadius: '3px',
  },
  closeBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--gray-100, #f1f5f9)',
    border: 'none',
    borderRadius: '50%',
    color: 'var(--gray-500, #64748b)',
    cursor: 'pointer',
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  iconWrapperSend: {
    width: '72px',
    height: '72px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    marginBottom: '16px',
    background: 'rgba(0, 102, 255, 0.1)',
    color: 'var(--blu-primary, #0066ff)',
  },
  iconWrapperSuccess: {
    width: '72px',
    height: '72px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    marginBottom: '16px',
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#10b981',
    animation: 'sendModalSuccessPop 0.4s ease-out',
  },
  title: {
    fontFamily: 'var(--font-display, system-ui)',
    fontSize: '22px',
    fontWeight: '700',
    color: 'var(--gray-900, #0f172a)',
    margin: '0 0 12px',
  },
  successMessage: {
    fontSize: '15px',
    color: 'var(--gray-600, #475569)',
    margin: '0',
  },
  documentInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'var(--gray-50, #f8fafc)',
    borderRadius: '10px',
    marginBottom: '20px',
    width: '100%',
  },
  docTitle: {
    flex: '1',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--gray-700, #334155)',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  docAmount: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--data-green, #10b981)',
  },
  inputGroup: {
    width: '100%',
    marginBottom: '16px',
  },
  inputLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--gray-600, #475569)',
    marginBottom: '8px',
    textAlign: 'left',
  },
  inputLabelOptional: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--gray-600, #475569)',
    marginBottom: '8px',
    textAlign: 'left',
  },
  emailInput: {
    width: '100%',
    padding: '14px 16px',
    background: 'var(--gray-50, #f8fafc)',
    borderRadius: '12px',
    fontSize: '15px',
    color: 'var(--gray-900, #0f172a)',
    boxSizing: 'border-box',
    outline: 'none',
  },
  messageInput: {
    width: '100%',
    padding: '14px 16px',
    background: 'var(--gray-50, #f8fafc)',
    border: '2px solid var(--gray-200, #e2e8f0)',
    borderRadius: '12px',
    fontSize: '15px',
    color: 'var(--gray-900, #0f172a)',
    resize: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none',
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '8px',
    color: '#dc2626',
    fontSize: '13px',
    marginBottom: '16px',
    width: '100%',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    width: '100%',
  },
  btnSecondary: {
    flex: '1',
    padding: '14px 20px',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'var(--gray-100, #f1f5f9)',
    color: 'var(--gray-700, #334155)',
  },
  btnPrimary: {
    flex: '1',
    padding: '14px 20px',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'var(--blu-primary, #0066ff)',
    color: 'white',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'sendModalSpin 0.8s linear infinite',
    display: 'inline-block',
  },
};

import { useState, useEffect, useCallback } from 'preact/hooks';
import { Send, Mail, Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
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

  return (
    <>
      <style>{`
        @keyframes sendModalSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes sendModalSuccessPop {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Backdrop */}
      <button
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] border-none cursor-default"
        onClick={handleClose}
        aria-label={t('aria.closeModal')}
      />

      {/* Modal */}
      <div
        class="fixed inset-0 flex items-center justify-center z-[1001] p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-modal-title"
      >
        <div class="relative bg-white/98 backdrop-blur-xl rounded-[20px] pt-8 px-6 pb-6 max-w-[400px] w-full shadow-[0_20px_60px_rgba(0,0,0,0.2)] pointer-events-auto">

          <button
            class="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-slate-100 border-none rounded-full text-slate-500 cursor-pointer hover:bg-slate-200 transition-colors"
            onClick={handleClose}
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>

          {success ? (
            <div class="flex flex-col items-center text-center">
              <div
                class="w-[72px] h-[72px] flex items-center justify-center rounded-full mb-4 bg-emerald-500/15 text-emerald-500"
                style={{ animation: 'sendModalSuccessPop 0.4s ease-out' }}
              >
                <Check size={36} />
              </div>
              <h2 class="font-[var(--font-display,system-ui)] text-[22px] font-bold text-emerald-500 mb-3">
                {t('review.sent')}
              </h2>
              <p class="text-[15px] text-slate-600">
                {t('review.sentToRecipient', { recipient: email })}
              </p>
            </div>
          ) : (
            <div class="flex flex-col items-center text-center">
              <div class="w-[72px] h-[72px] flex items-center justify-center rounded-full mb-4 bg-[rgba(0,102,255,0.1)] text-[var(--blu-primary,#0066ff)]">
                <Send size={28} />
              </div>

              <h2
                id="send-modal-title"
                class="font-[var(--font-display,system-ui)] text-[22px] font-bold text-slate-900 mb-3"
              >
                {t('docDetail.sendToClient')}
              </h2>

              {/* Document info */}
              <div class="flex items-center gap-3 py-3 px-4 bg-slate-50 rounded-[10px] mb-5 w-full">
                <span class="flex-1 text-sm font-medium text-slate-700 text-left truncate">
                  {document.title}
                </span>
                {document.amount ? (
                  <span class="text-[15px] font-semibold text-[var(--data-green,#10b981)]">
                    {formatAmount(document.amount)}
                  </span>
                ) : null}
              </div>

              {/* Email input */}
              <div class="w-full mb-4">
                <label for="recipient-email" class="flex items-center gap-1.5 text-[13px] font-medium text-slate-600 mb-2 text-left">
                  <Mail size={16} />
                  {t('review.recipientEmail')}
                </label>
                <input
                  id="recipient-email"
                  type="email"
                  class={cn(
                    'w-full py-3.5 px-4 bg-slate-50 rounded-xl text-[15px] text-slate-900 box-border outline-none border-2',
                    email.length === 0
                      ? 'border-slate-200'
                      : isEmailValid
                        ? 'border-emerald-500'
                        : 'border-red-500'
                  )}
                  value={email}
                  onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                  placeholder={t('docDetail.emailPlaceholder')}
                  disabled={isSending}
                />
              </div>

              {/* Optional message */}
              <div class="w-full mb-4">
                <label for="custom-message" class="flex items-center gap-1.5 text-[13px] font-medium text-slate-600 mb-2 text-left">
                  {t('review.customMessage')}
                </label>
                <textarea
                  id="custom-message"
                  class="w-full py-3.5 px-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-[15px] text-slate-900 resize-none font-[inherit] box-border outline-none focus:border-[var(--blu-primary,#0066ff)]"
                  value={customMessage}
                  onInput={(e) => setCustomMessage((e.target as HTMLTextAreaElement).value)}
                  placeholder={t('placeholder.addNote')}
                  rows={2}
                  disabled={isSending}
                />
              </div>

              {error && (
                <div class="flex items-center gap-1.5 py-2.5 px-3.5 bg-red-500/10 rounded-lg text-red-600 text-[13px] mb-4 w-full">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <div class="flex gap-3 w-full">
                <button
                  class="flex-1 py-3.5 px-5 border-none rounded-xl text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  onClick={handleClose}
                  disabled={isSending}
                >
                  {t('common.cancel')}
                </button>
                <button
                  class={cn(
                    'flex-1 py-3.5 px-5 border-none rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2 bg-[var(--blu-primary,#0066ff)] text-white transition-opacity',
                    !isEmailValid || isSending
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer hover:opacity-90'
                  )}
                  onClick={handleSend}
                  disabled={!isEmailValid || isSending}
                >
                  {isSending ? (
                    <>
                      <span
                        class="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                        style={{ animation: 'sendModalSpin 0.8s linear infinite' }}
                      />
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

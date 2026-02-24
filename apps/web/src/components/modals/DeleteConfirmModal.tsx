import { useState, useEffect, useCallback } from 'preact/hooks';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18nStore } from '@/lib/i18n';

interface DocumentInfo {
  id: string;
  type: 'invoice' | 'estimate' | 'contract';
  title: string;
  client: string;
  amount?: number;
}

interface DeleteConfirmModalProps {
  open: boolean;
  document: DocumentInfo | null;
  onClose: () => void;
  onConfirm: (documentId: string, documentType: string) => Promise<void>;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getTypeBadgeClasses(type: string): string {
  switch (type) {
    case 'invoice':
      return 'bg-emerald-500/10 text-emerald-700';
    case 'estimate':
      return 'bg-sky-500/10 text-sky-700';
    default:
      return 'bg-[rgba(0,102,255,0.1)] text-[var(--blu-primary,#0066ff)]';
  }
}

export function DeleteConfirmModal({ open, document, onClose, onConfirm }: DeleteConfirmModalProps) {
  const { t } = useI18nStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setIsDeleting(false);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    if (isDeleting) return;
    setError(null);
    onClose();
  }, [isDeleting, onClose]);

  const handleDelete = useCallback(async () => {
    if (!document || isDeleting) return;
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm(document.id, document.type);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
      setIsDeleting(false);
    }
  }, [document, isDeleting, onConfirm, handleClose]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isDeleting, handleClose]);

  if (!open || !document) return null;

  const typeLabel =
    document.type === 'invoice'
      ? t('review.invoice')
      : document.type === 'estimate'
        ? t('review.estimate')
        : t('documents.contracts');

  return (
    <>
      <style>{`
        @keyframes deleteModalSpin {
          to { transform: rotate(360deg); }
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
        class="fixed inset-0 flex items-center justify-center z-[1001] p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        <div class="relative bg-white/98 backdrop-blur-xl rounded-[20px] pt-8 px-6 pb-6 max-w-[400px] w-full shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
          <button
            class="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-slate-100 border-none rounded-full text-slate-500 cursor-pointer hover:bg-slate-200 transition-colors"
            onClick={handleClose}
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>

          <div class="flex flex-col items-center text-center">
            <div class="w-[72px] h-[72px] flex items-center justify-center rounded-full mb-4 bg-red-500/10 text-red-500">
              <Trash2 size={32} />
            </div>

            <h2
              id="delete-modal-title"
              class="font-[var(--font-display,system-ui)] text-[22px] font-bold text-slate-900 mb-4"
            >
              {t('delete.title')}
            </h2>

            <div class="flex items-center gap-2 py-3 px-4 bg-amber-500/10 rounded-[10px] text-amber-700 text-sm font-medium mb-5 w-full">
              <AlertTriangle size={16} />
              <span>{t('delete.warning')}</span>
            </div>

            <div class="w-full bg-slate-50 rounded-xl p-4 mb-6">
              <div class="flex justify-between items-center py-2 border-b border-slate-100">
                <span class="text-sm text-slate-500">{t('documents.client')}</span>
                <span class="text-sm font-semibold text-slate-900">{document.client}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-sm text-slate-500">{t('review.documentType')}</span>
                <span class={cn('py-1 px-2.5 rounded-full text-xs capitalize font-semibold', getTypeBadgeClasses(document.type))}>
                  {typeLabel}
                </span>
              </div>
              {document.amount ? (
                <div class="flex justify-between items-center py-2">
                  <span class="text-sm text-slate-500">{t('documents.amount')}</span>
                  <span class="text-sm font-semibold text-[var(--data-green,#10b981)]">
                    {formatAmount(document.amount)}
                  </span>
                </div>
              ) : null}
            </div>

            {error && (
              <div class="flex items-center gap-1.5 py-2.5 px-3.5 bg-red-500/10 rounded-lg text-red-600 text-[13px] mb-4 w-full">
                <AlertTriangle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div class="flex gap-3 w-full">
              <button
                class="flex-1 py-3.5 px-5 border-none rounded-xl text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                onClick={handleClose}
                disabled={isDeleting}
              >
                {t('common.cancel')}
              </button>
              <button
                class={cn(
                  'flex-1 py-3.5 px-5 border-none rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2 bg-red-500 text-white transition-opacity',
                  isDeleting
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:opacity-90'
                )}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span
                      class="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                      style={{ animation: 'deleteModalSpin 0.8s linear infinite' }}
                    />
                    {t('docDetail.deleting')}
                  </>
                ) : (
                  t('common.delete')
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

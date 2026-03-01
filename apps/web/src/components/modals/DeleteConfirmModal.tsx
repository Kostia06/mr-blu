import { useState, useEffect, useCallback } from 'preact/hooks';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { useModalState } from '@/stores/appStateStore';
import { cn } from '@/lib/utils';

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

export function DeleteConfirmModal({ open, document, onClose, onConfirm }: DeleteConfirmModalProps) {
  const { t } = useI18nStore();
  useModalState(open);
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

  const typeBadgeBg =
    document.type === 'invoice'
      ? 'rgba(16, 185, 129, 0.1)'
      : document.type === 'estimate'
        ? 'rgba(14, 165, 233, 0.1)'
        : 'rgba(0, 102, 255, 0.1)';

  const typeBadgeColor =
    document.type === 'invoice'
      ? '#059669'
      : document.type === 'estimate'
        ? '#0284c7'
        : 'var(--blu-primary, #0066ff)';

  return (
    <div
      class="fixed inset-0 z-[1000] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        role="presentation"
      />

      <div class="relative w-full max-w-[400px] mx-4">
        <div class="bg-white rounded-[20px] pt-8 px-6 pb-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
          <button
            class="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-[var(--gray-100,#f1f5f9)] border-none rounded-full text-[var(--gray-500,#64748b)] cursor-pointer"
            onClick={handleClose}
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>

          <div class="flex flex-col items-center text-center">
            <div class="w-16 h-16 flex items-center justify-center rounded-full mb-4 bg-red-500/10 text-red-500">
              <Trash2 size={28} strokeWidth={1.5} />
            </div>

            <h2
              id="delete-modal-title"
              class="font-[var(--font-display,system-ui)] text-xl font-bold text-[var(--gray-900,#0f172a)] m-0 mb-1"
            >
              {t('delete.title')}
            </h2>

            <p class="text-sm text-[var(--gray-500,#64748b)] m-0 mb-5">
              {t('delete.warning')}
            </p>

            <div class="w-full bg-[var(--gray-50,#f8fafc)] rounded-xl p-4 mb-5">
              <div class="flex justify-between items-center py-1.5">
                <span class="text-[13px] text-[var(--gray-500,#64748b)]">{t('documents.client')}</span>
                <span class="text-[13px] font-semibold text-[var(--gray-900,#0f172a)]">{document.client}</span>
              </div>
              <div class="flex justify-between items-center py-1.5">
                <span class="text-[13px] text-[var(--gray-500,#64748b)]">{t('review.documentType')}</span>
                <span
                  class="py-0.5 px-2 rounded-full text-[11px] capitalize font-semibold"
                  style={{ background: typeBadgeBg, color: typeBadgeColor }}
                >
                  {typeLabel}
                </span>
              </div>
              {document.amount ? (
                <div class="flex justify-between items-center py-1.5">
                  <span class="text-[13px] text-[var(--gray-500,#64748b)]">{t('documents.amount')}</span>
                  <span class="text-[13px] font-semibold text-[var(--data-green,#10b981)]">
                    {formatAmount(document.amount)}
                  </span>
                </div>
              ) : null}
            </div>

            {error && (
              <div class="flex items-center gap-1.5 py-2.5 px-3.5 bg-red-500/10 rounded-lg text-red-600 text-[13px] mb-4 w-full text-left">
                <AlertTriangle size={14} class="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div class="flex gap-3 w-full">
              <button
                class="flex-1 py-3.5 px-4 border-none rounded-[14px] text-[15px] font-semibold cursor-pointer flex items-center justify-center bg-[var(--gray-100,#f1f5f9)] text-[var(--gray-700,#334155)] active:scale-[0.98] transition-transform duration-100"
                onClick={handleClose}
                disabled={isDeleting}
              >
                {t('common.cancel')}
              </button>
              <button
                class={cn(
                  'flex-1 py-3.5 px-4 border-none rounded-[14px] text-[15px] font-semibold flex items-center justify-center gap-2 bg-red-500 text-white transition-all duration-100',
                  isDeleting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'
                )}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} class="animate-spin" />
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
    </div>
  );
}

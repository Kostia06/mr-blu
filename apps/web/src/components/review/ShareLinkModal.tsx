import { useState, useEffect, useCallback } from 'preact/hooks';
import { X, Link, Copy, Check, ExternalLink, HelpCircle } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';

interface ShareLinkModalProps {
  open: boolean;
  linkUrl: string | null;
  documentType: 'invoice' | 'estimate';
  onClose: () => void;
}

export function ShareLinkModal({ open, linkUrl, documentType, onClose }: ShareLinkModalProps) {
  const { t } = useI18nStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) setCopied(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const copyLink = useCallback(async () => {
    if (!linkUrl) return;
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      console.error('Failed to copy link');
    }
  }, [linkUrl]);

  const openPreview = useCallback(() => {
    if (linkUrl) window.open(linkUrl, '_blank');
  }, [linkUrl]);

  if (!open) return null;

  return (
    <div
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5"
      onClick={onClose}
      role="presentation"
    >
      <div
        class="bg-[var(--white)] rounded-2xl p-6 max-w-[480px] w-full relative shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <button
          class="absolute top-4 right-4 bg-transparent border-none text-[var(--gray-500)] cursor-pointer p-1 rounded-md transition-all duration-150 hover:bg-[var(--gray-100)]"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <div class="flex items-center gap-3 mb-4">
          <Link size={24} class="text-blue-500" />
          <h3 class="text-lg font-semibold text-slate-800 m-0">
            {t('review.shareLinkCreated')}
          </h3>
        </div>

        <div class="flex flex-col gap-4">
          <p class="text-sm text-[var(--gray-500)] m-0">
            {t('review.anyoneCanView', { type: documentType })}
          </p>

          <div class="border border-[var(--gray-200)] rounded-lg p-1">
            <input
              type="text"
              readOnly
              value={linkUrl || ''}
              class="w-full border-none bg-transparent px-3 py-2.5 text-[13px] text-slate-800 font-mono outline-none"
            />
          </div>

          <div class="flex gap-2.5">
            <button
              class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-[10px] text-sm font-medium cursor-pointer transition-all duration-150 bg-[var(--gray-100)] border border-[var(--gray-200)] text-[var(--gray-600)] hover:bg-[var(--gray-200)]"
              onClick={copyLink}
            >
              {copied ? (
                <>
                  <Check size={16} />
                  {t('common.copied')}
                </>
              ) : (
                <>
                  <Copy size={16} />
                  {t('review.copyLink')}
                </>
              )}
            </button>
            <button
              class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-[10px] text-sm font-medium cursor-pointer transition-all duration-150 bg-blue-500 border-none text-white hover:bg-blue-600"
              onClick={openPreview}
            >
              <ExternalLink size={16} />
              {t('review.openPreview')}
            </button>
          </div>
        </div>

        <p class="flex items-center gap-1.5 text-xs text-[var(--gray-400)] m-0 mt-4 pt-4 border-t border-slate-100">
          <HelpCircle size={14} />
          {t('review.noLoginRequired')}
        </p>
      </div>
    </div>
  );
}

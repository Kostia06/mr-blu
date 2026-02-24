import { useMemo } from 'preact/hooks';
import { Sparkles, FileText, Receipt, AlertCircle, Loader2, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18nStore } from '@/lib/i18n';
import type { SourceDocument, MergeSourceSelection } from '@/lib/review/review-types';
import { navigateTo } from '@/lib/navigation';

interface MergeData {
  summary: string;
}

interface MergeDocumentsFlowProps {
  mergeData: MergeData | null;
  mergeSourceSelections: MergeSourceSelection[];
  onSelectDocument: (index: number, doc: SourceDocument) => void;
  onConfirmMerge: () => void;
}

function formatQueryAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatQueryDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function MergeDocumentsFlow({
  mergeData,
  mergeSourceSelections,
  onSelectDocument,
  onConfirmMerge,
}: MergeDocumentsFlowProps) {
  const { t } = useI18nStore();

  const allMergeSourcesSelected = useMemo(
    () => mergeSourceSelections.length > 0 && mergeSourceSelections.every((s) => s.selectedDoc !== null),
    [mergeSourceSelections]
  );

  const selectedCount = useMemo(
    () => mergeSourceSelections.filter((s) => s.selectedDoc).length,
    [mergeSourceSelections]
  );

  return (
    <>
      <style>{`@keyframes mdfSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .mdf-spinning { animation: mdfSpin 1s linear infinite; }`}</style>
      <div class="flex-1 px-[var(--page-padding-x)] max-w-[var(--page-max-width)] mx-auto w-full flex flex-col gap-[var(--section-gap)]">
        <div class="bg-sky-500/5 border border-sky-500/20 rounded-[var(--radius-card)] p-[var(--space-5)]">
          <div class="flex items-center gap-[var(--space-2)] mb-[var(--space-2-5)] text-sky-400 text-[var(--text-sm)] font-[var(--font-medium)]">
            <Sparkles size={16} class="shrink-0" />
            <span>{t('review.mergingDocuments')}</span>
          </div>
          <p class="text-[var(--text-base)] leading-relaxed text-[var(--gray-700)] m-0">
            {mergeData?.summary || t('review.mergingDocuments')}
          </p>
        </div>

        <div class="mt-5">
          <h3 class="text-base font-semibold text-[var(--gray-900)] m-0 mb-1.5">
            {t('review.selectDocsToMerge')}
          </h3>
          <p class="text-[13px] text-[var(--gray-500)] m-0 mb-4">
            {t('review.chooseFromEachClient')}
          </p>

          {mergeSourceSelections.map((sel, index) => (
            <div key={index} class="mb-6 p-4 border border-[var(--gray-200)] rounded-[14px]">
              <h4 class="flex items-center gap-2.5 text-sm font-semibold text-[var(--gray-900)] m-0 mb-3.5">
                <span class="w-6 h-6 flex items-center justify-center bg-sky-500/20 text-sky-400 rounded-full text-xs font-bold">
                  {index + 1}
                </span>
                Documents from {sel.clientName}
              </h4>

              {sel.isSearching && (
                <div class="flex items-center gap-2.5 p-4 text-[var(--gray-500)] text-[13px]">
                  <Loader2 size={18} class="mdf-spinning" />
                  <span>{t('review.searching')}</span>
                </div>
              )}

              {!sel.isSearching && sel.documents.length > 0 && (
                <div class="flex flex-col gap-2">
                  {sel.documents.map((doc) => {
                    const isSelected = sel.selectedDoc?.id === doc.id;
                    return (
                      <button
                        key={doc.id}
                        class={cn(
                          'flex items-center gap-3 px-3.5 py-3 bg-[var(--white)] border border-[var(--gray-200)] rounded-xl text-left transition-all duration-200 cursor-pointer hover:bg-[var(--gray-50)]',
                          isSelected && 'bg-sky-500/15 border-sky-500/40'
                        )}
                        onClick={() => onSelectDocument(index, doc)}
                      >
                        <div
                          class={cn(
                            'w-9 h-9 flex items-center justify-center rounded-[10px] shrink-0',
                            doc.type === 'invoice'
                              ? 'bg-emerald-500/15 text-[var(--data-green)]'
                              : doc.type === 'estimate'
                                ? 'bg-purple-500/15 text-purple-500'
                                : 'bg-sky-500/15 text-sky-400'
                          )}
                        >
                          {doc.type === 'invoice' ? <Receipt size={16} /> : <FileText size={16} />}
                        </div>
                        <div class="flex-1 flex flex-col gap-0.5 min-w-0">
                          <span class="text-[13px] font-medium text-[var(--gray-900)] overflow-hidden text-ellipsis whitespace-nowrap">
                            {doc.title}
                          </span>
                          <span class="text-[11px] text-[var(--gray-500)]">
                            {formatQueryDate(doc.date)}
                          </span>
                        </div>
                        <div class="text-sm font-semibold text-[var(--data-green)]">
                          {formatQueryAmount(doc.amount)}
                        </div>
                        {isSelected && <Check size={16} class="text-sky-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {!sel.isSearching && sel.documents.length === 0 && (
                <div class="flex items-center gap-2.5 p-4 text-[var(--gray-500)] text-[13px]">
                  <AlertCircle size={18} />
                  <span>{t('review.noDocsForClient', { client: sel.clientName })}</span>
                </div>
              )}
            </div>
          ))}

          <div class="flex gap-3 mt-6">
            <button
              class={cn(
                'flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 border-none bg-gradient-to-br from-[#0066ff] to-[#0052cc] text-white shadow-[0_4px_12px_rgba(0,102,255,0.25)]',
                !allMergeSourcesSelected && 'opacity-50 cursor-not-allowed'
              )}
              disabled={!allMergeSourcesSelected}
              onClick={onConfirmMerge}
            >
              <Plus size={18} />
              Merge {selectedCount} Document{selectedCount !== 1 ? 's' : ''}
            </button>
            <button
              class="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 bg-[var(--gray-100)] text-[var(--gray-600)] border border-[var(--gray-200)] hover:bg-[var(--gray-200)]"
              onClick={() => navigateTo('/dashboard')}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

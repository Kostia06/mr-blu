import { Sparkles, FileText, Receipt, AlertCircle, Loader2 } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { SourceDocument } from '@/lib/review/review-types';
import { navigateTo } from '@/lib/navigation';

interface CloneClientSuggestion {
  name: string;
  similarity: number;
}

interface CloneData {
  sourceClient: string;
  summary: string;
}

interface CloneDocumentFlowProps {
  cloneData: CloneData | null;
  sourceDocuments: SourceDocument[];
  isSearching: boolean;
  clientSuggestions: CloneClientSuggestion[];
  onSelectDocument: (doc: SourceDocument) => void;
  onSelectClient: (clientName: string) => void;
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

function getSuggestionMatchLabel(
  similarity: number,
  t: (key: string) => string
): { label: string; classes: string } {
  if (similarity >= 0.7) {
    return { label: t('review.highMatch'), classes: 'bg-emerald-500/20 text-[var(--data-green)]' };
  }
  if (similarity >= 0.5) {
    return { label: t('review.goodMatch'), classes: 'bg-sky-500/20 text-[#38bdf8]' };
  }
  return { label: t('review.possibleMatch'), classes: 'bg-amber-500/20 text-amber-400' };
}

export function CloneDocumentFlow({
  cloneData,
  sourceDocuments,
  isSearching,
  clientSuggestions,
  onSelectDocument,
  onSelectClient,
}: CloneDocumentFlowProps) {
  const { t } = useI18nStore();

  return (
    <div class="flex-1 px-[var(--page-padding-x)] max-w-[var(--page-max-width)] mx-auto w-full flex flex-col gap-[var(--section-gap)]">
      <div class="rounded-[var(--radius-card)] p-[var(--space-5)] border border-purple-500/20 bg-purple-500/5">
        <div class="flex items-center gap-[var(--space-2)] mb-[var(--space-2-5)] text-purple-400 text-[var(--text-sm)] font-[var(--font-medium)]">
          <Sparkles size={16} class="shrink-0" />
          <span>{t('review.cloningDocument')}</span>
        </div>
        <p class="text-[var(--text-base)] leading-normal text-[var(--gray-700)] m-0">
          {cloneData?.summary || 'Finding document to clone...'}
        </p>
      </div>

      {isSearching && (
        <div class="flex flex-col items-center justify-center gap-4 py-15 px-[var(--page-padding-x,20px)] text-[var(--gray-500)]">
          <Loader2 size={24} class="animate-spin text-[var(--blu-primary,#0066ff)]" />
          <span class="text-sm">{t('review.searchingFor', { client: cloneData?.sourceClient })}</span>
        </div>
      )}

      {!isSearching && sourceDocuments.length > 0 && (
        <div class="mt-5">
          <h3 class="text-base font-semibold text-[var(--gray-900)] mb-1.5 mt-0">
            {t('review.selectDocumentToClone')}
          </h3>
          <p class="text-[13px] text-[var(--gray-500)] mb-4 mt-0">
            {t('review.foundDocuments', {
              n: sourceDocuments.length,
              client: cloneData?.sourceClient,
            })}
          </p>

          <div class="flex flex-col gap-2.5">
            {sourceDocuments.map((doc) => (
              <button
                key={doc.id}
                class="flex items-center gap-3.5 px-4 py-3.5 bg-transparent border border-[var(--gray-200)] rounded-[14px] text-left transition-all duration-200 cursor-pointer hover:border-[var(--gray-300)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                onClick={() => onSelectDocument(doc)}
              >
                <div
                  class={cn(
                    'w-11 h-11 flex items-center justify-center rounded-xl shrink-0',
                    doc.type === 'invoice'
                      ? 'bg-emerald-500/15 text-[var(--data-green)]'
                      : 'bg-purple-500/15 text-purple-500'
                  )}
                >
                  {doc.type === 'invoice' ? <Receipt size={20} /> : <FileText size={20} />}
                </div>
                <div class="flex-1 flex flex-col gap-0.5 min-w-0">
                  <span class="text-sm font-medium text-[var(--gray-900)] overflow-hidden text-ellipsis whitespace-nowrap">
                    {doc.title}
                  </span>
                  <span class="text-xs text-[var(--gray-500)]">
                    {doc.client} &bull; {formatQueryDate(doc.date)}
                  </span>
                </div>
                <div class="text-[15px] font-semibold text-[var(--data-green)]">
                  {formatQueryAmount(doc.amount)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isSearching && sourceDocuments.length === 0 && (
        <div class="flex flex-col items-center py-10 px-5 text-center text-[var(--gray-500)]">
          <AlertCircle size={32} />
          <p class="my-3 mb-5 text-sm">
            {t('review.noDocumentsFor', { client: cloneData?.sourceClient })}
          </p>

          {clientSuggestions.length > 0 ? (
            <div class="mt-4 w-full max-w-[320px]">
              <p class="text-[13px] text-[var(--gray-500)] mb-3 text-center">
                {t('review.speechMisheard')}
              </p>
              <div class="flex flex-col gap-2">
                {clientSuggestions.map((suggestion, index) => {
                  const match = getSuggestionMatchLabel(suggestion.similarity, t);
                  return (
                    <button
                      key={index}
                      class="flex items-center justify-between px-4 py-3 bg-transparent border border-[var(--gray-200)] rounded-xl text-[var(--gray-900)] text-sm font-medium transition-all duration-200 cursor-pointer hover:border-[var(--gray-300)] hover:shadow-sm"
                      onClick={() => onSelectClient(suggestion.name)}
                    >
                      <span class="flex-1 text-left">{suggestion.name}</span>
                      <span class={cn('text-[10px] font-semibold px-2 py-[3px] rounded-md uppercase', match.classes)}>
                        {match.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <button
              class="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 border border-[var(--gray-200)] bg-[var(--gray-100)] text-[var(--gray-600)]"
              onClick={() => navigateTo('/dashboard')}
            >
              Back to Dashboard
            </button>
          )}
        </div>
      )}
    </div>
  );
}

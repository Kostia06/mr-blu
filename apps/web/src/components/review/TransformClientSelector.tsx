import { useMemo } from 'preact/hooks';
import { Search, Loader2, User, Sparkles, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18nStore } from '@/lib/i18n';
import type { TransformClientSuggestion } from '@/lib/review/review-types';

interface TransformClientSelectorProps {
  suggestions: TransformClientSuggestion[];
  bestMatch: TransformClientSuggestion | null;
  searchedDocType: string | null;
  manualSearchQuery: string;
  onManualSearchQueryChange: (value: string) => void;
  manualSearchResults: TransformClientSuggestion[];
  isSearching: boolean;
  onSelectClient: (name: string) => void;
  onSearch: (query: string) => void;
  onBack: () => void;
}

function hasRelevantDocs(client: TransformClientSuggestion, searchedDocType: string | null): boolean {
  if (searchedDocType === 'estimate') return client.estimateCount > 0;
  if (searchedDocType === 'invoice') return client.invoiceCount > 0;
  return client.estimateCount > 0 || client.invoiceCount > 0;
}

export function TransformClientSelector({
  suggestions,
  bestMatch,
  searchedDocType,
  manualSearchQuery,
  onManualSearchQueryChange,
  manualSearchResults,
  isSearching,
  onSelectClient,
  onSearch,
  onBack,
}: TransformClientSelectorProps) {
  const { t } = useI18nStore();

  const otherSuggestions = useMemo(
    () => (bestMatch ? suggestions.filter((s) => s.id !== bestMatch.id) : suggestions),
    [bestMatch, suggestions]
  );

  function handleSearchInput(e: Event) {
    const value = (e.currentTarget as HTMLInputElement).value;
    onManualSearchQueryChange(value);
    onSearch(value);
  }

  return (
    <>
      <style>{`@keyframes tcsSpin { to { transform: rotate(360deg); } } .tcs-spinning { animation: tcsSpin 1s linear infinite; }`}</style>
      <div class="bg-[var(--white)] rounded-[var(--radius-lg)] border border-[var(--gray-200)] overflow-hidden mb-[var(--space-4)]">
        <div class="flex items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] border-b border-[var(--gray-100)]">
          <Search size={18} class="text-[var(--gray-400)] shrink-0" />
          <input
            type="text"
            placeholder={t('placeholder.searchClients')}
            value={manualSearchQuery}
            onInput={handleSearchInput}
            class="flex-1 border-none outline-none text-[var(--text-base)] bg-transparent text-[var(--gray-900)]"
          />
          {isSearching && <Loader2 size={18} class="tcs-spinning text-[var(--blu-primary)]" />}
        </div>

        <div class="max-h-[280px] overflow-y-auto">
          {manualSearchResults.length > 0 ? (
            manualSearchResults.map((client) => (
              <button
                key={client.id}
                class="w-full flex items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] bg-transparent border-none border-b border-[var(--gray-100)] cursor-pointer transition-[background] duration-150 text-left hover:bg-[var(--gray-50)]"
                onClick={() => onSelectClient(client.name)}
              >
                <User size={16} class="text-[var(--gray-400)] shrink-0" />
                <span class="flex-1 text-[var(--text-base)] font-[var(--font-medium)] text-[var(--gray-900)]">
                  {client.name}
                </span>
                <span class="text-[var(--text-sm)] font-[var(--font-medium)] text-[var(--gray-500)]">
                  {Math.round(client.similarity * 100)}%
                </span>
              </button>
            ))
          ) : bestMatch ? (
            <>
              {(() => {
                const bestHasDocs = hasRelevantDocs(bestMatch, searchedDocType);
                return (
                  <button
                    class={cn(
                      'w-full flex items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] border-none border-b border-[var(--gray-100)] text-left transition-[background] duration-150 bg-[var(--glass-primary-5)]',
                      bestHasDocs ? 'cursor-pointer hover:bg-[var(--gray-50)]' : 'opacity-50 cursor-not-allowed'
                    )}
                    onClick={() => bestHasDocs && onSelectClient(bestMatch.name)}
                    disabled={!bestHasDocs}
                  >
                    <Sparkles size={16} class="text-[var(--blu-primary)] shrink-0" />
                    <span class="flex-1 text-[var(--text-base)] font-[var(--font-medium)] text-[var(--gray-900)]">
                      {bestMatch.name}
                    </span>
                    <span class="text-[var(--text-sm)] font-[var(--font-medium)] text-[var(--data-green)]">
                      {Math.round(bestMatch.similarity * 100)}%
                    </span>
                  </button>
                );
              })()}
              {otherSuggestions.slice(0, 4).map((client) => {
                const clientHasDocs = hasRelevantDocs(client, searchedDocType);
                return (
                  <button
                    key={client.id}
                    class={cn(
                      'w-full flex items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] bg-transparent border-none border-b border-[var(--gray-100)] text-left transition-[background] duration-150',
                      clientHasDocs ? 'cursor-pointer hover:bg-[var(--gray-50)]' : 'opacity-50 cursor-not-allowed'
                    )}
                    onClick={() => clientHasDocs && onSelectClient(client.name)}
                    disabled={!clientHasDocs}
                  >
                    <User size={16} class="text-[var(--gray-400)] shrink-0" />
                    <span class="flex-1 text-[var(--text-base)] font-[var(--font-medium)] text-[var(--gray-900)]">
                      {client.name}
                    </span>
                    <span class="text-[var(--text-sm)] font-[var(--font-medium)] text-[var(--gray-500)]">
                      {Math.round(client.similarity * 100)}%
                    </span>
                  </button>
                );
              })}
            </>
          ) : suggestions.length > 0 ? (
            suggestions.slice(0, 5).map((client) => {
              const clientHasDocs = hasRelevantDocs(client, searchedDocType);
              return (
                <button
                  key={client.id}
                  class={cn(
                    'w-full flex items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] bg-transparent border-none border-b border-[var(--gray-100)] text-left transition-[background] duration-150',
                    clientHasDocs ? 'cursor-pointer hover:bg-[var(--gray-50)]' : 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={() => clientHasDocs && onSelectClient(client.name)}
                  disabled={!clientHasDocs}
                >
                  <User size={16} class="text-[var(--gray-400)] shrink-0" />
                  <span class="flex-1 text-[var(--text-base)] font-[var(--font-medium)] text-[var(--gray-900)]">
                    {client.name}
                  </span>
                  <span class="text-[var(--text-sm)] font-[var(--font-medium)] text-[var(--gray-500)]">
                    {Math.round(client.similarity * 100)}%
                  </span>
                </button>
              );
            })
          ) : (
            <div class="p-[var(--space-6)] text-center text-[var(--gray-500)]">
              <p>{t('review.noClientsFound')}</p>
            </div>
          )}
        </div>
      </div>

      <div class="flex gap-[var(--space-3)]">
        <button
          class="flex items-center gap-2 px-6 py-3.5 rounded-[14px] text-[15px] font-semibold transition-all duration-200 cursor-pointer bg-transparent border border-[var(--gray-200)] text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
          onClick={onBack}
        >
          <ChevronLeft size={18} />
          Back
        </button>
      </div>
    </>
  );
}

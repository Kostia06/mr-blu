import { useMemo } from 'preact/hooks';
import { Search, Loader2, User, Sparkles, ChevronLeft } from 'lucide-react';
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
      <style>{keyframes}</style>
      <div style={styles.clientSelectCard}>
        <div style={styles.clientSearchBox}>
          <Search size={18} style={{ color: 'var(--gray-400)', flexShrink: '0' }} />
          <input
            type="text"
            placeholder={t('placeholder.searchClients')}
            value={manualSearchQuery}
            onInput={handleSearchInput}
            style={styles.searchInput}
          />
          {isSearching && <Loader2 size={18} class="tcs-spinning" style={{ color: 'var(--blu-primary)' }} />}
        </div>

        <div style={styles.clientList}>
          {manualSearchResults.length > 0 ? (
            manualSearchResults.map((client) => (
              <button key={client.id} style={styles.clientOption} onClick={() => onSelectClient(client.name)}>
                <User size={16} style={{ color: 'var(--gray-400)', flexShrink: '0' }} />
                <span style={styles.clientName}>{client.name}</span>
                <span style={styles.matchPercent}>{Math.round(client.similarity * 100)}%</span>
              </button>
            ))
          ) : bestMatch ? (
            <>
              {(() => {
                const bestHasDocs = hasRelevantDocs(bestMatch, searchedDocType);
                return (
                  <button
                    style={{
                      ...styles.clientOption,
                      ...styles.clientOptionBest,
                      ...(bestHasDocs ? {} : styles.clientOptionDisabled),
                    }}
                    onClick={() => bestHasDocs && onSelectClient(bestMatch.name)}
                    disabled={!bestHasDocs}
                  >
                    <Sparkles size={16} style={{ color: 'var(--blu-primary)', flexShrink: '0' }} />
                    <span style={styles.clientName}>{bestMatch.name}</span>
                    <span style={{ ...styles.matchPercent, color: 'var(--data-green)' }}>
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
                    style={{
                      ...styles.clientOption,
                      ...(clientHasDocs ? {} : styles.clientOptionDisabled),
                    }}
                    onClick={() => clientHasDocs && onSelectClient(client.name)}
                    disabled={!clientHasDocs}
                  >
                    <User size={16} style={{ color: 'var(--gray-400)', flexShrink: '0' }} />
                    <span style={styles.clientName}>{client.name}</span>
                    <span style={styles.matchPercent}>{Math.round(client.similarity * 100)}%</span>
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
                  style={{
                    ...styles.clientOption,
                    ...(clientHasDocs ? {} : styles.clientOptionDisabled),
                  }}
                  onClick={() => clientHasDocs && onSelectClient(client.name)}
                  disabled={!clientHasDocs}
                >
                  <User size={16} style={{ color: 'var(--gray-400)', flexShrink: '0' }} />
                  <span style={styles.clientName}>{client.name}</span>
                  <span style={styles.matchPercent}>{Math.round(client.similarity * 100)}%</span>
                </button>
              );
            })
          ) : (
            <div style={styles.emptyState}>
              <p>{t('review.noClientsFound')}</p>
            </div>
          )}
        </div>
      </div>

      <div style={styles.actionButtons}>
        <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={onBack}>
          <ChevronLeft size={18} />
          Back
        </button>
      </div>
    </>
  );
}

const keyframes = `
@keyframes tcsSpin {
  to { transform: rotate(360deg); }
}
.tcs-spinning { animation: tcsSpin 1s linear infinite; }
`;

const styles: Record<string, Record<string, string>> = {
  clientSelectCard: {
    background: 'var(--white)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--gray-200)',
    overflow: 'hidden',
    marginBottom: 'var(--space-4)',
  },
  clientSearchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    borderBottom: '1px solid var(--gray-100)',
  },
  searchInput: {
    flex: '1',
    border: 'none',
    outline: 'none',
    fontSize: 'var(--text-base)',
    background: 'transparent',
    color: 'var(--gray-900)',
  },
  clientList: {
    maxHeight: '280px',
    overflowY: 'auto',
  },
  clientOption: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--gray-100)',
    cursor: 'pointer',
    transition: 'background var(--duration-fast) ease',
    textAlign: 'left',
  },
  clientOptionBest: {
    background: 'var(--glass-primary-5)',
  },
  clientOptionDisabled: {
    opacity: '0.5',
    cursor: 'not-allowed',
  },
  clientName: {
    flex: '1',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--gray-900)',
  },
  matchPercent: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--gray-500)',
  },
  emptyState: {
    padding: 'var(--space-6)',
    textAlign: 'center',
    color: 'var(--gray-500)',
  },
  actionButtons: {
    display: 'flex',
    gap: 'var(--space-3)',
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 24px',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  btnSecondary: {
    background: 'transparent',
    border: '1px solid var(--gray-200)',
    color: 'var(--gray-600)',
  },
};

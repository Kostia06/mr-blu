import { useState } from 'preact/hooks';
import { FileText, Clock, Sparkles, ChevronRight, X, Star } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';

interface RecentDocument {
  id: string;
  document_number: string;
  client_name: string;
  total: number;
  created_at: string;
  document_type: 'invoice' | 'estimate';
}

interface DocumentSuggestionsProps {
  documents: RecentDocument[];
  onSelect: (document: RecentDocument) => void;
  onDismiss: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DocumentSuggestions({
  documents,
  onSelect,
  onDismiss,
}: DocumentSuggestionsProps) {
  const t = useI18nStore((s) => s.t);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('time.today');
    if (diffDays === 1) return t('time.yesterday');
    if (diffDays < 7) return t('documents.xDaysAgo').replace('{n}', String(diffDays));

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div class="doc-suggestions">
      <header class="doc-panel-header">
        <div class="doc-header-row">
          <div class="doc-header-content">
            <Sparkles size={18} />
            <h3 class="doc-panel-title">{t('suggestions.needInspiration')}</h3>
          </div>
          <button
            class="doc-panel-close"
            onClick={onDismiss}
            aria-label={t('suggestions.dismiss')}
          >
            <X size={18} />
          </button>
        </div>
        <p class="doc-panel-subtitle">{t('suggestions.pickUpWhereLeftOff')}</p>
      </header>

      <div class="doc-documents-content">
        {documents.length > 0 ? (
          <section class="doc-documents-section">
            <h4 class="doc-section-label">{t('suggestions.recentDocuments')}</h4>
            <div class="doc-documents-list">
              {documents.map((document, i) => {
                const isLatest = i === 0;
                return (
                  <button
                    key={document.id}
                    class={`doc-document-card ${isLatest ? 'latest' : ''} ${hoveredId === document.id ? 'hovered' : ''}`}
                    onClick={() => onSelect(document)}
                    onMouseEnter={() => setHoveredId(document.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {isLatest && (
                      <div class="doc-latest-badge">
                        <Star size={10} />
                        <span>{t('suggestions.latest')}</span>
                      </div>
                    )}
                    <div class={`doc-document-icon ${isLatest ? 'latest' : ''}`}>
                      <FileText size={18} />
                    </div>
                    <div class="doc-document-content">
                      <span class="doc-document-title">
                        {document.document_number} - {document.client_name}
                      </span>
                      <div class="doc-document-meta">
                        <span class="doc-document-type">{document.document_type}</span>
                        <span class="doc-document-separator">-</span>
                        <span class="doc-document-amount">{formatCurrency(document.total)}</span>
                        <span class="doc-document-separator">-</span>
                        <Clock size={12} />
                        <span class="doc-document-date">{formatDate(document.created_at)}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} class="doc-document-arrow" />
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <div class="doc-empty-state">
            <FileText size={32} />
            <p>{t('suggestions.noRecentDocuments')}</p>
          </div>
        )}
      </div>

      <footer class="doc-panel-footer">
        <button class="doc-ai-suggestion-btn" onClick={onDismiss}>
          <Sparkles size={16} />
          <span>{t('suggestions.continueWithAI')}</span>
          <ChevronRight size={16} />
        </button>
      </footer>

      <style>{`
        .doc-suggestions {
          display: flex;
          flex-direction: column;
          background: var(--color-bg-secondary, #dbe8f4);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--color-border, #e2e8f0);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }

        .doc-panel-header {
          padding: 16px 20px 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .doc-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .doc-header-content {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-accent, #0684c7);
        }

        .doc-panel-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text, #0f172a);
          margin: 0;
        }

        .doc-panel-subtitle {
          font-size: 13px;
          color: var(--color-text-secondary, #64748b);
          margin: 0;
        }

        .doc-panel-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.04);
          border: none;
          border-radius: 8px;
          color: var(--color-text-secondary, #64748b);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .doc-panel-close:hover {
          background: rgba(0, 0, 0, 0.08);
          color: var(--color-text, #0f172a);
        }

        .doc-documents-content {
          padding: 12px 16px;
          max-height: 320px;
          overflow-y: auto;
        }

        .doc-section-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-secondary, #94a3b8);
          margin: 0 0 10px;
          padding-left: 4px;
        }

        .doc-documents-section {
          margin-bottom: 8px;
        }

        .doc-documents-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .doc-document-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          animation: doc-fadeInUp 0.3s ease forwards;
          opacity: 0;
        }

        @keyframes doc-fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .doc-document-card:hover,
        .doc-document-card.hovered {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(6, 132, 199, 0.2);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }

        .doc-document-card.latest {
          background: linear-gradient(135deg, rgba(6, 132, 199, 0.08) 0%, rgba(14, 165, 233, 0.08) 100%);
          border-color: rgba(6, 132, 199, 0.15);
        }

        .doc-document-card.latest:hover {
          background: linear-gradient(135deg, rgba(6, 132, 199, 0.12) 0%, rgba(14, 165, 233, 0.12) 100%);
          border-color: rgba(6, 132, 199, 0.3);
        }

        .doc-latest-badge {
          position: absolute;
          top: -6px;
          right: 12px;
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 2px 8px;
          background: var(--color-accent, #0684c7);
          border-radius: 10px;
          font-size: 10px;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .doc-document-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(6, 132, 199, 0.1);
          border-radius: 10px;
          color: var(--color-accent, #0684c7);
          flex-shrink: 0;
        }

        .doc-document-icon.latest {
          background: rgba(6, 132, 199, 0.15);
        }

        .doc-document-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .doc-document-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text, #0f172a);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .doc-document-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--color-text-secondary, #64748b);
        }

        .doc-document-type {
          font-weight: 500;
          text-transform: capitalize;
        }

        .doc-document-separator {
          opacity: 0.5;
        }

        .doc-document-date {
          opacity: 0.9;
        }

        .doc-document-arrow {
          color: var(--color-text-secondary, #cbd5e1);
          flex-shrink: 0;
          transition: transform 0.2s ease, color 0.2s ease;
        }

        .doc-document-card:hover .doc-document-arrow {
          color: var(--color-accent, #0684c7);
          transform: translateX(2px);
        }

        .doc-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 40px 20px;
          color: var(--color-text-secondary, #94a3b8);
        }

        .doc-empty-state p {
          font-size: 14px;
          margin: 0;
        }

        .doc-panel-footer {
          padding: 12px 16px 16px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        .doc-ai-suggestion-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          background: var(--color-accent, #0684c7);
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .doc-ai-suggestion-btn:hover {
          background: var(--color-primary-600, #056fa6);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(6, 132, 199, 0.3);
        }

        .doc-ai-suggestion-btn:active {
          transform: translateY(0);
        }

        .doc-documents-content::-webkit-scrollbar {
          width: 4px;
        }

        .doc-documents-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .doc-documents-content::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 2px;
        }

        .doc-documents-content::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.15);
        }

        :global(.dark) .doc-suggestions {
          background: var(--color-bg-secondary, #171717);
          border-color: var(--color-border, #262626);
        }

        :global(.dark) .doc-document-card {
          background: rgba(255, 255, 255, 0.05);
        }

        :global(.dark) .doc-document-card:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        :global(.dark) .doc-document-card.latest {
          background: linear-gradient(135deg, rgba(6, 132, 199, 0.15) 0%, rgba(14, 165, 233, 0.15) 100%);
        }

        :global(.dark) .doc-panel-close {
          background: rgba(255, 255, 255, 0.06);
        }

        :global(.dark) .doc-panel-close:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        @media (prefers-reduced-motion: reduce) {
          .doc-document-card {
            animation: none;
            opacity: 1;
          }

          .doc-document-card:hover,
          .doc-document-card.hovered {
            transform: none;
          }

          .doc-ai-suggestion-btn:hover {
            transform: none;
          }
        }

        @media (max-width: 480px) {
          .doc-panel-header {
            padding: 14px 16px 10px;
          }

          .doc-documents-content {
            padding: 10px 12px;
          }

          .doc-document-icon {
            width: 36px;
            height: 36px;
          }

          .doc-panel-footer {
            padding: 10px 12px 14px;
          }
        }
      `}</style>
    </div>
  );
}

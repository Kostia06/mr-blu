import { useState, useMemo, useCallback } from 'preact/hooks';
import {
  ChevronLeft,
  MessageSquare,
  Bug,
  Lightbulb,
  Heart,
  AlertCircle,
  Check,
  ChevronDown,
} from 'lucide-react';
import { navigateTo } from '@/lib/navigation';

interface FeedbackItem {
  id: string;
  category: string;
  comment: string;
  page_context: string | null;
  responded_at: string | null;
  response: string | null;
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
}

interface AdminFeedbackPageProps {
  feedback: FeedbackItem[];
  totalCount: number;
  page: number;
  limit: number;
  category: string | null;
  unreadOnly: boolean;
}

const CATEGORIES = ['bug', 'feature', 'general', 'praise', 'complaint'];

function getCategoryIcon(category: string) {
  switch (category) {
    case 'bug':
      return Bug;
    case 'feature':
      return Lightbulb;
    case 'praise':
      return Heart;
    case 'complaint':
      return AlertCircle;
    default:
      return MessageSquare;
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'bug':
      return 'var(--data-red, #ef4444)';
    case 'feature':
      return 'var(--data-purple, #8b5cf6)';
    case 'praise':
      return 'var(--data-green, #22c55e)';
    case 'complaint':
      return 'var(--data-orange, #f59e0b)';
    default:
      return 'var(--blu-primary, #0066ff)';
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminFeedbackPage({
  feedback,
  totalCount,
  page,
  limit,
  category,
  unreadOnly,
}: AdminFeedbackPageProps) {
  const [expandedFeedback, setExpandedFeedback] = useState<Set<string>>(new Set());
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  const totalPages = useMemo(() => Math.ceil(totalCount / limit), [totalCount, limit]);

  const toggleFeedback = useCallback((id: string) => {
    setExpandedFeedback((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const buildUrl = useCallback(
    (overrides: { category?: string | null; unread?: boolean; page?: number } = {}) => {
      const params = new URLSearchParams();
      const cat = overrides.category !== undefined ? overrides.category : category;
      const unread = overrides.unread !== undefined ? overrides.unread : unreadOnly;
      const pg = overrides.page !== undefined ? overrides.page : page;

      if (cat) params.set('category', cat);
      if (unread) params.set('unread', 'true');
      if (pg > 1) params.set('page', String(pg));

      const qs = params.toString();
      return `/admin/feedback${qs ? '?' + qs : ''}`;
    },
    [category, unreadOnly, page]
  );

  const filterByCategory = useCallback(
    (cat: string | null) => {
      navigateTo(buildUrl({ category: cat, page: 1 }));
    },
    [buildUrl]
  );

  const toggleUnread = useCallback(() => {
    navigateTo(buildUrl({ unread: !unreadOnly, page: 1 }));
  }, [buildUrl, unreadOnly]);

  const goToPage = useCallback(
    (targetPage: number) => {
      navigateTo(buildUrl({ page: targetPage }));
    },
    [buildUrl]
  );

  const markAsResponded = useCallback(
    async (id: string) => {
      try {
        const { respondToFeedback } = await import('@/lib/api/external');
        await respondToFeedback(id, responseText);
        setRespondingTo(null);
        setResponseText('');
        location.reload();
      } catch {
        // silently fail
      }
    },
    [responseText]
  );

  return (
    <main class="admin-page">
      <header class="page-header">
        <button
          class="back-btn"
          onClick={() => navigateTo('/dashboard')}
          aria-label="Back to dashboard"
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <h1 class="page-title">Feedback</h1>
        <div class="header-spacer" />
      </header>

      <div class="page-content">
        {/* Filters */}
        <div class="filters">
          <button
            class={`filter-btn ${!category ? 'active' : ''}`}
            onClick={() => filterByCategory(null)}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              class={`filter-btn ${category === cat ? 'active' : ''}`}
              onClick={() => filterByCategory(cat)}
              style={{ '--category-color': getCategoryColor(cat) } as any}
            >
              {cat}
            </button>
          ))}
          <button
            class={`filter-btn unread-toggle ${unreadOnly ? 'active' : ''}`}
            onClick={toggleUnread}
          >
            Unread only
          </button>
        </div>

        {/* Stats */}
        <div class="stats">
          <span class="stats-count">
            {totalCount} feedback item{totalCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Feedback List */}
        <div class="feedback-list">
          {feedback.map((item) => {
            const Icon = getCategoryIcon(item.category);
            const isExpanded = expandedFeedback.has(item.id);

            return (
              <div
                key={item.id}
                class={`feedback-card ${isExpanded ? 'expanded' : ''} ${item.responded_at ? 'responded' : ''}`}
              >
                <button class="feedback-header" onClick={() => toggleFeedback(item.id)}>
                  <span
                    class="feedback-icon"
                    style={{ color: getCategoryColor(item.category) }}
                  >
                    <Icon size={20} />
                  </span>
                  <div class="feedback-info">
                    <div class="feedback-meta-row">
                      <span class="feedback-category">{item.category}</span>
                      {item.responded_at && (
                        <span class="responded-badge">
                          <Check size={12} />
                          Responded
                        </span>
                      )}
                    </div>
                    <span class="feedback-comment">{item.comment}</span>
                    <span class="feedback-meta">
                      {formatDate(item.created_at)} ·{' '}
                      {item.profiles?.full_name || item.profiles?.email || 'Anonymous'}
                    </span>
                  </div>
                  <span class={`expand-icon ${isExpanded ? 'rotated' : ''}`}>
                    <ChevronDown size={18} />
                  </span>
                </button>

                {isExpanded && (
                  <div class="feedback-details">
                    <div class="detail-section">
                      <h4>Full Comment</h4>
                      <p class="full-comment">{item.comment}</p>
                    </div>

                    {item.page_context && (
                      <div class="detail-section">
                        <h4>Page Context</h4>
                        <code class="page-context">{item.page_context}</code>
                      </div>
                    )}

                    {!item.responded_at ? (
                      <div class="respond-section">
                        {respondingTo === item.id ? (
                          <>
                            <textarea
                              value={responseText}
                              onInput={(e) =>
                                setResponseText((e.target as HTMLTextAreaElement).value)
                              }
                              placeholder="Write your response..."
                              class="response-input"
                            />
                            <div class="respond-actions">
                              <button
                                class="btn-secondary"
                                onClick={() => setRespondingTo(null)}
                              >
                                Cancel
                              </button>
                              <button
                                class="btn-primary"
                                onClick={() => markAsResponded(item.id)}
                              >
                                Mark as Responded
                              </button>
                            </div>
                          </>
                        ) : (
                          <button
                            class="btn-outline"
                            onClick={() => setRespondingTo(item.id)}
                          >
                            Respond
                          </button>
                        )}
                      </div>
                    ) : (
                      <div class="detail-section">
                        <h4>Response</h4>
                        <p class="response-text">
                          {item.response || 'Marked as responded'}
                        </p>
                        <span class="response-date">
                          Responded: {formatDate(item.responded_at)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {feedback.length === 0 && (
            <div class="empty-state">
              <MessageSquare size={48} />
              <p>No feedback found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div class="pagination">
            {page > 1 && (
              <button class="page-btn" onClick={() => goToPage(page - 1)}>
                Previous
              </button>
            )}
            <span class="page-info">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <button class="page-btn" onClick={() => goToPage(page + 1)}>
                Next
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        .admin-page {
          min-height: 100vh;
          background: transparent;
        }

        .page-header {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px var(--page-padding-x, 20px);
          padding-top: calc(12px + var(--safe-area-top, 0px));
          background: transparent;
        }

        .back-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(20px);
          border: none;
          border-radius: 14px;
          color: var(--gray-600, #475569);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.7);
        }

        .page-title {
          flex: 1;
          font-size: 20px;
          font-weight: 700;
          color: var(--gray-900, #0f172a);
          margin: 0;
        }

        .header-spacer {
          width: 40px;
        }

        .page-content {
          padding: var(--page-padding-x, 20px);
          max-width: 800px;
          margin: 0 auto;
        }

        .filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .filter-btn {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.5);
          border: none;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
          color: var(--gray-600, #475569);
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: capitalize;
        }

        .filter-btn:hover {
          background: rgba(255, 255, 255, 0.7);
        }

        .filter-btn.active {
          background: var(--category-color, var(--blu-primary, #0066ff));
          color: white;
        }

        .filter-btn.unread-toggle {
          margin-left: auto;
        }

        .filter-btn.unread-toggle.active {
          background: var(--data-amber, #fbbf24);
          color: var(--gray-900, #0f172a);
        }

        .stats {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          font-size: 13px;
          color: var(--gray-500, #64748b);
        }

        .feedback-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .feedback-card {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          overflow: hidden;
        }

        .feedback-card.responded {
          opacity: 0.7;
        }

        .feedback-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          width: 100%;
          padding: 16px;
          background: transparent;
          border: none;
          text-align: left;
          cursor: pointer;
        }

        .feedback-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .feedback-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .feedback-meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .feedback-category {
          font-size: 12px;
          font-weight: 600;
          color: var(--gray-600, #475569);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .responded-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          background: var(--data-green, #22c55e);
          color: white;
          font-size: 10px;
          font-weight: 600;
          border-radius: 100px;
        }

        .feedback-comment {
          font-size: 14px;
          color: var(--gray-900, #0f172a);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .feedback-meta {
          font-size: 12px;
          color: var(--gray-400, #94a3b8);
        }

        .expand-icon {
          flex-shrink: 0;
          color: var(--gray-400, #94a3b8);
          transition: transform 0.2s ease;
        }

        .expand-icon.rotated {
          transform: rotate(180deg);
        }

        .feedback-details {
          padding: 0 16px 16px;
          border-top: 1px solid var(--gray-100, #f1f5f9);
        }

        .detail-section {
          margin-top: 12px;
        }

        .detail-section h4 {
          font-size: 12px;
          font-weight: 600;
          color: var(--gray-500, #64748b);
          margin: 0 0 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .full-comment {
          font-size: 14px;
          color: var(--gray-700, #334155);
          line-height: 1.6;
          margin: 0;
          white-space: pre-wrap;
        }

        .page-context {
          display: block;
          background: var(--gray-100, #f1f5f9);
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 12px;
          color: var(--gray-600, #475569);
        }

        .respond-section {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--gray-100, #f1f5f9);
        }

        .response-input {
          width: 100%;
          min-height: 80px;
          padding: 12px;
          background: white;
          border: 1px solid var(--gray-200, #e2e8f0);
          border-radius: 10px;
          font-size: 14px;
          resize: vertical;
          margin-bottom: 12px;
          box-sizing: border-box;
          font-family: inherit;
        }

        .response-input:focus {
          outline: none;
          border-color: var(--blu-primary, #0066ff);
        }

        .respond-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .btn-outline,
        .btn-secondary,
        .btn-primary {
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-outline {
          background: transparent;
          border: 1px solid var(--gray-300, #d1d5db);
          color: var(--gray-600, #475569);
        }

        .btn-outline:hover {
          background: var(--gray-50, #f8fafc);
        }

        .btn-secondary {
          background: var(--gray-100, #f1f5f9);
          border: none;
          color: var(--gray-600, #475569);
        }

        .btn-secondary:hover {
          background: var(--gray-200, #e2e8f0);
        }

        .btn-primary {
          background: var(--blu-primary, #0066ff);
          border: none;
          color: white;
        }

        .btn-primary:hover {
          opacity: 0.9;
        }

        .response-text {
          font-size: 14px;
          color: var(--gray-700, #334155);
          margin: 0;
          font-style: italic;
        }

        .response-date {
          font-size: 12px;
          color: var(--gray-400, #94a3b8);
          margin-top: 4px;
          display: block;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 48px 24px;
          color: var(--gray-400, #94a3b8);
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 24px;
        }

        .page-btn {
          padding: 8px 16px;
          background: var(--blu-primary, #0066ff);
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .page-btn:hover {
          opacity: 0.9;
        }

        .page-info {
          font-size: 13px;
          color: var(--gray-500, #64748b);
        }
      `}</style>
    </main>
  );
}

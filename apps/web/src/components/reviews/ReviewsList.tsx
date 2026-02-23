import { useState, useMemo, useCallback, useEffect, useRef } from 'preact/hooks';
import { deleteReviewSession } from '@/lib/api/reviews';
import {
  ChevronLeft,
  Clock,
  Check,
  XCircle,
  Play,
  FileText,
  Receipt,
  Calculator,
  Search,
  Trash2,
  RefreshCw,
  Mic,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { navigateTo } from '@/lib/navigation';

interface ReviewSession {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  intent_type: 'document_action' | 'information_query';
  original_transcript: string | null;
  parsed_data: Record<string, unknown>;
  actions: Array<{ type: string; status: string }>;
  summary: string | null;
  created_at: string;
  completed_at: string | null;
  created_document_id: string | null;
  created_document_type: string | null;
}

interface ReviewsListProps {
  reviews: ReviewSession[];
}

const SCROLL_DOWN_THRESHOLD = 8;
const SCROLL_UP_THRESHOLD = 4;
const SCROLL_HEADER_MIN_Y = 60;

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return Check;
    case 'cancelled':
      return XCircle;
    case 'in_progress':
      return RefreshCw;
    default:
      return Clock;
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'danger';
    case 'in_progress':
      return 'info';
    default:
      return 'warning';
  }
}

function getDocTypeIcon(type: string | null | undefined) {
  if (type === 'estimate') return Calculator;
  if (type === 'contract') return FileText;
  return Receipt;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getActionSummary(review: ReviewSession): string {
  if (review.intent_type === 'information_query') {
    return 'Information query';
  }
  const actions = review.actions || [];
  const completed = actions.filter((a) => a.status === 'completed').length;
  const total = actions.length;
  if (total === 0) return 'No actions';
  if (completed === total) return `${total} action${total > 1 ? 's' : ''} completed`;
  return `${completed}/${total} actions done`;
}

export function ReviewsList({ reviews }: ReviewsListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const filteredReviews = useMemo(
    () =>
      statusFilter === 'all'
        ? reviews
        : reviews.filter((r) => r.status === statusFilter),
    [reviews, statusFilter]
  );

  const pendingCount = useMemo(
    () => reviews.filter((r) => r.status === 'pending' || r.status === 'in_progress').length,
    [reviews]
  );

  const completedCount = useMemo(
    () => reviews.filter((r) => r.status === 'completed').length,
    [reviews]
  );

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (!ticking.current) {
        requestAnimationFrame(() => {
          const delta = currentScrollY - lastScrollY.current;

          if (delta > SCROLL_DOWN_THRESHOLD && currentScrollY > SCROLL_HEADER_MIN_Y) {
            setHeaderHidden(true);
          } else if (delta < -SCROLL_UP_THRESHOLD || currentScrollY <= SCROLL_HEADER_MIN_Y) {
            setHeaderHidden(false);
          }

          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const resumeReview = useCallback((review: ReviewSession) => {
    sessionStorage.setItem('resume_review', JSON.stringify(review));
    navigateTo(`/dashboard/review?resume=${review.id}`);
  }, []);

  const deleteReview = useCallback(async (review: ReviewSession, event: Event) => {
    event.stopPropagation();
    if (!confirm('Delete this review session?')) return;

    try {
      const result = await deleteReviewSession(review.id);
      if (result.success) {
        location.reload();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  }, []);

  return (
    <main class="reviews-page">
      {/* Header */}
      <header class={`page-header ${headerHidden ? 'header-hidden' : ''}`}>
        <button
          class="back-btn"
          onClick={() => navigateTo('/dashboard')}
          aria-label="Back to dashboard"
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <h1 class="page-title">Reviews</h1>
        <button
          class="new-btn"
          onClick={() => navigateTo('/dashboard')}
          aria-label="New recording"
        >
          <Mic size={18} strokeWidth={2} />
        </button>
      </header>

      <div class="page-content">
        {/* Stats Cards */}
        <section class="stats-row">
          <div class="stat-card warning">
            <div class="stat-icon">
              <Clock size={20} strokeWidth={1.5} />
            </div>
            <div class="stat-info">
              <span class="stat-value">{pendingCount}</span>
              <span class="stat-label">Pending</span>
            </div>
          </div>
          <div class="stat-card success">
            <div class="stat-icon">
              <Check size={20} strokeWidth={1.5} />
            </div>
            <div class="stat-info">
              <span class="stat-value">{completedCount}</span>
              <span class="stat-label">Completed</span>
            </div>
          </div>
          <div class="stat-card neutral">
            <div class="stat-icon">
              <MessageCircle size={20} strokeWidth={1.5} />
            </div>
            <div class="stat-info">
              <span class="stat-value">{reviews.length}</span>
              <span class="stat-label">Total</span>
            </div>
          </div>
        </section>

        {/* Filter Tabs */}
        <section class="filter-section">
          <div class="filter-tabs">
            <button
              class={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All
            </button>
            <button
              class={`filter-tab ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pending')}
            >
              <Clock size={14} strokeWidth={2} />
              Pending
            </button>
            <button
              class={`filter-tab ${statusFilter === 'in_progress' ? 'active' : ''}`}
              onClick={() => setStatusFilter('in_progress')}
            >
              <RefreshCw size={14} strokeWidth={2} />
              In Progress
            </button>
            <button
              class={`filter-tab ${statusFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('completed')}
            >
              <Check size={14} strokeWidth={2} />
              Done
            </button>
          </div>
        </section>

        {/* Reviews List */}
        <section class="reviews-list">
          {filteredReviews.length === 0 ? (
            <div class="empty-state">
              <div class="empty-icon">
                <Sparkles size={32} strokeWidth={1.5} />
              </div>
              <h3 class="empty-title">
                {statusFilter === 'all'
                  ? 'No reviews yet'
                  : `No ${statusFilter.replace('_', ' ')} reviews`}
              </h3>
              <p class="empty-text">Start a voice recording to create your first review</p>
              <button
                class="empty-cta"
                onClick={() => navigateTo('/dashboard')}
              >
                <Mic size={18} strokeWidth={2} />
                <span>Start Recording</span>
              </button>
            </div>
          ) : (
            filteredReviews.map((review) => {
              const StatusIcon = getStatusIcon(review.status);
              const DocIcon = getDocTypeIcon(
                review.created_document_type ||
                  (review.parsed_data as { documentType?: string })?.documentType
              );

              return (
                <div
                  key={review.id}
                  class={`review-card ${getStatusClass(review.status)}`}
                  onClick={() => resumeReview(review)}
                  onKeyDown={(e) =>
                    (e as KeyboardEvent).key === 'Enter' && resumeReview(review)
                  }
                  role="button"
                  tabIndex={0}
                >
                  <div class={`review-icon ${getStatusClass(review.status)}`}>
                    {review.intent_type === 'information_query' ? (
                      <Search size={20} strokeWidth={1.5} />
                    ) : (
                      <DocIcon size={20} strokeWidth={1.5} />
                    )}
                  </div>

                  <div class="review-content">
                    <div class="review-header">
                      <h3 class="review-summary">
                        {review.summary || 'Processing...'}
                      </h3>
                      <span class="review-date">{formatDate(review.created_at)}</span>
                    </div>

                    <div class="review-meta">
                      <span class={`review-status ${getStatusClass(review.status)}`}>
                        <StatusIcon size={12} strokeWidth={2} />
                        <span>{review.status.replace('_', ' ')}</span>
                      </span>
                      <span class="review-actions-count">{getActionSummary(review)}</span>
                    </div>

                    {review.original_transcript && (
                      <p class="review-transcript">
                        "{review.original_transcript.slice(0, 100)}
                        {review.original_transcript.length > 100 ? '...' : ''}"
                      </p>
                    )}
                  </div>

                  <div class="review-actions">
                    {(review.status === 'pending' || review.status === 'in_progress') && (
                      <div class="resume-badge">
                        <Play size={12} strokeWidth={2} />
                        <span>Resume</span>
                      </div>
                    )}
                    <button
                      class="delete-btn"
                      onClick={(e) => deleteReview(review, e)}
                      aria-label="Delete review"
                    >
                      <Trash2 size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>

      <style>{`
        .reviews-page {
          min-height: 100vh;
          min-height: 100dvh;
          background: transparent;
        }

        .page-header {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px var(--page-padding-x, 20px);
          padding-top: calc(12px + var(--safe-area-top, 0px));
          background: transparent;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                      opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, opacity;
        }

        .page-header.header-hidden {
          transform: translateY(-100%);
          opacity: 0;
          pointer-events: none;
        }

        .back-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: none;
          border-radius: 14px;
          color: var(--gray-600, #475569);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.7);
          color: var(--gray-900, #0f172a);
        }

        .back-btn:active {
          transform: scale(0.95);
        }

        .page-title {
          font-family: var(--font-display, system-ui);
          font-size: 18px;
          font-weight: 700;
          color: var(--gray-900, #0f172a);
          margin: 0;
          letter-spacing: -0.02em;
        }

        .new-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--blu-primary, #0066ff) 0%, #0ea5e9 100%);
          border: none;
          border-radius: 14px;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 102, 255, 0.25);
        }

        .new-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 102, 255, 0.35);
        }

        .new-btn:active {
          transform: scale(0.95);
        }

        .page-content {
          padding: var(--page-padding-x, 20px);
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Stats */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: transparent;
          border: none;
          border-radius: 14px;
        }

        .stat-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          flex-shrink: 0;
        }

        .stat-card.warning .stat-icon {
          background: rgba(245, 158, 11, 0.12);
          color: #f59e0b;
        }

        .stat-card.success .stat-icon {
          background: rgba(16, 185, 129, 0.12);
          color: var(--data-green, #10b981);
        }

        .stat-card.neutral .stat-icon {
          background: var(--gray-100, #f1f5f9);
          color: var(--gray-500, #64748b);
        }

        .stat-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .stat-value {
          font-family: var(--font-display, system-ui);
          font-size: 22px;
          font-weight: 700;
          color: var(--gray-900, #0f172a);
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .stat-label {
          font-size: 12px;
          color: var(--gray-500, #64748b);
        }

        /* Filter */
        .filter-section {
          margin: -8px 0;
        }

        .filter-tabs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .filter-tabs::-webkit-scrollbar {
          display: none;
        }

        .filter-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.5);
          border: none;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
          color: var(--gray-600, #475569);
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-tab:hover {
          background: rgba(255, 255, 255, 0.7);
        }

        .filter-tab.active {
          background: linear-gradient(135deg, var(--blu-primary, #0066ff) 0%, #0ea5e9 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(0, 102, 255, 0.25);
        }

        /* Review Cards */
        .reviews-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .review-card {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px;
          background: transparent;
          border: none;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .review-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }

        .review-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          flex-shrink: 0;
        }

        .review-icon.warning {
          background: rgba(245, 158, 11, 0.12);
          color: #f59e0b;
        }

        .review-icon.info {
          background: rgba(14, 165, 233, 0.12);
          color: #0ea5e9;
        }

        .review-icon.success {
          background: rgba(16, 185, 129, 0.12);
          color: var(--data-green, #10b981);
        }

        .review-icon.danger {
          background: rgba(239, 68, 68, 0.12);
          color: var(--data-red, #ef4444);
        }

        .review-content {
          flex: 1;
          min-width: 0;
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 8px;
        }

        .review-summary {
          font-size: 15px;
          font-weight: 600;
          color: var(--gray-900, #0f172a);
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .review-date {
          font-size: 12px;
          color: var(--gray-400, #94a3b8);
          white-space: nowrap;
          flex-shrink: 0;
        }

        .review-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          margin-bottom: 8px;
        }

        .review-status {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .review-status.warning {
          background: rgba(245, 158, 11, 0.12);
          color: #f59e0b;
        }

        .review-status.info {
          background: rgba(14, 165, 233, 0.12);
          color: #0ea5e9;
        }

        .review-status.success {
          background: rgba(16, 185, 129, 0.12);
          color: var(--data-green, #10b981);
        }

        .review-status.danger {
          background: rgba(239, 68, 68, 0.12);
          color: var(--data-red, #ef4444);
        }

        .review-actions-count {
          font-size: 12px;
          color: var(--gray-500, #64748b);
        }

        .review-transcript {
          font-size: 13px;
          font-style: italic;
          color: var(--gray-500, #64748b);
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.5;
        }

        .review-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          flex-shrink: 0;
        }

        .resume-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: linear-gradient(135deg, var(--blu-primary, #0066ff) 0%, #0ea5e9 100%);
          border-radius: 100px;
          font-size: 11px;
          font-weight: 600;
          color: white;
          box-shadow: 0 2px 6px rgba(0, 102, 255, 0.25);
        }

        .delete-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gray-100, #f1f5f9);
          border: none;
          border-radius: 10px;
          color: var(--gray-400, #94a3b8);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .delete-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: var(--data-red, #ef4444);
        }

        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 60px 24px;
          text-align: center;
          background: transparent;
          border: none;
          border-radius: 20px;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(0, 102, 255, 0.08) 0%, rgba(14, 165, 233, 0.08) 100%);
          border-radius: 24px;
          color: var(--blu-primary, #0066ff);
          margin-bottom: 20px;
        }

        .empty-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--gray-900, #0f172a);
          margin: 0 0 8px 0;
        }

        .empty-text {
          font-size: 14px;
          color: var(--gray-500, #64748b);
          margin: 0 0 24px 0;
          max-width: 280px;
        }

        .empty-cta {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 24px;
          background: linear-gradient(135deg, var(--blu-primary, #0066ff) 0%, #0ea5e9 100%);
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(0, 102, 255, 0.3);
        }

        .empty-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(0, 102, 255, 0.4);
        }

        .empty-cta:active {
          transform: scale(0.98);
        }

        @media (prefers-reduced-motion: reduce) {
          .page-header,
          .back-btn,
          .new-btn,
          .filter-tab,
          .review-card,
          .delete-btn,
          .empty-cta {
            transition: none;
          }

          .page-header.header-hidden {
            transform: none;
            opacity: 1;
            pointer-events: auto;
          }
        }

        @media (max-width: 400px) {
          .stats-row {
            grid-template-columns: 1fr;
          }

          .stat-card {
            flex-direction: row;
            justify-content: flex-start;
          }

          .review-card {
            flex-direction: column;
          }

          .review-actions {
            flex-direction: row;
            width: 100%;
            justify-content: flex-end;
            padding-top: 12px;
            margin-top: 4px;
          }
        }
      `}</style>
    </main>
  );
}

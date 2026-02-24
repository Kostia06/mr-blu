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
import { cn } from '@/lib/utils';
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
    <main class="min-h-screen bg-transparent">
      <header class="sticky top-0 z-[100] flex items-center gap-3 px-[var(--page-padding-x,20px)] pt-[calc(12px+var(--safe-area-top,0px))] pb-3 bg-transparent">
        <button
          class="w-10 h-10 flex items-center justify-center bg-white/50 backdrop-blur-xl border-none rounded-[14px] text-slate-600 cursor-pointer transition-all hover:bg-white/70"
          onClick={() => navigateTo('/dashboard')}
          aria-label="Back to dashboard"
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <h1 class="flex-1 text-xl font-bold text-slate-900 m-0">Feedback</h1>
        <div class="w-10" />
      </header>

      <div class="px-[var(--page-padding-x,20px)] max-w-[800px] mx-auto">
        {/* Filters */}
        <div class="flex gap-2 flex-wrap mb-4">
          <button
            class={cn(
              'py-2 px-4 border-none rounded-full text-[13px] font-medium cursor-pointer transition-all capitalize',
              !category
                ? 'bg-[var(--blu-primary,#0066ff)] text-white'
                : 'bg-white/50 text-slate-600 hover:bg-white/70'
            )}
            onClick={() => filterByCategory(null)}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              class={cn(
                'py-2 px-4 border-none rounded-full text-[13px] font-medium cursor-pointer transition-all capitalize',
                category === cat
                  ? 'text-white'
                  : 'bg-white/50 text-slate-600 hover:bg-white/70'
              )}
              onClick={() => filterByCategory(cat)}
              style={category === cat ? { background: getCategoryColor(cat) } : undefined}
            >
              {cat}
            </button>
          ))}
          <button
            class={cn(
              'py-2 px-4 border-none rounded-full text-[13px] font-medium cursor-pointer transition-all ml-auto',
              unreadOnly
                ? 'bg-[var(--data-amber,#fbbf24)] text-slate-900'
                : 'bg-white/50 text-slate-600 hover:bg-white/70'
            )}
            onClick={toggleUnread}
          >
            Unread only
          </button>
        </div>

        {/* Stats */}
        <div class="flex items-center gap-3 mb-4 text-[13px] text-slate-500">
          <span>
            {totalCount} feedback item{totalCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Feedback List */}
        <div class="flex flex-col gap-3">
          {feedback.map((item) => {
            const Icon = getCategoryIcon(item.category);
            const isExpanded = expandedFeedback.has(item.id);

            return (
              <div
                key={item.id}
                class={cn(
                  'bg-white/60 backdrop-blur-xl rounded-[20px] overflow-hidden',
                  item.responded_at && 'opacity-70'
                )}
              >
                <button
                  class="flex items-start gap-3 w-full p-4 bg-transparent border-none text-left cursor-pointer"
                  onClick={() => toggleFeedback(item.id)}
                >
                  <span class="shrink-0 mt-0.5" style={{ color: getCategoryColor(item.category) }}>
                    <Icon size={20} />
                  </span>
                  <div class="flex-1 min-w-0 flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        {item.category}
                      </span>
                      {item.responded_at && (
                        <span class="flex items-center gap-1 py-0.5 px-2 bg-green-500 text-white text-[10px] font-semibold rounded-full">
                          <Check size={12} />
                          Responded
                        </span>
                      )}
                    </div>
                    <span class="text-sm text-slate-900 line-clamp-2">
                      {item.comment}
                    </span>
                    <span class="text-xs text-slate-400">
                      {formatDate(item.created_at)} ·{' '}
                      {item.profiles?.full_name || item.profiles?.email || 'Anonymous'}
                    </span>
                  </div>
                  <span class={cn('shrink-0 text-slate-400 transition-transform duration-200', isExpanded && 'rotate-180')}>
                    <ChevronDown size={18} />
                  </span>
                </button>

                {isExpanded && (
                  <div class="px-4 pb-4 border-t border-slate-100">
                    <div class="mt-3">
                      <h4 class="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Full Comment</h4>
                      <p class="text-sm text-slate-700 leading-relaxed m-0 whitespace-pre-wrap">{item.comment}</p>
                    </div>

                    {item.page_context && (
                      <div class="mt-3">
                        <h4 class="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Page Context</h4>
                        <code class="block bg-slate-100 py-2 px-3 rounded-[10px] text-xs text-slate-600">
                          {item.page_context}
                        </code>
                      </div>
                    )}

                    {!item.responded_at ? (
                      <div class="mt-4 pt-4 border-t border-slate-100">
                        {respondingTo === item.id ? (
                          <>
                            <textarea
                              value={responseText}
                              onInput={(e) =>
                                setResponseText((e.target as HTMLTextAreaElement).value)
                              }
                              placeholder="Write your response..."
                              class="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-[10px] text-sm resize-y mb-3 box-border font-[inherit] outline-none focus:border-[var(--blu-primary,#0066ff)]"
                            />
                            <div class="flex gap-2 justify-end">
                              <button
                                class="py-2 px-4 rounded-[10px] text-[13px] font-medium cursor-pointer transition-all bg-slate-100 border-none text-slate-600 hover:bg-slate-200"
                                onClick={() => setRespondingTo(null)}
                              >
                                Cancel
                              </button>
                              <button
                                class="py-2 px-4 rounded-[10px] text-[13px] font-medium cursor-pointer transition-all bg-[var(--blu-primary,#0066ff)] border-none text-white hover:opacity-90"
                                onClick={() => markAsResponded(item.id)}
                              >
                                Mark as Responded
                              </button>
                            </div>
                          </>
                        ) : (
                          <button
                            class="py-2 px-4 rounded-[10px] text-[13px] font-medium cursor-pointer transition-all bg-transparent border border-slate-300 text-slate-600 hover:bg-slate-50"
                            onClick={() => setRespondingTo(item.id)}
                          >
                            Respond
                          </button>
                        )}
                      </div>
                    ) : (
                      <div class="mt-3">
                        <h4 class="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Response</h4>
                        <p class="text-sm text-slate-700 m-0 italic">
                          {item.response || 'Marked as responded'}
                        </p>
                        <span class="text-xs text-slate-400 mt-1 block">
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
            <div class="flex flex-col items-center gap-3 py-12 px-6 text-slate-400">
              <MessageSquare size={48} />
              <p>No feedback found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div class="flex items-center justify-center gap-4 mt-6">
            {page > 1 && (
              <button
                class="py-2 px-4 bg-[var(--blu-primary,#0066ff)] border-none rounded-[10px] text-white text-[13px] font-medium cursor-pointer transition-all hover:opacity-90"
                onClick={() => goToPage(page - 1)}
              >
                Previous
              </button>
            )}
            <span class="text-[13px] text-slate-500">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <button
                class="py-2 px-4 bg-[var(--blu-primary,#0066ff)] border-none rounded-[10px] text-white text-[13px] font-medium cursor-pointer transition-all hover:opacity-90"
                onClick={() => goToPage(page + 1)}
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

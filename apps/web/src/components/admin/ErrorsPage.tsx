import { useState, useMemo, useCallback } from 'preact/hooks';
import {
  ChevronLeft,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { navigateTo } from '@/lib/navigation';

interface ErrorLog {
  id: string;
  error_type: string;
  message: string;
  severity: string;
  stack: string | null;
  user_id: string | null;
  request_method: string | null;
  request_path: string | null;
  status_code: number | null;
  created_at: string;
}

interface ErrorsPageProps {
  errors: ErrorLog[];
  totalCount: number;
  page: number;
  limit: number;
  severity: string | null;
}

const SEVERITIES = ['critical', 'error', 'warn', 'info'];

function getSeverityIcon(severity: string) {
  switch (severity) {
    case 'critical':
    case 'error':
      return AlertCircle;
    case 'warn':
      return AlertTriangle;
    default:
      return Info;
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical':
      return 'var(--data-red, #ef4444)';
    case 'error':
      return 'var(--data-orange, #f59e0b)';
    case 'warn':
      return 'var(--data-amber, #fbbf24)';
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

export function ErrorsPage({ errors, totalCount, page, limit, severity }: ErrorsPageProps) {
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  const totalPages = useMemo(() => Math.ceil(totalCount / limit), [totalCount, limit]);

  const toggleError = useCallback((id: string) => {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const filterBySeverity = useCallback(
    (sev: string | null) => {
      if (sev) {
        navigateTo(`/admin/errors?severity=${sev}`);
      } else {
        navigateTo('/admin/errors');
      }
    },
    []
  );

  const goToPage = useCallback(
    (targetPage: number) => {
      const params = new URLSearchParams();
      params.set('page', String(targetPage));
      if (severity) params.set('severity', severity);
      navigateTo(`/admin/errors?${params.toString()}`);
    },
    [severity]
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
        <h1 class="flex-1 text-xl font-bold text-slate-900 m-0">Error Logs</h1>
        <div class="w-10" />
      </header>

      <div class="px-[var(--page-padding-x,20px)] max-w-[800px] mx-auto">
        {/* Filters */}
        <div class="flex gap-2 flex-wrap mb-4">
          <button
            class={cn(
              'py-2 px-4 border-none rounded-full text-[13px] font-medium cursor-pointer transition-all capitalize',
              !severity
                ? 'bg-[var(--blu-primary,#0066ff)] text-white'
                : 'bg-white/50 text-slate-600 hover:bg-white/70'
            )}
            onClick={() => filterBySeverity(null)}
          >
            All
          </button>
          {SEVERITIES.map((sev) => (
            <button
              key={sev}
              class={cn(
                'py-2 px-4 border-none rounded-full text-[13px] font-medium cursor-pointer transition-all capitalize',
                severity === sev
                  ? 'text-white'
                  : 'bg-white/50 text-slate-600 hover:bg-white/70'
              )}
              onClick={() => filterBySeverity(sev)}
              style={severity === sev ? { background: getSeverityColor(sev) } : undefined}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div class="flex items-center gap-3 mb-4 text-[13px] text-slate-500">
          <span>
            {totalCount} error{totalCount !== 1 ? 's' : ''}
          </span>
          {severity && (
            <span class="text-[var(--blu-primary,#0066ff)]">Filtered by: {severity}</span>
          )}
        </div>

        {/* Error List */}
        <div class="flex flex-col gap-3">
          {errors.map((error) => {
            const Icon = getSeverityIcon(error.severity);
            const isExpanded = expandedErrors.has(error.id);

            return (
              <div
                key={error.id}
                class="bg-white/60 backdrop-blur-xl rounded-[20px] overflow-hidden"
              >
                <button
                  class="flex items-start gap-3 w-full p-4 bg-transparent border-none text-left cursor-pointer"
                  onClick={() => toggleError(error.id)}
                >
                  <span class="shrink-0 mt-0.5" style={{ color: getSeverityColor(error.severity) }}>
                    <Icon size={20} />
                  </span>
                  <div class="flex-1 min-w-0 flex flex-col gap-1">
                    <span class="text-sm font-semibold text-slate-900">{error.error_type}</span>
                    <span class="text-[13px] text-slate-600 truncate">{error.message}</span>
                    <span class="text-xs text-slate-400">
                      {formatDate(error.created_at)} · {error.request_method || 'N/A'}{' '}
                      {error.request_path || ''}
                    </span>
                  </div>
                  <span class={cn('shrink-0 text-slate-400 transition-transform duration-200', isExpanded && 'rotate-180')}>
                    <ChevronDown size={18} />
                  </span>
                </button>

                {isExpanded && (
                  <div class="px-4 pb-4 border-t border-slate-100">
                    {error.stack && (
                      <div class="mt-3">
                        <h4 class="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Stack Trace</h4>
                        <pre class="bg-slate-900 text-slate-100 p-3 rounded-[10px] text-[11px] font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-[200px] m-0">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    <div class="mt-3">
                      <h4 class="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Details</h4>
                      <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
                        <span class="text-slate-500">User ID:</span>
                        <span class="text-slate-900 font-mono">{error.user_id || 'N/A'}</span>
                        <span class="text-slate-500">Status Code:</span>
                        <span class="text-slate-900 font-mono">{error.status_code || 'N/A'}</span>
                        <span class="text-slate-500">Severity:</span>
                        <span class="text-slate-900 font-mono">{error.severity}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {errors.length === 0 && (
            <div class="flex flex-col items-center gap-3 py-12 px-6 text-slate-400">
              <Info size={48} />
              <p>No errors found</p>
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

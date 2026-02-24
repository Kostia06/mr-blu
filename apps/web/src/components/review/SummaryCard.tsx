import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18nStore } from '@/lib/i18n';

type SummaryVariant = 'default' | 'info-query' | 'clone-mode' | 'send-mode';

interface SummaryCardProps {
  summary: string;
  variant?: SummaryVariant;
  label?: string;
}

const variantClasses: Record<SummaryVariant, {
  container: string;
  icon: string;
  accent: string;
}> = {
  default: {
    container: 'bg-amber-500/5 border-amber-500/15',
    icon: 'bg-amber-500/[0.12] text-amber-700',
    accent: 'text-amber-700',
  },
  'info-query': {
    container: 'bg-purple-500/5 border-purple-500/15',
    icon: 'bg-purple-500/[0.12] text-violet-600',
    accent: 'text-violet-600',
  },
  'clone-mode': {
    container: 'bg-blue-500/5 border-blue-500/15',
    icon: 'bg-blue-500/[0.12] text-blue-600',
    accent: 'text-blue-600',
  },
  'send-mode': {
    container: 'bg-violet-500/5 border-violet-500/15',
    icon: 'bg-violet-500/[0.12] text-violet-600',
    accent: 'text-violet-600',
  },
};

export function SummaryCard({ summary, variant = 'default', label }: SummaryCardProps) {
  const { t } = useI18nStore();
  const classes = variantClasses[variant];

  return (
    <div class={cn('flex gap-3 px-4 py-3.5 border rounded-[14px]', classes.container)}>
      <div
        class={cn(
          'flex items-center justify-center w-8 h-8 rounded-[10px] shrink-0',
          classes.icon
        )}
      >
        <Sparkles size={16} />
      </div>
      <div class="flex-1 min-w-0">
        <div
          class={cn(
            'text-xs font-semibold tracking-wide uppercase mb-1',
            classes.accent
          )}
        >
          {label || t('review.iUnderstood')}
        </div>
        <p class="text-sm leading-relaxed text-[var(--gray-700,#334155)] m-0">
          {summary || t('review.processingRequest')}
        </p>
      </div>
    </div>
  );
}

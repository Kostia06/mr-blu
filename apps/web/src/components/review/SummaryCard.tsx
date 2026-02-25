import { Sparkles } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';

type SummaryVariant = 'default' | 'info-query' | 'clone-mode' | 'send-mode';

interface SummaryCardProps {
  summary: string;
  variant?: SummaryVariant;
  label?: string;
}

const variantConfig: Record<SummaryVariant, { bg: string; border: string; accent: string; iconBg: string }> = {
  default: {
    bg: 'rgba(245, 158, 11, 0.05)',
    border: 'rgba(245, 158, 11, 0.15)',
    accent: '#b45309',
    iconBg: 'rgba(245, 158, 11, 0.12)',
  },
  'info-query': {
    bg: 'rgba(168, 85, 247, 0.05)',
    border: 'rgba(168, 85, 247, 0.15)',
    accent: '#7c3aed',
    iconBg: 'rgba(168, 85, 247, 0.12)',
  },
  'clone-mode': {
    bg: 'rgba(59, 130, 246, 0.05)',
    border: 'rgba(59, 130, 246, 0.15)',
    accent: '#2563eb',
    iconBg: 'rgba(59, 130, 246, 0.12)',
  },
  'send-mode': {
    bg: 'rgba(139, 92, 246, 0.05)',
    border: 'rgba(139, 92, 246, 0.15)',
    accent: '#7c3aed',
    iconBg: 'rgba(139, 92, 246, 0.12)',
  },
};

export function SummaryCard({ summary, variant = 'default', label }: SummaryCardProps) {
  const { t } = useI18nStore();
  const config = variantConfig[variant];

  return (
    <div
      class="flex gap-3 px-4 py-3.5 rounded-[14px]"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      <div
        class="flex items-center justify-center w-8 h-8 rounded-[10px] shrink-0"
        style={{
          background: config.iconBg,
          color: config.accent,
        }}
      >
        <Sparkles size={16} />
      </div>
      <div class="flex-1 min-w-0">
        <div
          class="text-xs font-semibold tracking-[0.02em] uppercase mb-1"
          style={{ color: config.accent }}
        >
          {label || t('review.iUnderstood')}
        </div>
        <p class="text-sm leading-normal text-[var(--gray-700,#334155)] m-0">
          {summary || t('review.processingRequest')}
        </p>
      </div>
    </div>
  );
}

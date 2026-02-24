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
      style={{
        display: 'flex',
        gap: '12px',
        padding: '14px 16px',
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: '14px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          background: config.iconBg,
          color: config.accent,
          flexShrink: '0',
        }}
      >
        <Sparkles size={16} />
      </div>
      <div style={{ flex: '1', minWidth: '0' }}>
        <div
          style={{
            fontSize: '12px',
            fontWeight: '600',
            color: config.accent,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}
        >
          {label || t('review.iUnderstood')}
        </div>
        <p
          style={{
            fontSize: '14px',
            lineHeight: '1.5',
            color: 'var(--gray-700, #334155)',
            margin: '0',
          }}
        >
          {summary || t('review.processingRequest')}
        </p>
      </div>
    </div>
  );
}

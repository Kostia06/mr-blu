import type { ComponentChildren } from 'preact';
import { cn } from './cn';

type BadgeStatus = 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'signed';
type BadgeVariant = 'default' | 'outline' | 'dot';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  status?: BadgeStatus;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  children?: ComponentChildren;
}

const STATUS_LABELS: Record<BadgeStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  pending: 'Pending',
  paid: 'Paid',
  overdue: 'Overdue',
  signed: 'Signed',
};

const STATUS_COLORS: Record<BadgeStatus, { background: string; color: string }> = {
  draft: { background: '#F2F2F7', color: '#8E8E93' },
  sent: { background: '#E6F0FF', color: '#0066FF' },
  pending: { background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
  paid: { background: '#E8FAE8', color: '#34C759' },
  overdue: { background: '#FFF0E6', color: '#FF9500' },
  signed: { background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' },
};

const BASE_STYLE: Record<string, string> = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontWeight: '600',
  borderRadius: 'var(--radius-chip, 100px)',
  whiteSpace: 'nowrap',
  transition: 'all 0.2s ease',
};

export function Badge({
  status,
  variant = 'default',
  size = 'md',
  className,
  children,
}: BadgeProps) {
  const sizeStyle =
    size === 'sm'
      ? { padding: '4px 8px', fontSize: '11px' }
      : { padding: '6px 12px', fontSize: '12px' };

  const statusStyle = status ? STATUS_COLORS[status] : {};

  const variantStyle = buildVariantStyle(variant, status);

  const combinedStyle = {
    ...BASE_STYLE,
    ...sizeStyle,
    ...statusStyle,
    ...variantStyle,
  };

  return (
    <span class={cn(className)} style={combinedStyle}>
      {variant === 'dot' && <DotIndicator />}
      {children ?? (status ? STATUS_LABELS[status] : null)}
    </span>
  );
}

function buildVariantStyle(
  variant: BadgeVariant,
  status?: BadgeStatus,
): Record<string, string> {
  if (variant === 'outline') {
    const borderColor =
      status === 'draft' ? 'var(--gray-300, #cbd5e1)' : 'currentColor';
    return {
      background: 'transparent',
      border: `1px solid ${borderColor}`,
    };
  }

  if (variant === 'dot') {
    return {
      background: 'transparent',
      padding: '4px 0',
    };
  }

  return {};
}

function DotIndicator() {
  return (
    <span
      style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'currentColor',
        flexShrink: '0',
      }}
    />
  );
}

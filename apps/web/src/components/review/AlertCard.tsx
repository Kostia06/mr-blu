import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import type { LucideIcon } from '@/lib/types/lucide';

type AlertVariant = 'warning' | 'error' | 'info' | 'success';

interface AlertCardProps {
  variant?: AlertVariant;
  title: string;
  message?: string;
}

const iconMap: Record<AlertVariant, LucideIcon> = {
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
  success: CheckCircle,
};

const variantStyles: Record<AlertVariant, { bg: string; borderColor: string; color: string }> = {
  warning: {
    bg: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    color: '#d97706',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    color: '#dc2626',
  },
  info: {
    bg: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    color: '#2563eb',
  },
  success: {
    bg: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    color: '#059669',
  },
};

export function AlertCard({ variant = 'warning', title, message }: AlertCardProps) {
  const Icon = iconMap[variant];
  const vStyle = variantStyles[variant];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '12px',
        background: vStyle.bg,
        border: `1px solid ${vStyle.borderColor}`,
        color: vStyle.color,
      }}
    >
      <Icon size={20} />
      <div style={styles.alertContent}>
        <strong style={styles.alertTitle}>{title}</strong>
        {message && <span style={styles.alertMessage}>{message}</span>}
      </div>
    </div>
  );
}

const styles: Record<string, Record<string, string>> = {
  alertContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  alertTitle: {
    fontSize: '14px',
    fontWeight: '600',
  },
  alertMessage: {
    fontSize: '13px',
    opacity: '0.9',
  },
};

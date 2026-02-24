import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
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

const variantClasses: Record<AlertVariant, { container: string; text: string }> = {
  warning: {
    container: 'bg-amber-500/10 border-amber-500/30 text-amber-600',
    text: 'text-amber-600',
  },
  error: {
    container: 'bg-red-500/10 border-red-500/30 text-red-600',
    text: 'text-red-600',
  },
  info: {
    container: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
    text: 'text-blue-600',
  },
  success: {
    container: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600',
    text: 'text-emerald-600',
  },
};

export function AlertCard({ variant = 'warning', title, message }: AlertCardProps) {
  const Icon = iconMap[variant];
  const classes = variantClasses[variant];

  return (
    <div
      class={cn(
        'flex items-start gap-3 px-4 py-3.5 rounded-xl border',
        classes.container
      )}
    >
      <Icon size={20} />
      <div class="flex flex-col gap-0.5">
        <strong class={cn('text-sm font-semibold', classes.text)}>{title}</strong>
        {message && <span class="text-[13px] opacity-90">{message}</span>}
      </div>
    </div>
  );
}

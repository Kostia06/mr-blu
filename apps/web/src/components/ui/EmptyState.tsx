import type { ComponentChildren, ComponentType } from 'preact';
import { cn } from './cn';
import { Button } from './Button';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ComponentType<{ class?: string }>;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div class={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {Icon && (
        <div class="mb-4 rounded-full bg-white/5 p-4">
          <Icon class="h-10 w-10 text-[var(--blu-text-muted)]" />
        </div>
      )}
      <h3 class="text-lg font-semibold text-[var(--blu-text)]">{title}</h3>
      {description && (
        <p class="mt-2 max-w-sm text-sm text-[var(--blu-text-muted)]">{description}</p>
      )}
      {action && (
        <div class="mt-6">
          <Button variant="primary" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}

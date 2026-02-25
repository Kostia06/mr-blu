import type { ComponentChildren } from 'preact';
import { cn } from '@/lib/utils';

type SectionVariant = 'default' | 'card' | 'inline';

interface FormSectionProps {
  title?: string;
  description?: string;
  variant?: SectionVariant;
  className?: string;
  children: ComponentChildren;
}

export function FormSection({
  title,
  description,
  variant = 'default',
  className,
  children,
}: FormSectionProps) {
  const isCard = variant === 'card';
  const isInline = variant === 'inline';
  const hasHeader = title || description;

  return (
    <div
      class={cn(
        'flex flex-col gap-5',
        isCard && 'p-6 rounded-[var(--radius-card,20px)] border border-white/50 bg-white/40 backdrop-blur-[12px] overflow-hidden',
        isInline && 'flex-row items-start gap-8',
        className,
      )}
    >
      {hasHeader && (
        <div
          class={cn(
            'flex flex-col gap-1',
            isInline && 'min-w-[200px] max-w-[280px] shrink-0',
          )}
        >
          {title && <h3 class="text-[17px] font-semibold text-[var(--gray-900)] leading-[1.4]">{title}</h3>}
          {description && <p class="text-sm text-[var(--gray-500)] leading-normal">{description}</p>}
        </div>
      )}

      <div class="flex flex-col gap-4 flex-1 min-w-0">{children}</div>
    </div>
  );
}

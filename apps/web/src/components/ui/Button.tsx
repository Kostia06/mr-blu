import type { ComponentChildren, JSX } from 'preact';
import { cn } from './cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  disabled?: boolean;
  loading?: boolean;
  pulse?: boolean;
  className?: string;
  onClick?: (event: MouseEvent) => void;
  children?: ComponentChildren;
  type?: 'button' | 'submit' | 'reset';
}

const BASE_CLASSES =
  'relative inline-flex items-center justify-center font-semibold transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--blu-bg-dark)] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden active:scale-[var(--tap-scale)] active:transition-transform active:duration-[var(--tap-duration)]';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--blu-primary)] hover:bg-[var(--blu-primary-hover)] active:bg-[var(--blu-primary-active)] text-white focus:ring-[var(--blu-primary)] shadow-lg shadow-[var(--blu-primary)]/25 hover:shadow-xl hover:shadow-[var(--blu-primary)]/30 hover:-translate-y-0.5 active:translate-y-0',
  secondary:
    'bg-white/10 hover:bg-white/15 active:bg-white/20 text-white border border-white/20 hover:border-white/30 focus:ring-white/50 backdrop-blur-sm',
  ghost:
    'bg-transparent hover:bg-white/5 active:bg-white/10 text-[var(--blu-text-light)] focus:ring-white/30',
  outline:
    'bg-transparent border-2 border-[var(--blu-primary)] text-[var(--blu-primary)] hover:bg-[var(--blu-primary)] hover:text-white focus:ring-[var(--blu-primary)]',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm gap-1.5 min-h-[36px] rounded-[var(--radius-sm)]',
  md: 'px-6 py-3 text-base gap-2 min-h-[50px] rounded-[var(--radius-md)]',
  lg: 'px-8 py-4 text-lg gap-2.5 min-h-[56px] rounded-[var(--radius-md)]',
};

function LoadingSpinner() {
  return (
    <svg
      class="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  href,
  disabled = false,
  loading = false,
  pulse = false,
  className,
  onClick,
  children,
  type = 'button',
}: ButtonProps) {
  const classes = cn(
    BASE_CLASSES,
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    pulse && 'pulse-glow',
    className,
  );

  if (href && !disabled) {
    return (
      <a href={href} class={classes}>
        {loading && <LoadingSpinner />}
        {children}
      </a>
    );
  }

  return (
    <button class={classes} disabled={disabled || loading} onClick={onClick} type={type}>
      {loading && <LoadingSpinner />}
      {children}
    </button>
  );
}

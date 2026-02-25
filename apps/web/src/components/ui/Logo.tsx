import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'white';
}

const SIZE_CLASSES = {
  sm: 'text-[20px]',
  md: 'text-[28px]',
  lg: 'text-[36px]',
} as const;

const COLOR_CLASSES = {
  default: 'text-[var(--blu-primary,#0066ff)]',
  white: 'text-white',
} as const;

export function Logo({ size = 'md', variant = 'default' }: LogoProps) {
  return (
    <span class={cn(
      'font-extrabold tracking-[-0.5px] leading-none',
      SIZE_CLASSES[size],
      COLOR_CLASSES[variant],
    )}>
      mrblu
    </span>
  );
}

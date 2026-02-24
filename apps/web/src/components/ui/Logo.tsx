import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'white'
}

const SIZE_CLASSES = {
  sm: 'text-xl',
  md: 'text-[28px]',
  lg: 'text-4xl',
} as const

const COLOR_CLASSES = {
  default: 'text-[var(--blu-primary,#0066ff)]',
  white: 'text-white',
} as const

export function Logo({ size = 'md', variant = 'default' }: LogoProps) {
  return (
    <span class={cn(
      'font-extrabold leading-none tracking-tight',
      SIZE_CLASSES[size],
      COLOR_CLASSES[variant],
    )}>
      mrblu
    </span>
  )
}

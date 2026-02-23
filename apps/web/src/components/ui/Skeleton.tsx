import { cn } from './cn';

type SkeletonVariant = 'text' | 'circle' | 'rect' | 'card';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string;
  height?: string;
  className?: string;
}

const VARIANT_CLASSES: Record<SkeletonVariant, string> = {
  text: 'h-[1em] w-full rounded',
  circle: 'w-12 h-12 rounded-full',
  rect: 'w-full h-[100px] rounded-[var(--radius-md,14px)]',
  card: 'w-full h-[120px] rounded-[var(--radius-lg,20px)]',
};

const SHIMMER_STYLE = `
@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;

export function Skeleton({
  variant = 'text',
  width,
  height,
  className,
}: SkeletonProps) {
  const inlineStyle: Record<string, string> = {
    background:
      'linear-gradient(90deg, var(--gray-100, #f1f5f9) 0%, var(--gray-200, #e2e8f0) 50%, var(--gray-100, #f1f5f9) 100%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
  };

  if (width) inlineStyle.width = width;
  if (height) inlineStyle.height = height;

  return (
    <>
      <style>{SHIMMER_STYLE}</style>
      <div
        class={cn(VARIANT_CLASSES[variant], className)}
        style={inlineStyle}
        role="status"
        aria-label="Loading..."
      />
    </>
  );
}

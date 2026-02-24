import { Skeleton } from '@/components/ui/Skeleton';

interface DocumentListSkeletonProps {
  count?: number;
}

export function DocumentListSkeleton({ count = 5 }: DocumentListSkeletonProps) {
  return (
    <div class="flex flex-col gap-2">
      <style>{fadeInKeyframes}</style>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          class="flex items-center gap-3.5 p-4 bg-white/40 backdrop-blur-xl rounded-[var(--radius-button,14px)] opacity-0"
          style={{
            animation: 'docSkeletonFadeIn 0.3s ease forwards',
            animationDelay: `${i * 100}ms`,
          }}
        >
          <Skeleton variant="rect" width="48px" height="48px" className="flex-shrink-0 !rounded-[14px]" />
          <div class="flex-1 flex flex-col gap-1.5">
            <Skeleton variant="text" width="140px" height="16px" />
            <Skeleton variant="text" width="100px" height="13px" className="opacity-70" />
          </div>
          <Skeleton variant="text" width="70px" height="16px" className="ml-auto" />
        </div>
      ))}
    </div>
  );
}

const fadeInKeyframes = `
@keyframes docSkeletonFadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

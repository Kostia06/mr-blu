import { Skeleton } from '@/components/ui/Skeleton';

interface DocumentListSkeletonProps {
  count?: number;
}

export function DocumentListSkeleton({ count = 5 }: DocumentListSkeletonProps) {
  return (
    <div style={styles.list}>
      <style>{fadeInKeyframes}</style>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            ...styles.item,
            animationDelay: `${i * 100}ms`,
          }}
        >
          <Skeleton variant="rect" width="48px" height="48px" className="flex-shrink-0 !rounded-[14px]" />
          <div style={styles.content}>
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

const styles: Record<string, Record<string, string>> = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 'var(--radius-button, 14px)',
    opacity: '0',
    animation: 'docSkeletonFadeIn 0.3s ease forwards',
  },
  content: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
};

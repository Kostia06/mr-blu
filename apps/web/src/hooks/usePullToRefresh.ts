import { useRef, useEffect, useState, useCallback } from 'preact/hooks';
import type { RefObject } from 'preact';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
}

interface UsePullToRefreshResult {
  containerRef: RefObject<HTMLDivElement>;
  isRefreshing: boolean;
  pullDistance: number;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
}: UsePullToRefreshOptions): UsePullToRefreshResult {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touching = false;

    function handleTouchStart(e: TouchEvent) {
      if (container!.scrollTop <= 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
        touching = true;
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (!touching || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0 && container!.scrollTop <= 0) {
        const dampened = Math.min(diff * 0.4, threshold * 1.5);
        setPullDistance(dampened);
        if (diff > 10) e.preventDefault();
      }
    }

    function handleTouchEnd() {
      if (!touching) return;
      touching = false;

      if (pullDistance >= threshold && !isRefreshing) {
        handleRefresh();
      }

      startY.current = 0;
      setPullDistance(0);
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleRefresh, threshold, isRefreshing, pullDistance]);

  return { containerRef, isRefreshing, pullDistance };
}

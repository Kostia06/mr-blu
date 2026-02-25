import { useRef, useState, useCallback } from 'preact/hooks';
import type { RefObject } from 'preact';

interface SwipeActionsOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

interface SwipeActionsResult {
  ref: RefObject<HTMLDivElement>;
  offset: number;
  isSwiping: boolean;
  handlers: {
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

export function useSwipeActions({
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
}: SwipeActionsOptions): SwipeActionsResult {
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const locked = useRef(false);
  const elementRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    locked.current = false;
    setIsSwiping(false);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Lock direction after 10px of movement
    if (!locked.current && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      locked.current = true;
      if (Math.abs(dy) > Math.abs(dx)) return; // vertical scroll, ignore
    }

    if (!locked.current) return;
    if (Math.abs(dy) > Math.abs(dx)) return;

    setIsSwiping(true);

    // Dampen the offset as it gets further
    const dampened = dx > 0
      ? Math.min(dx * 0.6, threshold * 1.5)
      : Math.max(dx * 0.6, -threshold * 1.5);

    setOffset(dampened);
  }, [threshold]);

  const handleTouchEnd = useCallback(() => {
    if (offset < -threshold && onSwipeLeft) {
      onSwipeLeft();
    } else if (offset > threshold && onSwipeRight) {
      onSwipeRight();
    }
    setOffset(0);
    setIsSwiping(false);
  }, [offset, threshold, onSwipeLeft, onSwipeRight]);

  return {
    ref: elementRef,
    offset,
    isSwiping,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}

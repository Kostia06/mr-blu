import { useState, useRef, useCallback } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { Trash2, Send } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';

interface SwipeableCardProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  rightDisabled?: boolean;
  leftDisabled?: boolean;
  children: ComponentChildren;
}

const SWIPE_THRESHOLD = 80;
const MAX_SWIPE = 120;

export function SwipeableCard({
  onSwipeLeft,
  onSwipeRight,
  rightDisabled = false,
  leftDisabled = false,
  children,
}: SwipeableCardProps) {
  const { t } = useI18nStore();
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHorizontalSwipe, setIsHorizontalSwipe] = useState(false);
  const startRef = useRef({ x: 0, y: 0 });
  const determinedRef = useRef(false);

  const leftOpacity = Math.min(1, Math.abs(Math.min(0, offsetX)) / SWIPE_THRESHOLD);
  const rightOpacity = Math.min(1, Math.max(0, offsetX) / SWIPE_THRESHOLD);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    startRef.current = { x: clientX, y: clientY };
    determinedRef.current = false;
    setIsDragging(true);
    setIsHorizontalSwipe(false);
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;

    const deltaX = clientX - startRef.current.x;
    const deltaY = clientY - startRef.current.y;

    if (!determinedRef.current) {
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        determinedRef.current = true;
        const horizontal = Math.abs(deltaX) > Math.abs(deltaY);
        setIsHorizontalSwipe(horizontal);
        if (!horizontal) return;
      } else {
        return;
      }
    }

    if (!isHorizontalSwipe) return;

    let newOffset = deltaX;
    if (rightDisabled && newOffset > 0) newOffset *= 0.2;
    if (leftDisabled && newOffset < 0) newOffset *= 0.2;

    if (Math.abs(newOffset) > MAX_SWIPE) {
      const excess = Math.abs(newOffset) - MAX_SWIPE;
      newOffset = (newOffset > 0 ? 1 : -1) * (MAX_SWIPE + excess * 0.3);
    }

    setOffsetX(newOffset);
  }, [isDragging, isHorizontalSwipe, rightDisabled, leftDisabled]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (offsetX < -SWIPE_THRESHOLD && !leftDisabled && onSwipeLeft) {
      onSwipeLeft();
    } else if (offsetX > SWIPE_THRESHOLD && !rightDisabled && onSwipeRight) {
      onSwipeRight();
    }

    setOffsetX(0);
  }, [isDragging, offsetX, leftDisabled, rightDisabled, onSwipeLeft, onSwipeRight]);

  return (
    <div class="relative overflow-hidden rounded-[var(--radius-button,14px)]" role="group" aria-label="Swipeable card">
      {/* Left action (delete) */}
      <div
        class="absolute inset-y-0 left-0 w-[120px] flex flex-col items-center justify-center gap-1.5 pointer-events-none rounded-l-[var(--radius-button,14px)]"
        style={{
          background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.95) 0%, rgba(239, 68, 68, 0.8) 100%)',
          opacity: leftOpacity,
        }}
      >
        <div class="size-11 flex items-center justify-center rounded-full bg-white/20">
          <Trash2 size={24} class="text-white" />
        </div>
        <span class="text-xs font-semibold text-white uppercase tracking-wide">{t('swipe.delete')}</span>
      </div>

      {/* Right action (send) */}
      <div
        class="absolute inset-y-0 right-0 w-[120px] flex flex-col items-center justify-center gap-1.5 pointer-events-none rounded-r-[var(--radius-button,14px)]"
        style={{
          background: rightDisabled
            ? 'linear-gradient(270deg, rgba(148, 163, 184, 0.95) 0%, rgba(148, 163, 184, 0.8) 100%)'
            : 'linear-gradient(270deg, rgba(0, 102, 255, 0.95) 0%, rgba(0, 102, 255, 0.8) 100%)',
          opacity: rightOpacity,
        }}
      >
        <div class="size-11 flex items-center justify-center rounded-full bg-white/20">
          <Send size={24} class="text-white" />
        </div>
        <span class="text-xs font-semibold text-white uppercase tracking-wide">
          {rightDisabled ? t('swipe.alreadySent') : t('swipe.send')}
        </span>
      </div>

      {/* Swipeable content */}
      <div
        class="relative z-[1] select-none"
        style={{
          cursor: isDragging && isHorizontalSwipe ? 'grabbing' : 'grab',
          touchAction: isHorizontalSwipe ? 'none' : 'pan-y',
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => {
          if (isHorizontalSwipe && isDragging) e.preventDefault();
          handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => { if (e.button === 0) handleStart(e.clientX, e.clientY); }}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={() => { if (isDragging) handleEnd(); }}
      >
        {children}
      </div>
    </div>
  );
}

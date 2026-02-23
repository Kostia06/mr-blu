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
  const direction = offsetX > 30 ? 'right' : offsetX < -30 ? 'left' : null;

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
    <div style={wrapperStyle} role="group" aria-label="Swipeable card">
      {/* Left action (delete) */}
      <div style={{ ...indicatorBaseStyle, ...indicatorLeftStyle, opacity: leftOpacity }}>
        <div style={{ ...actionIconStyle, background: 'rgba(255, 255, 255, 0.2)' }}>
          <Trash2 size={24} style={{ color: 'white' }} />
        </div>
        <span style={actionLabelStyle}>{t('swipe.delete')}</span>
      </div>

      {/* Right action (send) */}
      <div style={{
        ...indicatorBaseStyle,
        ...indicatorRightStyle,
        ...(rightDisabled ? indicatorDisabledStyle : {}),
        opacity: rightOpacity,
      }}>
        <div style={{ ...actionIconStyle, background: 'rgba(255, 255, 255, 0.2)' }}>
          <Send size={24} style={{ color: 'white' }} />
        </div>
        <span style={actionLabelStyle}>
          {rightDisabled ? t('swipe.alreadySent') : t('swipe.send')}
        </span>
      </div>

      {/* Swipeable content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          cursor: isDragging && isHorizontalSwipe ? 'grabbing' : 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
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

const wrapperStyle: Record<string, string> = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 'var(--radius-button, 14px)',
};

const indicatorBaseStyle: Record<string, string | number> = {
  position: 'absolute',
  top: '0',
  bottom: '0',
  width: '120px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  pointerEvents: 'none',
};

const indicatorLeftStyle: Record<string, string> = {
  left: '0',
  background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.95) 0%, rgba(239, 68, 68, 0.8) 100%)',
  borderRadius: 'var(--radius-button, 14px) 0 0 var(--radius-button, 14px)',
};

const indicatorRightStyle: Record<string, string> = {
  right: '0',
  background: 'linear-gradient(270deg, rgba(0, 102, 255, 0.95) 0%, rgba(0, 102, 255, 0.8) 100%)',
  borderRadius: '0 var(--radius-button, 14px) var(--radius-button, 14px) 0',
};

const indicatorDisabledStyle: Record<string, string> = {
  background: 'linear-gradient(270deg, rgba(148, 163, 184, 0.95) 0%, rgba(148, 163, 184, 0.8) 100%)',
};

const actionIconStyle: Record<string, string> = {
  width: '44px',
  height: '44px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
};

const actionLabelStyle: Record<string, string> = {
  fontSize: '12px',
  fontWeight: '600',
  color: 'white',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

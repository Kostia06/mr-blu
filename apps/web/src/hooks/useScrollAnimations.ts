import { useEffect, useRef, useState, useCallback } from 'preact/hooks';
import type { RefObject } from 'preact';
import { easeOutCubic } from '@/lib/animations/easings';

interface RevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export function useReveal<T extends HTMLElement>(options: RevealOptions = {}): {
  ref: RefObject<T>;
  isVisible: boolean;
} {
  const { threshold = 0.15, rootMargin = '0px', once = true } = options;
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, isVisible };
}

interface StaggerOptions {
  threshold?: number;
  staggerDelay?: number;
  once?: boolean;
}

export function useStagger<T extends HTMLElement>(
  itemCount: number,
  options: StaggerOptions = {}
): {
  containerRef: RefObject<T>;
  visibleItems: boolean[];
} {
  const { threshold = 0.1, staggerDelay = 100, once = true } = options;
  const containerRef = useRef<T>(null);
  const [visibleItems, setVisibleItems] = useState<boolean[]>(() =>
    Array(itemCount).fill(false)
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setVisibleItems(Array(itemCount).fill(true));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          for (let i = 0; i < itemCount; i++) {
            setTimeout(() => {
              setVisibleItems((prev) => {
                const next = [...prev];
                next[i] = true;
                return next;
              });
            }, i * staggerDelay);
          }
          if (once) observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [itemCount, threshold, staggerDelay, once]);

  return { containerRef, visibleItems };
}

interface ParallaxOptions {
  speed?: number;
  direction?: 'up' | 'down';
}

export function useParallax<T extends HTMLElement>(options: ParallaxOptions = {}): {
  ref: RefObject<T>;
  offset: number;
} {
  const { speed = 0.3, direction = 'up' } = options;
  const ref = useRef<T>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    function handleScroll() {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewHeight = window.innerHeight;
      const progress = (viewHeight - rect.top) / (viewHeight + rect.height);
      const clamped = Math.max(0, Math.min(1, progress));
      const value = (clamped - 0.5) * speed * 100;
      setOffset(direction === 'up' ? -value : value);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, direction]);

  return { ref, offset };
}

interface CountUpOptions {
  duration?: number;
  start?: number;
  delay?: number;
}

export function useCountUp(
  end: number,
  options: CountUpOptions = {}
): { ref: RefObject<HTMLElement>; value: number } {
  const { duration = 2000, start = 0, delay = 0 } = options;
  const ref = useRef<HTMLElement>(null);
  const [value, setValue] = useState(start);
  const hasStarted = useRef(false);

  const animate = useCallback(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const startTime = performance.now() + delay;
    const range = end - start;

    function tick(now: number) {
      const elapsed = now - startTime;
      if (elapsed < 0) {
        requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = easeOutCubic(progress);
      setValue(Math.round(start + range * easedProgress));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [end, start, duration, delay]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setValue(end);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate();
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animate, end]);

  return { ref, value };
}

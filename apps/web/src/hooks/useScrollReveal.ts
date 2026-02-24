import { useRef, useEffect } from 'preact/hooks';

interface ScrollRevealOptions {
  stagger?: number;
  duration?: number;
  y?: number;
  start?: string;
}

export function useScrollReveal<T extends HTMLElement>({
  stagger = 0.1,
  duration = 0.6,
  y = 40,
  start = 'top 75%',
}: ScrollRevealOptions = {}) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      const node = containerRef.current;
      if (!node) return;
      const elements = node.querySelectorAll<HTMLElement>('[data-reveal]');
      elements.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    let ctx: { revert: () => void } | undefined;

    import('gsap').then(({ gsap }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);

        const node = containerRef.current;
        if (!node) return;

        const elements = node.querySelectorAll('[data-reveal]');
        if (elements.length === 0) return;

        gsap.set(elements, { y, opacity: 0 });

        ctx = ScrollTrigger.create({
          trigger: node,
          start,
          onEnter: () => {
            gsap.to(elements, {
              y: 0,
              opacity: 1,
              duration,
              ease: 'power2.out',
              stagger,
            });
          },
          once: true,
        }) as unknown as { revert: () => void };
      });
    });

    return () => ctx?.revert();
  }, [stagger, duration, y, start]);

  return containerRef;
}

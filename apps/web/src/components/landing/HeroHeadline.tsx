import { useEffect, useRef, useMemo } from 'preact/hooks';
import { useI18nStore } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function HeroHeadline() {
  const { t } = useI18nStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const words = useMemo(
    () => [
      { text: t('landing.hero.word1') },
      { text: t('landing.hero.word2'), highlight: true },
      { text: t('landing.hero.word3') },
    ],
    [t]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const node = containerRef.current;
    if (!node) return;

    if (prefersReducedMotion) {
      node.querySelectorAll<HTMLElement>('.hero-word').forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      const sub = node.querySelector<HTMLElement>('.hero-sub');
      if (sub) {
        sub.style.opacity = '1';
      }
      return;
    }

    import('gsap').then(({ gsap }) => {
      const wordEls = node.querySelectorAll('.hero-word');
      const sub = node.querySelector('.hero-sub');

      gsap.to(wordEls, {
        y: 0,
        opacity: 1,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.12,
        delay: 0.1,
      });

      if (sub) {
        gsap.to(sub, {
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          delay: 0.5,
        });
      }
    });
  }, []);

  return (
    <div className="text-center relative" ref={containerRef}>
      <h1 className="font-[var(--font-display)] text-[clamp(3rem,10vw,5.5rem)] font-bold leading-[1.05] -tracking-[0.04em] text-[var(--landing-text)] mb-6 flex flex-col items-center">
        {words.map((word) => (
          <span
            key={word.text}
            className={cn(
              "hero-word block opacity-0 translate-y-5",
              word.highlight && "bg-gradient-to-br from-[#0066ff] via-[#0ea5e9] to-[#6366f1] bg-clip-text text-transparent"
            )}
          >
            {word.text}
          </span>
        ))}
      </h1>
      <p className="hero-sub font-[var(--font-body)] text-[clamp(1rem,2.5vw,1.25rem)] font-normal leading-[1.6] text-[var(--landing-text-secondary)] max-w-[440px] mx-auto opacity-0">
        {t('landing.hero.subheadline')}
      </p>
    </div>
  );
}

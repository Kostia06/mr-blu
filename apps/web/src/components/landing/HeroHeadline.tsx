import { useEffect, useRef, useMemo } from 'preact/hooks';
import { useI18nStore } from '@/lib/i18n';

const styles = {
  container: {
    textAlign: 'center' as const,
    position: 'relative' as const,
  },
  headline: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(3rem, 10vw, 5.5rem)',
    fontWeight: 700,
    lineHeight: 1.05,
    letterSpacing: '-0.04em',
    color: 'var(--landing-text, #0A0A0A)',
    margin: '0 0 24px 0',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  word: {
    display: 'block',
    opacity: 0,
    transform: 'translateY(20px)',
  },
  highlight: {
    display: 'block',
    background: 'linear-gradient(135deg, #0066ff 0%, #0ea5e9 50%, #6366f1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    opacity: 0,
    transform: 'translateY(20px)',
  },
  subheadline: {
    fontFamily: 'var(--font-body)',
    fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
    fontWeight: 400,
    lineHeight: 1.6,
    color: 'var(--landing-text-secondary, #6B7280)',
    maxWidth: 440,
    margin: '0 auto',
    opacity: 0,
  },
};

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
    <div style={styles.container} ref={containerRef}>
      <h1 style={styles.headline}>
        {words.map((word) => (
          <span
            key={word.text}
            className="hero-word"
            style={word.highlight ? styles.highlight : styles.word}
          >
            {word.text}
          </span>
        ))}
      </h1>
      <p className="hero-sub" style={styles.subheadline}>
        {t('landing.hero.subheadline')}
      </p>
    </div>
  );
}

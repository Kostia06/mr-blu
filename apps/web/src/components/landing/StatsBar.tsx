import { useRef, useState, useEffect, useMemo } from 'preact/hooks';
import { useI18nStore } from '@/lib/i18n';

interface Stat {
  value: string;
  label: string;
  suffix?: string;
}

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
  },
  statValue: {
    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: 700,
    color: 'var(--landing-text, #0A0A0A)',
    letterSpacing: '-0.02em',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--landing-text-secondary, #6B7280)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    marginTop: 4,
  },
};

export function StatsBar() {
  const { t } = useI18nStore();
  const barRef = useRef<HTMLDivElement>(null);

  const stats: Stat[] = useMemo(
    () => [
      { value: '500', suffix: '+', label: t('landing.testimonials.stat1Label') },
      { value: '5', suffix: ' hrs', label: t('landing.testimonials.stat2Label') },
      { value: '10', suffix: 'k+', label: t('landing.testimonials.stat3Label') },
    ],
    [t]
  );

  const [displayValues, setDisplayValues] = useState<string[]>(stats.map(() => '0'));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    import('gsap').then(({ gsap }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);

        const node = barRef.current;
        if (!node) return;

        ScrollTrigger.create({
          trigger: node,
          start: 'top 85%',
          onEnter: () => {
            stats.forEach((stat, index) => {
              const numericValue = parseFloat(stat.value.replace(/[^0-9.]/g, ''));
              gsap.to(
                { val: 0 },
                {
                  val: numericValue,
                  duration: 1.5,
                  ease: 'power2.out',
                  delay: index * 0.2,
                  onUpdate: function () {
                    const current = this.targets()[0].val;
                    setDisplayValues((prev) => {
                      const next = [...prev];
                      next[index] = Math.floor(current).toString();
                      return next;
                    });
                  },
                }
              );
            });
          },
          once: true,
        });
      });
    });
  }, [stats]);

  return (
    <div style={styles.bar} ref={barRef} data-reveal>
      {stats.map((stat, i) => (
        <div key={stat.label} style={styles.statItem}>
          <span style={styles.statValue}>
            {displayValues[i]}{stat.suffix || ''}
          </span>
          <span style={styles.statLabel}>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}

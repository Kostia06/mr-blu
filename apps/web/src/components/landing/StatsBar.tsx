import { useRef, useState, useEffect, useMemo } from 'preact/hooks';
import { useI18nStore } from '@/lib/i18n';

interface Stat {
  value: string;
  label: string;
  suffix?: string;
}

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
    <div className="flex items-center justify-center gap-10" ref={barRef} data-reveal>
      {stats.map((stat, i) => (
        <div key={stat.label} className="flex flex-col items-center text-center">
          <span className="font-[var(--font-mono)] text-[clamp(2rem,5vw,3rem)] font-bold text-[var(--landing-text)] -tracking-[0.02em] leading-none">
            {displayValues[i]}{stat.suffix || ''}
          </span>
          <span className="text-xs font-medium text-[var(--landing-text-secondary)] uppercase tracking-[0.06em] mt-1">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}

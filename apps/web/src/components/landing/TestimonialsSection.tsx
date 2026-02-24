import { useMemo } from 'preact/hooks';
import { StatsBar } from './StatsBar';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useI18nStore } from '@/lib/i18n';

const styles = {
  section: {
    width: '100%',
    padding: '100px 24px',
    background: '#FFFFFF',
  },
  container: {
    width: '100%',
    maxWidth: 560,
    margin: '0 auto',
  },
  statsWrapper: {
    marginBottom: 64,
  },
  testimonial: {
    paddingLeft: 24,
    borderLeft: '2px solid #E5E7EB',
  },
  quote: {
    fontFamily: 'var(--font-body)',
    fontSize: 'clamp(1.125rem, 2.5vw, 1.375rem)',
    fontWeight: 400,
    lineHeight: 1.7,
    color: 'var(--landing-text, #0A0A0A)',
    margin: '0 0 24px 0',
    fontStyle: 'italic' as const,
  },
  authorName: {
    fontWeight: 600,
    color: 'var(--landing-text, #0A0A0A)',
    fontSize: 15,
    display: 'block',
  },
  authorRole: {
    fontSize: 13,
    color: 'var(--landing-text-secondary, #6B7280)',
    display: 'block',
    marginTop: 2,
  },
};

export function TestimonialsSection() {
  const { t } = useI18nStore();
  const containerRef = useScrollReveal<HTMLDivElement>({ stagger: 0.15 });

  const testimonial = useMemo(
    () => ({
      quote: t('landing.testimonials.quote'),
      author: t('landing.testimonials.author'),
      role: t('landing.testimonials.role'),
    }),
    [t]
  );

  return (
    <section id="testimonials" style={styles.section}>
      <div style={styles.container} ref={containerRef}>
        <div style={styles.statsWrapper} data-reveal>
          <StatsBar />
        </div>

        <div style={styles.testimonial} data-reveal>
          <blockquote style={styles.quote}>"{testimonial.quote}"</blockquote>
          <div>
            <span style={styles.authorName}>{testimonial.author}</span>
            <span style={styles.authorRole}>{testimonial.role}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

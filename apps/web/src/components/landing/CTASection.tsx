import { ArrowRight } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useI18nStore } from '@/lib/i18n';

const styles = {
  section: {
    width: '100%',
    background: '#FFFFFF',
  },
  container: {
    textAlign: 'center' as const,
    maxWidth: 560,
    margin: '0 auto',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2.5rem, 7vw, 4rem)',
    fontWeight: 700,
    color: 'var(--landing-text, #0A0A0A)',
    margin: '0 0 16px 0',
    letterSpacing: '-0.03em',
    lineHeight: 1.05,
  },
  description: {
    fontSize: 16,
    color: 'var(--landing-text-secondary, #6B7280)',
    margin: '0 0 32px 0',
    lineHeight: 1.6,
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '18px 36px',
    background: 'var(--blu-primary, #0066ff)',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 600,
    textDecoration: 'none',
    borderRadius: 100,
    transition: 'background 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 2px 10px rgba(0, 102, 255, 0.25)',
  },
};

export function CTASection() {
  const { t } = useI18nStore();
  const containerRef = useScrollReveal<HTMLDivElement>();

  return (
    <section id="cta" className="landing-scene" style={styles.section}>
      <div style={styles.container} ref={containerRef}>
        <h2 style={styles.title} data-reveal>{t('landing.cta.title')}</h2>
        <p style={styles.description} data-reveal>{t('landing.cta.description')}</p>
        <div data-reveal>
          <a
            href="/login"
            style={styles.button}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = '#0052cc';
              el.style.boxShadow = '0 4px 20px rgba(0, 102, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'var(--blu-primary, #0066ff)';
              el.style.boxShadow = '0 2px 10px rgba(0, 102, 255, 0.25)';
            }}
          >
            <span>{t('landing.hero.ctaPrimary')}</span>
            <ArrowRight size={20} strokeWidth={2.5} />
          </a>
        </div>
      </div>
    </section>
  );
}

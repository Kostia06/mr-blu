import { useRef, useEffect } from 'preact/hooks';
import { ArrowRight } from 'lucide-react';
import { HeroHeadline } from './HeroHeadline';
import { HeroPhone } from './HeroPhone';
import { useI18nStore } from '@/lib/i18n';

const styles = {
  hero: {
    position: 'relative' as const,
    minHeight: '100svh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 24px 48px',
    background: '#FFFFFF',
    overflowX: 'clip' as const,
  },
  container: {
    width: '100%',
    maxWidth: 480,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 24,
  },
  phoneWrapper: {
    opacity: 0,
    transform: 'translateY(30px)',
  },
  ctaButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '14px 28px',
    fontSize: 15,
    fontWeight: 600,
    textDecoration: 'none',
    borderRadius: 100,
    background: 'var(--blu-primary, #0066ff)',
    color: '#FFFFFF',
    transition: 'background 0.2s ease, box-shadow 0.2s ease, opacity 0.6s ease',
    boxShadow: '0 2px 10px rgba(0, 102, 255, 0.25)',
    opacity: 0,
  },
  trustText: {
    fontSize: 13,
    fontWeight: 400,
    color: 'var(--landing-text-secondary, #6B7280)',
    textAlign: 'center' as const,
    opacity: 0,
  },
};

export function HeroSection() {
  const { t } = useI18nStore();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const node = sectionRef.current;
    if (!node) return;

    if (prefersReducedMotion) {
      node.querySelectorAll<HTMLElement>('.hero-animate').forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    import('gsap').then(({ gsap }) => {
      const phone = node.querySelector('.hero-phone-wrap');
      const cta = node.querySelector('.hero-cta');
      const trust = node.querySelector('.hero-trust-line');

      if (phone) {
        gsap.to(phone, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          delay: 0.6,
        });
      }

      if (cta) {
        gsap.to(cta, {
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out',
          delay: 1,
        });
      }

      if (trust) {
        gsap.to(trust, {
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out',
          delay: 1.2,
        });
      }
    });
  }, []);

  return (
    <section style={styles.hero} id="main-content" ref={sectionRef}>
      <div style={styles.container}>
        <HeroHeadline />

        <div className="hero-animate hero-phone-wrap" style={styles.phoneWrapper}>
          <HeroPhone />
        </div>

        <a
          href="/login"
          className="hero-animate hero-cta"
          style={styles.ctaButton}
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
          <ArrowRight size={18} strokeWidth={2.5} />
        </a>

        <p className="hero-animate hero-trust-line" style={styles.trustText}>
          {t('landing.hero.trust1')} &middot; {t('landing.hero.trust2')} &middot; {t('landing.hero.trust3')}
        </p>
      </div>
    </section>
  );
}

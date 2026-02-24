import { useState, useEffect, useCallback } from 'preact/hooks';
import { ArrowRight } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';

const styles = {
  skipLink: {
    position: 'absolute' as const,
    top: 16,
    left: 16,
    zIndex: 100,
    padding: '12px 24px',
    background: '#0A0A0A',
    color: 'white',
    fontWeight: 600,
    borderRadius: 8,
    textDecoration: 'none',
    transform: 'translateY(calc(-100% - 16px))',
    transition: 'transform 0.2s ease',
  },
  navbar: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    padding: '0 24px',
    transition: 'background 0.3s ease, border-color 0.3s ease',
  },
  navContainer: {
    width: '100%',
    maxWidth: 1280,
    margin: '0 auto',
  },
  navContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
  },
  logoLink: {
    textDecoration: 'none',
  },
  logoText: {
    fontSize: 22,
    fontWeight: 800,
    color: 'var(--blu-primary, #0066ff)',
    letterSpacing: -0.5,
    lineHeight: 1,
    fontFamily: 'var(--font-display)',
  },
  ctaButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 20px',
    background: 'var(--blu-primary, #0066ff)',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 600,
    textDecoration: 'none',
    borderRadius: 100,
    transition: 'background 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 2px 10px rgba(0, 102, 255, 0.25)',
  },
};

export function Navbar() {
  const { t } = useI18nStore();
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <>
      <a
        href="#main-content"
        style={styles.skipLink}
        onFocus={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(calc(-100% - 16px))';
        }}
      >
        {t('landing.nav.skipToContent')}
      </a>

      <header style={{
        ...styles.navbar,
        background: scrolled ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid #F3F4F6' : '1px solid transparent',
      }}>
        <nav style={styles.navContainer} aria-label="Main navigation">
          <div style={styles.navContent}>
            <a href="/" style={styles.logoLink} aria-label="mrblu Home">
              <span style={styles.logoText}>mrblu</span>
            </a>

            <a
              href="/login"
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
              <span>{t('landing.nav.getStarted')}</span>
              <ArrowRight size={14} strokeWidth={2.5} />
            </a>
          </div>
        </nav>
      </header>
    </>
  );
}

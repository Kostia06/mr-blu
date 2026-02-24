import { useI18nStore } from '@/lib/i18n';

const styles = {
  footer: {
    borderTop: '1px solid #F3F4F6',
    padding: '32px 24px',
    background: '#FFFFFF',
  },
  container: {
    maxWidth: 1280,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: 16,
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
  },
  link: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
  },
  copyright: {
    fontSize: 12,
    color: '#9CA3AF',
    margin: 0,
  },
  langToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: '#9CA3AF',
  },
  langButton: {
    background: 'none',
    border: 'none',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 4,
    transition: 'color 0.2s ease, background 0.2s ease',
  },
};

export function Footer() {
  const { locale, setLocale, t } = useI18nStore();
  const currentYear = new Date().getFullYear();

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.links}>
          <a
            href="/terms"
            style={styles.link}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#0A0A0A'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }}
          >
            {t('landing.footer.terms')}
          </a>
          <a
            href="/privacy"
            style={styles.link}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#0A0A0A'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }}
          >
            {t('landing.footer.privacy')}
          </a>
          <a
            href="mailto:soporte@mrblu.com"
            style={styles.link}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#0A0A0A'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }}
          >
            {t('landing.footer.contact')}
          </a>
        </div>

        <div style={styles.langToggle}>
          <button
            style={{
              ...styles.langButton,
              color: locale === 'en' ? '#0A0A0A' : '#9CA3AF',
              fontWeight: locale === 'en' ? 600 : 400,
            }}
            onClick={() => setLocale('en')}
          >
            EN
          </button>
          <span style={{ color: '#D1D5DB' }}>|</span>
          <button
            style={{
              ...styles.langButton,
              color: locale === 'es' ? '#0A0A0A' : '#9CA3AF',
              fontWeight: locale === 'es' ? 600 : 400,
            }}
            onClick={() => setLocale('es')}
          >
            ES
          </button>
        </div>

        <p style={styles.copyright}>
          &copy; {currentYear} mrblu. {t('landing.footer.copyright')}
        </p>
      </div>
    </footer>
  );
}

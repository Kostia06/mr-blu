const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--white, #dbe8f4)',
    padding: '120px 24px 80px',
  },
  container: {
    maxWidth: 640,
    margin: '0 auto',
  },
  backLink: {
    display: 'inline-block',
    fontSize: 14,
    color: 'var(--gray-500, #64748b)',
    textDecoration: 'none',
    marginBottom: 32,
    transition: 'color 0.2s ease',
  },
  title: {
    fontFamily: 'var(--font-display, system-ui)',
    fontSize: 'clamp(2rem, 5vw, 2.5rem)',
    fontWeight: 700,
    color: 'var(--gray-900, #0f172a)',
    letterSpacing: '-0.02em',
    margin: '0 0 8px 0',
  },
  updated: {
    fontSize: 14,
    color: 'var(--gray-500, #64748b)',
    margin: '0 0 48px 0',
  },
  section: {
    marginBottom: 32,
  },
  heading: {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--gray-900, #0f172a)',
    margin: '0 0 8px 0',
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 1.7,
    color: 'var(--gray-600, #475569)',
    margin: 0,
  },
  link: {
    color: 'var(--blu-primary, #0066ff)',
    textDecoration: 'none',
  },
};

export function TermsPage() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <a href="/" style={styles.backLink}>&larr; Back</a>
        <h1 style={styles.title}>Terms of Service</h1>
        <p style={styles.updated}>Last updated: February 2026</p>

        <section style={styles.section}>
          <h2 style={styles.heading}>1. Acceptance of Terms</h2>
          <p style={styles.paragraph}>By accessing or using mrblu, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.</p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>2. Description of Service</h2>
          <p style={styles.paragraph}>mrblu is a billing assistant that helps users capture, organize, and manage invoices and expenses through voice and document processing.</p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>3. User Accounts</h2>
          <p style={styles.paragraph}>You are responsible for maintaining the security of your account credentials. You must provide accurate information when creating an account.</p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>4. Acceptable Use</h2>
          <p style={styles.paragraph}>You agree not to misuse the service, interfere with its operation, or use it for any unlawful purpose.</p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>5. Data and Privacy</h2>
          <p style={styles.paragraph}>Your use of mrblu is also governed by our <a href="/privacy" style={styles.link}>Privacy Policy</a>. We process your data as described therein.</p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>6. Limitation of Liability</h2>
          <p style={styles.paragraph}>mrblu is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service.</p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>7. Changes to Terms</h2>
          <p style={styles.paragraph}>We may update these terms from time to time. Continued use of the service constitutes acceptance of the updated terms.</p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>8. Contact</h2>
          <p style={styles.paragraph}>For questions about these terms, contact us at <a href="mailto:soporte@mrblu.com" style={styles.link}>soporte@mrblu.com</a>.</p>
        </section>
      </div>
    </div>
  );
}

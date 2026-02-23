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

export function PrivacyPage() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <a href="/" style={styles.backLink}>&larr; Back</a>
        <h1 style={styles.title}>Privacy Policy</h1>
        <p style={styles.updated}>Last updated: February 2026</p>

        <section style={styles.section}>
          <h2 style={styles.heading}>1. Information We Collect</h2>
          <p style={styles.paragraph}>We collect information you provide directly: account details (email, name), uploaded documents (invoices, receipts), and voice recordings for transcription.</p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>2. How We Use Your Information</h2>
          <p style={styles.paragraph}>Your data is used to provide the mrblu service: processing documents, generating summaries, and organizing your billing information.</p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>3. Data Storage</h2>
          <p style={styles.paragraph}>Your data is stored securely using industry-standard encryption. We use Supabase for authentication and data storage.</p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>4. Data Sharing</h2>
          <p style={styles.paragraph}>We do not sell your personal data. We may share data with third-party services strictly necessary for operating the platform (e.g., AI processing, cloud storage).</p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>5. Your Rights</h2>
          <p style={styles.paragraph}>You may request access to, correction of, or deletion of your personal data at any time by contacting us.</p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>6. Cookies</h2>
          <p style={styles.paragraph}>We use essential cookies for authentication and session management. No tracking or advertising cookies are used.</p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>7. Changes to This Policy</h2>
          <p style={styles.paragraph}>We may update this policy periodically. We will notify you of significant changes through the service.</p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>8. Contact</h2>
          <p style={styles.paragraph}>For privacy-related questions, contact us at <a href="mailto:soporte@mrblu.com" style={styles.link}>soporte@mrblu.com</a>.</p>
        </section>
      </div>
    </div>
  );
}

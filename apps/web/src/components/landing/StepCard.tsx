interface StepCardProps {
  step: number;
  title: string;
  description: string;
}

const styles = {
  card: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
  },
  numberCircle: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: '1.5px solid #E5E7EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  number: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--landing-text, #0A0A0A)',
    fontFamily: 'var(--font-mono)',
  },
  content: {
    flex: 1,
    paddingTop: 6,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--landing-text, #0A0A0A)',
    margin: '0 0 4px 0',
    letterSpacing: '-0.01em',
  },
  description: {
    fontSize: 14,
    lineHeight: 1.5,
    color: 'var(--landing-text-secondary, #6B7280)',
    margin: 0,
  },
};

export function StepCard({ step, title, description }: StepCardProps) {
  return (
    <div style={styles.card} data-reveal>
      <div style={styles.numberCircle}>
        <span style={styles.number}>{step}</span>
      </div>
      <div style={styles.content}>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.description}>{description}</p>
      </div>
    </div>
  );
}

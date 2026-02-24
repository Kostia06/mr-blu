import type { LucideIcon } from '@/lib/types/lucide';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  accent?: 'blue' | 'cyan' | 'green' | 'amber';
}

const ACCENT_BG: Record<string, string> = {
  blue: 'rgba(0, 102, 255, 0.08)',
  cyan: 'rgba(14, 165, 233, 0.08)',
  green: 'rgba(16, 185, 129, 0.08)',
  amber: 'rgba(245, 158, 11, 0.08)',
};

const ACCENT_COLOR: Record<string, string> = {
  blue: '#0066FF',
  cyan: '#0EA5E9',
  green: '#10B981',
  amber: '#F59E0B',
};

const styles = {
  card: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    padding: 24,
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
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

export function FeatureCard({ title, description, icon: Icon, accent = 'blue' }: FeatureCardProps) {
  return (
    <div style={styles.card} data-reveal>
      <div style={{ ...styles.iconCircle, background: ACCENT_BG[accent], color: ACCENT_COLOR[accent] }}>
        <Icon size={22} strokeWidth={1.5} />
      </div>
      <div style={styles.content}>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.description}>{description}</p>
      </div>
    </div>
  );
}

import type { ComponentChildren } from 'preact';

type SectionVariant = 'default' | 'card' | 'inline';

interface FormSectionProps {
  title?: string;
  description?: string;
  variant?: SectionVariant;
  className?: string;
  children: ComponentChildren;
}

const styles = {
  base: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  card: {
    padding: '24px',
    borderRadius: 'var(--radius-md, 12px)',
    border: '1px solid var(--gray-200)',
    background: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  inline: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start',
    gap: '32px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  inlineHeader: {
    minWidth: '200px',
    maxWidth: '280px',
    flexShrink: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: 600,
    color: 'var(--gray-900)',
    lineHeight: 1.4,
  },
  description: {
    fontSize: 14,
    color: 'var(--gray-500)',
    lineHeight: 1.5,
  },
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    flex: 1,
    minWidth: 0,
  },
};

export function FormSection({
  title,
  description,
  variant = 'default',
  className,
  children,
}: FormSectionProps) {
  const isCard = variant === 'card';
  const isInline = variant === 'inline';

  const sectionStyle: Record<string, string | number> = {
    ...styles.base,
    ...(isCard ? styles.card : {}),
    ...(isInline ? styles.inline : {}),
  };

  const hasHeader = title || description;

  return (
    <div style={sectionStyle} class={className}>
      {hasHeader && (
        <div style={{ ...styles.header, ...(isInline ? styles.inlineHeader : {}) }}>
          {title && <h3 style={styles.title}>{title}</h3>}
          {description && <p style={styles.description}>{description}</p>}
        </div>
      )}

      <div style={styles.content}>{children}</div>
    </div>
  );
}

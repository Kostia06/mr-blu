import { useMemo } from 'preact/hooks';
import { Mic, Zap, FileStack, Shield } from 'lucide-react';
import { FeatureCard } from './FeatureCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useI18nStore } from '@/lib/i18n';

const styles = {
  section: {
    width: '100%',
    padding: '80px 24px',
    background: '#FFFFFF',
  },
  container: {
    width: '100%',
    maxWidth: 480,
    margin: '0 auto',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: 40,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.5rem, 5vw, 2rem)',
    fontWeight: 700,
    color: 'var(--landing-text, #0A0A0A)',
    margin: '0 0 12px 0',
    letterSpacing: '-0.02em',
  },
  description: {
    fontSize: 15,
    color: 'var(--landing-text-secondary, #6B7280)',
    maxWidth: 400,
    margin: '0 auto',
    lineHeight: 1.6,
  },
  grid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
};

export function FeaturesSection() {
  const { t } = useI18nStore();
  const containerRef = useScrollReveal<HTMLDivElement>({ stagger: 0.08 });

  const features = useMemo(
    () => [
      { title: t('landing.features.feature1Title'), description: t('landing.features.feature1Desc'), icon: Mic, accent: 'blue' as const },
      { title: t('landing.features.feature2Title'), description: t('landing.features.feature2Desc'), icon: Zap, accent: 'cyan' as const },
      { title: t('landing.features.feature3Title'), description: t('landing.features.feature3Desc'), icon: FileStack, accent: 'green' as const },
      { title: t('landing.features.feature4Title'), description: t('landing.features.feature4Desc'), icon: Shield, accent: 'amber' as const },
    ],
    [t]
  );

  return (
    <section id="features" style={styles.section}>
      <div style={styles.container} ref={containerRef}>
        <div style={styles.header} data-reveal>
          <h2 style={styles.title}>{t('landing.features.title')}</h2>
          <p style={styles.description}>{t('landing.features.description')}</p>
        </div>

        <div style={styles.grid}>
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

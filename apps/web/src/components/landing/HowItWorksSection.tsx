import { useMemo } from 'preact/hooks';
import { StepCard } from './StepCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useI18nStore } from '@/lib/i18n';

const styles = {
  section: {
    width: '100%',
    background: '#FFFFFF',
  },
  container: {
    width: '100%',
    maxWidth: 360,
    margin: '0 auto',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: 48,
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
    maxWidth: 340,
    margin: '0 auto',
    lineHeight: 1.6,
  },
  stepsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 0,
    position: 'relative' as const,
  },
  stepWrapper: {
    position: 'relative' as const,
    paddingLeft: 0,
    paddingBottom: 32,
  },
  stepWrapperLast: {
    position: 'relative' as const,
    paddingLeft: 0,
    paddingBottom: 0,
  },
  verticalLine: {
    position: 'absolute' as const,
    left: 17,
    top: 36,
    bottom: 0,
    width: 1,
    background: '#E5E7EB',
  },
};

export function HowItWorksSection() {
  const { t } = useI18nStore();
  const containerRef = useScrollReveal<HTMLDivElement>({ stagger: 0.15 });

  const steps = useMemo(
    () => [
      { step: 1, title: t('landing.howItWorks.step1Title'), description: t('landing.howItWorks.step1Desc') },
      { step: 2, title: t('landing.howItWorks.step2Title'), description: t('landing.howItWorks.step2Desc') },
      { step: 3, title: t('landing.howItWorks.step3Title'), description: t('landing.howItWorks.step3Desc') },
    ],
    [t]
  );

  return (
    <section id="how-it-works" className="landing-scene" style={styles.section}>
      <div style={styles.container} ref={containerRef}>
        <div style={styles.header} data-reveal>
          <h2 style={styles.title}>{t('landing.howItWorks.title')}</h2>
          <p style={styles.description}>{t('landing.howItWorks.description')}</p>
        </div>

        <div style={styles.stepsContainer}>
          {steps.map((stepData, i) => {
            const isLast = i === steps.length - 1;
            return (
              <div key={stepData.step} style={isLast ? styles.stepWrapperLast : styles.stepWrapper}>
                {!isLast && <div style={styles.verticalLine} />}
                <StepCard {...stepData} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import { useMemo } from 'preact/hooks';
import { Mic, Zap, FileStack, Shield } from 'lucide-react';
import { FeatureCard } from './FeatureCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useI18nStore } from '@/lib/i18n';

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
    <section id="features" className="w-full py-20 px-6 bg-white">
      <div className="w-full max-w-[480px] mx-auto" ref={containerRef}>
        <div className="text-center mb-10" data-reveal>
          <h2 className="font-[var(--font-display)] text-[clamp(1.5rem,5vw,2rem)] font-bold text-[var(--landing-text)] mb-3 -tracking-[0.02em]">
            {t('landing.features.title')}
          </h2>
          <p className="text-[15px] text-[var(--landing-text-secondary)] max-w-[400px] mx-auto leading-[1.6]">
            {t('landing.features.description')}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

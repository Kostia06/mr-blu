import { useMemo } from 'preact/hooks';
import { StepCard } from './StepCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useI18nStore } from '@/lib/i18n';

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
    <section id="how-it-works" className="landing-scene w-full bg-white">
      <div className="w-full max-w-[360px] mx-auto" ref={containerRef}>
        <div className="text-center mb-12" data-reveal>
          <h2 className="font-[var(--font-display)] text-[clamp(1.5rem,5vw,2rem)] font-bold text-[var(--landing-text)] mb-3 -tracking-[0.02em]">
            {t('landing.howItWorks.title')}
          </h2>
          <p className="text-[15px] text-[var(--landing-text-secondary)] max-w-[340px] mx-auto leading-[1.6]">
            {t('landing.howItWorks.description')}
          </p>
        </div>

        <div className="flex flex-col relative">
          {steps.map((stepData, i) => {
            const isLast = i === steps.length - 1;
            return (
              <div key={stepData.step} className={isLast ? "relative" : "relative pb-8"}>
                {!isLast && (
                  <div className="absolute left-[17px] top-9 bottom-0 w-px bg-gray-200" />
                )}
                <StepCard {...stepData} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

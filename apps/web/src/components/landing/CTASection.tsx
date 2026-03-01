import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useI18nStore } from '@/lib/i18n';
import { BetaSignupForm } from './BetaSignupForm';

export function CTASection() {
  const { t } = useI18nStore();
  const containerRef = useScrollReveal<HTMLDivElement>();

  return (
    <section id="cta" className="landing-scene w-full bg-white">
      <div className="text-center max-w-[560px] mx-auto" ref={containerRef}>
        <h2
          className="font-[var(--font-display)] text-[clamp(2rem,5vw,3rem)] font-bold text-[var(--landing-text)] mb-4 -tracking-[0.03em] leading-[1.1]"
          data-reveal
        >
          {t('landing.cta.title')}
        </h2>
        <p className="text-base text-[var(--landing-text-secondary)] mb-8 leading-[1.6]" data-reveal>
          {t('landing.cta.description')}
        </p>
        <div data-reveal>
          <BetaSignupForm />
        </div>
      </div>
    </section>
  );
}

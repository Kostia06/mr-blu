import { ArrowRight } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useI18nStore } from '@/lib/i18n';

export function CTASection() {
  const { t } = useI18nStore();
  const containerRef = useScrollReveal<HTMLDivElement>();

  return (
    <section id="cta" className="landing-scene w-full bg-white">
      <div className="text-center max-w-[560px] mx-auto" ref={containerRef}>
        <h2
          className="font-[var(--font-display)] text-[clamp(2.5rem,7vw,4rem)] font-bold text-[var(--landing-text)] mb-4 -tracking-[0.03em] leading-[1.05]"
          data-reveal
        >
          {t('landing.cta.title')}
        </h2>
        <p className="text-base text-[var(--landing-text-secondary)] mb-8 leading-[1.6]" data-reveal>
          {t('landing.cta.description')}
        </p>
        <div data-reveal>
          <a
            href="/login"
            className="inline-flex items-center gap-2.5 py-[18px] px-9 bg-[var(--blu-primary)] text-white text-base font-semibold no-underline rounded-full shadow-[0_2px_10px_rgba(0,102,255,0.25)] hover:bg-[#0052cc] hover:shadow-[0_4px_20px_rgba(0,102,255,0.3)] transition-all duration-200"
          >
            <span>{t('landing.hero.ctaPrimary')}</span>
            <ArrowRight size={20} strokeWidth={2.5} />
          </a>
        </div>
      </div>
    </section>
  );
}

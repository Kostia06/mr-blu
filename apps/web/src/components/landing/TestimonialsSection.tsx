import { useMemo } from 'preact/hooks';
import { StatsBar } from './StatsBar';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useI18nStore } from '@/lib/i18n';

export function TestimonialsSection() {
  const { t } = useI18nStore();
  const containerRef = useScrollReveal<HTMLDivElement>({ stagger: 0.15 });

  const testimonial = useMemo(
    () => ({
      quote: t('landing.testimonials.quote'),
      author: t('landing.testimonials.author'),
      role: t('landing.testimonials.role'),
    }),
    [t]
  );

  return (
    <section id="testimonials" className="w-full py-[100px] px-6 bg-white">
      <div className="w-full max-w-[560px] mx-auto" ref={containerRef}>
        <div className="mb-16" data-reveal>
          <StatsBar />
        </div>

        <div className="pl-6 border-l-2 border-gray-200" data-reveal>
          <blockquote className="font-[var(--font-body)] text-[clamp(1.125rem,2.5vw,1.375rem)] font-normal leading-[1.7] text-[var(--landing-text)] mb-6 italic">
            "{testimonial.quote}"
          </blockquote>
          <div>
            <span className="font-semibold text-[var(--landing-text)] text-[15px] block">
              {testimonial.author}
            </span>
            <span className="text-[13px] text-[var(--landing-text-secondary)] block mt-0.5">
              {testimonial.role}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

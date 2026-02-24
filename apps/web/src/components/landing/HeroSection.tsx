import { useRef, useEffect } from 'preact/hooks';
import { ArrowRight } from 'lucide-react';
import { HeroHeadline } from './HeroHeadline';
import { HeroPhone } from './HeroPhone';
import { useI18nStore } from '@/lib/i18n';

export function HeroSection() {
  const { t } = useI18nStore();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const node = sectionRef.current;
    if (!node) return;

    if (prefersReducedMotion) {
      node.querySelectorAll<HTMLElement>('.hero-animate').forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    import('gsap').then(({ gsap }) => {
      const phone = node.querySelector('.hero-phone-wrap');
      const cta = node.querySelector('.hero-cta');
      const trust = node.querySelector('.hero-trust-line');

      if (phone) {
        gsap.to(phone, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          delay: 0.6,
        });
      }

      if (cta) {
        gsap.to(cta, {
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out',
          delay: 1,
        });
      }

      if (trust) {
        gsap.to(trust, {
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out',
          delay: 1.2,
        });
      }
    });
  }, []);

  return (
    <section
      className="relative min-h-svh flex items-center justify-center pt-[100px] px-6 pb-12 bg-white overflow-x-clip"
      id="main-content"
      ref={sectionRef}
    >
      <div className="w-full max-w-[480px] mx-auto flex flex-col items-center gap-6">
        <HeroHeadline />

        <div className="hero-animate hero-phone-wrap opacity-0 translate-y-[30px]">
          <HeroPhone />
        </div>

        <a
          href="/login"
          className="hero-animate hero-cta inline-flex items-center gap-2 py-3.5 px-7 text-[15px] font-semibold no-underline rounded-full bg-[var(--blu-primary)] text-white shadow-[0_2px_10px_rgba(0,102,255,0.25)] hover:bg-[#0052cc] hover:shadow-[0_4px_20px_rgba(0,102,255,0.3)] transition-all duration-200 opacity-0"
        >
          <span>{t('landing.hero.ctaPrimary')}</span>
          <ArrowRight size={18} strokeWidth={2.5} />
        </a>

        <p className="hero-animate hero-trust-line text-[13px] font-normal text-[var(--landing-text-secondary)] text-center opacity-0">
          {t('landing.hero.trust1')} &middot; {t('landing.hero.trust2')} &middot; {t('landing.hero.trust3')}
        </p>
      </div>
    </section>
  );
}

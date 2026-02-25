import { useI18nStore } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function Footer() {
  const { locale, setLocale, t } = useI18nStore();
  const currentYear = new Date().getFullYear();

  return (
    <footer class="border-t border-gray-100 py-8 px-6 bg-white">
      <div class="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-5">
          <a href="/terms" class="text-xs text-gray-400 no-underline hover:text-[#0A0A0A] transition-colors duration-200">
            {t('landing.footer.terms')}
          </a>
          <a href="/privacy" class="text-xs text-gray-400 no-underline hover:text-[#0A0A0A] transition-colors duration-200">
            {t('landing.footer.privacy')}
          </a>
          <a href="mailto:soporte@mrblu.com" class="text-xs text-gray-400 no-underline hover:text-[#0A0A0A] transition-colors duration-200">
            {t('landing.footer.contact')}
          </a>
        </div>

        <div class="flex items-center gap-2 text-xs text-gray-400">
          <button
            class={cn(
              "bg-transparent border-none text-xs cursor-pointer py-1 px-2 rounded transition-colors duration-200",
              locale === 'en' ? "text-[#0A0A0A] font-semibold" : "text-gray-400 font-normal"
            )}
            onClick={() => setLocale('en')}
          >
            EN
          </button>
          <span class="text-gray-300">|</span>
          <button
            class={cn(
              "bg-transparent border-none text-xs cursor-pointer py-1 px-2 rounded transition-colors duration-200",
              locale === 'es' ? "text-[#0A0A0A] font-semibold" : "text-gray-400 font-normal"
            )}
            onClick={() => setLocale('es')}
          >
            ES
          </button>
        </div>

        <p class="text-xs text-gray-400">
          &copy; {currentYear} mrblu. {t('landing.footer.copyright')}
        </p>
      </div>
    </footer>
  );
}

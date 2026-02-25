import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { User } from '@supabase/supabase-js';
import { Link } from 'wouter';
import {
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Building2,
  LogOut,
  Globe,
  BellRing,
  MessageCircle,
  BookOpen,
  Shield,
  Users,
} from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { navigateTo } from '@/lib/navigation';
import { logout } from '@/lib/api/auth';
import { cn } from '@/lib/utils';

const SCROLL_DOWN_THRESHOLD = 10;
const SCROLL_UP_THRESHOLD = 10;
const SCROLL_HEADER_MIN_Y = 60;

interface SettingsHubProps {
  user: User | null;
}

interface SectionItem {
  icon: ComponentChildren;
  label: string;
  value: string;
  href: string;
}

interface Section {
  title: string;
  items: SectionItem[];
}

/* ---------- inline sub-components ---------- */

function SettingsSection({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <section class="flex flex-col gap-2">
      <h2 class="text-xs font-semibold text-[var(--gray-500,#64748b)] uppercase tracking-[0.05em] m-0 px-1 mb-1">
        {title}
      </h2>
      <div class="flex flex-col bg-white/40 backdrop-blur-[12px] border border-white/50 rounded-[var(--radius-card,20px)] overflow-hidden">
        {children}
      </div>
    </section>
  );
}

function SettingsItem({
  icon,
  label,
  value,
  href,
}: {
  icon: ComponentChildren;
  label: string;
  value?: string;
  href: string;
}) {
  return (
    <Link href={href} class="flex items-center gap-3.5 w-full p-4 bg-transparent border-none no-underline cursor-pointer text-left">
      <span class="flex items-center justify-center w-9 h-9 bg-[var(--gray-100,#f1f5f9)] rounded-[var(--radius-input,12px)] text-[var(--gray-600,#475569)] shrink-0">
        {icon}
      </span>
      <span class="flex-1 min-w-0 flex flex-col gap-0.5">
        <span class="text-[15px] font-medium text-[var(--gray-900,#0f172a)]">{label}</span>
        {value && <span class="text-[13px] text-[var(--gray-500,#64748b)] whitespace-nowrap overflow-hidden text-ellipsis">{value}</span>}
      </span>
      <span class="flex items-center justify-center text-[var(--gray-400,#94a3b8)] shrink-0">
        <ChevronRight size={18} strokeWidth={2} />
      </span>
    </Link>
  );
}

/* ---------- main component ---------- */

export function SettingsHub({ user }: SettingsHubProps) {
  const { t } = useI18nStore();
  const [headerHidden, setHeaderHidden] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    if (!ticking.current) {
      requestAnimationFrame(() => {
        const delta = currentScrollY - lastScrollY.current;
        if (delta > SCROLL_DOWN_THRESHOLD && currentScrollY > SCROLL_HEADER_MIN_Y) {
          setHeaderHidden(true);
        } else if (delta < -SCROLL_UP_THRESHOLD || currentScrollY <= SCROLL_HEADER_MIN_Y) {
          setHeaderHidden(false);
        }
        lastScrollY.current = currentScrollY;
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const sections: Section[] = [
    {
      title: t('settings.account'),
      items: [
        {
          icon: <UserIcon size={18} strokeWidth={1.5} />,
          label: t('settings.profile'),
          value: t('settings.nameEmail'),
          href: '/dashboard/settings/profile',
        },
        {
          icon: <Building2 size={18} strokeWidth={1.5} />,
          label: t('settings.business'),
          value: t('settings.companyInfoBranding'),
          href: '/dashboard/settings/business',
        },
        {
          icon: <Users size={18} strokeWidth={1.5} />,
          label: t('settings.clients'),
          value: t('settings.clientsDesc'),
          href: '/dashboard/settings/clients',
        },
        {
          icon: <BookOpen size={18} strokeWidth={1.5} />,
          label: t('settings.priceBook') || 'Price Book',
          value: t('settings.priceBookDesc') || 'Saved material rates',
          href: '/dashboard/settings/price-book',
        },
        {
          icon: <Shield size={18} strokeWidth={1.5} />,
          label: t('security.title') || 'Security',
          value: t('security.settingsDesc') || 'Sessions & account',
          href: '/dashboard/settings/security',
        },
      ],
    },
    {
      title: t('settings.preferences'),
      items: [
        {
          icon: <BellRing size={18} strokeWidth={1.5} />,
          label: t('settings.notifications'),
          value: t('settings.notificationsDesc'),
          href: '/dashboard/settings/notifications',
        },
        {
          icon: <Globe size={18} strokeWidth={1.5} />,
          label: t('settings.language'),
          value: t('settings.appLanguage'),
          href: '/dashboard/settings/language',
        },
        {
          icon: <MessageCircle size={18} strokeWidth={1.5} />,
          label: t('settings.feedback'),
          value: t('settings.feedbackDesc'),
          href: '/dashboard/settings/feedback',
        },
      ],
    },
  ];

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logout();
      window.location.href = '/';
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <main class="min-h-screen bg-transparent">
      <header
        class={cn(
          'sticky top-0 z-[var(--z-sticky,40)] flex items-center justify-between px-[var(--page-padding-x,20px)] pb-[var(--space-3,12px)] pt-[calc(var(--space-3,12px)+var(--safe-area-top,0px))] bg-transparent max-w-[var(--page-max-width,600px)] mx-auto w-full transition-[transform,opacity] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity]',
          headerHidden && '-translate-y-full opacity-0 pointer-events-none'
        )}
      >
        <button
          class="w-[var(--btn-height-md,40px)] h-[var(--btn-height-md,40px)] flex items-center justify-center bg-[var(--glass-white-50,rgba(255,255,255,0.5))] backdrop-blur-[12px] border-none rounded-[var(--radius-button,14px)] text-[var(--gray-600,#475569)] cursor-pointer"
          onClick={() => navigateTo('/dashboard')}
          aria-label={t('aria.backToDashboard')}
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <h1 class="font-[var(--font-display,system-ui)] text-lg font-bold text-[var(--gray-900,#0f172a)] m-0 tracking-[-0.02em]">
          {t('settings.title')}
        </h1>
        <div class="w-10" />
      </header>

      <div class="px-[var(--page-padding-x,20px)] max-w-[var(--page-max-width,600px)] w-full mx-auto flex flex-col justify-center min-h-[calc(100vh-60px)] gap-[var(--section-gap,24px)] pb-[100px]">
        {sections.map((section) => (
          <SettingsSection key={section.title} title={section.title}>
            {section.items.map((item) => (
              <SettingsItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                value={item.value}
                href={item.href}
              />
            ))}
          </SettingsSection>
        ))}

        <div class="mt-2">
          <button
            class="flex items-center justify-center gap-2.5 w-full py-4 px-6 bg-transparent border-none rounded-[var(--radius-button,14px)] text-[var(--data-red,#ef4444)] text-[15px] font-semibold cursor-pointer"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <span class="flex items-center justify-center">
              <LogOut size={18} strokeWidth={2} />
            </span>
            <span>{signingOut ? '...' : t('settings.signOut')}</span>
          </button>
        </div>

        <p class="text-center text-xs text-[var(--gray-400,#94a3b8)] mt-2 mb-0">
          {t('settings.versionNumber')}
        </p>
      </div>
    </main>
  );
}

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
    <section style={sectionStyles.wrapper}>
      <h2 style={sectionStyles.title}>{title}</h2>
      <div style={sectionStyles.items}>{children}</div>
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
    <Link href={href} style={itemStyles.root}>
      <span style={itemStyles.icon}>{icon}</span>
      <span style={itemStyles.content}>
        <span style={itemStyles.label}>{label}</span>
        {value && <span style={itemStyles.value}>{value}</span>}
      </span>
      <span style={itemStyles.arrow}>
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
          label: 'Clients',
          value: 'Saved client info',
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

  const headerStyle: Record<string, string | number> = {
    ...styles.pageHeader,
    ...(headerHidden ? styles.pageHeaderHidden : {}),
  };

  return (
    <main style={styles.page}>
      <header style={headerStyle}>
        <button
          style={styles.backBtn}
          onClick={() => navigateTo('/dashboard')}
          aria-label={t('aria.backToDashboard')}
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <h1 style={styles.pageTitle}>{t('settings.title')}</h1>
        <div style={styles.headerSpacer} />
      </header>

      <div style={styles.pageContent}>
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

        <div style={styles.logoutWrapper}>
          <button style={styles.logoutBtn} onClick={handleSignOut} disabled={signingOut}>
            <span style={styles.logoutIcon}>
              <LogOut size={18} strokeWidth={2} />
            </span>
            <span>{signingOut ? '...' : t('settings.signOut')}</span>
          </button>
        </div>

        <p style={styles.versionText}>{t('settings.versionNumber')}</p>
      </div>
    </main>
  );
}

/* ---------- styles ---------- */

const styles: Record<string, Record<string, string | number>> = {
  page: {
    minHeight: '100vh',
    background: 'transparent',
  },
  pageHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 'var(--z-sticky, 40)' as unknown as number,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-3, 12px) var(--page-padding-x, 20px)',
    paddingTop: 'calc(var(--space-3, 12px) + var(--safe-area-top, 0px))',
    background: 'transparent',
    maxWidth: 'var(--page-max-width, 600px)',
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '100%',
    transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.3s cubic-bezier(0.16,1,0.3,1)',
    willChange: 'transform, opacity',
  },
  pageHeaderHidden: {
    transform: 'translateY(-100%)',
    opacity: 0,
    pointerEvents: 'none',
  },
  backBtn: {
    width: 'var(--btn-height-md, 40px)',
    height: 'var(--btn-height-md, 40px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--glass-white-50, rgba(255,255,255,0.5))',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: 'none',
    borderRadius: 'var(--radius-button, 14px)',
    color: 'var(--gray-600, #475569)',
    cursor: 'pointer',
  },
  pageTitle: {
    fontFamily: 'var(--font-display, system-ui)',
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--gray-900, #0f172a)',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  headerSpacer: {
    width: 40,
  },
  pageContent: {
    padding: 'var(--page-padding-x, 20px)',
    maxWidth: 'var(--page-max-width, 600px)',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 60px)',
    gap: 'var(--section-gap, 24px)',
    paddingBottom: 100,
  },
  logoutWrapper: {
    marginTop: 8,
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    padding: '16px 24px',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-button, 14px)',
    color: 'var(--data-red, #ef4444)',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  logoutIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: 'var(--gray-400, #94a3b8)',
    margin: '8px 0 0',
  },
};

const sectionStyles: Record<string, Record<string, string | number>> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--gray-500, #64748b)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: 0,
    padding: '0 4px',
    marginBottom: 4,
  },
  items: {
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(255,255,255,0.4)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.5)',
    borderRadius: 'var(--radius-card, 20px)',
    overflow: 'hidden',
  },
};

const itemStyles: Record<string, Record<string, string | number>> = {
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    padding: 16,
    background: 'transparent',
    border: 'none',
    textDecoration: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    background: 'var(--gray-100, #f1f5f9)',
    borderRadius: 'var(--radius-input, 12px)',
    color: 'var(--gray-600, #475569)',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--gray-900, #0f172a)',
  },
  value: {
    fontSize: 13,
    color: 'var(--gray-500, #64748b)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  arrow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--gray-400, #94a3b8)',
    flexShrink: 0,
  },
};

import type { ComponentChildren } from 'preact';
import { ChevronLeft } from 'lucide-react';
import { navigateTo } from '@/lib/navigation';

interface SettingsPageHeaderProps {
  title: string;
  backHref?: string;
  backLabel?: string;
  right?: ComponentChildren;
}

export function SettingsPageHeader({
  title,
  backHref = '/dashboard/settings',
  backLabel = 'Back',
  right,
}: SettingsPageHeaderProps) {
  return (
    <header style={headerStyles.root}>
      <button
        style={headerStyles.backBtn}
        onClick={() => navigateTo(backHref)}
        aria-label={backLabel}
      >
        <ChevronLeft size={22} strokeWidth={2} />
      </button>
      <h1 style={headerStyles.title}>{title}</h1>
      {right ?? <div style={headerStyles.spacer} />}
    </header>
  );
}

const headerStyles: Record<string, Record<string, string | number>> = {
  root: {
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
  title: {
    fontFamily: 'var(--font-display, system-ui)',
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--gray-900, #0f172a)',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  spacer: {
    width: 40,
  },
};

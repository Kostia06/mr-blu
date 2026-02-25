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
    <header class="sticky top-0 z-[var(--z-sticky,40)] flex items-center justify-between px-[var(--page-padding-x,20px)] pb-[var(--space-3,12px)] pt-[calc(var(--space-3,12px)+var(--safe-area-top,0px))] bg-transparent max-w-[var(--page-max-width,600px)] mx-auto w-full">
      <button
        class="w-[var(--btn-height-md,40px)] h-[var(--btn-height-md,40px)] flex items-center justify-center bg-[var(--glass-white-50,rgba(255,255,255,0.5))] backdrop-blur-[12px] border-none rounded-[var(--radius-button,14px)] text-[var(--gray-600,#475569)] cursor-pointer"
        onClick={() => navigateTo(backHref)}
        aria-label={backLabel}
      >
        <ChevronLeft size={22} strokeWidth={2} />
      </button>
      <h1 class="font-[var(--font-display,system-ui)] text-lg font-bold text-[var(--gray-900,#0f172a)] m-0 tracking-[-0.02em]">
        {title}
      </h1>
      {right ?? <div class="w-10" />}
    </header>
  );
}

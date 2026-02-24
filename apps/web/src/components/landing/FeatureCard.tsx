import type { LucideIcon } from '@/lib/types/lucide';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  accent?: 'blue' | 'cyan' | 'green' | 'amber';
}

const ACCENT_STYLES: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-[rgba(0,102,255,0.08)]', text: 'text-[#0066FF]' },
  cyan: { bg: 'bg-[rgba(14,165,233,0.08)]', text: 'text-[#0EA5E9]' },
  green: { bg: 'bg-[rgba(16,185,129,0.08)]', text: 'text-[#10B981]' },
  amber: { bg: 'bg-[rgba(245,158,11,0.08)]', text: 'text-[#F59E0B]' },
};

export function FeatureCard({ title, description, icon: Icon, accent = 'blue' }: FeatureCardProps) {
  const { bg, text } = ACCENT_STYLES[accent];

  return (
    <div className="flex items-start gap-4 p-6 bg-white border border-gray-200 rounded-2xl" data-reveal>
      <div className={cn("size-11 rounded-xl flex items-center justify-center shrink-0", bg, text)}>
        <Icon size={22} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-[var(--font-display)] text-base font-semibold text-[var(--landing-text)] mb-1 -tracking-[0.01em]">
          {title}
        </h3>
        <p className="text-sm leading-normal text-[var(--landing-text-secondary)]">
          {description}
        </p>
      </div>
    </div>
  );
}

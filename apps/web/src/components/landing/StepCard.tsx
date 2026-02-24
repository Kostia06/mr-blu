interface StepCardProps {
  step: number;
  title: string;
  description: string;
}

export function StepCard({ step, title, description }: StepCardProps) {
  return (
    <div className="flex items-start gap-4" data-reveal>
      <div className="size-9 rounded-full border-[1.5px] border-gray-200 flex items-center justify-center shrink-0">
        <span className="text-sm font-semibold text-[var(--landing-text)] font-[var(--font-mono)]">
          {step}
        </span>
      </div>
      <div className="flex-1 pt-1.5">
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

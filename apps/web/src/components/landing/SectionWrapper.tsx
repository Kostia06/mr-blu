import type { ComponentChildren } from 'preact';
import { cn } from '@/lib/utils';

interface SectionWrapperProps {
  id?: string;
  className?: string;
  scene?: boolean;
  children: ComponentChildren;
}

export function SectionWrapper({
  id,
  className = '',
  scene = false,
  children,
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={cn(
        "w-full px-6 bg-white",
        scene ? "landing-scene" : "py-[100px]",
        className
      )}
    >
      <div className="w-full max-w-7xl mx-auto">{children}</div>
    </section>
  );
}

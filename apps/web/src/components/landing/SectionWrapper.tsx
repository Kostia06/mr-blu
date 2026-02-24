import type { ComponentChildren } from 'preact';

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
  const style: Record<string, string | number> = {
    width: '100%',
    padding: scene ? '0 24px' : '100px 24px',
    background: '#FFFFFF',
  };

  const innerStyle: Record<string, string | number> = {
    width: '100%',
    maxWidth: 1280,
    margin: '0 auto',
  };

  return (
    <section
      id={id}
      className={`${scene ? 'landing-scene' : ''} ${className}`.trim()}
      style={style}
    >
      <div style={innerStyle}>{children}</div>
    </section>
  );
}

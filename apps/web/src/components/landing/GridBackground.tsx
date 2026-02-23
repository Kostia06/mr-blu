interface GridBackgroundProps {
  opacity?: number;
  size?: number;
  color?: string;
  fade?: boolean;
}

export function GridBackground({
  opacity = 0.3,
  size = 60,
  color = 'var(--gray-200, #e2e8f0)',
  fade = true,
}: GridBackgroundProps) {
  const style: Record<string, string | number> = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
    backgroundSize: `${size}px ${size}px`,
    opacity,
  };

  if (fade) {
    style.maskImage = 'radial-gradient(ellipse at center, black 0%, transparent 70%)';
    style.WebkitMaskImage = 'radial-gradient(ellipse at center, black 0%, transparent 70%)';
  }

  return <div style={style} />;
}

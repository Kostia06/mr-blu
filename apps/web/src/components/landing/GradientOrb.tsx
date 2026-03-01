interface GradientOrbProps {
  color?: string;
  size?: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  blur?: number;
  opacity?: number;
  animate?: boolean;
  delay?: number;
}

export function GradientOrb({
  color = 'rgba(0, 102, 255, 0.15)',
  size = 300,
  top,
  left,
  right,
  bottom,
  blur = 80,
  opacity = 0.5,
  animate = true,
  delay = 0,
}: GradientOrbProps) {
  const style: Record<string, string | number | undefined> = {
    position: 'absolute',
    width: size,
    height: size,
    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    borderRadius: '50%',
    filter: `blur(${blur}px)`,
    opacity,
    pointerEvents: 'none',
    top, left, right, bottom,
  };

  if (animate) {
    style.animation = `orb-float 20s ease-in-out infinite`;
    style.animationDelay = `${delay}s`;
  }

  return (
    <>
      <div style={style} />
      {animate && (
        <style>{`
          @keyframes orb-float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(10px, -15px) scale(1.05); }
            50% { transform: translate(-5px, 10px) scale(0.95); }
            75% { transform: translate(-10px, -5px) scale(1.02); }
          }
          @media (prefers-reduced-motion: reduce) {
            [style*="orb-float"] { animation: none !important; }
          }
        `}</style>
      )}
    </>
  );
}

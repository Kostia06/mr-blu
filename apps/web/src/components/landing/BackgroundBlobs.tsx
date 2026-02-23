import { useEffect, useRef } from 'preact/hooks';

interface BackgroundBlobsProps {
  variant?: 'hero' | 'sections' | 'full';
  intensity?: 'subtle' | 'normal' | 'vivid';
}

const OPACITY_MAP = {
  subtle: { primary: 0.2, secondary: 0.15, tertiary: 0.12, quaternary: 0.15 },
  normal: { primary: 0.35, secondary: 0.25, tertiary: 0.2, quaternary: 0.25 },
  vivid: { primary: 0.45, secondary: 0.35, tertiary: 0.3, quaternary: 0.35 },
};

export function BackgroundBlobs({ variant = 'full', intensity = 'normal' }: BackgroundBlobsProps) {
  const opacities = OPACITY_MAP[intensity];
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const blobs = containerRef.current?.querySelectorAll<HTMLDivElement>('.blob');
    if (!blobs) return;

    blobs.forEach((blob) => {
      blob.style.animation = `blob-drift ${18 + Math.random() * 8}s ease-in-out infinite`;
      blob.style.animationDelay = `${Math.random() * 4}s`;
    });
  }, []);

  const containerStyle: Record<string, string | number> = {
    position: variant === 'hero' ? 'absolute' : 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
    overflow: 'clip',
    contain: 'strict',
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      <div class="blob" style={{
        position: 'absolute',
        width: 600, height: 600,
        top: -200, right: -150,
        background: 'linear-gradient(135deg, #0066ff 0%, #0ea5e9 100%)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        opacity: opacities.primary,
      }} />
      <div class="blob" style={{
        position: 'absolute',
        width: 500, height: 500,
        top: '35%', left: -200,
        background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        opacity: opacities.secondary,
      }} />
      <div class="blob" style={{
        position: 'absolute',
        width: 450, height: 450,
        bottom: '10%', right: -100,
        background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        opacity: opacities.tertiary,
      }} />
      <div class="blob" style={{
        position: 'absolute',
        width: 400, height: 400,
        bottom: -150, left: '15%',
        background: 'linear-gradient(135deg, #0066ff 0%, #3b82f6 100%)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        opacity: opacities.quaternary,
      }} />

      <style>{`
        @keyframes blob-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(10px, -15px) scale(1.03); }
          66% { transform: translate(-8px, 10px) scale(0.97); }
        }
        @media (max-width: 768px) {
          .blob { transform: scale(0.6); }
        }
        @media (prefers-reduced-motion: reduce) {
          .blob { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

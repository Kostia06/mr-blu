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

  return (
    <div
      ref={containerRef}
      style={{
        position: variant === 'hero' ? 'absolute' : 'fixed',
        top: '-env(safe-area-inset-top, 0px)',
        left: 0,
        right: 0,
        bottom: '-env(safe-area-inset-bottom, 0px)',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Top-right blob */}
      <div class="blob" style={{
        position: 'absolute',
        width: '70vw', height: '70vw',
        top: '-15vw', right: '-20vw',
        background: 'linear-gradient(135deg, #0066ff 0%, #0ea5e9 100%)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        opacity: opacities.primary,
      }} />
      {/* Mid-left blob */}
      <div class="blob" style={{
        position: 'absolute',
        width: '60vw', height: '60vw',
        top: '30%', left: '-20vw',
        background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        opacity: opacities.secondary,
      }} />
      {/* Bottom-right blob */}
      <div class="blob" style={{
        position: 'absolute',
        width: '55vw', height: '55vw',
        bottom: '5%', right: '-10vw',
        background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        opacity: opacities.tertiary,
      }} />
      {/* Bottom-left blob */}
      <div class="blob" style={{
        position: 'absolute',
        width: '50vw', height: '50vw',
        bottom: '-10vw', left: '10%',
        background: 'linear-gradient(135deg, #0066ff 0%, #3b82f6 100%)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        opacity: opacities.quaternary,
      }} />

      <style>{`
        @keyframes blob-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(10px, -15px) scale(1.03); }
          66% { transform: translate(-8px, 10px) scale(0.97); }
        }
        @media (prefers-reduced-motion: reduce) {
          .blob { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

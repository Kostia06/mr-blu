import { useState, useEffect, useRef } from 'preact/hooks';
import { useLocation } from 'wouter';

export function NavigationProgress() {
  const [location] = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevLocation = useRef(location);

  useEffect(() => {
    if (location === prevLocation.current) return;
    prevLocation.current = location;

    setVisible(true);
    setProgress(30);

    const mid = setTimeout(() => setProgress(70), 100);
    const done = setTimeout(() => setProgress(100), 250);
    const hide = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 500);

    return () => {
      clearTimeout(mid);
      clearTimeout(done);
      clearTimeout(hide);
    };
  }, [location]);

  if (!visible && progress === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
      <div style={{
        height: '100%',
        width: `${progress}%`,
        background: 'var(--blu-primary, #0066ff)',
        transition: progress > 0 ? 'width 200ms ease, opacity 200ms ease' : 'none',
        opacity: visible ? 1 : 0,
        boxShadow: '0 0 10px rgba(0, 102, 255, 0.5)',
      }} />
    </div>
  );
}

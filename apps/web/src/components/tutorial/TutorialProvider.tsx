import { useEffect, useState } from 'preact/hooks';
import { useTutorialStore } from '@/stores/tutorialStore';
import { TutorialStartModal } from './TutorialStartModal';
import { TutorialOverlay } from './TutorialOverlay';
import { TutorialCompleteModal } from './TutorialCompleteModal';
import { HintTooltip } from './HintTooltip';

export function TutorialProvider() {
  const initialize = useTutorialStore((s) => s.initialize);
  const [isOnDashboard, setIsOnDashboard] = useState(false);

  useEffect(() => {
    setIsOnDashboard(window.location.pathname.startsWith('/dashboard'));

    // Small delay to let the page fully render
    const timer = setTimeout(() => {
      initialize();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!isOnDashboard) return null;

  return (
    <>
      <TutorialStartModal />
      <TutorialOverlay />
      <TutorialCompleteModal />
      <HintTooltip />
    </>
  );
}

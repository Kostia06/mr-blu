import { PartyPopper, Lightbulb } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { useTutorialStore } from '@/stores/tutorialStore';

export function TutorialCompleteModal() {
  const t = useI18nStore((s) => s.t);
  const showCompleteModal = useTutorialStore((s) => s.showCompleteModal);
  const closeCompleteModal = useTutorialStore((s) => s.closeCompleteModal);

  if (!showCompleteModal) return null;

  return (
    <>
      <div class="tut-complete-backdrop" role="presentation" />

      <div
        class="tut-complete-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="complete-title"
      >
        <div class="tut-complete-content">
          <div class="tut-confetti-container">
            <div class="tut-confetti c1" />
            <div class="tut-confetti c2" />
            <div class="tut-confetti c3" />
            <div class="tut-confetti c4" />
            <div class="tut-confetti c5" />
          </div>

          <div class="tut-complete-icon">
            <PartyPopper size={36} strokeWidth={1.5} />
          </div>

          <h2 id="complete-title" class="tut-complete-title">
            {t('tutorial.completeModal.title')}
          </h2>

          <p class="tut-complete-description">
            {t('tutorial.completeModal.description')}
          </p>

          <div class="tut-tip-box">
            <div class="tut-tip-icon">
              <Lightbulb size={18} />
            </div>
            <div class="tut-tip-content">
              <span class="tut-tip-label">{t('tutorial.completeModal.tipTitle')}</span>
              <p class="tut-tip-text">{t('tutorial.completeModal.tipDescription')}</p>
            </div>
          </div>

          <button class="tut-complete-btn" onClick={closeCompleteModal}>
            {t('tutorial.completeModal.startCreating')}
          </button>
        </div>
      </div>

      <style>{`
        .tut-complete-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 1000;
          animation: tut-complete-fade-in 0.2s ease forwards;
        }

        .tut-complete-container {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1001;
          pointer-events: none;
          animation: tut-complete-fly-in 0.3s cubic-bezier(0.33, 1, 0.68, 1) forwards;
        }

        .tut-complete-content {
          position: relative;
          background: white;
          border-radius: 24px;
          padding: 32px;
          max-width: 380px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          pointer-events: auto;
          overflow: hidden;
        }

        .tut-confetti-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .tut-confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 2px;
          animation: tut-confetti-fall 3s ease-out forwards;
        }

        .tut-confetti.c1 { background: #0066ff; left: 10%; animation-delay: 0s; }
        .tut-confetti.c2 { background: #10b981; left: 30%; animation-delay: 0.2s; }
        .tut-confetti.c3 { background: #f59e0b; left: 50%; animation-delay: 0.1s; }
        .tut-confetti.c4 { background: #ef4444; left: 70%; animation-delay: 0.3s; }
        .tut-confetti.c5 { background: #8b5cf6; left: 90%; animation-delay: 0.15s; }

        @keyframes tut-confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(400px) rotate(720deg);
            opacity: 0;
          }
        }

        .tut-complete-icon {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.25));
          border-radius: 24px;
          margin: 0 auto 24px;
          color: var(--data-green, #10b981);
          animation: tut-bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }

        @keyframes tut-bounce-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        .tut-complete-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--gray-900, #0f172a);
          margin: 0 0 12px;
          letter-spacing: -0.02em;
        }

        .tut-complete-description {
          font-size: 15px;
          color: var(--gray-600, #475569);
          line-height: 1.6;
          margin: 0 0 24px;
        }

        .tut-tip-box {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: var(--gray-50, #f8fafc);
          border-radius: 12px;
          text-align: left;
          margin-bottom: 24px;
        }

        .tut-tip-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(245, 158, 11, 0.15);
          border-radius: 8px;
          color: var(--data-amber, #f59e0b);
          flex-shrink: 0;
        }

        .tut-tip-content {
          flex: 1;
          min-width: 0;
        }

        .tut-tip-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-900, #0f172a);
          margin-bottom: 4px;
        }

        .tut-tip-text {
          font-size: 13px;
          color: var(--gray-600, #475569);
          line-height: 1.5;
          margin: 0;
        }

        .tut-complete-btn {
          width: 100%;
          padding: 16px 24px;
          background: var(--blu-primary, #0066ff);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tut-complete-btn:hover {
          background: #0052cc;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0, 102, 255, 0.3);
        }

        .tut-complete-btn:active {
          transform: scale(0.98);
        }

        @keyframes tut-complete-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes tut-complete-fly-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .tut-confetti {
            animation: none;
            display: none;
          }

          .tut-complete-icon {
            animation: none;
          }

          .tut-complete-btn:hover {
            transform: none;
          }

          .tut-complete-btn:active {
            transform: none;
          }
        }

        @media (max-width: 480px) {
          .tut-complete-content {
            padding: 24px;
            margin: 16px;
          }

          .tut-complete-title {
            font-size: 20px;
          }
        }
      `}</style>
    </>
  );
}

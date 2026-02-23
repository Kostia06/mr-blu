import { useState } from 'preact/hooks';
import { Compass, X } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { useTutorialStore } from '@/stores/tutorialStore';

export function TutorialStartModal() {
  const t = useI18nStore((s) => s.t);
  const showStartModal = useTutorialStore((s) => s.showStartModal);
  const startTutorial = useTutorialStore((s) => s.startTutorial);
  const skipTutorial = useTutorialStore((s) => s.skipTutorial);

  const [userName, setUserName] = useState('');

  function handleStartTutorial() {
    startTutorial(userName || undefined);
  }

  if (!showStartModal) return null;

  return (
    <>
      <div class="tut-start-backdrop" role="presentation" />

      <div
        class="tut-start-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
      >
        <div class="tut-start-content">
          <button
            class="tut-start-close-btn"
            onClick={skipTutorial}
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>

          <div class="tut-start-icon">
            <Compass size={32} strokeWidth={1.5} />
          </div>

          <h2 id="tutorial-title" class="tut-start-title">
            {t('tutorial.startModal.title')}
          </h2>

          <p class="tut-start-description">
            {t('tutorial.startModal.description')}
          </p>

          <p class="tut-start-time">
            {t('tutorial.startModal.timeEstimate')}
          </p>

          <div class="tut-start-name-container">
            <label for="tutorial-name" class="tut-start-name-label">
              {t('tutorial.startModal.nameQuestion') || "What's your first name?"}
            </label>
            <input
              type="text"
              id="tutorial-name"
              class="tut-start-name-input"
              value={userName}
              onInput={(e) => setUserName((e.target as HTMLInputElement).value)}
              placeholder={t('tutorial.startModal.namePlaceholder') || 'Your name'}
              autoComplete="given-name"
            />
            <p class="tut-start-name-hint">
              {t('tutorial.startModal.nameHint') || 'Optional, but helps personalize your experience'}
            </p>
          </div>

          <div class="tut-start-actions">
            <button class="tut-start-btn" onClick={handleStartTutorial}>
              {t('tutorial.startModal.startTour')}
            </button>

            <button class="tut-start-skip-btn" onClick={skipTutorial}>
              {t('tutorial.startModal.skip')}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .tut-start-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 1000;
          animation: tut-fade-in 0.2s ease forwards;
        }

        .tut-start-container {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1001;
          pointer-events: none;
          animation: tut-fly-in 0.3s cubic-bezier(0.33, 1, 0.68, 1) forwards;
        }

        .tut-start-content {
          position: relative;
          background: white;
          border-radius: 24px;
          padding: 32px;
          max-width: 380px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          pointer-events: auto;
        }

        .tut-start-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.05);
          border: none;
          border-radius: 10px;
          color: var(--gray-500, #64748b);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .tut-start-close-btn:hover {
          background: rgba(0, 0, 0, 0.1);
          color: var(--gray-700, #334155);
        }

        .tut-start-icon {
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(0, 102, 255, 0.1), rgba(0, 102, 255, 0.2));
          border-radius: 20px;
          margin: 0 auto 24px;
          color: var(--blu-primary, #0066ff);
        }

        .tut-start-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--gray-900, #0f172a);
          margin: 0 0 12px;
          letter-spacing: -0.02em;
        }

        .tut-start-description {
          font-size: 15px;
          color: var(--gray-600, #475569);
          line-height: 1.6;
          margin: 0 0 8px;
        }

        .tut-start-time {
          font-size: 13px;
          color: var(--gray-400, #94a3b8);
          margin: 0 0 20px;
        }

        .tut-start-name-container {
          margin-bottom: 24px;
          text-align: left;
        }

        .tut-start-name-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: var(--gray-700, #334155);
          margin-bottom: 8px;
        }

        .tut-start-name-input {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid var(--gray-200, #e2e8f0);
          border-radius: 12px;
          font-size: 15px;
          color: var(--gray-900, #0f172a);
          background: var(--gray-50, #f8fafc);
          transition: all 0.2s ease;
          outline: none;
          box-sizing: border-box;
        }

        .tut-start-name-input::placeholder {
          color: var(--gray-400, #94a3b8);
        }

        .tut-start-name-input:focus {
          border-color: var(--blu-primary, #0066ff);
          background: white;
          box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
        }

        .tut-start-name-hint {
          font-size: 12px;
          color: var(--gray-400, #94a3b8);
          margin: 8px 0 0;
          text-align: center;
        }

        .tut-start-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tut-start-btn {
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

        .tut-start-btn:hover {
          background: #0052cc;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0, 102, 255, 0.3);
        }

        .tut-start-btn:active {
          transform: scale(0.98);
        }

        .tut-start-skip-btn {
          background: none;
          border: none;
          color: var(--gray-500, #64748b);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          padding: 8px;
          transition: color 0.15s ease;
        }

        .tut-start-skip-btn:hover {
          color: var(--gray-700, #334155);
        }

        @keyframes tut-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes tut-fly-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 480px) {
          .tut-start-content {
            padding: 24px;
            margin: 16px;
          }

          .tut-start-title {
            font-size: 20px;
          }
        }
      `}</style>
    </>
  );
}

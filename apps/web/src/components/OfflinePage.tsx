import { useCallback } from 'preact/hooks';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';

export function OfflinePage() {
  const { t } = useI18nStore();

  const handleRetry = useCallback(() => {
    location.reload();
  }, []);

  return (
    <main class="offline-page">
      <div class="offline-content">
        <div class="offline-icon">
          <WifiOff size={48} strokeWidth={1.5} />
        </div>

        <h1 class="offline-title">{t('offline.title')}</h1>
        <p class="offline-message">{t('offline.message')}</p>

        <button class="retry-btn" onClick={handleRetry}>
          <RefreshCw size={18} strokeWidth={2} />
          <span>{t('offline.retry')}</span>
        </button>
      </div>

      <style>{`
        .offline-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: var(--blu-bg-gradient, linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%));
        }

        .offline-content {
          text-align: center;
          max-width: 400px;
        }

        .offline-icon {
          width: 96px;
          height: 96px;
          margin: 0 auto 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--glass-white-70, rgba(255, 255, 255, 0.7));
          border: 1px solid var(--gray-200, #e2e8f0);
          border-radius: 50%;
          color: var(--gray-400, #94a3b8);
        }

        .offline-title {
          font-family: var(--font-display, system-ui);
          font-size: 28px;
          font-weight: 700;
          color: var(--gray-900, #0f172a);
          margin: 0 0 12px;
          letter-spacing: -0.02em;
        }

        .offline-message {
          font-size: 15px;
          line-height: 1.6;
          color: var(--gray-600, #475569);
          margin: 0 0 32px;
        }

        .retry-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 28px;
          background: var(--blu-primary, #0066ff);
          color: white;
          border: none;
          border-radius: var(--radius-button, 14px);
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .retry-btn:hover {
          background: var(--blu-primary-hover, #0052cc);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0, 102, 255, 0.3);
        }

        .retry-btn:active {
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .retry-btn { transition: none; }
          .retry-btn:hover { transform: none; }
        }
      `}</style>
    </main>
  );
}

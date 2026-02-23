import { useI18nStore } from '@/lib/i18n'
import { navigateTo } from '@/lib/navigation'

export function NotFoundPage() {
  const { t } = useI18nStore()

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: 24,
    }}>
      <h1 style={{ fontSize: 72, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>404</h1>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Page Not Found</h2>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        The page you're looking for doesn't exist.
      </p>
      <button
        onClick={() => navigateTo('/dashboard')}
        style={{
          padding: '10px 24px',
          background: 'var(--blu-primary, #0066ff)',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {t('nav.home')}
      </button>
    </div>
  )
}

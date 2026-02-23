import { useState, useEffect } from 'preact/hooks'
import { useRoute } from 'wouter'
import { Loader2 } from 'lucide-react'
import { DocumentViewPage } from '@/components/DocumentViewPage'
import { fetchSharedDocument } from '@/lib/api/external'

export function DocumentViewPage_Route() {
  const [, params] = useRoute('/view/:type/:id')
  const type = params?.type ?? ''
  const id = params?.id ?? ''
  const token = new URLSearchParams(window.location.search).get('token') ?? ''

  const [document, setDocument] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setError('Access denied — no share token provided')
      setLoading(false)
      return
    }

    const validTypes = ['invoice', 'estimate', 'contract']
    if (!validTypes.includes(type)) {
      setError('Invalid document type')
      setLoading(false)
      return
    }

    fetchSharedDocument({ type, id, token })
      .then(setDocument)
      .catch(() => setError('Document not found or link has expired'))
      .finally(() => setLoading(false))
  }, [type, id, token])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Loader2 size={32} style={{ color: '#0066ff', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (error || !document) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '12px', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1a1a2e' }}>{error ?? 'Something went wrong'}</p>
        <p style={{ fontSize: '0.9rem', color: '#64748b' }}>This share link may be invalid or expired.</p>
      </div>
    )
  }

  return <DocumentViewPage document={document} shareToken={token} />
}

export { DocumentViewPage_Route as DocumentViewPage }

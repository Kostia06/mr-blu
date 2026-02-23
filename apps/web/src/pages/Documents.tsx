import { DocumentList } from '@/components/documents/DocumentList'
import { useDocumentsData } from '@/hooks/useDocumentsData'
import { Spinner } from '@/components/ui/Spinner'

export function DocumentsPage() {
  const { data, isLoading } = useDocumentsData()

  const params = new URLSearchParams(window.location.search)
  const activeType = params.get('type') || 'all'
  const statusFilter = params.get('status') || null
  const clientFilter = params.get('client') || null

  if (isLoading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
        <Spinner />
      </div>
    )
  }

  return (
    <DocumentList
      documents={data.documents}
      summaries={data.summaries}
      activeType={activeType}
      initialStatusFilter={statusFilter}
      initialClientFilter={clientFilter}
    />
  )
}

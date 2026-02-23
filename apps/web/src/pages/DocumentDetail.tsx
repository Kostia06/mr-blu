import { useQuery } from '@tanstack/react-query'
import { useRoute } from 'wouter'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { DocumentDetail } from '@/components/documents/DocumentDetail'
import { Spinner } from '@/components/ui/Spinner'

export function DocumentDetailPage() {
  const [, params] = useRoute('/dashboard/documents/:id')
  const id = params?.id
  const user = useAuthStore((s) => s.user)
  const userId = user?.id

  const { data: document, isLoading } = useQuery({
    queryKey: ['document', id],
    enabled: !!id && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*, clients(*)')
        .eq('id', id!)
        .eq('user_id', userId!)
        .single()

      if (error) throw error

      const clients = data.clients as {
        name?: string
        email?: string
        phone?: string
        address?: string
      } | null

      return {
        ...data,
        type: data.document_type,
        documentType: data.document_type,
        client: clients?.name || '',
        clientDetails: clients
          ? {
              name: clients.name,
              email: clients.email,
              phone: clients.phone,
              address: clients.address,
            }
          : null,
      }
    },
  })

  const { data: profile } = useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .single()
      return data
    },
  })

  if (isLoading || !document) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
        <Spinner />
      </div>
    )
  }

  return (
    <DocumentDetail
      document={document}
      profile={profile ?? null}
      userMetadata={user?.user_metadata}
    />
  )
}

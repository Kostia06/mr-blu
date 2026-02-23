import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'

export function useDashboardData() {
  const user = useAuthStore((s) => s.user)
  const userId = user?.id

  return useQuery({
    queryKey: ['dashboard', userId],
    enabled: !!userId,
    queryFn: async () => {
      const [invoicesResult, contractsResult, allInvoicesResult, pendingReviewResult] =
        await Promise.all([
          supabase
            .from('documents')
            .select('id, title, document_number, client_id, total, status, created_at, document_type, clients(name)')
            .eq('user_id', userId!)
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('contracts')
            .select('id, title, client_id, status, created_at, clients(name)')
            .eq('user_id', userId!)
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('documents')
            .select('total, status, document_type')
            .eq('user_id', userId!),
          supabase
            .from('review_sessions')
            .select('id, status, intent_type, summary, created_at, parsed_data, original_transcript, actions')
            .eq('user_id', userId!)
            .in('status', ['pending', 'in_progress'])
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ])

      const invoices = invoicesResult.data ?? []
      const contracts = contractsResult.data ?? []
      const allInvoices = allInvoicesResult.data ?? []
      const pendingReview = pendingReviewResult.data

      const recentDocuments = [
        ...invoices.map((doc: any) => ({
          id: doc.id,
          type: doc.document_type === 'estimate' ? 'Estimate' : 'Invoice',
          documentType: doc.document_type || 'invoice',
          title: doc.title || doc.document_number || 'Untitled',
          client: doc.clients?.name || 'Unknown Client',
          date: doc.created_at,
          amount: doc.total || 0,
          status: doc.status || 'draft',
        })),
        ...contracts.map((doc: any) => ({
          id: doc.id,
          type: 'Contract',
          documentType: 'contract',
          title: doc.title || 'Untitled Contract',
          client: doc.clients?.name || 'Unknown Client',
          date: doc.created_at,
          amount: 0,
          status: doc.status || 'draft',
        })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3)

      const stats = {
        totalDocuments: invoices.length + contracts.length,
        totalInvoiced: allInvoices
          .filter((i: any) => i.document_type !== 'estimate')
          .reduce((sum: number, i: any) => sum + (i.total || 0), 0),
        paidAmount: allInvoices
          .filter((i: any) => i.status === 'paid' && i.document_type !== 'estimate')
          .reduce((sum: number, i: any) => sum + (i.total || 0), 0),
        pendingCount: allInvoices.filter(
          (i: any) => ['sent', 'pending'].includes(i.status) && i.document_type !== 'estimate'
        ).length,
      }

      const userMeta = user?.user_metadata || {}
      const fullName = userMeta.full_name || userMeta.first_name || ''
      const firstName = fullName.split(' ')[0] || ''

      return { recentDocuments, stats, pendingReview, firstName }
    },
  })
}

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'

export function useDocumentsData() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: ['documents', userId],
    enabled: !!userId,
    queryFn: async () => {
      const [contractsResult, invoicesResult, sentDocumentsResult] = await Promise.all([
        supabase
          .from('contracts')
          .select('id, title, client_id, status, created_at, updated_at, clients(name, email)')
          .eq('user_id', userId!)
          .order('created_at', { ascending: false }),
        supabase
          .from('documents')
          .select('id, title, document_number, client_id, total, status, created_at, updated_at, document_type, due_date, line_items, subtotal, tax_rate, tax_amount, clients(name, email)')
          .eq('user_id', userId!)
          .order('created_at', { ascending: false }),
        supabase
          .from('sent_documents')
          .select('document_id, created_at')
          .eq('user_id', userId!)
          .order('created_at', { ascending: false }),
      ])

      const contracts = contractsResult.data ?? []
      const invoices = invoicesResult.data ?? []
      const sentDocuments = sentDocumentsResult.data ?? []

      const sentAtMap = new Map<string, string>()
      for (const sent of sentDocuments) {
        if (!sentAtMap.has(sent.document_id)) {
          sentAtMap.set(sent.document_id, sent.created_at)
        }
      }

      const allDocuments = [
        ...contracts.map((doc: any) => ({
          id: doc.id,
          type: 'contract' as const,
          documentType: 'contract' as const,
          title: doc.title || 'Untitled Contract',
          client: doc.clients?.name || 'Unknown Client',
          clientEmail: doc.clients?.email || null,
          date: doc.created_at,
          createdAt: doc.created_at,
          updatedAt: doc.updated_at || doc.created_at,
          sentAt: sentAtMap.get(doc.id) || null,
          status: doc.status || 'draft',
          amount: 0,
        })),
        ...invoices.map((doc: any) => ({
          id: doc.id,
          type: (doc.document_type === 'estimate' ? 'estimate' : 'invoice') as 'estimate' | 'invoice',
          documentType: (doc.document_type || 'invoice') as 'estimate' | 'invoice',
          documentNumber: doc.document_number || null,
          title: doc.title || doc.document_number || 'Untitled',
          client: doc.clients?.name || 'Unknown Client',
          clientEmail: doc.clients?.email || null,
          date: doc.created_at,
          createdAt: doc.created_at,
          updatedAt: doc.updated_at || doc.created_at,
          sentAt: sentAtMap.get(doc.id) || null,
          amount: doc.total || 0,
          status: doc.status || 'draft',
          dueDate: doc.due_date,
          lineItems: doc.line_items || [],
          subtotal: doc.subtotal || 0,
          taxRate: doc.tax_rate || 0,
          taxAmount: doc.tax_amount || 0,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      const summaries = {
        totalInvoices: allDocuments.filter((d) => d.type === 'invoice').length,
        totalEstimates: allDocuments.filter((d) => d.type === 'estimate').length,
        totalContracts: allDocuments.filter((d) => d.type === 'contract').length,
        clients: [...new Set(allDocuments.map((d) => d.client).filter((c) => c !== 'Unknown Client'))],
      }

      return { documents: allDocuments, summaries }
    },
  })
}

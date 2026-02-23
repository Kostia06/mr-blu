import { supabase } from '@/lib/supabase/client';
import { findSimilarItems } from '@/lib/utils/phonetic';

interface QueryParams {
  type: 'list' | 'sum' | 'count' | 'details';
  documentTypes: string[];
  clientName: string | null;
  status: string | null;
  dateRange: {
    start: string | null;
    end: string | null;
    period: string | null;
  };
  sortBy: string | null;
  limit: number | null;
}

interface QueryDocument {
  id: string;
  type: string;
  documentType: string;
  title: string;
  client: string;
  clientId: string | null;
  date: string;
  amount: number;
  status: string;
  dueDate?: string | null;
}

function getDateRangeFromPeriod(period: string): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'today':
      return { start: today, end: now };
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: today };
    }
    case 'this_week': {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return { start: weekStart, end: now };
    }
    case 'last_week': {
      const lastWeekEnd = new Date(today);
      lastWeekEnd.setDate(today.getDate() - today.getDay());
      const lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setDate(lastWeekEnd.getDate() - 7);
      return { start: lastWeekStart, end: lastWeekEnd };
    }
    case 'this_month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: monthStart, end: now };
    }
    case 'last_month': {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: lastMonthStart, end: lastMonthEnd };
    }
    case 'this_year': {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return { start: yearStart, end: now };
    }
    default:
      return { start: new Date(0), end: now };
  }
}

export async function executeInfoQuery(query: QueryParams) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const userId = user.id;
  const allDocuments: QueryDocument[] = [];

  let allClients: { id: string; name: string }[] = [];
  if (query.clientName) {
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name')
      .eq('user_id', userId);
    allClients = clients || [];
  }

  let dateStart: Date | null = null;
  let dateEnd: Date | null = null;

  if (query.dateRange?.period) {
    const range = getDateRangeFromPeriod(query.dateRange.period);
    dateStart = range.start;
    dateEnd = range.end;
  } else if (query.dateRange?.start || query.dateRange?.end) {
    dateStart = query.dateRange.start ? new Date(query.dateRange.start) : null;
    dateEnd = query.dateRange.end ? new Date(query.dateRange.end) : null;
  }

  if (query.documentTypes.includes('invoice') || query.documentTypes.includes('estimate')) {
    let invoiceQuery = supabase
      .from('documents')
      .select('id, title, document_number, client_id, total, status, created_at, document_type, due_date, clients(id, name)')
      .eq('user_id', userId);

    if (query.documentTypes.includes('invoice') && !query.documentTypes.includes('estimate')) {
      invoiceQuery = invoiceQuery.or('document_type.eq.invoice,document_type.is.null');
    } else if (query.documentTypes.includes('estimate') && !query.documentTypes.includes('invoice')) {
      invoiceQuery = invoiceQuery.eq('document_type', 'estimate');
    }

    if (query.status) invoiceQuery = invoiceQuery.eq('status', query.status);
    if (dateStart) invoiceQuery = invoiceQuery.gte('created_at', dateStart.toISOString());
    if (dateEnd) invoiceQuery = invoiceQuery.lte('created_at', dateEnd.toISOString());
    if (query.limit) invoiceQuery = invoiceQuery.limit(query.limit);

    if (query.sortBy === 'amount') {
      invoiceQuery = invoiceQuery.order('total', { ascending: false });
    } else if (query.sortBy === 'client') {
      invoiceQuery = invoiceQuery.order('client_id', { ascending: true });
    } else {
      invoiceQuery = invoiceQuery.order('created_at', { ascending: false });
    }

    const { data: invoices } = await invoiceQuery;

    for (const doc of invoices || []) {
      const clientName = (doc.clients as any)?.name || 'Unknown Client';
      if (query.clientName && !clientName.toLowerCase().includes(query.clientName.toLowerCase())) continue;

      allDocuments.push({
        id: doc.id,
        type: doc.document_type === 'estimate' ? 'estimate' : 'invoice',
        documentType: doc.document_type || 'invoice',
        title: doc.title || doc.document_number || 'Untitled',
        client: clientName,
        clientId: doc.client_id,
        date: doc.created_at,
        amount: doc.total || 0,
        status: doc.status || 'draft',
        dueDate: doc.due_date,
      });
    }
  }

  if (query.documentTypes.includes('contract')) {
    let contractQuery = supabase
      .from('contracts')
      .select('id, title, client_id, status, created_at, clients(id, name)')
      .eq('user_id', userId);

    if (query.status) contractQuery = contractQuery.eq('status', query.status);
    if (dateStart) contractQuery = contractQuery.gte('created_at', dateStart.toISOString());
    if (dateEnd) contractQuery = contractQuery.lte('created_at', dateEnd.toISOString());
    if (query.limit) contractQuery = contractQuery.limit(query.limit);
    contractQuery = contractQuery.order('created_at', { ascending: false });

    const { data: contracts } = await contractQuery;

    for (const doc of contracts || []) {
      const clientName = (doc.clients as any)?.name || 'Unknown Client';
      if (query.clientName && !clientName.toLowerCase().includes(query.clientName.toLowerCase())) continue;

      allDocuments.push({
        id: doc.id,
        type: 'contract',
        documentType: 'contract',
        title: doc.title || 'Untitled Contract',
        client: clientName,
        clientId: doc.client_id,
        date: doc.created_at,
        amount: 0,
        status: doc.status || 'draft',
      });
    }
  }

  allDocuments.sort((a, b) => {
    if (query.sortBy === 'amount') return b.amount - a.amount;
    if (query.sortBy === 'client') return a.client.localeCompare(b.client);
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const limitedDocuments = query.limit ? allDocuments.slice(0, query.limit) : allDocuments;

  let clientSuggestions: { id: string; name: string; similarity: number }[] = [];
  if (query.clientName && allClients.length > 0) {
    clientSuggestions = findSimilarItems(allClients, query.clientName, (c: { name: string }) => c.name)
      .filter((m: any) => m.item.name.toLowerCase() !== query.clientName?.toLowerCase())
      .map((m: any) => ({ id: m.item.id, name: m.item.name, similarity: m.similarity }));
  }

  const summary = {
    count: limitedDocuments.length,
    totalAmount: limitedDocuments.reduce((sum, d) => sum + d.amount, 0),
    byStatus: limitedDocuments.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + (query.type === 'sum' ? d.amount : 1);
      return acc;
    }, {} as Record<string, number>),
    byType: limitedDocuments.reduce((acc, d) => {
      acc[d.type] = (acc[d.type] || 0) + (query.type === 'sum' ? d.amount : 1);
      return acc;
    }, {} as Record<string, number>),
  };

  const suggestions = clientSuggestions.length > 0
    ? { type: 'client' as const, searchedFor: query.clientName || '', alternatives: clientSuggestions }
    : undefined;

  return {
    success: true,
    queryType: query.type,
    documents: limitedDocuments,
    summary,
    suggestions,
  };
}

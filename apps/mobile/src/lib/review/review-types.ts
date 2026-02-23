// Review page types - extracted from review page

export interface ActionStep {
  id: string;
  type: 'create_document' | 'send_email';
  order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  details: {
    recipient?: string;
    frequency?: string;
    message?: string;
  };
  error?: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
  material?: string | null;
  measurementType?: 'sqft' | 'linear_ft' | 'unit' | 'hour' | 'job' | 'service' | null;
  dimensions?: {
    width: number | null;
    length: number | null;
    unit: 'ft' | 'm' | null;
  } | null;
  suggestedPrice?: number | null;
  pricingConfidence?: number;
  hasPricingSuggestion?: boolean;
}

export interface ParsedData {
  documentType: 'invoice' | 'estimate';
  client: {
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  items: LineItem[];
  total: number;
  subtotal?: number;
  taxRate: number | null;
  taxAmount?: number;
  taxes?: Array<{ rate: number; [key: string]: unknown }>;
  dueDate: string | null;
  actions: ActionStep[];
  summary: string;
  confidence: {
    overall: number;
    client: number;
    items: number;
    actions: number;
  };
  [key: string]: unknown;
}

export interface QueryDocument {
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

export interface ClientSuggestion {
  id: string;
  name: string;
  similarity: number;
}

export interface QueryResult {
  success: boolean;
  queryType: string;
  documents?: QueryDocument[];
  summary?: {
    count: number;
    totalAmount: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  };
  answer?: string;
  suggestions?: {
    type: 'client';
    searchedFor: string;
    alternatives: ClientSuggestion[];
  };
}

export interface QueryData {
  query: {
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
  };
  summary: string;
  naturalLanguageQuery: string;
  confidence: {
    overall: number;
    queryType: number;
    filters: number;
  };
}

export interface CloneModifications {
  updateItems?: Array<{
    match: string;
    newRate?: number;
    newQuantity?: number;
    newDescription?: string;
  }>;
  addItems?: Array<{
    description: string;
    quantity?: number;
    unit?: string;
    rate?: number;
  }>;
  removeItems?: string[];
  newTotal?: number;
}

export interface CloneData {
  sourceClient: string;
  targetClient: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  documentType: string | null;
  modifications?: CloneModifications;
  actions: ActionStep[];
  summary: string;
  confidence: Record<string, number>;
}

export interface SourceDocument {
  id: string;
  type: 'invoice' | 'estimate' | 'contract';
  title: string;
  client: string;
  clientId?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  amount: number;
  date: string;
  status: string;
  lineItems?: LineItem[];
}

export interface MergeData {
  sourceClients: string[];
  targetClient: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  documentType: string | null;
  actions: ActionStep[];
  summary: string;
  confidence: Record<string, number>;
}

export interface MergeSourceSelection {
  clientName: string;
  documents: SourceDocument[];
  selectedDoc: SourceDocument | null;
  isSearching: boolean;
}

export interface SendData {
  clientName: string;
  documentType: string | null;
  selector: 'last' | 'latest' | 'recent' | 'first' | null;
  deliveryMethod: 'email' | 'sms' | 'whatsapp';
  recipient: {
    email?: string | null;
    phone?: string | null;
    clientName?: string | null;
  };
  summary: string;
  confidence: Record<string, number>;
}

export interface TransformData {
  source: {
    clientName: string;
    documentType: 'invoice' | 'estimate' | null;
    selector: 'last' | 'latest' | 'recent' | null;
    documentNumber: string | null;
  };
  conversion: {
    enabled: boolean;
    targetType: 'invoice' | 'estimate';
  };
  split: {
    enabled: boolean;
    numberOfParts: number;
    splitMethod: 'equal' | 'custom' | 'percentage';
    customAmounts: number[] | null;
    percentages: number[] | null;
    roundingMethod: 'floor' | 'ceil' | 'round';
  };
  schedule: {
    enabled: boolean;
    frequency: { type: 'days' | 'weeks' | 'months'; interval: number } | null;
    startDate: string | null;
    sendFirst: boolean;
  };
  targetClient: {
    name: string | null;
    email: string | null;
  };
  actions: ActionStep[];
  summary: string;
  confidence: Record<string, number>;
}

export interface TransformSourceDocument {
  id: string;
  type: 'invoice' | 'estimate';
  number: string;
  total: number;
  clientId: string;
  clientName: string;
  clientEmail: string;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    rate: number;
    total: number;
  }>;
  createdAt: Date;
}

export interface TransformClientSuggestion {
  id: string;
  name: string;
  estimateCount: number;
  invoiceCount: number;
  similarity: number;
}

export interface RecentDocument {
  id: string;
  document_number: string;
  client_name: string;
  total: number;
  created_at: string;
  document_type: 'invoice' | 'estimate';
}

export interface ItemSuggestion {
  description: string;
  rate: number;
  unit: string;
  count: number;
}

export interface ClientSuggestionFull {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  similarity: number;
}

export interface UserProfile {
  business_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export type IntentType =
  | 'document_action'
  | 'information_query'
  | 'document_clone'
  | 'document_merge'
  | 'document_send'
  | 'document_transform';

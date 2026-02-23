import { useState, useMemo, useEffect, useRef } from 'preact/hooks';
import { useI18nStore } from '@/lib/i18n';
import { useToastStore } from '@/stores/toastStore';
import { useReviewAPI } from '@/hooks/review/useReviewAPI';
import { useReviewSession } from '@/hooks/review/useReviewSession';
import { useReviewClone } from '@/hooks/review/useReviewClone';
import { useReviewMerge } from '@/hooks/review/useReviewMerge';
import { useReviewSend } from '@/hooks/review/useReviewSend';
import { useReviewTransform } from '@/hooks/review/useReviewTransform';
import {
  handleInformationQuery,
  handleDocumentClone,
  handleDocumentMerge,
  handleDocumentSend,
  handleDocumentTransform,
  handleDocumentAction,
  handleParseError,
} from '@/lib/review/review-intent-handlers';
import type {
  ActionStep,
  LineItem,
  ParsedData,
  QueryData,
  QueryResult,
  SourceDocument,
  ItemSuggestion,
  ClientSuggestionFull,
  UserProfile,
  RecentDocument,
  IntentType,
} from '@/lib/review/review-types';

import { ReviewHeader } from '@/components/review/ReviewHeader';
import { ReviewLoadingState } from '@/components/review/ReviewLoadingState';
import { SummaryCard } from '@/components/review/SummaryCard';
import { DoneState } from '@/components/review/DoneState';
import { AlertCard } from '@/components/review/AlertCard';
import { ShareLinkModal } from '@/components/review/ShareLinkModal';
import { QueryResultsFlow } from '@/components/review/QueryResultsFlow';
import { CloneDocumentFlow } from '@/components/review/CloneDocumentFlow';
import { MergeDocumentsFlow } from '@/components/review/MergeDocumentsFlow';
import { SendDocumentFlow } from '@/components/review/SendDocumentFlow';
import { ReviewPreviewCard } from '@/components/review/ReviewPreviewCard';
import { ReviewLineItems } from '@/components/review/ReviewLineItems';
import { ReviewActions } from '@/components/review/ReviewActions';
import { ReviewExecuteButton } from '@/components/review/ReviewExecuteButton';
import { TransformReview } from '@/components/review/TransformReview';
import { TransformClientSelector } from '@/components/review/TransformClientSelector';
import { DocumentSuggestions } from '@/components/review/DocumentSuggestions';
import { ContactMergeModal } from '@/components/modals/ContactMergeModal';
import { AlertCircle, FileText, Mail } from 'lucide-react';
import { navigateTo } from '@/lib/navigation';
import { fetchProfile } from '@/lib/api/user';
import { suggestClients } from '@/lib/api/clients';
import { lookupPricing, savePricing, searchPriceItems } from '@/lib/api/pricing';
import type { PriceSearchResult } from '@/lib/api/pricing';
import {
  generateNextNumber,
  fetchDocument as fetchDocumentDirect,
  generatePDF,
} from '@/lib/api/documents';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReviewPageProps {
  entryMode: 'new' | 'resume' | 'legacy_resume' | 'sessionStorage';
  transcript?: string;
  reviewSession?: any;
}

// ---------------------------------------------------------------------------
// Default parsed data
// ---------------------------------------------------------------------------

const DEFAULT_PARSED_DATA: ParsedData = {
  documentType: 'invoice',
  client: {
    name: null,
    firstName: null,
    lastName: null,
    email: null,
    phone: null,
    address: null,
  },
  items: [],
  total: 0,
  taxRate: null,
  dueDate: null,
  actions: [],
  summary: '',
  confidence: { overall: 0, client: 0, items: 0, actions: 0 },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReviewPage({ entryMode, transcript, reviewSession: reviewSessionProp }: ReviewPageProps) {
  const { t } = useI18nStore();
  const toast = useToastStore();

  // --- Hooks ---------------------------------------------------------------

  const api = useReviewAPI();
  const transform = useReviewTransform();
  const clone = useReviewClone();
  const merge = useReviewMerge();
  const reviewSession = useReviewSession();
  const send = useReviewSend({
    sendDocumentAPI: api.sendDocumentAPI,
    updateClientContactInfo: api.updateClientContactInfo,
  });

  // --- Core state ----------------------------------------------------------

  const [isParsing, setIsParsing] = useState(true);
  const [parsingStep, setParsingStep] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentActionIndex, setCurrentActionIndex] = useState(-1);
  const [parseError, setParseError] = useState<string | null>(null);
  const [savedDocumentId, _setSavedDocumentId] = useState<string | null>(null);
  const savedDocumentIdRef = useRef<string | null>(null);
  const setSavedDocumentId = (id: string | null) => {
    savedDocumentIdRef.current = id;
    _setSavedDocumentId(id);
  };
  const [generatedDocNumber, setGeneratedDocNumber] = useState('');

  // Intent / query state
  const [intentType, setIntentType] = useState<IntentType>('document_action');
  const [queryData, setQueryData] = useState<QueryData | null>(null);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isQueryLoading, setIsQueryLoading] = useState(false);

  // Item suggestions
  const [itemSuggestions, setItemSuggestions] = useState<ItemSuggestion[]>([]);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);

  // Client suggestions
  const [clientSuggestions, setClientSuggestions] = useState<ClientSuggestionFull[]>([]);
  const [exactClientMatch, setExactClientMatch] = useState<ClientSuggestionFull | null>(null);
  const [isLoadingClientSuggestions, setIsLoadingClientSuggestions] = useState(false);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  // AI action suggestions
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  // User profile
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showProfileWarning, setShowProfileWarning] = useState(false);
  const [profileWarningDismissed, setProfileWarningDismissed] = useState(false);

  // Business info
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    businessName: '',
    address: '',
    phone: '',
    email: '',
    website: '',
  });

  // Main data
  const [data, setData] = useState<ParsedData>({ ...DEFAULT_PARSED_DATA });
  const [rawTranscription, setRawTranscription] = useState('');

  // Client search dropdown
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientDropdownResults, setClientDropdownResults] = useState<ClientSuggestionFull[]>([]);
  const [isSearchingClients, setIsSearchingClients] = useState(false);

  // Action editing
  const [showActionTypePicker, setShowActionTypePicker] = useState(false);

  // Pricing
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);



  // Refs for timeouts
  const clientSearchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // --- Derived values (useMemo) -------------------------------------------

  const profileMissingFields = useMemo(() => {
    if (!userProfile) return ['Profile not loaded'];
    const missing: string[] = [];
    if (!userProfile.business_name && !userProfile.full_name) missing.push('Business name');
    if (!userProfile.email) missing.push('Email address');
    if (!userProfile.address) missing.push('Business address');
    return missing;
  }, [userProfile]);

  const hasAnyProfileField = useMemo(
    () =>
      Boolean(
        userProfile?.business_name ||
          userProfile?.full_name ||
          userProfile?.email ||
          userProfile?.address
      ),
    [userProfile]
  );

  const isProfileComplete = useMemo(() => profileMissingFields.length === 0, [profileMissingFields]);

  const documentNumber = useMemo(() => generatedDocNumber || 'DRAFT', [generatedDocNumber]);

  const calculatedSubtotal = useMemo(
    () => data.items.reduce((sum, item) => sum + (item.total || 0), 0),
    [data.items]
  );

  const calculatedTaxAmount = useMemo(
    () => (data.taxRate ? calculatedSubtotal * (data.taxRate / 100) : 0),
    [data.taxRate, calculatedSubtotal]
  );

  const calculatedTotal = useMemo(
    () => calculatedSubtotal + calculatedTaxAmount,
    [calculatedSubtotal, calculatedTaxAmount]
  );

  const allActionsCompleted = useMemo(
    () => data.actions.length > 0 && data.actions.every((a) => a.status === 'completed'),
    [data.actions]
  );

  const clientFullName = useMemo(() => {
    const firstName = data.client.firstName?.trim() || '';
    const lastName = data.client.lastName?.trim() || '';
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return data.client.name || '';
  }, [data.client.firstName, data.client.lastName, data.client.name]);

  const validation = useMemo(() => {
    const hasSendEmailAction = data.actions.some(
      (a) => a.type === 'send_email' && a.status === 'pending'
    );

    return {
      clientName: {
        valid: !!clientFullName,
        message: clientFullName ? undefined : 'Client name is required',
      },
      clientEmail: {
        valid: !hasSendEmailAction || !!data.client.email,
        message:
          hasSendEmailAction && !data.client.email
            ? 'Email required for email delivery'
            : undefined,
        warning: hasSendEmailAction && !data.client.email,
      },
      total: {
        valid: calculatedTotal > 0,
        message: calculatedTotal <= 0 ? 'Total must be greater than $0' : undefined,
      },
      items: {
        valid: data.items.length > 0,
        message: data.items.length === 0 ? 'At least one line item is required' : undefined,
      },
    };
  }, [data.actions, data.client.email, data.items.length, calculatedTotal, clientFullName]);

  const hasValidationErrors = useMemo(
    () => !validation.clientName.valid || !validation.total.valid || !validation.items.valid,
    [validation]
  );

  const hasValidationWarnings = useMemo(
    () => !!validation.clientEmail.warning,
    [validation]
  );

  const canExecute = useMemo(
    () => !hasValidationErrors && data.actions.length > 0,
    [hasValidationErrors, data.actions.length]
  );

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!validation.clientName.valid) errors.push(t('review.clientNameRequired'));
    if (!validation.items.valid) errors.push(t('review.atLeastOneItem'));
    if (!validation.total.valid) errors.push(t('review.totalMustBePositive'));
    return errors;
  }, [validation, t]);

  const sortedActions = useMemo(
    () => [...data.actions].sort((a, b) => a.order - b.order),
    [data.actions]
  );

  // --- Helpers -------------------------------------------------------------

  function parseClientName(fullName: string): { firstName: string; lastName: string } {
    const trimmed = fullName.trim();
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function goToDashboard() {
    navigateTo('/dashboard');
  }

  // --- Effects -------------------------------------------------------------

  // Sync client name when firstName/lastName changes
  useEffect(() => {
    if (data.client.firstName || data.client.lastName) {
      setData((prev) => ({
        ...prev,
        client: { ...prev.client, name: clientFullName || null },
      }));
    }
  }, [data.client.firstName, data.client.lastName, clientFullName]);

  // Auto-save review when data changes (debounced)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (reviewSession.reviewSessionId && !isParsing) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        reviewSession.autoSaveReview(getSessionData);
      }, 2000);
    }
    return () => clearTimeout(autoSaveTimerRef.current);
  }, [
    data.client,
    data.items,
    data.total,
    data.taxRate,
    data.dueDate,
    data.actions,
    reviewSession.reviewSessionId,
    isParsing,
  ]);

  // --- Session data getter -------------------------------------------------

  function getSessionData(): Record<string, unknown> {
    return {
      originalTranscript: rawTranscription,
      intentType,
      parsedData:
        intentType === 'document_action'
          ? data
          : intentType === 'document_clone'
            ? clone.cloneData
            : queryData,
      actions: data.actions,
      queryData,
      queryResult,
      sourceDocumentId: clone.selectedSourceDoc?.id,
      sourceDocumentType: clone.selectedSourceDoc?.type,
      confidence: data.confidence,
      summary: data.summary || queryData?.summary || clone.cloneData?.summary,
      status: allActionsCompleted ? 'completed' : 'in_progress',
    };
  }

  // --- Fetch user profile --------------------------------------------------

  async function fetchUserProfile(): Promise<void> {
    try {
      const result = await fetchProfile();
      if (result.profile) {
        setUserProfile(result.profile);
        const p = result.profile;
        const fullAddress = [p.address, ''].filter(Boolean).join('\n');
        setBusinessInfo({
          name: p.full_name || '',
          businessName: p.business_name || '',
          address: fullAddress,
          phone: p.phone || '',
          email: p.email || '',
          website: p.website || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  }

  // --- Doc number generation -----------------------------------------------

  async function generateDocNumber(docType?: string) {
    try {
      const resolvedType = docType || data.documentType;
      const type = resolvedType === 'estimate' ? 'estimate' : 'invoice';
      const number = await generateNextNumber(type);
      setGeneratedDocNumber(number);
    } catch {
      const resolvedType = docType || data.documentType;
      const prefix = resolvedType === 'estimate' ? 'EST' : 'INV';
      const year = new Date().getFullYear();
      setGeneratedDocNumber(`${prefix}-${year}-0001`);
    }
  }

  // --- Pricing -------------------------------------------------------------

  async function fetchPricingSuggestions(): Promise<void> {
    const itemsWithMaterial = data.items.filter(
      (item) => item.material && item.measurementType && item.quantity > 0
    );
    if (itemsWithMaterial.length === 0) return;

    setIsLoadingPricing(true);
    try {
      const lookupPromises = itemsWithMaterial.map(async (item) => {
        try {
          const result = await lookupPricing(
            item.material!,
            item.measurementType!,
            item.quantity
          );
          if (result.found && result.suggestedPrice) {
            setData((prev) => {
              const idx = prev.items.findIndex((i) => i.id === item.id);
              if (idx === -1) return prev;
              if (prev.items[idx].rate && prev.items[idx].total !== 0) return prev;
              const updatedItems = [...prev.items];
              updatedItems[idx] = {
                ...updatedItems[idx],
                suggestedPrice: result.suggestedPrice,
                pricingConfidence: result.confidence,
                hasPricingSuggestion: true,
              };
              return { ...prev, items: updatedItems };
            });
          }
        } catch (error) {
          console.error(`Pricing lookup failed for ${item.material}:`, error);
        }
      });
      await Promise.all(lookupPromises);
    } finally {
      setIsLoadingPricing(false);
    }
  }

  function applySuggestedPrice(itemId: string): void {
    setData((prev) => {
      const idx = prev.items.findIndex((i) => i.id === itemId);
      if (idx === -1 || !prev.items[idx].suggestedPrice) return prev;
      const suggestedPrice = prev.items[idx].suggestedPrice!;
      const quantity = prev.items[idx].quantity || 1;
      const updatedItems = [...prev.items];
      updatedItems[idx] = {
        ...updatedItems[idx],
        total: suggestedPrice,
        rate: suggestedPrice / quantity,
        hasPricingSuggestion: false,
      };
      return { ...prev, items: updatedItems };
    });
  }

  function dismissPricingSuggestion(itemId: string): void {
    setData((prev) => {
      const idx = prev.items.findIndex((i) => i.id === itemId);
      if (idx === -1) return prev;
      const updatedItems = [...prev.items];
      updatedItems[idx] = {
        ...updatedItems[idx],
        suggestedPrice: null,
        hasPricingSuggestion: false,
      };
      return { ...prev, items: updatedItems };
    });
  }

  async function savePricingMemory(): Promise<void> {
    const pricedItems = data.items.filter(
      (item) => item.description && item.quantity > 0 && item.total > 0
    );
    if (pricedItems.length === 0) return;
    try {
      await savePricing(
        pricedItems.map((item) => ({
          description: item.description,
          material: item.material ?? undefined,
          measurementType: item.measurementType ?? undefined,
          quantity: item.quantity,
          rate: item.rate,
          total: item.total,
        }))
      );
    } catch (error) {
      console.error('Failed to save pricing memory:', error);
    }
  }

  // --- Information query ---------------------------------------------------

  async function executeQuery(overrideClientName?: string) {
    if (!queryData?.query) return;

    setIsQueryLoading(true);
    try {
      const queryToSend = overrideClientName
        ? { ...queryData.query, clientName: overrideClientName }
        : queryData.query;

      const { executeInfoQuery } = await import('@/lib/api/infoQuery');
      const result = await executeInfoQuery(queryToSend);
      setQueryResult(result);

      if (overrideClientName && queryData) {
        setQueryData({
          ...queryData,
          query: { ...queryData.query, clientName: overrideClientName },
          naturalLanguageQuery: queryData.naturalLanguageQuery.replace(
            result?.suggestions?.searchedFor || '',
            overrideClientName
          ),
        });
      }
    } catch (error) {
      console.error('Query execution error:', error);
      setQueryResult({
        success: false,
        queryType: 'list',
        answer: 'Failed to execute query. Please try again.',
      });
    } finally {
      setIsQueryLoading(false);
    }
  }

  function useSuggestedClient(clientName: string) {
    executeQuery(clientName);
  }

  // --- Item suggestions ----------------------------------------------------

  async function fetchItemSuggestionsData() {
    try {
      const { fetchItemSuggestions: fetchSuggestions } = await import('@/lib/api/suggestions');
      const suggestions = await fetchSuggestions();
      setItemSuggestions(suggestions);
    } catch (error) {
      console.error('Fetch item suggestions error:', error);
    }
  }

  function addItemFromSuggestion(suggestion: ItemSuggestion) {
    const newItem: LineItem = {
      id: `item-${Date.now()}-${data.items.length}`,
      description: suggestion.description,
      quantity: 1,
      unit: suggestion.unit,
      rate: suggestion.rate,
      total: suggestion.rate,
    };
    setData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
    setShowItemSuggestions(false);
  }

  async function trackUsedItems() {
    if (data.items.length === 0) return;
    try {
      const { trackItems } = await import('@/lib/api/suggestions');
      await trackItems(data.items);
    } catch (error) {
      console.error('Track items error:', error);
    }
  }

  // --- Client suggestions --------------------------------------------------

  async function fetchClientSuggestions(name: string) {
    if (!name || name.length < 2) {
      setClientSuggestions([]);
      setExactClientMatch(null);
      setShowClientSuggestions(false);
      return;
    }

    setIsLoadingClientSuggestions(true);
    try {
      const result = await suggestClients(name, 5);
      const suggestions = result.suggestions || [];
      const exact = result.exactMatch || null;
      setClientSuggestions(suggestions);
      setExactClientMatch(exact);
      setShowClientSuggestions(suggestions.length > 0 && !exact);

      if (exact) {
        const { firstName, lastName } = parseClientName(exact.name || '');
        setData((prev) => ({
          ...prev,
          client: {
            ...prev.client,
            name: exact.name || prev.client.name,
            firstName: firstName || prev.client.firstName,
            lastName: lastName || prev.client.lastName,
            email: exact.email || prev.client.email,
            phone: exact.phone || prev.client.phone,
            address: exact.address || prev.client.address,
          },
        }));
      }
    } catch (error) {
      console.error('Client suggestion error:', error);
    } finally {
      setIsLoadingClientSuggestions(false);
    }
  }

  function applyClientSuggestion(client: ClientSuggestionFull) {
    const { firstName, lastName } = parseClientName(client.name || '');
    setData((prev) => ({
      ...prev,
      client: {
        name: client.name,
        firstName,
        lastName,
        email: client.email,
        phone: client.phone,
        address: client.address,
      },
    }));
    setShowClientSuggestions(false);
    setClientSuggestions([]);
  }

  function searchClients(query: string) {
    if (clientSearchTimeoutRef.current) clearTimeout(clientSearchTimeoutRef.current);
    if (!query || query.length < 2) {
      setClientDropdownResults([]);
      return;
    }
    clientSearchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingClients(true);
      try {
        const result = await suggestClients(query, 10);
        setClientDropdownResults(result.suggestions || []);
      } catch (error) {
        console.error('Error searching clients:', error);
        setClientDropdownResults([]);
      } finally {
        setIsSearchingClients(false);
      }
    }, 300);
  }

  function selectClientFromDropdown(client: ClientSuggestionFull) {
    const { firstName, lastName } = parseClientName(client.name || '');
    setData((prev) => ({
      ...prev,
      client: {
        name: client.name,
        firstName,
        lastName,
        email: client.email,
        phone: client.phone,
        address: client.address,
      },
    }));
    setShowClientDropdown(false);
    setClientSearchQuery('');
    setClientDropdownResults([]);
  }

  function openClientDropdown() {
    setShowClientDropdown(true);
    const q = clientFullName || '';
    setClientSearchQuery(q);
    if (q) searchClients(q);
  }

  // --- Document suggestions ------------------------------------------------

  async function handleDocumentSuggestionSelect(doc: RecentDocument) {
    reviewSession.setShowDocumentSuggestions(false);

    try {
      const tableName = (doc as any).document_type === 'contract' ? 'contracts' : 'documents';
      const fullDoc = await fetchDocumentDirect(doc.id, tableName);

      if (fullDoc) {
        const clientName = (fullDoc.client_name as string) || null;
        const clientEmail = (fullDoc.client_email as string) || null;
        const clientPhone = (fullDoc.client_phone as string) || null;
        const clientAddress = (fullDoc.client_address as string) || null;

        let newClient = {
          name: clientName,
          firstName: null as string | null,
          lastName: null as string | null,
          email: clientEmail,
          phone: clientPhone,
          address: clientAddress,
        };

        if (clientName) {
          const { firstName, lastName } = parseClientName(clientName);
          newClient.firstName = firstName;
          newClient.lastName = lastName;
        }

        let newItems: LineItem[] = [];
        if (fullDoc.line_items && Array.isArray(fullDoc.line_items)) {
          newItems = fullDoc.line_items.map(
            (
              item: {
                description?: string;
                quantity?: number;
                unit?: string;
                rate?: number;
                total?: number;
              },
              index: number
            ) => ({
              id: `item-${Date.now()}-${index}`,
              description: item.description || '',
              quantity: item.quantity || 1,
              unit: item.unit || 'unit',
              rate: item.rate || 0,
              total: item.total || 0,
            })
          );
        }

        setData((prev) => ({
          ...prev,
          documentType: (doc as any).document_type === 'estimate' ? 'estimate' as const : 'invoice' as const,
          client: newClient,
          items: newItems,
          taxRate: (fullDoc.tax_rate as number) || null,
        }));
        generateDocNumber();
      }
    } catch (error) {
      console.error('Failed to fetch document details:', error);
    }
  }

  // --- Clone flow ----------------------------------------------------------

  function selectSourceDocumentForClone(doc: SourceDocument) {
    clone.selectSourceDocument(doc);

    const { items, subtotal, total } = clone.applyCloneModifications(doc, clone.cloneData);

    const clonedClientName = clone.cloneData?.targetClient.name || '';
    const { firstName: cloneFirstName, lastName: cloneLastName } =
      parseClientName(clonedClientName);

    setIntentType('document_action');
    setData({
      documentType: doc.type === 'contract' ? 'invoice' : (doc.type as 'invoice' | 'estimate'),
      client: {
        name: clone.cloneData?.targetClient.name || null,
        firstName: cloneFirstName || null,
        lastName: cloneLastName || null,
        email: clone.cloneData?.targetClient.email || null,
        phone: clone.cloneData?.targetClient.phone || null,
        address: clone.cloneData?.targetClient.address || null,
      },
      items,
      total,
      subtotal,
      taxRate: null,
      dueDate: null,
      actions: clone.cloneData?.actions || [
        {
          id: `action-${Date.now()}-0`,
          type: 'create_document',
          order: 1,
          status: 'pending',
          details: {},
        },
      ],
      summary:
        clone.cloneData?.summary ||
        `Cloned from ${doc.client}'s ${doc.type} for ${clone.cloneData?.targetClient.name}`,
      confidence: { overall: 0.9, client: 0.9, items: 0.95, actions: 0.9 },
    });

    generateDocNumber();
    if (clone.cloneData?.targetClient.name) {
      fetchClientSuggestions(clone.cloneData.targetClient.name);
    }
  }

  // --- Merge flow ----------------------------------------------------------

  function confirmMergeSelections() {
    if (!merge.allMergeSourcesSelected || !merge.mergeData) return;

    const { items: combinedItems, subtotal } = merge.getCombinedMergeItems(merge.mergeSourceSelections);
    const docType = merge.mergeSourceSelections[0]?.selectedDoc?.type || 'estimate';

    setIntentType('document_action');
    merge.setShowMergeSelection(false);

    const mergedClientName = merge.mergeData.targetClient.name || '';
    const { firstName: mergeFirstName, lastName: mergeLastName } =
      parseClientName(mergedClientName);

    setData({
      documentType: docType === 'contract' ? 'estimate' : (docType as 'invoice' | 'estimate'),
      client: {
        name: merge.mergeData.targetClient.name || null,
        firstName: mergeFirstName || null,
        lastName: mergeLastName || null,
        email: merge.mergeData.targetClient.email || null,
        phone: merge.mergeData.targetClient.phone || null,
        address: merge.mergeData.targetClient.address || null,
      },
      items: combinedItems,
      total: subtotal,
      subtotal,
      taxRate: null,
      dueDate: null,
      actions: merge.mergeData.actions || [
        {
          id: `action-${Date.now()}-0`,
          type: 'create_document',
          order: 1,
          status: 'pending',
          details: {},
        },
      ],
      summary:
        merge.mergeData.summary ||
        `Merged items from ${merge.mergeSourceSelections.map((s) => s.clientName).join(' and ')} for ${merge.mergeData.targetClient.name}`,
      confidence: { overall: 0.9, client: 0.9, items: 0.95, actions: 0.9 },
    });

    generateDocNumber();
    if (merge.mergeData.targetClient.name) {
      fetchClientSuggestions(merge.mergeData.targetClient.name);
    }
  }

  // --- AI suggestion selection ---------------------------------------------

  function handleSuggestionSelect(suggestion: Partial<{ type: string; category: string; description: string }>) {
    const newAction: ActionStep = {
      id: crypto.randomUUID(),
      type: mapSuggestionToActionType(
        suggestion.type || 'create',
        suggestion.category || 'document'
      ),
      order: data.actions.length + 1,
      status: 'pending',
      details: {
        recipient: suggestion.category === 'communication' ? data.client.email || '' : undefined,
        frequency: suggestion.category === 'scheduling' ? 'monthly' : undefined,
      },
    };

    setData((prev) => ({ ...prev, actions: [...prev.actions, newAction] }));
    setShowAISuggestions(false);
  }

  function mapSuggestionToActionType(type: string, category: string): ActionStep['type'] {
    if (category === 'communication') return 'send_email';
    return 'create_document';
  }

  // --- Template data for PDF -----------------------------------------------

  function getTemplateData() {
    const docType: 'INVOICE' | 'ESTIMATE' =
      data.documentType === 'estimate' ? 'ESTIMATE' : 'INVOICE';

    const ensureNumber = (val: unknown): number => {
      if (typeof val === 'number' && !isNaN(val)) return val;
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    const cleanUnit = (item: LineItem): string => {
      const qty = ensureNumber(item.quantity);
      if (qty <= 0) return '1';
      return String(qty);
    };

    return {
      documentType: docType,
      documentNumber: documentNumber || '',
      billTo: {
        name: data.client.name || '',
        address: data.client.address || null,
        city: null,
        phone: data.client.phone || null,
        email: data.client.email || null,
      },
      from: {
        name: businessInfo.name || null,
        businessName: businessInfo.businessName || '',
        address: businessInfo.address || null,
        city: null,
        phone: businessInfo.phone || null,
        email: businessInfo.email || null,
        website: businessInfo.website || null,
      },
      items: data.items.map((item) => {
        let dims: string | undefined;
        const rawDims = item.dimensions as unknown;
        if (typeof rawDims === 'string') {
          dims = (rawDims as string).includes('undefined') ? undefined : (rawDims as string);
        } else if (item.dimensions?.width && item.dimensions?.length) {
          dims = `${item.dimensions.width} x ${item.dimensions.length} ${item.dimensions.unit || 'ft'}`;
        }
        return {
          id: item.id || '',
          description: item.description || '',
          quantity: ensureNumber(item.quantity) || 1,
          unit: cleanUnit(item),
          rate: ensureNumber(item.rate),
          total: ensureNumber(item.total),
          measurementType: item.measurementType || undefined,
          dimensions: dims,
        };
      }),
      subtotal: ensureNumber(calculatedSubtotal),
      gstRate: ensureNumber(data.taxRate) / 100,
      gstAmount: ensureNumber(calculatedTaxAmount),
      total: ensureNumber(calculatedTotal),
      date: new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || null,
    };
  }

  // --- PDF download --------------------------------------------------------

  async function handleDownloadPDF() {
    try {
      const tpl = getTemplateData();
      const documentData = {
        documentType: tpl.documentType,
        documentNumber: tpl.documentNumber,
        client: {
          name: tpl.billTo.name,
          email: tpl.billTo.email,
          phone: tpl.billTo.phone,
          address: tpl.billTo.address,
        },
        from: {
          name: tpl.from.name,
          businessName: tpl.from.businessName,
          email: tpl.from.email,
          phone: tpl.from.phone,
          address: tpl.from.address,
          website: tpl.from.website,
        },
        lineItems: tpl.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          total: item.total,
          measurementType: item.measurementType,
          dimensions: item.dimensions,
        })),
        subtotal: tpl.subtotal,
        taxRate: tpl.gstRate * 100,
        taxAmount: tpl.gstAmount,
        total: tpl.total,
        date: tpl.date,
        dueDate: tpl.dueDate,
        notes: (data as any).notes || null,
      };

      const blob = await generatePDF(documentData as unknown as Record<string, unknown>);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tpl.documentType}-${tpl.documentNumber || 'document'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate PDF');
    }
  }

  // --- Action execution ----------------------------------------------------

  async function executeAction(action: ActionStep) {
    const index = data.actions.findIndex((a) => a.id === action.id);
    if (index === -1) return;

    setCurrentActionIndex(index);
    setData((prev) => {
      const actions = [...prev.actions];
      actions[index] = { ...actions[index], status: 'in_progress', error: undefined };
      return { ...prev, actions };
    });

    try {
      switch (action.type) {
        case 'create_document': {
          const savedDoc = await api.saveDocumentAPI(getTemplateData(), rawTranscription, 'draft');
          if (savedDoc) {
            setSavedDocumentId(savedDoc.id);
          } else {
            // Merge conflict — modal will show, reset action to pending
            setData((prev) => {
              const actions = [...prev.actions];
              actions[index] = { ...actions[index], status: 'pending' };
              return { ...prev, actions };
            });
            setCurrentActionIndex(-1);
            return;
          }
          break;
        }

        case 'send_email': {
          if (!hasAnyProfileField && !profileWarningDismissed) {
            setShowProfileWarning(true);
            setData((prev) => {
              const actions = [...prev.actions];
              actions[index] = { ...actions[index], status: 'pending' };
              return { ...prev, actions };
            });
            setCurrentActionIndex(-1);
            return;
          }
          setShowProfileWarning(false);

          const emailRecipient = action.details.recipient || data.client.email;
          if (!emailRecipient) throw new Error('Email address is required');

          let docId = savedDocumentIdRef.current;
          if (!docId) {
            const doc = await api.saveDocumentAPI(getTemplateData(), rawTranscription, 'sent');
            if (doc) {
              docId = doc.id;
              setSavedDocumentId(doc.id);
            }
          }
          if (docId) {
            const emailResult = await api.sendDocumentAPI(
              docId,
              data.documentType,
              'email',
              { email: emailRecipient }
            );
            if (!emailResult.success) {
              throw new Error(emailResult.error || 'Failed to send email');
            }
          }
          break;
        }

      }

      setData((prev) => {
        const actions = [...prev.actions];
        actions[index] = { ...actions[index], status: 'completed' };
        return { ...prev, actions };
      });

      const toastMessages: Record<string, string> = {
        create_document: 'Document created',
        send_email: 'Email sent',
      };
      if (toastMessages[action.type]) {
        toast.success(toastMessages[action.type]);
      }
      if (['create_document', 'send_email'].includes(action.type)) {
        savePricingMemory();
        trackUsedItems();
      }
    } catch (error) {
      console.error('Action failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Action failed';
      setData((prev) => {
        const actions = [...prev.actions];
        actions[index] = { ...actions[index], status: 'failed', error: errorMessage };
        return { ...prev, actions };
      });
      toast.error(errorMessage);
    }

    setCurrentActionIndex(-1);
  }

  async function executeAllActions() {
    if (!canExecute) return;
    setIsExecuting(true);

    // Normalize actions missing id/status (e.g. from resumed sessions)
    const normalized = sortedActions.map((a, i) => ({
      ...a,
      id: a.id || crypto.randomUUID(),
      status: a.status || ('pending' as const),
      order: a.order || i + 1,
      details: a.details || {},
    }));

    // Persist normalized actions to state
    setData((prev) => ({ ...prev, actions: normalized }));

    for (const action of normalized) {
      if (action.status === 'pending' || action.status === 'failed') {
        await executeAction(action);
      }
    }

    setIsExecuting(false);

    // savedDocumentIdRef tracks the ID synchronously
    const docId = savedDocumentIdRef.current;
    if (docId) {
      await reviewSession.completeReviewSession(docId, data.documentType);
    }
  }

  // --- Action helpers ------------------------------------------------------

  function showValidationErrors() {
    for (const error of validationErrors) {
      toast.error(error);
    }
  }

  function getActionDescription(action: ActionStep): string {
    switch (action.type) {
      case 'create_document': {
        const key =
          data.documentType === 'estimate' ? 'review.estimateFor' : 'review.invoiceFor';
        return t(key).replace('{amount}', formatCurrency(calculatedTotal));
      }
      case 'send_email': {
        const email = action.details.recipient || data.client.email;
        return email || t('review.tapEditEmail');
      }
      default:
        return '';
    }
  }

  function retryAction(action: ActionStep) {
    const index = data.actions.findIndex((a) => a.id === action.id);
    if (index === -1) return;

    const needsEmail =
      action.type === 'send_email' && !action.details.recipient && !data.client.email;
    if (needsEmail) return;

    setData((prev) => {
      const actions = [...prev.actions];
      actions[index] = { ...actions[index], status: 'pending', error: undefined };
      return { ...prev, actions };
    });

    const retryActionStep = { ...data.actions[index], status: 'pending' as const, error: undefined };
    executeAction(retryActionStep);
  }

  function addAction(type: ActionStep['type']) {
    const newAction: ActionStep = {
      id: crypto.randomUUID(),
      type,
      order: data.actions.length + 1,
      status: 'pending',
      details: {
        recipient: type === 'send_email' ? data.client.email || '' : '',
        message: '',
      },
    };
    setData((prev) => ({ ...prev, actions: [...prev.actions, newAction] }));
    setShowActionTypePicker(false);
  }

  function addItem() {
    setData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `item-${Date.now()}`,
          description: '',
          quantity: 1,
          unit: 'unit',
          rate: 0,
          total: 0,
        },
      ],
    }));
  }

  function addItemFromPriceBook(priceItem: PriceSearchResult) {
    const unitMap: Record<string, LineItem['measurementType']> = {
      sqft: 'sqft',
      ft: 'linear_ft',
      unit: 'unit',
      hr: 'hour',
      hour: 'hour',
      job: 'service',
      service: 'service',
    };
    const newItem: LineItem = {
      id: `item-${Date.now()}-${data.items.length}`,
      description: priceItem.name,
      quantity: 1,
      unit: priceItem.unit,
      rate: priceItem.unit_price,
      total: priceItem.unit_price,
      measurementType: unitMap[priceItem.unit.toLowerCase()] || 'unit',
    };
    setData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  }

  function removeItem(id: string) {
    setData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  }

  function updateItemTotal(item: LineItem) {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === item.id ? { ...i, total: i.quantity * i.rate } : i
      ),
    }));
  }

  function updateDimensionsQuantity(item: LineItem) {
    if (item.dimensions?.width && item.dimensions?.length) {
      setData((prev) => ({
        ...prev,
        items: prev.items.map((i) => {
          if (i.id !== item.id) return i;
          const quantity = (i.dimensions?.width || 0) * (i.dimensions?.length || 0);
          return { ...i, quantity, total: quantity * i.rate };
        }),
      }));
    }
  }

  function updateActionRecipient(action: ActionStep, value: string) {
    setData((prev) => ({
      ...prev,
      actions: prev.actions.map((a) =>
        a.id === action.id
          ? { ...a, details: { ...a.details, recipient: value } }
          : a
      ),
    }));
  }

  function updateActionFrequency(action: ActionStep, frequency: string) {
    setData((prev) => ({
      ...prev,
      actions: prev.actions.map((a) =>
        a.id === action.id
          ? { ...a, details: { ...a.details, frequency } }
          : a
      ),
    }));
  }

  function actionHasEditableData(_action: ActionStep): boolean {
    return true;
  }

  function saveSendStateAndNavigate(url: string) {
    if (intentType === 'document_send' && send.sendDocument) {
      const sendState = {
        intentType,
        sendData: send.sendData,
        sendDocument: send.sendDocument,
        sendClientInfo: send.sendClientInfo,
        editableSendEmail: send.editableSendEmail,
        editableSendPhone: send.editableSendPhone,
      };
      sessionStorage.setItem('review_send_state', JSON.stringify(sendState));
    }
    navigateTo(url);
  }

  // --- AI Parse ------------------------------------------------------------

  async function parseWithAI(transcription: string) {
    setIsParsing(true);
    setParsingStep(0);
    setParseError(null);
    setRawTranscription(transcription);

    setTimeout(() => setParsingStep(1), 500);
    setTimeout(() => setParsingStep(2), 1200);

    try {
      const { parseWithAI } = await import('@/lib/api/external');
      const result = await parseWithAI(transcription);

      if (result.success) {
        const saveSession = () => reviewSession.saveReviewSession(getSessionData);
        const intent = result.intentType || 'document_action';

        if (intent === 'information_query') {
          setIsParsing(false);
          const res = await handleInformationQuery(result, {
            setQueryData: (d) => setQueryData(d),
            executeQuery,
          });
          setIntentType(res.intentType);
        } else if (intent === 'document_clone') {
          setIsParsing(false);
          // Bridge the intent handler's direct property assignments to state setters
          const cloneProxy = {
            get cloneData() { return clone.cloneData; },
            set cloneData(val: any) { clone.setCloneData(val); },
            searchSourceDocuments: clone.searchSourceDocuments,
          };
          const res = await handleDocumentClone(result, { clone: cloneProxy, saveSession });
          setIntentType(res.intentType);
          if (res.parseError) setParseError(res.parseError);
        } else if (intent === 'document_merge') {
          setIsParsing(false);
          // Bridge merge handler
          const mergeProxy = {
            get mergeData() { return merge.mergeData; },
            set mergeData(val: any) { merge.setMergeData(val); },
            get mergeSourceSelections() { return merge.mergeSourceSelections; },
            set mergeSourceSelections(val: any) { merge.setMergeSourceSelections(val); },
            get showMergeSelection() { return merge.showMergeSelection; },
            set showMergeSelection(val: boolean) { merge.setShowMergeSelection(val); },
            searchMergeSourceDocuments: merge.searchMergeSourceDocuments,
          };
          const res = await handleDocumentMerge(result, { merge: mergeProxy, saveSession });
          setIntentType(res.intentType);
        } else if (intent === 'document_send') {
          setIsParsing(false);
          // Bridge send handler
          const sendProxy = {
            get sendData() { return send.sendData; },
            set sendData(val: any) { send.setSendData(val); },
            get sendDocument() { return send.sendDocument; },
            set sendDocument(val: any) { send.setSendDocument(val); },
            get sendClientInfo() { return send.sendClientInfo; },
            set sendClientInfo(val: any) { send.setSendClientInfo(val); },
            get sendError() { return send.sendError; },
            set sendError(val: any) { send.setSendError(val); },
            get sendSuccess() { return send.sendSuccess; },
            set sendSuccess(val: boolean) { send.setSendSuccess(val); },
            findDocumentToSend: send.findDocumentToSend,
          };
          const res = await handleDocumentSend(result, { send: sendProxy });
          setIntentType(res.intentType);
        } else if (intent === 'document_transform') {
          setIsParsing(false);
          // Bridge transform handler
          const transformProxy = {
            get transformData() { return transform.transformData; },
            set transformData(val: any) { transform.setTransformData(val); },
            get transformSourceDoc() { return transform.transformSourceDoc; },
            set transformSourceDoc(val: any) { transform.setTransformSourceDoc(val); },
            get transformError() { return transform.transformError; },
            set transformError(val: any) { transform.setTransformError(val); },
            get transformSuccess() { return transform.transformSuccess; },
            set transformSuccess(val: boolean) { transform.setTransformSuccess(val); },
            get transformResult() { return transform.transformResult; },
            set transformResult(val: any) { transform.setTransformResult(val); },
            findTransformSourceDocument: transform.findTransformSourceDocument,
          };
          const res = await handleDocumentTransform(result, { transform: transformProxy, saveSession });
          setIntentType(res.intentType);
        } else {
          const res = handleDocumentAction(result, data);
          setData(res.data);
          setIntentType(res.intentType);
          setIsParsing(false);
          generateDocNumber(res.data.documentType);
          if (res.data.client.name) {
            await fetchClientSuggestions(res.data.client.name);
          }
          fetchItemSuggestionsData();
          fetchPricingSuggestions();
          saveSession();
          if (res.data.confidence?.overall < 0.7) {
            reviewSession.fetchRecentDocuments();
          }
        }
      } else {
        const res = handleParseError(result, data);
        setData(res.data);
        setParseError(res.parseError);
        setIntentType(res.intentType);
        setIsParsing(false);
        generateDocNumber();
      }
    } catch (error) {
      console.error('AI parsing error:', error);
      setParseError('Failed to connect to AI service');
      setIntentType('document_action');
      setData((prev) => ({
        ...prev,
        actions: [
          {
            id: 'fallback-create',
            type: 'create_document',
            order: 1,
            status: 'pending',
            details: {},
          },
        ],
      }));
      setIsParsing(false);
      generateDocNumber();
    }
  }

  // --- onMount equivalent --------------------------------------------------

  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    async function init() {
      fetchUserProfile();

      // Check if returning from document view (document_send flow)
      const savedSendState = sessionStorage.getItem('review_send_state');
      if (savedSendState) {
        try {
          const state = JSON.parse(savedSendState);
          setIntentType(state.intentType || 'document_send');
          send.setSendData(state.sendData);
          send.setSendDocument(state.sendDocument);
          send.setSendClientInfo(state.sendClientInfo);
          send.setEditableSendEmail(state.editableSendEmail || '');
          send.setEditableSendPhone(state.editableSendPhone || '');
          setIsParsing(false);
          sessionStorage.removeItem('review_send_state');
          return;
        } catch (e) {
          console.error('Error restoring send state:', e);
          sessionStorage.removeItem('review_send_state');
        }
      }

      if (entryMode === 'resume' && reviewSessionProp) {
        const review = reviewSessionProp;
        reviewSession.setReviewSessionId(review.id);
        setRawTranscription(review.original_transcript || '');
        setIntentType(review.intent_type || 'document_action');

        if (review.parsed_data) {
          if ((review.intent_type || 'document_action') === 'document_action') {
            setData(review.parsed_data);
            generateDocNumber();
          } else if (review.intent_type === 'information_query') {
            setQueryData(review.parsed_data);
            if (review.query_result) {
              setQueryResult(review.query_result);
            }
          } else if (review.intent_type === 'document_clone') {
            clone.setCloneData(review.parsed_data);
            if (review.parsed_data?.sourceClient) {
              await clone.searchSourceDocuments(
                review.parsed_data.sourceClient,
                review.parsed_data.documentType || undefined
              );
            }
          }
        }

        if (review.actions) {
          setData((prev) => ({ ...prev, actions: review.actions }));
        }

        setIsParsing(false);
      } else if (entryMode === 'legacy_resume') {
        const storedReview = sessionStorage.getItem('resume_review');

        if (storedReview) {
          try {
            const review = JSON.parse(storedReview);
            reviewSession.setReviewSessionId(review.id);
            setRawTranscription(review.original_transcript || '');
            setIntentType(review.intent_type || 'document_action');

            if (review.parsed_data) {
              if ((review.intent_type || 'document_action') === 'document_action') {
                setData(review.parsed_data);
                generateDocNumber();
              } else if (review.intent_type === 'information_query') {
                setQueryData(review.parsed_data);
                if (review.query_result) {
                  setQueryResult(review.query_result);
                }
              } else if (review.intent_type === 'document_clone') {
                clone.setCloneData(review.parsed_data);
                if (review.parsed_data?.sourceClient) {
                  await clone.searchSourceDocuments(
                    review.parsed_data.sourceClient,
                    review.parsed_data.documentType || undefined
                  );
                }
              }
            }

            if (review.actions) {
              setData((prev) => ({ ...prev, actions: review.actions }));
            }

            setIsParsing(false);
            sessionStorage.removeItem('resume_review');
          } catch (e) {
            console.error('Error resuming review:', e);
            setIsParsing(false);
            setParseError('Failed to resume review.');
          }
        } else {
          setIsParsing(false);
          setParseError('Session expired. Please try again.');
        }
      } else if (entryMode === 'new' && transcript) {
        await parseWithAI(decodeURIComponent(transcript));
      } else if (entryMode === 'sessionStorage' || !entryMode) {
        const savedTranscript = sessionStorage.getItem('review_transcript');
        if (savedTranscript) {
          sessionStorage.removeItem('review_transcript');
          await parseWithAI(savedTranscript);
        } else {
          goToDashboard();
          return;
        }
      }

      fetchItemSuggestionsData();
    }

    init();
  }, []);

  // --- Action config -------------------------------------------------------

  const actionConfig: Record<string, { icon: any; labelKey: string; color: string }> = {
    create_document: { icon: FileText, labelKey: 'review.createDocument', color: '#0ea5e9' },
    send_email: { icon: Mail, labelKey: 'review.sendEmailAction', color: '#8b5cf6' },
  };

  // --- Render --------------------------------------------------------------

  return (
    <>
      <main class="review-page">
        {/* Header */}
        <ReviewHeader onBack={goToDashboard} />

        {isParsing ? (
          /* Parsing State */
          <ReviewLoadingState currentStep={parsingStep} />
        ) : intentType === 'information_query' ? (
          /* Information Query Results */
          <QueryResultsFlow
            queryData={queryData}
            queryResult={queryResult}
            isLoading={isQueryLoading}
            onSelectClient={useSuggestedClient}
          />
        ) : intentType === 'document_clone' && !clone.selectedSourceDoc ? (
          /* Document Clone - Select Source */
          <CloneDocumentFlow
            cloneData={clone.cloneData}
            sourceDocuments={clone.sourceDocuments}
            isSearching={clone.isSearchingDocs}
            clientSuggestions={clone.cloneClientSuggestions}
            onSelectDocument={selectSourceDocumentForClone}
            onSelectClient={clone.useCloneSuggestedClient}
          />
        ) : intentType === 'document_merge' && merge.showMergeSelection ? (
          /* Document Merge - Select Sources */
          <MergeDocumentsFlow
            mergeData={merge.mergeData}
            mergeSourceSelections={merge.mergeSourceSelections}
            onSelectDocument={merge.selectMergeSourceDocument}
            onConfirmMerge={confirmMergeSelections}
          />
        ) : intentType === 'document_send' ? (
          /* Document Send Flow */
          <SendDocumentFlow
            sendData={send.sendData}
            sendDocument={send.sendDocument}
            sendClientInfo={send.sendClientInfo}
            isSendingDocument={send.isSendingDocument}
            sendError={send.sendError}
            sendSuccess={send.sendSuccess}
            onExecuteSend={send.executeSendDocument}
            onLoadDocumentForEditing={send.loadSendDocumentForEditing}
            onSaveDocumentChanges={send.saveSendDocumentChanges}
          />
        ) : intentType === 'document_transform' ? (
          /* Document Transform Flow */
          <div class="content">
            {transform.transformSuccess && transform.transformResult ? (
              /* Transform Success State */
              <DoneState
                title="Transform Complete!"
                message={`${transform.transformResult.documentsCreated} document${
                  transform.transformResult.documentsCreated !== 1 ? 's' : ''
                } created successfully`}
                onViewDocuments={() => { navigateTo('/dashboard/documents'); }}
                onNewRecording={goToDashboard}
              />
            ) : transform.isSearchingTransformSource || isParsing ? (
              /* Loading State */
              <ReviewLoadingState
                message={isParsing ? undefined : 'Finding source document...'}
                currentStep={isParsing ? parsingStep : 0}
              />
            ) : transform.transformError && !transform.transformSourceDoc ? (
              /* Error Finding Source - With Suggestions */
              <>
                <AlertCard
                  variant="warning"
                  title="Client not found"
                  message={`${transform.transformSearchedClient || 'Unknown'} - select a client below`}
                />

                <TransformClientSelector
                  suggestions={transform.transformClientSuggestions}
                  bestMatch={
                    transform.transformClientSuggestions.length > 0 &&
                    transform.transformClientSuggestions[0].similarity >= 0.5
                      ? transform.transformClientSuggestions[0]
                      : null
                  }
                  searchedDocType={transform.transformSearchedDocType}
                  manualSearchQuery={transform.manualClientSearchQuery}
                  onManualSearchQueryChange={transform.setManualClientSearchQuery}
                  manualSearchResults={transform.manualClientSearchResults}
                  isSearching={transform.isSearchingManualClient}
                  onSelectClient={transform.retryTransformWithClient}
                  onSearch={transform.handleManualClientSearch}
                  onBack={goToDashboard}
                />
              </>
            ) : transform.transformSourceDoc ? (
              /* Transform Review Component */
              <TransformReview
                sourceDocument={{
                  id: transform.transformSourceDoc.id,
                  type: transform.transformSourceDoc.type,
                  number: transform.transformSourceDoc.number,
                  total: transform.transformSourceDoc.total,
                  clientId: transform.transformSourceDoc.clientId || '',
                  clientName: transform.transformSourceDoc.clientName,
                  clientEmail: transform.transformSourceDoc.clientEmail || '',
                  items: transform.transformSourceDoc.items,
                  createdAt: transform.transformSourceDoc.createdAt || new Date(),
                }}
                initialConversion={{
                  enabled: transform.transformData?.conversion?.enabled || false,
                  targetType:
                    transform.transformData?.conversion?.targetType ||
                    (transform.transformSourceDoc.type === 'estimate' ? 'invoice' : 'estimate'),
                }}
                initialSplit={{
                  enabled: transform.transformData?.split?.enabled || false,
                  numberOfParts: transform.transformData?.split?.numberOfParts || 2,
                  method: transform.transformData?.split?.splitMethod || 'equal',
                }}
                initialSchedule={{
                  enabled: transform.transformData?.schedule?.enabled || false,
                  frequency: transform.transformData?.schedule?.frequency || null,
                  startDate: transform.transformData?.schedule?.startDate
                    ? new Date(transform.transformData.schedule.startDate)
                    : null,
                  sendFirst: transform.transformData?.schedule?.sendFirst ?? true,
                }}
                onExecute={(config) => transform.handleExecuteTransform({
                  conversion: config.conversion,
                  split: {
                    enabled: false,
                    numberOfParts: 2,
                    method: 'equal',
                    amounts: [],
                    labels: [],
                  },
                  schedule: {
                    enabled: false,
                    frequency: null,
                    startDate: null,
                    sendFirst: true,
                  },
                })}
                onBack={goToDashboard}
                isExecuting={transform.isExecutingTransform}
                error={transform.transformError}
              />
            ) : (
              /* Fallback */
              <div class="send-error-state">
                <AlertCircle size={32} />
                <h3>{t('review.somethingWentWrong')}</h3>
                <p>{t('review.unableToLoad')}</p>
                <button class="btn primary" onClick={goToDashboard}>
                  {t('common.back')}
                </button>
              </div>
            )}
          </div>
        ) : allActionsCompleted ? (
          /* All Done State */
          <DoneState
            documentId={savedDocumentId}
            documentType={data.documentType}
            onDownload={handleDownloadPDF}
            onNewRecording={goToDashboard}
          />
        ) : (
          /* Main Content */
          <>
            <div class="content">
              {/* AI Summary Card */}
              <SummaryCard summary={data.summary || 'Processing your request...'} />

              {/* Document Preview Card */}
              <ReviewPreviewCard
                data={data}
                onDataChange={(d) => setData(d as ParsedData)}
                documentNumber={documentNumber}
                calculatedTotal={calculatedTotal}
                exactClientMatch={exactClientMatch}
                clientSuggestions={clientSuggestions}
                showClientSuggestions={showClientSuggestions}
                onShowClientSuggestionsChange={setShowClientSuggestions}
                clientFullName={clientFullName}
                formatCurrency={formatCurrency}
                onSearchClients={searchClients}
                onSelectClientFromDropdown={selectClientFromDropdown}
                onApplyClientSuggestion={applyClientSuggestion}
                onParseClientName={parseClientName}
                onDocNumberChange={setGeneratedDocNumber}
                onSaveClientInfo={api.saveClientInfo}
              />

              {/* Line Items Section */}
              <ReviewLineItems
                items={data.items}
                onItemsChange={(items) => setData((prev) => ({ ...prev, items }))}
                taxRate={data.taxRate}
                onTaxRateChange={(taxRate) => setData((prev) => ({ ...prev, taxRate }))}
                calculatedSubtotal={calculatedSubtotal}
                calculatedTaxAmount={calculatedTaxAmount}
                calculatedTotal={calculatedTotal}
                formatCurrency={formatCurrency}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                onUpdateItemTotal={updateItemTotal}
                onUpdateDimensionsQuantity={updateDimensionsQuantity}
                onApplySuggestedPrice={applySuggestedPrice}
                onDismissPricingSuggestion={dismissPricingSuggestion}
                onAddItemFromPriceBook={addItemFromPriceBook}
                onSearchPriceItems={searchPriceItems}
              />

              {/* Action Steps */}
              <ReviewActions
                data={data}
                onDataChange={(d) => setData(d as ParsedData)}
                actions={data.actions}
                onActionsChange={(actions) => setData((prev) => ({ ...prev, actions }))}
                actionConfig={actionConfig}
                isExecuting={isExecuting}
                hasValidationErrors={hasValidationErrors}
                calculatedTotal={calculatedTotal}
                formatCurrency={formatCurrency}
                showProfileWarning={showProfileWarning}
                onShowProfileWarningChange={setShowProfileWarning}
                profileMissingFields={profileMissingFields}
                copyLinkStatus={api.copyLinkStatus}
                sortedActions={sortedActions}
                reviewSessionId={reviewSession.reviewSessionId}
                onSaveSession={() => reviewSession.saveReviewSession(getSessionData)}
                onExecuteAction={executeAction}
                onRetryAction={retryAction}
                onAddAction={addAction}
                onHandleDownloadPDF={handleDownloadPDF}
                onSaveDocument={async (actionId: string) => {
                  try {
                    const doc = await api.saveDocumentAPI(
                      getTemplateData(),
                      rawTranscription,
                      'draft'
                    );
                    if (doc) {
                      setSavedDocumentId(doc.id);
                      setData((prev) => ({
                        ...prev,
                        actions: prev.actions.map((a) =>
                          a.id === actionId ? { ...a, status: 'completed' as const } : a
                        ),
                      }));
                      await reviewSession.completeReviewSession(doc.id, data.documentType);
                    }
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Failed to save document');
                  }
                }}
                onOpenViewLinkModal={() =>
                  api.openViewLinkModal(
                    savedDocumentId,
                    getTemplateData,
                    rawTranscription,
                    data.documentType,
                    (id) => setSavedDocumentId(id)
                  )
                }
                onGetActionDescription={getActionDescription}
                onActionHasEditableData={actionHasEditableData}
                onUpdateActionRecipient={updateActionRecipient}
                onUpdateActionFrequency={updateActionFrequency}
                onDismissProfileWarning={() => setProfileWarningDismissed(true)}
              />
            </div>

            {/* Execute Button */}
            <ReviewExecuteButton
              isExecuting={isExecuting}
              canExecute={canExecute}
              onExecute={executeAllActions}
              onLockedClick={showValidationErrors}
              documentType={data.documentType}
              total={calculatedTotal > 0 ? formatCurrency(calculatedTotal) : undefined}
              actionCount={data.actions.length}
            />
          </>
        )}
      </main>

      {/* Share Link Modal */}
      <ShareLinkModal
        open={api.showViewLinkModal}
        linkUrl={api.viewLinkUrl}
        documentType={data.documentType}
        onClose={() => api.setShowViewLinkModal(false)}
      />

      {/* Contact Merge Modal */}
      <ContactMergeModal
        open={api.showMergeModal}
        conflictData={api.mergeConflictData}
        onClose={() => {
          api.setShowMergeModal(false);
          api.setMergeConflictData(null);
          api.setPendingSaveData(null);
        }}
        onDecision={api.handleMergeDecision}
      />

      <style>{`
        .review-page {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          padding-bottom: env(safe-area-inset-bottom, 0);
          background: transparent;
        }

        .content {
          flex: 1;
          padding: var(--page-padding-x);
          padding-bottom: calc(100px + env(safe-area-inset-bottom, 0));
          max-width: var(--page-max-width);
          margin: 0 auto;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: var(--section-gap);
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 24px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
        }

        .btn.primary {
          background: linear-gradient(135deg, #0066ff 0%, #0ea5e9 100%);
          color: white;
          box-shadow: 0 4px 20px rgba(0, 102, 255, 0.3);
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .hint-icon {
          color: var(--gray-300);
        }

        .send-error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-4);
          padding: var(--space-8) var(--space-4);
          text-align: center;
          color: var(--gray-500);
        }

        .send-error-state h3 {
          margin: 0;
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--gray-900);
        }

        .send-error-state p {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--gray-500);
        }

        .send-error-state svg {
          color: var(--data-amber);
        }
      `}</style>
    </>
  );
}


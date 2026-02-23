import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores/toastStore';
import { parseWithAI } from '@/lib/api/external';
import { executeInfoQuery } from '@/lib/api/infoQuery';
import { suggestClients } from '@/lib/api/clients';
import { fetchItemSuggestions } from '@/lib/api/suggestions';
import { fetchProfile } from '@/lib/api/user';
import { useReviewSession } from './useReviewSession';
import { useReviewAPI } from './useReviewAPI';
import { useReviewClone } from './useReviewClone';
import { useReviewMerge } from './useReviewMerge';
import { useReviewSend } from './useReviewSend';
import { useReviewTransform } from './useReviewTransform';
import {
  handleDocumentAction,
  handleDocumentClone,
  handleParseError,
} from './review-intent-handlers';
import type {
  ParsedData,
  QueryData,
  QueryResult,
  IntentType,
  ItemSuggestion,
  ClientSuggestionFull,
  UserProfile,
} from '@/lib/review/review-types';

const EMPTY_DATA: ParsedData = {
  documentType: 'invoice',
  client: { name: null, firstName: null, lastName: null, email: null, phone: null, address: null },
  items: [],
  total: 0,
  taxRate: null,
  dueDate: null,
  actions: [],
  summary: '',
  confidence: { overall: 0, client: 0, items: 0, actions: 0 },
};

interface OrchestratorParams {
  rawData?: string;
  rawTranscript?: string;
}

export function useReviewOrchestrator({ rawData, rawTranscript }: OrchestratorParams) {
  const toast = useToastStore();
  const queryClient = useQueryClient();

  const [isParsing, setIsParsing] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [intentType, setIntentType] = useState<IntentType | null>(null);
  const [data, setData] = useState<ParsedData>(EMPTY_DATA);
  const [parseError, setParseError] = useState<string | null>(null);
  const [queryData, setQueryData] = useState<QueryData | null>(null);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const [itemSuggestions, setItemSuggestions] = useState<ItemSuggestion[]>([]);
  const [clientSuggestions, setClientSuggestions] = useState<ClientSuggestionFull[]>([]);
  const [isSearchingClients, setIsSearchingClients] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [savedDocumentId, setSavedDocumentId] = useState<string | null>(null);
  const [allActionsComplete, setAllActionsComplete] = useState(false);

  const hasInitialized = useRef(false);
  const clientSearchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const session = useReviewSession();
  const api = useReviewAPI();
  const clone = useReviewClone();
  const merge = useReviewMerge();
  const send = useReviewSend({
    sendDocumentAPI: api.sendDocumentAPI,
    updateClientContactInfo: api.updateClientContactInfo,
  });
  const transform = useReviewTransform();

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    loadProfile();
    loadItemSuggestions();

    if (rawData) {
      processPreParsedData(rawData);
    } else if (rawTranscript) {
      parseTranscript(rawTranscript);
    } else {
      setIsParsing(false);
      setParseError('No data to review');
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const result = await fetchProfile();
      setUserProfile(result.profile as unknown as UserProfile);
    } catch { /* non-critical */ }
  }, []);

  const loadItemSuggestions = useCallback(async () => {
    try {
      setItemSuggestions(await fetchItemSuggestions());
    } catch { /* non-critical */ }
  }, []);

  const processPreParsedData = useCallback((rawJson: string) => {
    try {
      const parsed = JSON.parse(rawJson);
      routeIntent({ success: true, intentType: parsed.intentType, data: parsed });
    } catch {
      setIsParsing(false);
      setParseError('Failed to process data');
    }
  }, []);

  const parseTranscript = useCallback(async (transcript: string) => {
    setIsParsing(true);
    try {
      routeIntent(await parseWithAI(transcript));
    } catch {
      setIsParsing(false);
      setParseError('Failed to parse voice input. Please try again.');
      toast.error('Parse failed');
    }
  }, []);

  const routeIntent = useCallback(async (result: any) => {
    const intent = result.intentType || result.data?.intentType || 'document_action';
    try {
      if (intent === 'information_query') {
        setQueryData(result.data);
        setIntentType('information_query');
        setIsQueryLoading(true);
        try {
          setQueryResult(await executeInfoQuery(result.data.query));
        } finally {
          setIsQueryLoading(false);
        }
      } else if (intent === 'document_clone') {
        clone.setCloneData(result.data);
        const r = await handleDocumentClone(result, {
          clone: { cloneData: result.data, searchSourceDocuments: clone.searchSourceDocuments },
          saveSession: () => session.saveReviewSession(() => ({ intentType: intent, data: result.data })),
        });
        setIntentType(r.intentType);
        if (r.parseError) setParseError(r.parseError);
      } else if (intent === 'document_merge') {
        merge.setMergeData(result.data);
        if (result.data?.sourceClients?.length > 0) {
          merge.setMergeSourceSelections(
            result.data.sourceClients.map((c: string) => ({ clientName: c, documents: [], selectedDoc: null, isSearching: true }))
          );
          merge.setShowMergeSelection(true);
          await Promise.all(
            result.data.sourceClients.map((c: string, i: number) =>
              merge.searchMergeSourceDocuments(c, i, result.data?.documentType)
            )
          );
        }
        setIntentType('document_merge');
      } else if (intent === 'document_send') {
        send.setSendData(result.data);
        send.setSendDocument(null);
        send.setSendClientInfo(null);
        send.setSendError(null);
        send.setSendSuccess(false);
        if (result.data?.clientName) await send.findDocumentToSend();
        setIntentType('document_send');
      } else if (intent === 'document_transform') {
        transform.setTransformData(result.data);
        if (result.data?.source?.clientName) await transform.findTransformSourceDocument();
        setIntentType('document_transform');
      } else {
        const r = handleDocumentAction(result, data);
        setData(r.data);
        setIntentType(r.intentType);
        session.saveReviewSession(() => ({ intentType: r.intentType, data: r.data }));
      }
    } catch {
      const r = handleParseError(result, data);
      setData(r.data);
      setParseError(r.parseError);
      setIntentType(r.intentType);
    } finally {
      setIsParsing(false);
    }
  }, [data, clone, merge, send, transform, session]);

  const handleUpdateData = useCallback((updates: Partial<ParsedData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleSearchClients = useCallback((query: string) => {
    clearTimeout(clientSearchTimeout.current);
    if (!query.trim()) { setClientSuggestions([]); return; }
    clientSearchTimeout.current = setTimeout(async () => {
      setIsSearchingClients(true);
      try {
        const r = await suggestClients(query, 5);
        setClientSuggestions(r.suggestions.map((s) => ({
          id: s.id, name: s.name, email: s.email || null,
          phone: s.phone || null, address: s.address || null, similarity: s.similarity ?? 0,
        })));
      } finally { setIsSearchingClients(false); }
    }, 300);
  }, []);

  const handleSelectClient = useCallback((client: ClientSuggestionFull) => {
    setData((prev) => ({
      ...prev,
      client: { ...prev.client, name: client.name, email: client.email, phone: client.phone, address: client.address },
    }));
    setClientSuggestions([]);
  }, []);

  const buildTemplateData = useCallback(() => {
    const subtotal = data.items.reduce((s, i) => s + (i.total || 0), 0);
    const taxRate = data.taxRate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    return {
      documentType: data.documentType,
      documentNumber: (data as Record<string, unknown>).documentNumber,
      billTo: { name: data.client?.name || '', email: data.client?.email || '', phone: data.client?.phone || '', address: data.client?.address || '' },
      items: data.items.map((i) => ({
        description: i.description, quantity: i.quantity || 1, unit: i.unit || 'unit',
        rate: i.rate || 0, total: i.total || 0, measurementType: i.measurementType, dimensions: i.dimensions,
      })),
      subtotal, gstRate: taxRate / 100, gstAmount: taxAmount, total: subtotal + taxAmount,
      dueDate: data.dueDate, notes: (data as Record<string, unknown>).notes,
    };
  }, [data]);

  const updateActionStatus = useCallback((actionId: string, status: string, error?: string) => {
    setData((prev) => ({
      ...prev,
      actions: prev.actions.map((a) => a.id === actionId ? { ...a, status: status as any, error } : a),
    }));
  }, []);

  const executeAllActions = useCallback(async () => {
    setIsExecuting(true);
    let currentDocId = savedDocumentId;
    try {
      for (const action of data.actions) {
        updateActionStatus(action.id, 'in_progress');
        if (action.type === 'create_document') {
          const result = await api.saveDocumentAPI(buildTemplateData(), rawTranscript);
          if (result) {
            currentDocId = result.id;
            setSavedDocumentId(result.id);
            updateActionStatus(action.id, 'completed');
            await session.completeReviewSession(result.id, data.documentType);
          } else {
            updateActionStatus(action.id, 'failed', 'Save failed');
            break;
          }
        } else if (action.type === 'send_email') {
          if (!currentDocId) { updateActionStatus(action.id, 'failed', 'No document to send'); continue; }
          const recipient = action.details?.recipient || data.client?.email || '';
          const result = await api.sendDocumentAPI(currentDocId, data.documentType, 'email', { email: recipient });
          updateActionStatus(action.id, result.success ? 'completed' : 'failed', result.error);
        }
      }
      setAllActionsComplete(true);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document created successfully');
    } catch { toast.error('Execution failed'); }
    finally { setIsExecuting(false); }
  }, [data, savedDocumentId, api, session, buildTemplateData, queryClient, rawTranscript, updateActionStatus]);

  const handleCloneConfirm = useCallback(() => {
    if (!clone.selectedSourceDoc || !clone.cloneData) return;
    const result = clone.applyCloneModifications(clone.selectedSourceDoc, clone.cloneData);
    setData({
      ...EMPTY_DATA,
      documentType: (clone.selectedSourceDoc.type as 'invoice' | 'estimate') || 'invoice',
      client: {
        name: clone.cloneData.targetClient?.name || null, firstName: null, lastName: null,
        email: clone.cloneData.targetClient?.email || null, phone: clone.cloneData.targetClient?.phone || null,
        address: clone.cloneData.targetClient?.address || null,
      },
      items: result.items, total: result.total, summary: clone.cloneData.summary,
      actions: clone.cloneData.actions || [{ id: 'create', type: 'create_document', order: 1, status: 'pending', details: {} }],
      confidence: { overall: 0.9, client: 0.9, items: 0.9, actions: 0.9 },
    });
    setIntentType('document_action');
  }, [clone]);

  const handleMergeConfirm = useCallback(() => {
    if (!merge.mergeData) return;
    const result = merge.getCombinedMergeItems(merge.mergeSourceSelections);
    setData({
      ...EMPTY_DATA,
      documentType: (merge.mergeData.documentType as 'invoice' | 'estimate') || 'invoice',
      client: {
        name: merge.mergeData.targetClient?.name || null, firstName: null, lastName: null,
        email: merge.mergeData.targetClient?.email || null, phone: merge.mergeData.targetClient?.phone || null,
        address: merge.mergeData.targetClient?.address || null,
      },
      items: result.items, total: result.subtotal, summary: merge.mergeData.summary,
      actions: merge.mergeData.actions || [{ id: 'create', type: 'create_document', order: 1, status: 'pending', details: {} }],
      confidence: { overall: 0.9, client: 0.9, items: 0.9, actions: 0.9 },
    });
    setIntentType('document_action');
  }, [merge]);

  return {
    isParsing, isExecuting, intentType, data, parseError,
    queryData, queryResult, isQueryLoading,
    itemSuggestions, clientSuggestions, isSearchingClients,
    userProfile, savedDocumentId, allActionsComplete,
    session, api, clone, merge, send, transform,
    handleUpdateData, handleSearchClients, handleSelectClient,
    executeAllActions, handleCloneConfirm, handleMergeConfirm,
  };
}

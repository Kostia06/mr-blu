import { TAX_RATE_DECIMAL_THRESHOLD } from '@/lib/constants';
import type { ParsedData, QueryData, IntentType } from './review-types';

interface ParseResponse {
  success: boolean;
  intentType?: string;
  data: any;
  error?: string;
}

export interface IntentResult {
  intentType: IntentType;
  parseError: string | null;
}

export async function handleInformationQuery(
  result: ParseResponse,
  deps: {
    setQueryData: (data: QueryData) => void;
    executeQuery: () => Promise<void>;
  }
): Promise<IntentResult> {
  deps.setQueryData(result.data);
  await deps.executeQuery();
  return { intentType: 'information_query', parseError: null };
}

export async function handleDocumentClone(
  result: ParseResponse,
  deps: {
    clone: {
      cloneData: any;
      searchSourceDocuments: (client: string, docType?: string) => Promise<string | null>;
    };
    saveSession: () => void;
  }
): Promise<IntentResult> {
  deps.clone.cloneData = result.data;
  let parseError: string | null = null;

  if (deps.clone.cloneData?.sourceClient) {
    const err = await deps.clone.searchSourceDocuments(
      deps.clone.cloneData.sourceClient,
      deps.clone.cloneData.documentType || undefined
    );
    if (err) parseError = err;
  }

  deps.saveSession();
  return { intentType: 'document_clone', parseError };
}

export async function handleDocumentMerge(
  result: ParseResponse,
  deps: {
    merge: {
      mergeData: any;
      mergeSourceSelections: any[];
      showMergeSelection: boolean;
      searchMergeSourceDocuments: (
        client: string,
        index: number,
        docType?: string
      ) => Promise<void>;
    };
    saveSession: () => void;
  }
): Promise<IntentResult> {
  deps.merge.mergeData = result.data;

  if (deps.merge.mergeData?.sourceClients && deps.merge.mergeData.sourceClients.length > 0) {
    deps.merge.mergeSourceSelections = deps.merge.mergeData.sourceClients.map(
      (clientName: string) => ({
        clientName,
        documents: [],
        selectedDoc: null,
        isSearching: true
      })
    );
    deps.merge.showMergeSelection = true;

    await Promise.all(
      deps.merge.mergeData.sourceClients.map((clientName: string, index: number) =>
        deps.merge.searchMergeSourceDocuments(
          clientName,
          index,
          deps.merge.mergeData?.documentType || undefined
        )
      )
    );
  }

  deps.saveSession();
  return { intentType: 'document_merge', parseError: null };
}

export async function handleDocumentSend(
  result: ParseResponse,
  deps: {
    send: {
      sendData: any;
      sendDocument: any;
      sendClientInfo: any;
      sendError: any;
      sendSuccess: boolean;
      findDocumentToSend: () => Promise<void>;
    };
  }
): Promise<IntentResult> {
  deps.send.sendData = result.data;
  deps.send.sendDocument = null;
  deps.send.sendClientInfo = null;
  deps.send.sendError = null;
  deps.send.sendSuccess = false;

  if (deps.send.sendData?.clientName) {
    await deps.send.findDocumentToSend();
  }

  return { intentType: 'document_send', parseError: null };
}

export async function handleDocumentTransform(
  result: ParseResponse,
  deps: {
    transform: {
      transformData: any;
      transformSourceDoc: any;
      transformError: any;
      transformSuccess: boolean;
      transformResult: any;
      findTransformSourceDocument: () => Promise<void>;
    };
    saveSession: () => void;
  }
): Promise<IntentResult> {
  deps.transform.transformData = result.data;
  deps.transform.transformSourceDoc = null;
  deps.transform.transformError = null;
  deps.transform.transformSuccess = false;
  deps.transform.transformResult = null;

  if (deps.transform.transformData?.source?.clientName) {
    await deps.transform.findTransformSourceDocument();
  }

  deps.saveSession();
  return { intentType: 'document_transform', parseError: null };
}

export function handleDocumentAction(
  result: ParseResponse,
  data: ParsedData
): { data: ParsedData; intentType: IntentType } {
  const newData = result.data as ParsedData;
  if (newData.taxRate && newData.taxRate > 0 && newData.taxRate < TAX_RATE_DECIMAL_THRESHOLD) {
    newData.taxRate = newData.taxRate * 100;
  }
  if (newData.taxes && Array.isArray(newData.taxes)) {
    for (const tax of newData.taxes) {
      if (tax.rate && tax.rate > 0 && tax.rate < TAX_RATE_DECIMAL_THRESHOLD) {
        tax.rate = tax.rate * 100;
      }
    }
  }
  if (newData.items) {
    for (const item of newData.items) {
      if (!item.quantity || item.quantity <= 0) {
        item.quantity = 1;
      }
      if (!item.total && item.rate) {
        item.total = item.quantity * item.rate;
      }
      if (!item.measurementType) {
        if (item.dimensions?.width && item.dimensions?.length) {
          item.measurementType = 'sqft';
        } else if (item.unit) {
          const u = item.unit.toLowerCase();
          if (u === 'sqft' || u === 'sq ft' || u === 'sf') {
            item.measurementType = 'sqft';
          } else if (u === 'ft' || u === 'linear_ft' || u === 'lf') {
            item.measurementType = 'linear_ft';
          } else if (u === 'hr' || u === 'hour' || u === 'hours') {
            item.measurementType = 'hour';
          } else if (item.quantity === 1 && (u === 'unit' || u === 'job' || u === 'ea')) {
            item.measurementType = 'service';
          }
        } else if (item.quantity === 1) {
          item.measurementType = 'service';
        }
      }
    }
  }
  if (newData.actions) {
    newData.actions = newData.actions.map((action, i) => ({
      ...action,
      id: action.id || crypto.randomUUID(),
      status: action.status || 'pending',
      order: action.order || i + 1,
      details: action.details || {},
    }));
  }

  return { data: newData, intentType: 'document_action' };
}

export function handleParseError(
  result: ParseResponse,
  currentData: ParsedData
): { data: ParsedData; parseError: string; intentType: IntentType } {
  const parseError = result.error || 'Failed to parse';
  const data = result.data ? { ...currentData, ...result.data } : currentData;
  data.summary = result.data?.summary || parseError;

  if (!data.actions || data.actions.length === 0) {
    data.actions = [
      {
        id: 'fallback-create',
        type: 'create_document',
        order: 1,
        status: 'pending',
        details: {}
      }
    ];
  }

  return { data, parseError, intentType: 'document_action' };
}

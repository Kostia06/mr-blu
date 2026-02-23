// Transform flow state + logic

import { useState, useCallback, useRef } from 'preact/hooks';
import { suggestClients } from '@/lib/api/clients';
import {
  findSourceDocumentByClient,
  findSimilarClients,
  executeTransform as executeTransformService,
} from '@/lib/services/transform';
import type {
  TransformData,
  TransformSourceDocument,
  TransformClientSuggestion
} from '@/lib/review/review-types';

export function useReviewTransform() {
  const [transformData, setTransformData] = useState<TransformData | null>(null);
  const [transformSourceDoc, setTransformSourceDoc] = useState<TransformSourceDocument | null>(null);
  const [isSearchingTransformSource, setIsSearchingTransformSource] = useState(false);
  const [isExecutingTransform, setIsExecutingTransform] = useState(false);
  const [transformError, setTransformError] = useState<string | null>(null);
  const [transformSuccess, setTransformSuccess] = useState(false);
  const [transformResult, setTransformResult] = useState<{ jobId: string; documentsCreated: number } | null>(null);

  const [transformClientSuggestions, setTransformClientSuggestions] = useState<TransformClientSuggestion[]>([]);
  const [transformSearchedClient, setTransformSearchedClient] = useState<string | null>(null);
  const [transformSearchedDocType, setTransformSearchedDocType] = useState<string | null>(null);
  const [showOtherSuggestions, setShowOtherSuggestions] = useState(false);

  const [manualClientSearchQuery, setManualClientSearchQuery] = useState('');
  const [manualClientSearchResults, setManualClientSearchResults] = useState<TransformClientSuggestion[]>([]);
  const [isSearchingManualClient, setIsSearchingManualClient] = useState(false);
  const manualSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const findTransformSourceDocument = useCallback(async (clientNameOverride?: string) => {
    const clientName = clientNameOverride || transformData?.source?.clientName;
    if (!clientName) return;

    setIsSearchingTransformSource(true);
    setTransformError(null);
    setTransformSourceDoc(null);
    setTransformClientSuggestions([]);
    setTransformSearchedClient(null);
    setTransformSearchedDocType(null);

    try {
      const docType = transformData?.source?.documentType as 'invoice' | 'estimate' | null ?? null;
      const selector = transformData?.source?.selector as 'last' | 'latest' | 'recent' | null ?? null;

      const sourceDoc = await findSourceDocumentByClient(clientName, docType, selector);

      if (sourceDoc) {
        setTransformSourceDoc({
          id: sourceDoc.id,
          type: sourceDoc.type,
          number: sourceDoc.number,
          total: sourceDoc.total,
          clientId: sourceDoc.clientId,
          clientName: sourceDoc.clientName,
          clientEmail: sourceDoc.clientEmail,
          items: sourceDoc.items,
          createdAt: new Date(sourceDoc.createdAt)
        });
      } else {
        const suggestions = await findSimilarClients(clientName);
        if (suggestions.length > 0) {
          setTransformClientSuggestions(suggestions);
          setTransformSearchedClient(clientName);
          setTransformSearchedDocType(docType || null);
          setTransformError(`No documents found for "${clientName}"`);
        } else {
          setTransformError(
            `No ${transformData?.source?.documentType || 'documents'} found for "${clientName}".`
          );
        }
      }
    } catch (error) {
      console.error('Find transform source error:', error);
      setTransformError('Failed to find source document. Please try again.');
    } finally {
      setIsSearchingTransformSource(false);
    }
  }, [transformData]);

  const retryTransformWithClient = useCallback((clientName: string) => {
    setTransformData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        source: {
          ...prev.source,
          clientName
        }
      };
    });
    findTransformSourceDocument(clientName);
  }, [findTransformSourceDocument]);

  const handleExecuteTransform = useCallback(async (config: {
    conversion: { enabled: boolean; targetType: 'invoice' | 'estimate' };
    split: {
      enabled: boolean;
      numberOfParts: number;
      method: 'equal' | 'custom' | 'percentage';
      amounts: number[];
      labels: string[];
    };
    schedule: {
      enabled: boolean;
      frequency: { type: 'days' | 'weeks' | 'months'; interval: number } | null;
      startDate: Date | null;
      sendFirst: boolean;
    };
  }) => {
    if (!transformSourceDoc) return;

    setIsExecutingTransform(true);
    setTransformError(null);

    try {
      const result = await executeTransformService({
        sourceDocumentId: transformSourceDoc.id,
        sourceDocumentType: transformSourceDoc.type,
        conversion: config.conversion,
      });

      if (result.success && result.job) {
        setTransformSuccess(true);
        setTransformResult({
          jobId: result.job.id,
          documentsCreated: result.generatedDocument ? 1 : 0
        });
      } else {
        setTransformError(result.error || 'Transform failed. Please try again.');
      }
    } catch (error) {
      console.error('Execute transform error:', error);
      setTransformError('Transform failed. Please try again.');
    } finally {
      setIsExecutingTransform(false);
    }
  }, [transformSourceDoc]);

  const searchClientsManually = useCallback(async (query: string) => {
    if (!query.trim()) {
      setManualClientSearchResults([]);
      return;
    }

    setIsSearchingManualClient(true);
    try {
      const result = await suggestClients(query, 5);
      setManualClientSearchResults(
        result.suggestions.map((s) => ({
          id: s.id,
          name: s.name,
          similarity: s.similarity ?? 0,
          estimateCount: 0,
          invoiceCount: 0,
        }))
      );
    } catch (error) {
      console.error('Manual client search error:', error);
    } finally {
      setIsSearchingManualClient(false);
    }
  }, []);

  const handleManualClientSearch = useCallback((query: string) => {
    if (manualSearchTimeoutRef.current) {
      clearTimeout(manualSearchTimeoutRef.current);
    }
    manualSearchTimeoutRef.current = setTimeout(() => searchClientsManually(query), 300);
  }, [searchClientsManually]);

  return {
    transformData,
    setTransformData,
    transformSourceDoc,
    setTransformSourceDoc,
    isSearchingTransformSource,
    isExecutingTransform,
    transformError,
    setTransformError,
    transformSuccess,
    setTransformSuccess,
    transformResult,
    setTransformResult,
    transformClientSuggestions,
    transformSearchedClient,
    transformSearchedDocType,
    showOtherSuggestions,
    setShowOtherSuggestions,
    manualClientSearchQuery,
    setManualClientSearchQuery,
    manualClientSearchResults,
    isSearchingManualClient,
    findTransformSourceDocument,
    retryTransformWithClient,
    handleExecuteTransform,
    searchClientsManually,
    handleManualClientSearch
  };
}

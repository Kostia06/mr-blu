// Clone flow state + logic

import { useState, useCallback } from 'react';
import { searchDocuments } from '@/lib/api/documents';
import type { CloneData, SourceDocument, LineItem } from '@/lib/review/review-types';

export function useReviewClone() {
  const [cloneData, setCloneData] = useState<CloneData | null>(null);
  const [sourceDocuments, setSourceDocuments] = useState<SourceDocument[]>([]);
  const [selectedSourceDoc, setSelectedSourceDoc] = useState<SourceDocument | null>(null);
  const [isSearchingDocs, setIsSearchingDocs] = useState(false);
  const [showDocSelection, setShowDocSelection] = useState(false);
  const [cloneClientSuggestions, setCloneClientSuggestions] = useState<{ name: string; similarity: number }[]>([]);

  const selectSourceDocument = useCallback((doc: SourceDocument) => {
    setSelectedSourceDoc(doc);
    setShowDocSelection(false);
  }, []);

  const searchSourceDocuments = useCallback(async (clientName: string, docType?: string) => {
    setIsSearchingDocs(true);
    setCloneClientSuggestions([]);
    try {
      const result = await searchDocuments({
        clientName,
        documentType: docType,
        limit: 10,
      });

      setSourceDocuments(result.documents as unknown as SourceDocument[]);
      setShowDocSelection(result.documents.length > 1);

      if (result.suggestions?.alternatives) {
        setCloneClientSuggestions(result.suggestions.alternatives);
      }

      if (result.documents.length === 1) {
        selectSourceDocument(result.documents[0] as unknown as SourceDocument);
      } else if (result.documents.length === 0 && !result.suggestions?.alternatives?.length) {
        return `No documents found for "${clientName}". Try creating a new document instead.`;
      }
    } catch (error) {
      console.error('Search documents error:', error);
    } finally {
      setIsSearchingDocs(false);
    }
    return null;
  }, [selectSourceDocument]);

  const useCloneSuggestedClient = useCallback((clientName: string) => {
    setCloneData(prev => {
      if (!prev) return prev;
      const updated = { ...prev, sourceClient: clientName };
      searchSourceDocuments(clientName, updated.documentType || undefined);
      return updated;
    });
  }, [searchSourceDocuments]);

  const applyCloneModifications = useCallback((
    doc: SourceDocument,
    currentCloneData: CloneData | null
  ): {
    items: LineItem[];
    subtotal: number;
    total: number;
  } => {
    let items: LineItem[] = (doc.lineItems || []).map((item, index) => {
      const quantity =
        typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 1;
      const total = typeof item.total === 'number' && !isNaN(item.total) ? item.total : 0;
      const rate =
        typeof item.rate === 'number' && !isNaN(item.rate) ? item.rate : total / quantity;

      return {
        id: `item-${Date.now()}-${index}`,
        description: item.description || '',
        quantity,
        unit: item.unit || 'unit',
        rate: isNaN(rate) ? 0 : rate,
        total
      };
    });

    const modifications = currentCloneData?.modifications;

    const matchesKeyword = (description: string, keyword: string): boolean => {
      const desc = description.toLowerCase();
      const kw = keyword.toLowerCase();

      if (desc.includes(kw)) return true;

      const keywordWords = kw.split(/\s+/).filter((w) => w.length > 2);
      const descWords = desc.split(/\s+/);

      for (const kwWord of keywordWords) {
        for (const descWord of descWords) {
          if (descWord.startsWith(kwWord) || kwWord.startsWith(descWord)) {
            return true;
          }
        }
      }

      const categoryWords = [
        'service',
        'labor',
        'material',
        'fee',
        'cost',
        'charge',
        'work',
        'install',
        'delivery'
      ];
      for (const catWord of categoryWords) {
        if (kw.includes(catWord) && desc.includes(catWord)) {
          return true;
        }
      }

      return false;
    };

    if (modifications) {
      if (modifications.updateItems && Array.isArray(modifications.updateItems)) {
        for (const update of modifications.updateItems) {
          const matchKeyword = update.match;
          if (!matchKeyword) continue;

          items = items.map((item) => {
            const isMatch = matchesKeyword(item.description, matchKeyword);

            if (isMatch) {
              const safeItemRate =
                typeof item.rate === 'number' && !isNaN(item.rate) ? item.rate : 0;
              const safeItemQty =
                typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 1;

              let newRate = update.newRate != null ? Number(update.newRate) : safeItemRate;
              let newQuantity =
                update.newQuantity != null ? Number(update.newQuantity) : safeItemQty;

              if (isNaN(newRate)) newRate = safeItemRate;
              if (isNaN(newQuantity)) newQuantity = safeItemQty;

              const newTotal = newRate * newQuantity;

              return {
                ...item,
                description: update.newDescription || item.description,
                rate: newRate,
                quantity: newQuantity,
                total: isNaN(newTotal) ? 0 : newTotal
              };
            }
            return item;
          });
        }
      }

      if ((modifications as Record<string, unknown>).newAmount && !modifications.updateItems) {
        const newAmount = (modifications as Record<string, unknown>).newAmount as number;
        if (items.length > 0) {
          items[0] = {
            ...items[0],
            rate: newAmount,
            total: newAmount * items[0].quantity
          };
        }
      }

      if (modifications.removeItems && Array.isArray(modifications.removeItems)) {
        const removeKeywords = modifications.removeItems;
        items = items.filter((item) => {
          return !removeKeywords.some((keyword: string) =>
            matchesKeyword(item.description, keyword)
          );
        });
      }

      if (modifications.addItems && Array.isArray(modifications.addItems)) {
        for (const newItem of modifications.addItems) {
          items.push({
            id: `item-${Date.now()}-${items.length}`,
            description: newItem.description,
            quantity: newItem.quantity || 1,
            unit: newItem.unit || 'unit',
            rate: newItem.rate || 0,
            total: (newItem.quantity || 1) * (newItem.rate || 0)
          });
        }
      }
    }

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const total = modifications?.newTotal ?? subtotal;

    return { items, subtotal, total };
  }, []);

  return {
    cloneData,
    setCloneData,
    sourceDocuments,
    selectedSourceDoc,
    setSelectedSourceDoc,
    isSearchingDocs,
    showDocSelection,
    cloneClientSuggestions,
    searchSourceDocuments,
    selectSourceDocument,
    useCloneSuggestedClient,
    applyCloneModifications
  };
}

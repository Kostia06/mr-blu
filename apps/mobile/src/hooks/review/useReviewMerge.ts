// Merge flow state + logic

import { useState, useCallback, useMemo } from 'react';
import { searchDocuments, type SearchResult } from '@/lib/api/documents';
import type { MergeData, MergeSourceSelection, SourceDocument, LineItem } from '@/lib/review/review-types';

export function useReviewMerge() {
  const [mergeData, setMergeData] = useState<MergeData | null>(null);
  const [mergeSourceSelections, setMergeSourceSelections] = useState<MergeSourceSelection[]>([]);
  const [showMergeSelection, setShowMergeSelection] = useState(false);

  const allMergeSourcesSelected = useMemo(
    () =>
      mergeSourceSelections.length > 0 &&
      mergeSourceSelections.every((sel) => sel.selectedDoc !== null),
    [mergeSourceSelections]
  );

  const searchMergeSourceDocuments = useCallback(async (
    clientName: string,
    index: number,
    docType?: string
  ) => {
    try {
      const result = await searchDocuments({
        clientName,
        documentType: docType,
        limit: 10,
      });

      const docs = result.documents as unknown as SourceDocument[];
      setMergeSourceSelections(prev =>
        prev.map((sel, i) => {
          if (i === index) {
            return {
              ...sel,
              documents: docs,
              isSearching: false,
              selectedDoc: docs.length === 1 ? docs[0] : null,
            };
          }
          return sel;
        })
      );
    } catch (error) {
      console.error('Search merge documents error:', error);
      setMergeSourceSelections(prev =>
        prev.map((sel, i) => {
          if (i === index) {
            return { ...sel, isSearching: false };
          }
          return sel;
        })
      );
    }
  }, []);

  const selectMergeSourceDocument = useCallback((index: number, doc: SourceDocument) => {
    setMergeSourceSelections(prev =>
      prev.map((sel, i) => {
        if (i === index) {
          return { ...sel, selectedDoc: doc };
        }
        return sel;
      })
    );
  }, []);

  const getCombinedMergeItems = useCallback((
    selections: MergeSourceSelection[]
  ): { items: LineItem[]; subtotal: number } => {
    const combinedItems: LineItem[] = [];
    let itemIndex = 0;

    for (const sel of selections) {
      if (sel.selectedDoc?.lineItems) {
        for (const item of sel.selectedDoc.lineItems) {
          const quantity =
            typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 1;
          const total = typeof item.total === 'number' && !isNaN(item.total) ? item.total : 0;
          const rate =
            typeof item.rate === 'number' && !isNaN(item.rate) ? item.rate : total / quantity;

          combinedItems.push({
            id: `item-${Date.now()}-${itemIndex++}`,
            description: item.description || '',
            quantity,
            unit: item.unit || 'unit',
            rate: isNaN(rate) ? 0 : rate,
            total
          });
        }
      }
    }

    const subtotal = combinedItems.reduce((sum, item) => sum + item.total, 0);
    return { items: combinedItems, subtotal };
  }, []);

  return {
    mergeData,
    setMergeData,
    mergeSourceSelections,
    setMergeSourceSelections,
    showMergeSelection,
    setShowMergeSelection,
    allMergeSourcesSelected,
    searchMergeSourceDocuments,
    selectMergeSourceDocument,
    getCombinedMergeItems
  };
}

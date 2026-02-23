// Session persistence state + logic

import { useState, useCallback, useRef } from 'preact/hooks';
import {
  createReviewSession,
  updateReviewSession,
  deleteReviewSession,
} from '@/lib/api/reviews';
import { fetchRecentDocuments as fetchRecentDocumentsDirect } from '@/lib/api/documents';
import type { RecentDocument } from '@/lib/review/review-types';

export function useReviewSession() {
  const [reviewSessionId, setReviewSessionId] = useState<string | null>(null);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [showDocumentSuggestions, setShowDocumentSuggestions] = useState(false);
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [isLoadingRecentDocs, setIsLoadingRecentDocs] = useState(false);

  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const saveReviewSession = useCallback(async (getSessionData: () => Record<string, unknown>) => {
    if (isSavingReview) return;
    setIsSavingReview(true);

    try {
      const sessionData = getSessionData();

      if (reviewSessionId) {
        await updateReviewSession(reviewSessionId, sessionData);
      } else {
        const result = await createReviewSession(sessionData);
        if (result.success && result.review) {
          setReviewSessionId(result.review.id);
          history.replaceState(null, '', `/dashboard/review?session=${result.review.id}`);
        }
      }
    } catch (error) {
      console.error('Save review error:', error);
    } finally {
      setIsSavingReview(false);
    }
  }, [isSavingReview, reviewSessionId]);

  const autoSaveReview = useCallback((getSessionData: () => Record<string, unknown>) => {
    if (!reviewSessionId) return;
    clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(async () => {
      await saveReviewSession(getSessionData);
    }, 2000);
  }, [reviewSessionId, saveReviewSession]);

  const cancelAutoSave = useCallback(() => {
    clearTimeout(autoSaveTimeoutRef.current);
  }, []);

  const completeReviewSession = useCallback(async (
    documentId: string,
    documentType: 'invoice' | 'estimate'
  ) => {
    const sessionIdToDelete = reviewSessionId;
    if (!sessionIdToDelete) return;

    cancelAutoSave();
    setReviewSessionId(null);

    try {
      await deleteReviewSession(sessionIdToDelete);
    } catch (error) {
      console.error('Complete review error:', error);
    }
  }, [reviewSessionId, cancelAutoSave]);

  const fetchRecentDocuments = useCallback(async () => {
    if (isLoadingRecentDocs) return;
    setIsLoadingRecentDocs(true);

    try {
      const documents = await fetchRecentDocumentsDirect();
      if (documents.length > 0) {
        setRecentDocuments(documents as unknown as RecentDocument[]);
        setShowDocumentSuggestions(true);
      }
    } catch (error) {
      console.error('Failed to fetch recent documents:', error);
    } finally {
      setIsLoadingRecentDocs(false);
    }
  }, [isLoadingRecentDocs]);

  const dismissDocumentSuggestions = useCallback(() => {
    setShowDocumentSuggestions(false);
  }, []);

  return {
    reviewSessionId,
    setReviewSessionId,
    isSavingReview,
    showDocumentSuggestions,
    setShowDocumentSuggestions,
    recentDocuments,
    isLoadingRecentDocs,
    saveReviewSession,
    autoSaveReview,
    cancelAutoSave,
    completeReviewSession,
    fetchRecentDocuments,
    dismissDocumentSuggestions
  };
}

import { useState, useCallback } from 'react';
import * as Clipboard from 'expo-clipboard';
import { updateClient } from '@/lib/api/clients';
import {
  saveDocument as saveDocumentDirect,
  sendDocument as sendDocumentDirect,
  shareDocument,
} from '@/lib/api/documents';

interface MergeConflictData {
  existingClient: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  newData: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  differences: Array<{ field: string; old: string | null; new: string | null }>;
}

interface PendingSaveData {
  templateData: Record<string, unknown>;
  originalTranscript?: string;
  status: 'draft' | 'sent';
}

export function useReviewAPI() {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copyLinkStatus, setCopyLinkStatus] = useState<'idle' | 'loading' | 'copied' | 'error'>('idle');
  const [showViewLinkModal, setShowViewLinkModal] = useState(false);
  const [viewLinkUrl, setViewLinkUrl] = useState<string | null>(null);
  const [viewLinkCopied, setViewLinkCopied] = useState(false);

  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeConflictData, setMergeConflictData] = useState<MergeConflictData | null>(null);
  const [pendingSaveData, setPendingSaveData] = useState<PendingSaveData | null>(null);

  const saveDocumentAPI = useCallback(async (
    templateData: Record<string, unknown>,
    originalTranscript?: string,
    status: 'draft' | 'sent' = 'draft',
    clientMergeDecision?: 'keep' | 'use_new' | 'update'
  ): Promise<{ id: string } | null> => {
    try {
      const result = await saveDocumentDirect(templateData, {
        originalTranscript,
        status,
        clientMergeDecision,
      });

      if (result.clientConflict) {
        setMergeConflictData({
          existingClient: result.existingClient as MergeConflictData['existingClient'],
          newData: result.newData as MergeConflictData['newData'],
          differences: result.differences || [],
        });
        setPendingSaveData({ templateData, originalTranscript, status });
        setShowMergeModal(true);
        return null;
      }

      return { id: result.id };
    } catch (error) {
      console.error('Save document error:', error);
      throw error instanceof Error ? error : new Error('Save document failed');
    }
  }, []);

  const handleMergeDecision = useCallback(async (decision: 'keep' | 'use_new' | 'update') => {
    if (!pendingSaveData) return;

    setShowMergeModal(false);

    const saved = await saveDocumentAPI(
      pendingSaveData.templateData,
      pendingSaveData.originalTranscript,
      pendingSaveData.status,
      decision
    );

    setPendingSaveData(null);
    setMergeConflictData(null);

    return saved;
  }, [pendingSaveData, saveDocumentAPI]);

  const sendDocumentAPI = useCallback(async (
    documentId: string,
    documentType: 'invoice' | 'estimate',
    deliveryMethod: 'email' | 'sms' | 'whatsapp',
    recipient: { email?: string; phone?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendDocumentDirect(documentId, documentType, deliveryMethod, recipient);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      console.error('Send document error:', error);
      return { success: false, error: message };
    }
  }, []);

  const generateShareLink = useCallback(async (
    documentId: string,
    documentType: 'invoice' | 'estimate'
  ): Promise<string | null> => {
    try {
      setCopyLinkStatus('loading');
      const result = await shareDocument(documentId, documentType);
      return result.shareUrl;
    } catch (error) {
      console.error('Generate share link error:', error);
      return null;
    }
  }, []);

  const copyShareLink = useCallback(async (
    savedDocumentId: string | null,
    getTemplateData: () => Record<string, unknown>,
    rawTranscription: string,
    documentType: 'invoice' | 'estimate',
    setSavedDocumentId: (id: string) => void
  ): Promise<void> => {
    let docId = savedDocumentId;
    if (!docId) {
      try {
        const doc = await saveDocumentAPI(getTemplateData(), rawTranscription, 'draft');
        if (!doc) {
          setCopyLinkStatus('error');
          return;
        }
        docId = doc.id;
        setSavedDocumentId(docId);
      } catch {
        setCopyLinkStatus('error');
        return;
      }
    }

    const link = await generateShareLink(docId, documentType);
    if (link) {
      try {
        await Clipboard.setStringAsync(link);
        setShareLink(link);
        setCopyLinkStatus('copied');
        setTimeout(() => setCopyLinkStatus('idle'), 3000);
      } catch {
        setCopyLinkStatus('error');
      }
    } else {
      setCopyLinkStatus('error');
    }
  }, [saveDocumentAPI, generateShareLink]);

  const openViewLinkModal = useCallback(async (
    savedDocumentId: string | null,
    getTemplateData: () => Record<string, unknown>,
    rawTranscription: string,
    documentType: 'invoice' | 'estimate',
    setSavedDocumentId: (id: string) => void
  ): Promise<void> => {
    let docId = savedDocumentId;
    if (!docId) {
      try {
        const doc = await saveDocumentAPI(getTemplateData(), rawTranscription, 'draft');
        if (!doc) return;
        docId = doc.id;
        setSavedDocumentId(docId);
      } catch {
        return;
      }
    }

    const link = await generateShareLink(docId, documentType);
    if (link) {
      setViewLinkUrl(link);
      setShowViewLinkModal(true);
      setViewLinkCopied(false);
      setCopyLinkStatus('idle');
    }
  }, [saveDocumentAPI, generateShareLink]);

  const copyViewLink = useCallback(async (): Promise<void> => {
    if (viewLinkUrl) {
      try {
        await Clipboard.setStringAsync(viewLinkUrl);
        setViewLinkCopied(true);
        setTimeout(() => setViewLinkCopied(false), 3000);
      } catch {
        console.error('Failed to copy link');
      }
    }
  }, [viewLinkUrl]);

  const updateClientContactInfo = useCallback(async (
    clientId: string,
    email?: string,
    phone?: string
  ) => {
    try {
      return await updateClient(clientId, { email, phone });
    } catch (error) {
      console.error('Update client info error:', error);
      return false;
    }
  }, []);

  const saveClientInfo = useCallback(async ({
    clientId,
    email,
    name
  }: {
    clientId: string;
    email?: string;
    name?: string;
  }) => {
    try {
      await updateClient(clientId, { email, name });
    } catch (error) {
      console.error('Failed to auto-save client info:', error);
    }
  }, []);

  return {
    shareLink,
    setShareLink,
    copyLinkStatus,
    setCopyLinkStatus,
    showViewLinkModal,
    setShowViewLinkModal,
    viewLinkUrl,
    setViewLinkUrl,
    viewLinkCopied,
    setViewLinkCopied,
    showMergeModal,
    setShowMergeModal,
    mergeConflictData,
    setMergeConflictData,
    pendingSaveData,
    setPendingSaveData,
    saveDocumentAPI,
    handleMergeDecision,
    sendDocumentAPI,
    generateShareLink,
    copyShareLink,
    openViewLinkModal,
    copyViewLink,
    updateClientContactInfo,
    saveClientInfo
  };
}

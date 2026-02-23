// Send flow state + logic

import { useState, useCallback, useMemo } from 'react';
import { useI18nStore } from '@/lib/i18n';
import { lookupClient } from '@/lib/api/clients';
import { searchDocuments, fetchDocument, updateDocument } from '@/lib/api/documents';
import type { SendData, SourceDocument, LineItem } from '@/lib/review/review-types';

interface SendFlowDeps {
  sendDocumentAPI: (
    documentId: string,
    documentType: 'invoice' | 'estimate',
    deliveryMethod: 'email' | 'sms' | 'whatsapp',
    recipient: { email?: string; phone?: string }
  ) => Promise<{ success: boolean; error?: string }>;
  updateClientContactInfo: (clientId: string, email?: string, phone?: string) => Promise<boolean>;
}

export function useReviewSend(deps: SendFlowDeps) {
  const { t } = useI18nStore();

  const [sendData, setSendData] = useState<SendData | null>(null);
  const [sendDocument, setSendDocument] = useState<SourceDocument | null>(null);
  const [sendClientInfo, setSendClientInfo] = useState<{ email?: string; phone?: string } | null>(null);
  const [isSendingDocument, setIsSendingDocument] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [editableSendEmail, setEditableSendEmail] = useState('');
  const [editableSendPhone, setEditableSendPhone] = useState('');
  const [isUpdatingClientInfo, setIsUpdatingClientInfo] = useState(false);

  const [isEditingSendDocument, setIsEditingSendDocument] = useState(false);
  const [sendDocumentItems, setSendDocumentItems] = useState<LineItem[]>([]);
  const [sendDocumentTaxRate, setSendDocumentTaxRate] = useState(0);
  const [expandedSendItemId, setExpandedSendItemId] = useState<string | null>(null);
  const [isSavingSendDocument, setIsSavingSendDocument] = useState(false);

  const sendDocumentSubtotal = useMemo(
    () => sendDocumentItems.reduce((sum, item) => sum + (item.total || 0), 0),
    [sendDocumentItems]
  );

  const sendDocumentTaxAmount = useMemo(
    () => sendDocumentSubtotal * (sendDocumentTaxRate / 100),
    [sendDocumentSubtotal, sendDocumentTaxRate]
  );

  const sendDocumentTotal = useMemo(
    () => sendDocumentSubtotal + sendDocumentTaxAmount,
    [sendDocumentSubtotal, sendDocumentTaxAmount]
  );

  const showSendErrorToast = useCallback((message: string) => {
    setSendError(message);
  }, []);

  const lookupRecipientClient = useCallback(async (
    name: string
  ): Promise<{ email?: string; phone?: string } | null> => {
    try {
      const result = await lookupClient(name);
      if (result.client) {
        return {
          email: result.client.email || undefined,
          phone: result.client.phone || undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Recipient lookup error:', error);
      return null;
    }
  }, []);

  const findDocumentToSend = useCallback(async () => {
    if (!sendData?.clientName) return;

    setIsSendingDocument(true);
    setSendError(null);
    setSendDocument(null);
    setSendClientInfo(null);

    try {
      const result = await searchDocuments({
        clientName: sendData.clientName,
        documentType: sendData.documentType ?? undefined,
        limit: 5,
      });

      if (result.documents && result.documents.length > 0) {
        const docs = result.documents as unknown as SourceDocument[];
        let selected: SourceDocument | null = null;

        if (sendData.selector === 'first') {
          selected = docs[docs.length - 1];
        } else {
          selected = docs[0];
        }

        setSendDocument(selected);

        if (selected) {
          setSendClientInfo({
            email: selected.clientEmail || undefined,
            phone: selected.clientPhone || undefined,
          });

          let recipientEmail = sendData.recipient?.email || '';
          let recipientPhone = sendData.recipient?.phone || '';

          if (sendData.recipient?.clientName) {
            const recipientClient = await lookupRecipientClient(sendData.recipient.clientName);
            if (recipientClient) {
              recipientEmail = recipientClient.email || recipientEmail;
              recipientPhone = recipientClient.phone || recipientPhone;
            }
          }

          setEditableSendEmail(recipientEmail || selected.clientEmail || '');
          setEditableSendPhone(recipientPhone || selected.clientPhone || '');
        }
      } else {
        setSendError(`No ${sendData.documentType || 'documents'} found for "${sendData.clientName}".`);
      }
    } catch (error) {
      console.error('Find document to send error:', error);
      setSendError('Failed to find document. Please try again.');
    } finally {
      setIsSendingDocument(false);
    }
  }, [sendData, lookupRecipientClient]);

  const loadSendDocumentForEditing = useCallback(async () => {
    if (!sendDocument) return;

    try {
      const tableName = sendDocument.type === 'contract' ? 'contracts' : 'documents';
      const doc = await fetchDocument(sendDocument.id, tableName);

      const lineItems = (doc.line_items as Array<Record<string, unknown>>) || [];
      setSendDocumentItems(
        lineItems.map(
          (
            item: Record<string, unknown>,
            i: number
          ) => ({
            id: `send-item-${i}`,
            description: (item.description as string) || '',
            quantity: (item.quantity as number) || 0,
            unit: (item.unit as string) || '',
            rate: (item.rate as number) || 0,
            total: (item.total as number) || 0,
          })
        )
      );
      setSendDocumentTaxRate((doc.tax_rate as number) || 0);
      setIsEditingSendDocument(true);
    } catch (error) {
      console.error('Load document for editing error:', error);
      showSendErrorToast(t('review.failedToLoad'));
    }
  }, [sendDocument, showSendErrorToast, t]);

  const updateSendItemTotal = useCallback((item: LineItem) => {
    setSendDocumentItems(prev =>
      prev.map(existing =>
        existing.id === item.id
          ? { ...existing, total: existing.quantity * existing.rate }
          : existing
      )
    );
  }, []);

  const removeSendItem = useCallback((itemId: string) => {
    setSendDocumentItems(prev => prev.filter((item) => item.id !== itemId));
    setExpandedSendItemId(prev => prev === itemId ? null : prev);
  }, []);

  const addSendItem = useCallback(() => {
    const newItem: LineItem = {
      id: `send-item-${Date.now()}`,
      description: '',
      quantity: 1,
      unit: '',
      rate: 0,
      total: 0
    };
    setSendDocumentItems(prev => [...prev, newItem]);
    setExpandedSendItemId(newItem.id);
  }, []);

  const saveSendDocumentChanges = useCallback(async () => {
    if (!sendDocument) return false;

    setIsSavingSendDocument(true);
    try {
      const tableName = sendDocument.type === 'contract' ? 'contracts' : 'documents';
      await updateDocument(sendDocument.id, {
        line_items: sendDocumentItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          total: item.total,
        })),
        subtotal: sendDocumentSubtotal,
        tax_rate: sendDocumentTaxRate,
        tax_amount: sendDocumentTaxAmount,
        total: sendDocumentTotal,
      }, tableName);

      setSendDocument({
        ...sendDocument,
        amount: sendDocumentTotal,
        lineItems: sendDocumentItems,
      });

      setIsEditingSendDocument(false);
      return true;
    } catch (error) {
      console.error('Save send document error:', error);
      showSendErrorToast(t('review.failedToSave'));
      return false;
    } finally {
      setIsSavingSendDocument(false);
    }
  }, [
    sendDocument,
    sendDocumentItems,
    sendDocumentSubtotal,
    sendDocumentTaxRate,
    sendDocumentTaxAmount,
    sendDocumentTotal,
    showSendErrorToast,
    t,
  ]);

  const cancelSendDocumentEditing = useCallback(() => {
    setIsEditingSendDocument(false);
    setSendDocumentItems([]);
    setExpandedSendItemId(null);
  }, []);

  const executeSendDocument = useCallback(async (email: string = '', phone: string = '') => {
    if (!sendDocument || !sendData) return;

    setIsSendingDocument(true);
    setSendError(null);

    const providedEmail = email.trim() || editableSendEmail.trim();
    const providedPhone = phone.trim() || editableSendPhone.trim();

    try {
      const recipient: { email?: string; phone?: string } = {};

      if (sendData.deliveryMethod === 'email') {
        recipient.email = providedEmail || sendData.recipient?.email || sendClientInfo?.email;
        if (!recipient.email) {
          showSendErrorToast(t('review.enterEmail'));
          setIsSendingDocument(false);
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email)) {
          showSendErrorToast(t('review.enterValidEmail'));
          setIsSendingDocument(false);
          return;
        }
      } else {
        recipient.phone = providedPhone || sendData.recipient?.phone || sendClientInfo?.phone;
        if (!recipient.phone) {
          showSendErrorToast(t('review.enterPhone'));
          setIsSendingDocument(false);
          return;
        }
      }

      if (sendDocument.clientId) {
        const emailChanged = providedEmail && providedEmail !== sendClientInfo?.email;
        const phoneChanged = providedPhone && providedPhone !== sendClientInfo?.phone;
        if (emailChanged || phoneChanged) {
          setIsUpdatingClientInfo(true);
          await deps.updateClientContactInfo(
            sendDocument.clientId,
            emailChanged ? providedEmail : undefined,
            phoneChanged ? providedPhone : undefined
          );
          setIsUpdatingClientInfo(false);
        }
      }

      const result = await deps.sendDocumentAPI(
        sendDocument.id,
        sendDocument.type as 'invoice' | 'estimate',
        sendData.deliveryMethod,
        recipient
      );

      if (result.success) {
        setSendSuccess(true);
      } else {
        showSendErrorToast(result.error || t('review.failedToSend'));
      }
    } catch (error) {
      console.error('Execute send document error:', error);
      showSendErrorToast(t('review.errorSending'));
    } finally {
      setIsSendingDocument(false);
      setIsUpdatingClientInfo(false);
    }
  }, [
    sendDocument,
    sendData,
    editableSendEmail,
    editableSendPhone,
    sendClientInfo,
    deps,
    showSendErrorToast,
    t
  ]);

  return {
    sendData,
    setSendData,
    sendDocument,
    setSendDocument,
    sendClientInfo,
    setSendClientInfo,
    isSendingDocument,
    sendError,
    setSendError,
    sendSuccess,
    setSendSuccess,
    editableSendEmail,
    setEditableSendEmail,
    editableSendPhone,
    setEditableSendPhone,
    isUpdatingClientInfo,
    isEditingSendDocument,
    sendDocumentItems,
    setSendDocumentItems,
    sendDocumentSubtotal,
    sendDocumentTaxRate,
    setSendDocumentTaxRate,
    sendDocumentTaxAmount,
    sendDocumentTotal,
    expandedSendItemId,
    isSavingSendDocument,
    lookupRecipientClient,
    findDocumentToSend,
    loadSendDocumentForEditing,
    updateSendItemTotal,
    removeSendItem,
    addSendItem,
    saveSendDocumentChanges,
    cancelSendDocumentEditing,
    executeSendDocument,
    showSendErrorToast
  };
}

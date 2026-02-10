// Send flow state + logic

import { t } from '$lib/i18n';
import { get } from 'svelte/store';
import type { SendData, SourceDocument, LineItem } from './review-types';

export function createSendFlow(deps: {
	sendDocumentAPI: (
		documentId: string,
		documentType: 'invoice' | 'estimate',
		deliveryMethod: 'email' | 'sms' | 'whatsapp',
		recipient: { email?: string; phone?: string }
	) => Promise<{ success: boolean; error?: string }>;
	updateClientContactInfo: (clientId: string, email?: string, phone?: string) => Promise<boolean>;
}) {
	let sendData = $state<SendData | null>(null);
	let sendDocument = $state<SourceDocument | null>(null);
	let sendClientInfo = $state<{ email?: string; phone?: string } | null>(null);
	let isSendingDocument = $state(false);
	let sendError = $state<string | null>(null);
	let sendSuccess = $state(false);
	let editableSendEmail = $state('');
	let editableSendPhone = $state('');
	let isUpdatingClientInfo = $state(false);

	// Send document editing state
	let isEditingSendDocument = $state(false);
	let sendDocumentItems = $state<LineItem[]>([]);
	let sendDocumentSubtotal = $derived(
		sendDocumentItems.reduce((sum, item) => sum + (item.total || 0), 0)
	);
	let sendDocumentTaxRate = $state(0);
	let sendDocumentTaxAmount = $derived(sendDocumentSubtotal * (sendDocumentTaxRate / 100));
	let sendDocumentTotal = $derived(sendDocumentSubtotal + sendDocumentTaxAmount);
	let expandedSendItemId = $state<string | null>(null);
	let isSavingSendDocument = $state(false);

	function showSendErrorToast(message: string) {
		sendError = message;
	}

	async function lookupRecipientClient(
		name: string
	): Promise<{ email?: string; phone?: string } | null> {
		try {
			const response = await fetch(`/api/clients/lookup?name=${encodeURIComponent(name)}`);
			const result = await response.json();
			if (result.success && result.client) {
				return {
					email: result.client.email || undefined,
					phone: result.client.phone || undefined
				};
			}
			return null;
		} catch (error) {
			console.error('Recipient lookup error:', error);
			return null;
		}
	}

	async function findDocumentToSend() {
		if (!sendData?.clientName) return;

		isSendingDocument = true;
		sendError = null;
		sendDocument = null;
		sendClientInfo = null;

		try {
			const response = await fetch('/api/documents/search', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					clientName: sendData.clientName,
					documentType: sendData.documentType,
					limit: 5
				})
			});

			if (!response.ok) {
				console.error('Search API error:', response.status, response.statusText);
				sendError = 'Failed to search documents. Please try again.';
				return;
			}

			const result = await response.json();

			if (result.success && result.documents && result.documents.length > 0) {
				const docs = result.documents as SourceDocument[];
				let selected: SourceDocument | null = null;

				if (sendData.selector === 'first') {
					selected = docs[docs.length - 1];
				} else {
					selected = docs[0];
				}

				sendDocument = selected;

				if (selected) {
					sendClientInfo = {
						email: selected.clientEmail || undefined,
						phone: selected.clientPhone || undefined
					};

					let recipientEmail = sendData.recipient?.email || '';
					let recipientPhone = sendData.recipient?.phone || '';

					if (sendData.recipient?.clientName) {
						const recipientClient = await lookupRecipientClient(sendData.recipient.clientName);
						if (recipientClient) {
							recipientEmail = recipientClient.email || recipientEmail;
							recipientPhone = recipientClient.phone || recipientPhone;
						}
					}

					editableSendEmail = recipientEmail || selected.clientEmail || '';
					editableSendPhone = recipientPhone || selected.clientPhone || '';
				}
			} else {
				sendError = `No ${sendData.documentType || 'documents'} found for "${sendData.clientName}".`;
			}
		} catch (error) {
			console.error('Find document to send error:', error);
			sendError = 'Failed to find document. Please try again.';
		} finally {
			isSendingDocument = false;
		}
	}

	async function loadSendDocumentForEditing() {
		if (!sendDocument) return;

		try {
			const tableName = sendDocument.type === 'contract' ? 'contracts' : 'invoices';
			const response = await fetch(`/api/documents/${sendDocument.id}?table=${tableName}`);
			if (!response.ok) {
				showSendErrorToast(get(t)('review.failedToLoad'));
				return;
			}

			const result = await response.json();
			if (result.success && result.document) {
				const doc = result.document;
				sendDocumentItems = (doc.line_items || []).map(
					(
						item: {
							description?: string;
							quantity?: number;
							unit?: string;
							rate?: number;
							total?: number;
						},
						i: number
					) => ({
						id: `send-item-${i}`,
						description: item.description || '',
						quantity: item.quantity || 0,
						unit: item.unit || '',
						rate: item.rate || 0,
						total: item.total || 0
					})
				);
				sendDocumentTaxRate = doc.tax_rate || 0;
				isEditingSendDocument = true;
			}
		} catch (error) {
			console.error('Load document for editing error:', error);
			showSendErrorToast(get(t)('review.failedToLoad'));
		}
	}

	function updateSendItemTotal(item: LineItem) {
		item.total = item.quantity * item.rate;
		sendDocumentItems = [...sendDocumentItems];
	}

	function removeSendItem(itemId: string) {
		sendDocumentItems = sendDocumentItems.filter((item) => item.id !== itemId);
		if (expandedSendItemId === itemId) {
			expandedSendItemId = null;
		}
	}

	function addSendItem() {
		const newItem: LineItem = {
			id: `send-item-${Date.now()}`,
			description: '',
			quantity: 1,
			unit: '',
			rate: 0,
			total: 0
		};
		sendDocumentItems = [...sendDocumentItems, newItem];
		expandedSendItemId = newItem.id;
	}

	async function saveSendDocumentChanges() {
		if (!sendDocument) return false;

		isSavingSendDocument = true;
		try {
			const tableName = sendDocument.type === 'contract' ? 'contracts' : 'invoices';
			const response = await fetch(`/api/documents/${sendDocument.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					table: tableName,
					line_items: sendDocumentItems.map((item) => ({
						description: item.description,
						quantity: item.quantity,
						unit: item.unit,
						rate: item.rate,
						total: item.total
					})),
					subtotal: sendDocumentSubtotal,
					tax_rate: sendDocumentTaxRate,
					tax_amount: sendDocumentTaxAmount,
					total: sendDocumentTotal
				})
			});

			if (!response.ok) {
				showSendErrorToast(get(t)('review.failedToSave'));
				return false;
			}

			sendDocument = {
				...sendDocument,
				amount: sendDocumentTotal,
				lineItems: sendDocumentItems
			};

			isEditingSendDocument = false;
			return true;
		} catch (error) {
			console.error('Save send document error:', error);
			showSendErrorToast(get(t)('review.failedToSave'));
			return false;
		} finally {
			isSavingSendDocument = false;
		}
	}

	function cancelSendDocumentEditing() {
		isEditingSendDocument = false;
		sendDocumentItems = [];
		expandedSendItemId = null;
	}

	async function executeSendDocument(email: string = '', phone: string = '') {
		if (!sendDocument || !sendData) return;

		isSendingDocument = true;
		sendError = null;

		const providedEmail = email.trim() || editableSendEmail.trim();
		const providedPhone = phone.trim() || editableSendPhone.trim();

		try {
			const recipient: { email?: string; phone?: string } = {};

			if (sendData.deliveryMethod === 'email') {
				recipient.email = providedEmail || sendData.recipient?.email || sendClientInfo?.email;
				if (!recipient.email) {
					showSendErrorToast(get(t)('review.enterEmail'));
					isSendingDocument = false;
					return;
				}
				if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email)) {
					showSendErrorToast(get(t)('review.enterValidEmail'));
					isSendingDocument = false;
					return;
				}
			} else {
				recipient.phone = providedPhone || sendData.recipient?.phone || sendClientInfo?.phone;
				if (!recipient.phone) {
					showSendErrorToast(get(t)('review.enterPhone'));
					isSendingDocument = false;
					return;
				}
			}

			if (sendDocument.clientId) {
				const emailChanged = providedEmail && providedEmail !== sendClientInfo?.email;
				const phoneChanged = providedPhone && providedPhone !== sendClientInfo?.phone;
				if (emailChanged || phoneChanged) {
					isUpdatingClientInfo = true;
					await deps.updateClientContactInfo(
						sendDocument.clientId,
						emailChanged ? providedEmail : undefined,
						phoneChanged ? providedPhone : undefined
					);
					isUpdatingClientInfo = false;
				}
			}

			const result = await deps.sendDocumentAPI(
				sendDocument.id,
				sendDocument.type as 'invoice' | 'estimate',
				sendData.deliveryMethod,
				recipient
			);

			if (result.success) {
				sendSuccess = true;
			} else {
				showSendErrorToast(result.error || get(t)('review.failedToSend'));
			}
		} catch (error) {
			console.error('Execute send document error:', error);
			showSendErrorToast(get(t)('review.errorSending'));
		} finally {
			isSendingDocument = false;
			isUpdatingClientInfo = false;
		}
	}

	return {
		get sendData() {
			return sendData;
		},
		set sendData(v) {
			sendData = v;
		},
		get sendDocument() {
			return sendDocument;
		},
		set sendDocument(v) {
			sendDocument = v;
		},
		get sendClientInfo() {
			return sendClientInfo;
		},
		set sendClientInfo(v) {
			sendClientInfo = v;
		},
		get isSendingDocument() {
			return isSendingDocument;
		},
		get sendError() {
			return sendError;
		},
		set sendError(v) {
			sendError = v;
		},
		get sendSuccess() {
			return sendSuccess;
		},
		set sendSuccess(v) {
			sendSuccess = v;
		},
		get editableSendEmail() {
			return editableSendEmail;
		},
		set editableSendEmail(v) {
			editableSendEmail = v;
		},
		get editableSendPhone() {
			return editableSendPhone;
		},
		set editableSendPhone(v) {
			editableSendPhone = v;
		},
		get isUpdatingClientInfo() {
			return isUpdatingClientInfo;
		},
		get isEditingSendDocument() {
			return isEditingSendDocument;
		},
		get sendDocumentItems() {
			return sendDocumentItems;
		},
		get sendDocumentSubtotal() {
			return sendDocumentSubtotal;
		},
		get sendDocumentTaxRate() {
			return sendDocumentTaxRate;
		},
		set sendDocumentTaxRate(v) {
			sendDocumentTaxRate = v;
		},
		get sendDocumentTaxAmount() {
			return sendDocumentTaxAmount;
		},
		get sendDocumentTotal() {
			return sendDocumentTotal;
		},
		get expandedSendItemId() {
			return expandedSendItemId;
		},
		get isSavingSendDocument() {
			return isSavingSendDocument;
		},
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

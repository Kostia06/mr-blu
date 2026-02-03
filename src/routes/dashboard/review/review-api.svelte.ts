// Shared API functions for the review page

export function createReviewAPI() {
	// Share link state
	let shareLink = $state<string | null>(null);
	let copyLinkStatus = $state<'idle' | 'loading' | 'copied' | 'error'>('idle');
	let showViewLinkModal = $state(false);
	let viewLinkUrl = $state<string | null>(null);
	let viewLinkCopied = $state(false);

	// Contact merge modal state
	let showMergeModal = $state(false);
	let mergeConflictData = $state<{
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
	} | null>(null);
	let pendingSaveData = $state<{
		templateData: Record<string, unknown>;
		originalTranscript?: string;
		status: 'draft' | 'sent';
	} | null>(null);

	async function saveDocumentAPI(
		templateData: Record<string, unknown>,
		originalTranscript?: string,
		status: 'draft' | 'sent' = 'draft',
		clientMergeDecision?: 'keep' | 'use_new' | 'update'
	): Promise<{ id: string } | null> {
		try {
			const response = await fetch('/api/documents/save', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ templateData, originalTranscript, status, clientMergeDecision })
			});

			const result = await response.json();

			if (result.clientConflict) {
				mergeConflictData = {
					existingClient: result.existingClient,
					newData: result.newData,
					differences: result.differences
				};
				pendingSaveData = { templateData, originalTranscript, status };
				showMergeModal = true;
				return null;
			}

			if (result.success && result.data) {
				return result.data;
			}
			console.error('Save document error:', result.error, result.details);
			return null;
		} catch (error) {
			console.error('Save document fetch error:', error);
			return null;
		}
	}

	async function handleMergeDecision(decision: 'keep' | 'use_new' | 'update') {
		if (!pendingSaveData) return;

		showMergeModal = false;

		const saved = await saveDocumentAPI(
			pendingSaveData.templateData,
			pendingSaveData.originalTranscript,
			pendingSaveData.status,
			decision
		);

		pendingSaveData = null;
		mergeConflictData = null;

		return saved;
	}

	async function sendDocumentAPI(
		documentId: string,
		documentType: 'invoice' | 'estimate',
		deliveryMethod: 'email' | 'sms' | 'whatsapp',
		recipient: { email?: string; phone?: string }
	): Promise<boolean> {
		try {
			const response = await fetch('/api/documents/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					documentId,
					documentType,
					method: deliveryMethod,
					recipient
				})
			});

			const result = await response.json();
			return result.success;
		} catch (error) {
			console.error('Send document error:', error);
			return false;
		}
	}

	async function generateShareLink(
		documentId: string,
		documentType: 'invoice' | 'estimate'
	): Promise<string | null> {
		try {
			copyLinkStatus = 'loading';
			const response = await fetch('/api/documents/share', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ documentId, documentType })
			});

			const result = await response.json();
			if (result.success && result.shareUrl) {
				return result.shareUrl;
			}
			console.error('Share link error:', result.error);
			return null;
		} catch (error) {
			console.error('Generate share link error:', error);
			return null;
		}
	}

	async function copyShareLink(
		savedDocumentId: string | null,
		getTemplateData: () => Record<string, unknown>,
		rawTranscription: string,
		documentType: 'invoice' | 'estimate',
		setSavedDocumentId: (id: string) => void
	): Promise<void> {
		let docId = savedDocumentId;
		if (!docId) {
			const doc = await saveDocumentAPI(getTemplateData(), rawTranscription, 'draft');
			if (!doc) {
				copyLinkStatus = 'error';
				return;
			}
			docId = doc.id;
			setSavedDocumentId(docId);
		}

		const link = await generateShareLink(docId, documentType);
		if (link) {
			try {
				await navigator.clipboard.writeText(link);
				shareLink = link;
				copyLinkStatus = 'copied';
				setTimeout(() => (copyLinkStatus = 'idle'), 3000);
			} catch {
				copyLinkStatus = 'error';
			}
		} else {
			copyLinkStatus = 'error';
		}
	}

	async function openViewLinkModal(
		savedDocumentId: string | null,
		getTemplateData: () => Record<string, unknown>,
		rawTranscription: string,
		documentType: 'invoice' | 'estimate',
		setSavedDocumentId: (id: string) => void
	): Promise<void> {
		let docId = savedDocumentId;
		if (!docId) {
			const doc = await saveDocumentAPI(getTemplateData(), rawTranscription, 'draft');
			if (!doc) return;
			docId = doc.id;
			setSavedDocumentId(docId);
		}

		const link = await generateShareLink(docId, documentType);
		if (link) {
			viewLinkUrl = link;
			showViewLinkModal = true;
			viewLinkCopied = false;
			copyLinkStatus = 'idle';
		}
	}

	async function copyViewLink(): Promise<void> {
		if (viewLinkUrl) {
			try {
				await navigator.clipboard.writeText(viewLinkUrl);
				viewLinkCopied = true;
				setTimeout(() => (viewLinkCopied = false), 3000);
			} catch {
				console.error('Failed to copy link');
			}
		}
	}

	async function updateClientContactInfo(clientId: string, email?: string, phone?: string) {
		try {
			const response = await fetch('/api/clients/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ clientId, email, phone })
			});
			if (!response.ok) {
				console.error('Failed to update client info');
				return false;
			}
			return true;
		} catch (error) {
			console.error('Update client info error:', error);
			return false;
		}
	}

	async function saveClientInfo({
		clientId,
		email,
		name
	}: {
		clientId: string;
		email?: string;
		name?: string;
	}) {
		try {
			await fetch('/api/clients/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ clientId, email, name })
			});
		} catch (error) {
			console.error('Failed to auto-save client info:', error);
		}
	}

	return {
		get shareLink() {
			return shareLink;
		},
		set shareLink(v) {
			shareLink = v;
		},
		get copyLinkStatus() {
			return copyLinkStatus;
		},
		set copyLinkStatus(v) {
			copyLinkStatus = v;
		},
		get showViewLinkModal() {
			return showViewLinkModal;
		},
		set showViewLinkModal(v) {
			showViewLinkModal = v;
		},
		get viewLinkUrl() {
			return viewLinkUrl;
		},
		set viewLinkUrl(v) {
			viewLinkUrl = v;
		},
		get viewLinkCopied() {
			return viewLinkCopied;
		},
		set viewLinkCopied(v) {
			viewLinkCopied = v;
		},
		get showMergeModal() {
			return showMergeModal;
		},
		set showMergeModal(v) {
			showMergeModal = v;
		},
		get mergeConflictData() {
			return mergeConflictData;
		},
		set mergeConflictData(v) {
			mergeConflictData = v;
		},
		get pendingSaveData() {
			return pendingSaveData;
		},
		set pendingSaveData(v) {
			pendingSaveData = v;
		},
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

// Session persistence state + logic

import type { RecentDocument } from './review-types';

export function createReviewSession() {
	let reviewSessionId = $state<string | null>(null);
	let isSavingReview = $state(false);
	let showDocumentSuggestions = $state(false);
	let recentDocuments = $state<RecentDocument[]>([]);
	let isLoadingRecentDocs = $state(false);

	let autoSaveTimeout: ReturnType<typeof setTimeout>;

	async function saveReviewSession(getSessionData: () => Record<string, unknown>) {
		if (isSavingReview) return;
		isSavingReview = true;

		try {
			const sessionData = getSessionData();

			if (reviewSessionId) {
				await fetch(`/api/reviews/${reviewSessionId}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(sessionData)
				});
			} else {
				const response = await fetch('/api/reviews', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(sessionData)
				});
				const result = await response.json();
				if (result.success) {
					reviewSessionId = result.review.id;
					history.replaceState(null, '', `/dashboard/review?session=${reviewSessionId}`);
				}
			}
		} catch (error) {
			console.error('Save review error:', error);
		} finally {
			isSavingReview = false;
		}
	}

	function autoSaveReview(getSessionData: () => Record<string, unknown>) {
		if (!reviewSessionId) return;
		clearTimeout(autoSaveTimeout);
		autoSaveTimeout = setTimeout(async () => {
			await saveReviewSession(getSessionData);
		}, 2000);
	}

	async function completeReviewSession(documentId: string, documentType: 'invoice' | 'estimate') {
		if (!reviewSessionId) return;

		try {
			// First mark as completed
			await fetch(`/api/reviews/${reviewSessionId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status: 'completed',
					createdDocumentId: documentId,
					createdDocumentType: documentType
				})
			});

			// Then delete the session to prevent it showing in dashboard
			await fetch(`/api/reviews/${reviewSessionId}`, {
				method: 'DELETE'
			});

			reviewSessionId = null;
		} catch (error) {
			console.error('Complete review error:', error);
		}
	}

	async function fetchRecentDocuments() {
		if (isLoadingRecentDocs) return;
		isLoadingRecentDocs = true;

		try {
			const response = await fetch('/api/documents/recent');
			const result = await response.json();

			if (result.success && result.documents?.length > 0) {
				recentDocuments = result.documents;
				showDocumentSuggestions = true;
			}
		} catch (error) {
			console.error('Failed to fetch recent documents:', error);
		} finally {
			isLoadingRecentDocs = false;
		}
	}

	function dismissDocumentSuggestions() {
		showDocumentSuggestions = false;
	}

	return {
		get reviewSessionId() {
			return reviewSessionId;
		},
		set reviewSessionId(v) {
			reviewSessionId = v;
		},
		get isSavingReview() {
			return isSavingReview;
		},
		get showDocumentSuggestions() {
			return showDocumentSuggestions;
		},
		set showDocumentSuggestions(v) {
			showDocumentSuggestions = v;
		},
		get recentDocuments() {
			return recentDocuments;
		},
		get isLoadingRecentDocs() {
			return isLoadingRecentDocs;
		},
		saveReviewSession,
		autoSaveReview,
		completeReviewSession,
		fetchRecentDocuments,
		dismissDocumentSuggestions
	};
}

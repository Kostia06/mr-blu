<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { t, locale } from '$lib/i18n';
	import { toast } from '$lib/stores/toast';
	import FileText from 'lucide-svelte/icons/file-text';
	import Mail from 'lucide-svelte/icons/mail';
	import Save from 'lucide-svelte/icons/save';
	import Check from 'lucide-svelte/icons/check';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import User from 'lucide-svelte/icons/user';
	import Download from 'lucide-svelte/icons/download';
	import Link from 'lucide-svelte/icons/link';
	import { onMount } from 'svelte';
	import DocumentSuggestions from '$lib/components/DocumentSuggestions.svelte';
	import type { ActionSuggestion } from '$lib/actions/types';
	import {
		ReviewHeader,
		ReviewLoadingState,
		SummaryCard,
		DoneState,
		AlertCard,
		TransformReview,
		ShareLinkModal,
		QueryResultsFlow,
		CloneDocumentFlow,
		MergeDocumentsFlow,
		SendDocumentFlow,
		ReviewPreviewCard,
		ReviewLineItems,
		ReviewActions,
		ReviewExecuteButton,
		TransformClientSelector
	} from './components';
	import ContactMergeModal from '$lib/components/modals/ContactMergeModal.svelte';

	// Extracted modules
	import type {
		ActionStep,
		LineItem,
		ParsedData,
		QueryData,
		QueryResult,
		SourceDocument,
		ItemSuggestion,
		ClientSuggestionFull,
		UserProfile,
		RecentDocument,
		IntentType
	} from './review-types';
	import { createReviewAPI } from './review-api.svelte';
	import { createTransformFlow } from './review-transform.svelte';
	import { createCloneFlow } from './review-clone.svelte';
	import { createSendFlow } from './review-send.svelte';
	import { createMergeFlow } from './review-merge.svelte';
	import { createReviewSession } from './review-session.svelte';
	import {
		handleInformationQuery,
		handleDocumentClone,
		handleDocumentMerge,
		handleDocumentSend,
		handleDocumentTransform,
		handleDocumentAction,
		handleParseError
	} from './review-intent-handlers';

	// Initialize modules
	const api = createReviewAPI();
	const transform = createTransformFlow();
	const clone = createCloneFlow();
	const merge = createMergeFlow();
	const session = createReviewSession();

	// Send flow depends on api functions
	const send = createSendFlow({
		sendDocumentAPI: api.sendDocumentAPI,
		updateClientContactInfo: api.updateClientContactInfo
	});

	// Page data from server load function
	let { data: pageData } = $props();

	// Fetch user profile
	async function fetchUserProfile(): Promise<void> {
		try {
			const response = await fetch('/api/user/profile');
			if (response.ok) {
				const result = await response.json();
				if (result.profile) {
					userProfile = result.profile;
					const p = result.profile;
					const biz = pageData.user?.user_metadata?.business;
					const fullAddress = [
						p.address || biz?.address,
						[biz?.city, biz?.state, biz?.zip].filter(Boolean).join(', ')
					]
						.filter(Boolean)
						.join('\n');
					businessInfo = {
						name: p.full_name || '',
						businessName: p.business_name || '',
						address: fullAddress,
						phone: p.phone || '',
						email: p.email || '',
						website: p.website || biz?.website || ''
					};
				}
			}
		} catch (error) {
			console.error('Failed to fetch profile:', error);
		}
	}

	// Pricing lookup state
	let isLoadingPricing = $state(false);

	async function fetchPricingSuggestions(): Promise<void> {
		const itemsWithMaterial = data.items.filter(
			(item) => item.material && item.measurementType && item.quantity > 0
		);

		if (itemsWithMaterial.length === 0) return;

		isLoadingPricing = true;

		try {
			const lookupPromises = itemsWithMaterial.map(async (item) => {
				try {
					const response = await fetch('/api/pricing/lookup', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							material: item.material,
							measurementType: item.measurementType,
							quantity: item.quantity
						})
					});

					if (response.ok) {
						const result = await response.json();
						if (result.found && result.suggestedPrice) {
							const itemIndex = data.items.findIndex((i) => i.id === item.id);
							if (itemIndex !== -1) {
								if (!data.items[itemIndex].rate || data.items[itemIndex].total === 0) {
									data.items[itemIndex] = {
										...data.items[itemIndex],
										suggestedPrice: result.suggestedPrice,
										pricingConfidence: result.confidence,
										hasPricingSuggestion: true
									};
								}
							}
						}
					}
				} catch (error) {
					console.error(`Pricing lookup failed for ${item.material}:`, error);
				}
			});

			await Promise.all(lookupPromises);
		} finally {
			isLoadingPricing = false;
		}
	}

	function applySuggestedPrice(itemId: string): void {
		const itemIndex = data.items.findIndex((i) => i.id === itemId);
		if (itemIndex !== -1 && data.items[itemIndex].suggestedPrice) {
			const suggestedPrice = data.items[itemIndex].suggestedPrice!;
			const quantity = data.items[itemIndex].quantity || 1;
			data.items[itemIndex] = {
				...data.items[itemIndex],
				total: suggestedPrice,
				rate: suggestedPrice / quantity,
				hasPricingSuggestion: false
			};
		}
	}

	function dismissPricingSuggestion(itemId: string): void {
		const itemIndex = data.items.findIndex((i) => i.id === itemId);
		if (itemIndex !== -1) {
			data.items[itemIndex] = {
				...data.items[itemIndex],
				suggestedPrice: null,
				hasPricingSuggestion: false
			};
		}
	}

	async function savePricingMemory(): Promise<void> {
		const itemsWithMaterial = data.items.filter(
			(item) => item.material && item.measurementType && item.quantity > 0 && item.total > 0
		);

		if (itemsWithMaterial.length === 0) return;

		try {
			await fetch('/api/pricing/save', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					items: itemsWithMaterial.map((item) => ({
						description: item.description,
						material: item.material,
						measurementType: item.measurementType,
						quantity: item.quantity,
						rate: item.rate,
						total: item.total
					}))
				})
			});
		} catch (error) {
			console.error('Failed to save pricing memory:', error);
		}
	}

	// State
	let isParsing = $state(true);
	let parsingStep = $state(0);
	let isExecuting = $state(false);
	let currentActionIndex = $state(-1);
	let parseError = $state<string | null>(null);
	let savedDocumentId = $state<string | null>(null);
	let generatedDocNumber = $state('');

	// Information query state
	let intentType = $state<IntentType>('document_action');
	let queryData = $state<QueryData | null>(null);
	let queryResult = $state<QueryResult | null>(null);
	let isQueryLoading = $state(false);

	// Collapsible sections state (collapsed by default)

	// Item suggestions
	let itemSuggestions = $state<ItemSuggestion[]>([]);
	let showItemSuggestions = $state(false);

	// Client suggestions state (for document creation)
	let clientSuggestions = $state<ClientSuggestionFull[]>([]);
	let exactClientMatch = $state<ClientSuggestionFull | null>(null);
	let isLoadingClientSuggestions = $state(false);
	let showClientSuggestions = $state(false);

	// AI Action Suggestions state
	let showAISuggestions = $state(false);

	// User profile
	let userProfile = $state<UserProfile | null>(null);
	let showProfileWarning = $state(false);
	let profileWarningDismissed = $state(false);

	const profileMissingFields = $derived.by(() => {
		if (!userProfile) return ['Profile not loaded'];
		const missing: string[] = [];
		if (!userProfile.business_name && !userProfile.full_name) missing.push('Business name');
		if (!userProfile.email) missing.push('Email address');
		if (!userProfile.address) missing.push('Business address');
		return missing;
	});
	const hasAnyProfileField = $derived(
		Boolean(userProfile?.business_name || userProfile?.full_name || userProfile?.email || userProfile?.address)
	);
	const isProfileComplete = $derived(profileMissingFields.length === 0);

	let businessInfo = $state({
		name: '',
		businessName: '',
		address: '',
		phone: '',
		email: '',
		website: ''
	});

	let data = $state<ParsedData>({
		documentType: 'invoice',
		client: {
			name: null,
			firstName: null,
			lastName: null,
			email: null,
			phone: null,
			address: null
		},
		items: [],
		total: 0,
		taxRate: null,
		dueDate: null,
		actions: [],
		summary: '',
		confidence: { overall: 0, client: 0, items: 0, actions: 0 }
	});

	let rawTranscription = $state('');

	// Client search dropdown state
	let showClientDropdown = $state(false);
	let clientSearchQuery = $state('');
	let clientDropdownResults = $state<ClientSuggestionFull[]>([]);
	let isSearchingClients = $state(false);

	// Action editing state
	let showActionTypePicker = $state(false);

	// Generate document number from server (sequential)
	async function generateDocNumber() {
		try {
			const type = data.documentType === 'estimate' ? 'estimate' : 'invoice';
			const res = await fetch(`/api/documents/next-number?type=${type}`);
			if (res.ok) {
				const result = await res.json();
				generatedDocNumber = result.number;
			} else {
				const prefix = data.documentType === 'estimate' ? 'EST' : 'INV';
				const year = new Date().getFullYear();
				generatedDocNumber = `${prefix}-${year}-0001`;
			}
		} catch {
			const prefix = data.documentType === 'estimate' ? 'EST' : 'INV';
			const year = new Date().getFullYear();
			generatedDocNumber = `${prefix}-${year}-0001`;
		}
	}

	const documentNumber = $derived(generatedDocNumber || 'DRAFT');

	const calculatedSubtotal = $derived(data.items.reduce((sum, item) => sum + (item.total || 0), 0));

	const calculatedTaxAmount = $derived(
		data.taxRate ? calculatedSubtotal * (data.taxRate / 100) : 0
	);

	const calculatedTotal = $derived(calculatedSubtotal + calculatedTaxAmount);

	const allActionsCompleted = $derived(
		data.actions.length > 0 && data.actions.every((a) => a.status === 'completed')
	);

	const clientFullName = $derived.by(() => {
		const firstName = data.client.firstName?.trim() || '';
		const lastName = data.client.lastName?.trim() || '';
		if (firstName && lastName) return `${firstName} ${lastName}`;
		if (firstName) return firstName;
		if (lastName) return lastName;
		return data.client.name || '';
	});

	function parseClientName(fullName: string): { firstName: string; lastName: string } {
		const trimmed = fullName.trim();
		const parts = trimmed.split(/\s+/);
		if (parts.length === 1) {
			return { firstName: parts[0], lastName: '' };
		}
		const firstName = parts[0];
		const lastName = parts.slice(1).join(' ');
		return { firstName, lastName };
	}

	$effect(() => {
		if (data.client.firstName || data.client.lastName) {
			data.client.name = clientFullName || null;
		}
	});

	// Auto-save review when data changes (debounced)
	$effect(() => {
		const _ = JSON.stringify({
			client: data.client,
			items: data.items,
			total: data.total,
			taxRate: data.taxRate,
			dueDate: data.dueDate,
			actions: data.actions
		});
		if (session.reviewSessionId && !isParsing) {
			session.autoSaveReview(getSessionData);
		}
	});

	// Session data getter for the session module
	function getSessionData(): Record<string, unknown> {
		return {
			originalTranscript: rawTranscription,
			intentType,
			parsedData:
				intentType === 'document_action'
					? data
					: intentType === 'document_clone'
						? clone.cloneData
						: queryData,
			actions: data.actions,
			queryData: queryData,
			queryResult: queryResult,
			sourceDocumentId: clone.selectedSourceDoc?.id,
			sourceDocumentType: clone.selectedSourceDoc?.type,
			confidence: data.confidence,
			summary: data.summary || queryData?.summary || clone.cloneData?.summary,
			status: allActionsCompleted ? 'completed' : 'in_progress'
		};
	}

	const validation = $derived.by(() => {
		const hasSendEmailAction = data.actions.some(
			(a) => a.type === 'send_email' && a.status === 'pending'
		);
		const hasSendSMSAction = data.actions.some(
			(a) => a.type === 'send_sms' && a.status === 'pending'
		);

		return {
			clientName: {
				valid: !!clientFullName,
				message: clientFullName ? undefined : 'Client name is required'
			},
			clientEmail: {
				valid: !hasSendEmailAction || !!data.client.email,
				message:
					hasSendEmailAction && !data.client.email
						? 'Email required for email delivery'
						: undefined,
				warning: hasSendEmailAction && !data.client.email
			},
			clientPhone: {
				valid: !hasSendSMSAction || !!data.client.phone,
				message:
					hasSendSMSAction && !data.client.phone ? 'Phone required for SMS delivery' : undefined,
				warning: hasSendSMSAction && !data.client.phone
			},
			total: {
				valid: calculatedTotal > 0,
				message: calculatedTotal <= 0 ? 'Total must be greater than $0' : undefined
			},
			items: {
				valid: data.items.length > 0,
				message: data.items.length === 0 ? 'At least one line item is required' : undefined
			}
		};
	});

	const hasValidationErrors = $derived(
		!validation.clientName.valid || !validation.total.valid || !validation.items.valid
	);

	const hasValidationWarnings = $derived(
		validation.clientEmail.warning || validation.clientPhone.warning
	);

	const canExecute = $derived(!hasValidationErrors && data.actions.length > 0);

	const validationErrors = $derived.by(() => {
		const errors: string[] = [];
		if (!validation.clientName.valid) errors.push($t('review.clientNameRequired'));
		if (!validation.items.valid) errors.push($t('review.atLeastOneItem'));
		if (!validation.total.valid) errors.push($t('review.totalMustBePositive'));
		return errors;
	});

	function showValidationErrors() {
		for (const error of validationErrors) {
			toast.error(error);
		}
	}

	const sortedActions = $derived([...data.actions].sort((a, b) => a.order - b.order));

	const actionConfig: Record<string, { icon: typeof FileText; labelKey: string; color: string }> = {
		create_document: { icon: FileText, labelKey: 'review.createDocument', color: '#0ea5e9' },
		send_email: { icon: Mail, labelKey: 'review.sendEmailAction', color: '#8b5cf6' }
	};

	function actionHasEditableData(_action: ActionStep): boolean {
		return true;
	}

	function updateActionRecipient(action: ActionStep, value: string) {
		const index = data.actions.findIndex((a) => a.id === action.id);
		if (index !== -1) {
			data.actions[index].details.recipient = value;
		}
	}

	function updateActionFrequency(action: ActionStep, frequency: string) {
		const index = data.actions.findIndex((a) => a.id === action.id);
		if (index !== -1) {
			data.actions[index].details.frequency = frequency;
		}
	}

	// Handle AI suggestion selection
	function handleSuggestionSelect(suggestion: Partial<ActionSuggestion>) {
		const newAction: ActionStep = {
			id: crypto.randomUUID(),
			type: mapSuggestionToActionType(
				suggestion.type || 'create',
				suggestion.category || 'document'
			),
			order: data.actions.length + 1,
			status: 'pending',
			details: {
				recipient: suggestion.category === 'communication' ? data.client.email || '' : undefined,
				frequency: suggestion.category === 'scheduling' ? 'monthly' : undefined
			}
		};

		data.actions = [...data.actions, newAction];
		showAISuggestions = false;
	}

	function mapSuggestionToActionType(type: string, category: string): ActionStep['type'] {
		if (category === 'communication') {
			if (type === 'send_sms') return 'send_sms';
			return 'send_email';
		}
		if (category === 'scheduling') return 'schedule';
		if (type === 'save_draft') return 'save_draft';
		return 'create_document';
	}

	// Parse with AI
	async function parseWithAI(transcription: string) {
		isParsing = true;
		parsingStep = 0;
		parseError = null;
		rawTranscription = transcription;

		setTimeout(() => {
			if (isParsing) parsingStep = 1;
		}, 500);
		setTimeout(() => {
			if (isParsing) parsingStep = 2;
		}, 1200);

		try {
			const response = await fetch('/api/ai/parse', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ transcription })
			});

			if (response.status === 429) {
				toast.error($t('error.rateLimit'), 6000);
				goToDashboard();
				return;
			}

			const result = await response.json();

			if (result.success) {
				const saveSession = () => session.saveReviewSession(getSessionData);
				const intent = result.intentType || 'document_action';

				if (intent === 'information_query') {
					isParsing = false;
					const res = await handleInformationQuery(result, {
						setQueryData: (d) => (queryData = d),
						executeQuery
					});
					intentType = res.intentType;
				} else if (intent === 'document_clone') {
					isParsing = false;
					const res = await handleDocumentClone(result, { clone, saveSession });
					intentType = res.intentType;
					if (res.parseError) parseError = res.parseError;
				} else if (intent === 'document_merge') {
					isParsing = false;
					const res = await handleDocumentMerge(result, { merge, saveSession });
					intentType = res.intentType;
				} else if (intent === 'document_send') {
					isParsing = false;
					const res = await handleDocumentSend(result, { send });
					intentType = res.intentType;
				} else if (intent === 'document_transform') {
					isParsing = false;
					const res = await handleDocumentTransform(result, { transform, saveSession });
					intentType = res.intentType;
				} else {
					const res = handleDocumentAction(result, data);
					data = res.data;
					intentType = res.intentType;
					isParsing = false;
					generateDocNumber();
					if (data.client.name) {
						await fetchClientSuggestions(data.client.name);
					}
					fetchItemSuggestions();
					fetchPricingSuggestions();
					saveSession();
					if (data.confidence?.overall < 0.7) {
						session.fetchRecentDocuments();
					}
				}
			} else {
				const res = handleParseError(result, data);
				data = res.data;
				parseError = res.parseError;
				intentType = res.intentType;
				isParsing = false;
				generateDocNumber();
			}
		} catch (error) {
			console.error('AI parsing error:', error);
			parseError = 'Failed to connect to AI service';
			intentType = 'document_action';
			data.actions = [
				{
					id: 'fallback-create',
					type: 'create_document',
					order: 1,
					status: 'pending',
					details: {}
				}
			];
			isParsing = false;
			generateDocNumber();
		}
	}

	// Execute information query
	async function executeQuery(overrideClientName?: string) {
		if (!queryData?.query) return;

		isQueryLoading = true;
		try {
			const queryToSend = overrideClientName
				? { ...queryData.query, clientName: overrideClientName }
				: queryData.query;

			const response = await fetch('/api/info/query', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: queryToSend })
			});

			const result = await response.json();
			queryResult = result;

			if (overrideClientName && queryData) {
				queryData = {
					...queryData,
					query: { ...queryData.query, clientName: overrideClientName },
					naturalLanguageQuery: queryData.naturalLanguageQuery.replace(
						queryResult?.suggestions?.searchedFor || '',
						overrideClientName
					)
				};
			}
		} catch (error) {
			console.error('Query execution error:', error);
			queryResult = {
				success: false,
				queryType: 'list',
				answer: 'Failed to execute query. Please try again.'
			};
		} finally {
			isQueryLoading = false;
		}
	}

	function useSuggestedClient(clientName: string) {
		executeQuery(clientName);
	}

	// Handle document suggestion select
	async function handleDocumentSuggestionSelect(doc: RecentDocument) {
		session.showDocumentSuggestions = false;

		try {
			const response = await fetch(`/api/documents/${doc.id}?type=${doc.document_type}`);
			const result = await response.json();

			if (result.success && result.document) {
				const fullDoc = result.document;

				data.documentType = doc.document_type;
				data.client = {
					name: fullDoc.client_name || null,
					firstName: null,
					lastName: null,
					email: fullDoc.client_email || null,
					phone: fullDoc.client_phone || null,
					address: fullDoc.client_address || null
				};

				if (fullDoc.client_name) {
					const { firstName, lastName } = parseClientName(fullDoc.client_name);
					data.client.firstName = firstName;
					data.client.lastName = lastName;
				}

				if (fullDoc.line_items && Array.isArray(fullDoc.line_items)) {
					data.items = fullDoc.line_items.map(
						(
							item: {
								description?: string;
								quantity?: number;
								unit?: string;
								rate?: number;
								total?: number;
							},
							index: number
						) => ({
							id: `item-${Date.now()}-${index}`,
							description: item.description || '',
							quantity: item.quantity || 1,
							unit: item.unit || 'unit',
							rate: item.rate || 0,
							total: item.total || 0
						})
					);
				}

				data.taxRate = fullDoc.tax_rate || null;
				generateDocNumber();
			}
		} catch (error) {
			console.error('Failed to fetch document details:', error);
		}
	}

	// Select source document for clone and apply modifications
	function selectSourceDocumentForClone(doc: SourceDocument) {
		clone.selectSourceDocument(doc);

		const { items, subtotal, total } = clone.applyCloneModifications(doc);

		const clonedClientName = clone.cloneData?.targetClient.name || '';
		const { firstName: cloneFirstName, lastName: cloneLastName } =
			parseClientName(clonedClientName);

		intentType = 'document_action';
		data = {
			documentType: doc.type === 'contract' ? 'invoice' : (doc.type as 'invoice' | 'estimate'),
			client: {
				name: clone.cloneData?.targetClient.name || null,
				firstName: cloneFirstName || null,
				lastName: cloneLastName || null,
				email: clone.cloneData?.targetClient.email || null,
				phone: clone.cloneData?.targetClient.phone || null,
				address: clone.cloneData?.targetClient.address || null
			},
			items,
			total,
			subtotal,
			taxRate: null,
			dueDate: null,
			actions: clone.cloneData?.actions || [
				{
					id: `action-${Date.now()}-0`,
					type: 'create_document',
					order: 1,
					status: 'pending',
					details: {}
				}
			],
			summary:
				clone.cloneData?.summary ||
				`Cloned from ${doc.client}'s ${doc.type} for ${clone.cloneData?.targetClient.name}`,
			confidence: { overall: 0.9, client: 0.9, items: 0.95, actions: 0.9 }
		};

		generateDocNumber();
		if (data.client.name) {
			fetchClientSuggestions(data.client.name);
		}
	}

	// Confirm merge selections and create combined document
	function confirmMergeSelections() {
		if (!merge.allMergeSourcesSelected || !merge.mergeData) return;

		const { items: combinedItems, subtotal } = merge.getCombinedMergeItems();
		const docType = merge.mergeSourceSelections[0]?.selectedDoc?.type || 'estimate';

		intentType = 'document_action';
		merge.showMergeSelection = false;

		const mergedClientName = merge.mergeData.targetClient.name || '';
		const { firstName: mergeFirstName, lastName: mergeLastName } =
			parseClientName(mergedClientName);
		data = {
			documentType: docType === 'contract' ? 'estimate' : (docType as 'invoice' | 'estimate'),
			client: {
				name: merge.mergeData.targetClient.name || null,
				firstName: mergeFirstName || null,
				lastName: mergeLastName || null,
				email: merge.mergeData.targetClient.email || null,
				phone: merge.mergeData.targetClient.phone || null,
				address: merge.mergeData.targetClient.address || null
			},
			items: combinedItems,
			total: subtotal,
			subtotal: subtotal,
			taxRate: null,
			dueDate: null,
			actions: merge.mergeData.actions || [
				{
					id: `action-${Date.now()}-0`,
					type: 'create_document',
					order: 1,
					status: 'pending',
					details: {}
				}
			],
			summary:
				merge.mergeData.summary ||
				`Merged items from ${merge.mergeSourceSelections.map((s) => s.clientName).join(' and ')} for ${merge.mergeData.targetClient.name}`,
			confidence: { overall: 0.9, client: 0.9, items: 0.95, actions: 0.9 }
		};

		generateDocNumber();
		if (data.client.name) {
			fetchClientSuggestions(data.client.name);
		}
	}

	// Fetch item suggestions
	async function fetchItemSuggestions() {
		try {
			const response = await fetch('/api/suggestions?type=items');
			const result = await response.json();
			if (result.success) {
				itemSuggestions = result.suggestions;
			}
		} catch (error) {
			console.error('Fetch item suggestions error:', error);
		}
	}

	function addItemFromSuggestion(suggestion: ItemSuggestion) {
		const newItem: LineItem = {
			id: `item-${Date.now()}-${data.items.length}`,
			description: suggestion.description,
			quantity: 1,
			unit: suggestion.unit,
			rate: suggestion.rate,
			total: suggestion.rate
		};
		data.items = [...data.items, newItem];
		showItemSuggestions = false;
	}

	async function trackUsedItems() {
		if (data.items.length === 0) return;
		try {
			await fetch('/api/suggestions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ items: data.items })
			});
		} catch (error) {
			console.error('Track items error:', error);
		}
	}

	// Fetch client suggestions for document creation
	async function fetchClientSuggestions(name: string) {
		if (!name || name.length < 2) {
			clientSuggestions = [];
			exactClientMatch = null;
			showClientSuggestions = false;
			return;
		}

		isLoadingClientSuggestions = true;
		try {
			const response = await fetch('/api/clients/suggest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, limit: 5 })
			});

			const result = await response.json();
			if (result.success) {
				clientSuggestions = result.suggestions || [];
				exactClientMatch = result.exactMatch || null;
				showClientSuggestions = clientSuggestions.length > 0 && !exactClientMatch;

				// Auto-fill client details from exact match (email, phone, address)
				if (exactClientMatch) {
					const { firstName, lastName } = parseClientName(exactClientMatch.name || '');
					data.client = {
						...data.client,
						name: exactClientMatch.name || data.client.name,
						firstName: firstName || data.client.firstName,
						lastName: lastName || data.client.lastName,
						email: exactClientMatch.email || data.client.email,
						phone: exactClientMatch.phone || data.client.phone,
						address: exactClientMatch.address || data.client.address
					};
				}
			}
		} catch (error) {
			console.error('Client suggestion error:', error);
		} finally {
			isLoadingClientSuggestions = false;
		}
	}

	function applyClientSuggestion(client: ClientSuggestionFull) {
		const { firstName, lastName } = parseClientName(client.name || '');
		data.client = {
			name: client.name,
			firstName,
			lastName,
			email: client.email,
			phone: client.phone,
			address: client.address
		};
		showClientSuggestions = false;
		clientSuggestions = [];
	}

	let clientSearchTimeout: ReturnType<typeof setTimeout>;
	async function searchClients(query: string) {
		if (clientSearchTimeout) clearTimeout(clientSearchTimeout);

		if (!query || query.length < 2) {
			clientDropdownResults = [];
			return;
		}

		clientSearchTimeout = setTimeout(async () => {
			isSearchingClients = true;
			try {
				const response = await fetch('/api/clients/suggest', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: query, limit: 10 })
				});
				if (response.ok) {
					const result = await response.json();
					if (result.success) {
						clientDropdownResults = result.suggestions || [];
					}
				}
			} catch (error) {
				console.error('Error searching clients:', error);
				clientDropdownResults = [];
			} finally {
				isSearchingClients = false;
			}
		}, 300);
	}

	function selectClientFromDropdown(client: ClientSuggestionFull) {
		const { firstName, lastName } = parseClientName(client.name || '');
		data.client = {
			name: client.name,
			firstName,
			lastName,
			email: client.email,
			phone: client.phone,
			address: client.address
		};
		showClientDropdown = false;
		clientSearchQuery = '';
		clientDropdownResults = [];
	}

	function openClientDropdown() {
		showClientDropdown = true;
		clientSearchQuery = clientFullName || '';
		if (clientSearchQuery) {
			searchClients(clientSearchQuery);
		}
	}

	// Format currency for query results
	function formatQueryAmount(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function formatQueryDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		if (days < 7) return `${days} days ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	// Get template data for PDF
	function getTemplateData() {
		const documentType: 'INVOICE' | 'ESTIMATE' =
			data.documentType === 'estimate' ? 'ESTIMATE' : 'INVOICE';

		const ensureNumber = (val: unknown): number => {
			if (typeof val === 'number' && !isNaN(val)) return val;
			if (typeof val === 'string') {
				const parsed = parseFloat(val);
				return isNaN(parsed) ? 0 : parsed;
			}
			return 0;
		};

		const cleanUnit = (item: LineItem): string => {
			const qty = ensureNumber(item.quantity);
			if (qty <= 0) return '1';

			let baseUnit = 'unit';
			if (item.unit && typeof item.unit === 'string') {
				const firstWord = item.unit.split(/[\s@$0-9]/)[0];
				if (firstWord && firstWord.length > 0 && firstWord !== 'null') {
					baseUnit = firstWord;
				}
			}

			return String(qty);
		};

		return {
			documentType,
			documentNumber: documentNumber || '',
			billTo: {
				name: data.client.name || '',
				address: data.client.address || null,
				city: null,
				phone: data.client.phone || null,
				email: data.client.email || null
			},
			from: {
				name: businessInfo.name || null,
				businessName: businessInfo.businessName || '',
				address: businessInfo.address || null,
				city: null,
				phone: businessInfo.phone || null,
				email: businessInfo.email || null,
				website: businessInfo.website || null
			},
			items: data.items.map((item) => {
				let dims: string | undefined;
				const rawDims = item.dimensions as unknown;
				if (typeof rawDims === 'string') {
					dims = rawDims.includes('undefined') ? undefined : rawDims;
				} else if (item.dimensions?.width && item.dimensions?.length) {
					dims = `${item.dimensions.width} × ${item.dimensions.length} ${item.dimensions.unit || 'ft'}`;
				}
				return {
					id: item.id || '',
					description: item.description || '',
					quantity: ensureNumber(item.quantity) || 1,
					unit: cleanUnit(item),
					rate: ensureNumber(item.rate),
					total: ensureNumber(item.total),
					measurementType: item.measurementType || undefined,
					dimensions: dims
				};
			}),
			subtotal: ensureNumber(calculatedSubtotal),
			gstRate: ensureNumber(data.taxRate) / 100,
			gstAmount: ensureNumber(calculatedTaxAmount),
			total: ensureNumber(calculatedTotal),
			date: new Date().toISOString().split('T')[0],
			dueDate: data.dueDate || null
		};
	}

	// Download PDF
	async function handleDownloadPDF() {
		try {
			const tpl = getTemplateData();
			const documentData = {
				documentType: tpl.documentType,
				documentNumber: tpl.documentNumber,
				client: {
					name: tpl.billTo.name,
					email: tpl.billTo.email,
					phone: tpl.billTo.phone,
					address: tpl.billTo.address
				},
				from: {
					businessName: tpl.from.businessName,
					email: tpl.from.email,
					phone: tpl.from.phone,
					address: tpl.from.address,
					website: tpl.from.website
				},
				lineItems: tpl.items.map(
					(item: {
						description: string;
						quantity: number;
						unit: string;
						rate: number;
						total: number;
						measurementType?: string;
						dimensions?: string;
					}) => ({
						description: item.description,
						quantity: item.quantity,
						unit: item.unit,
						rate: item.rate,
						total: item.total,
						measurementType: item.measurementType,
						dimensions: item.dimensions
					})
				),
				subtotal: tpl.subtotal,
				taxRate: tpl.gstRate * 100,
				taxAmount: tpl.gstAmount,
				total: tpl.total,
				date: tpl.date,
				dueDate: tpl.dueDate
			};

			const response = await fetch('/api/documents/pdf', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(documentData)
			});

			if (!response.ok) throw new Error('PDF generation failed');

			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const link = window.document.createElement('a');
			link.href = url;
			link.download = `${tpl.documentType}-${tpl.documentNumber || 'document'}.pdf`;
			window.document.body.appendChild(link);
			link.click();
			window.document.body.removeChild(link);
			URL.revokeObjectURL(url);
			toast.success('PDF downloaded');
		} catch (error) {
			console.error('Failed to generate PDF:', error);
			toast.error('Failed to generate PDF');
		}
	}

	// Execute single action
	async function executeAction(action: ActionStep) {
		const index = data.actions.findIndex((a) => a.id === action.id);
		if (index === -1) return;

		currentActionIndex = index;
		data.actions[index].status = 'in_progress';
		data.actions[index].error = undefined;

		try {
			switch (action.type) {
				case 'create_document':
					const savedDoc = await api.saveDocumentAPI(getTemplateData(), rawTranscription, 'draft');
					if (savedDoc) {
						savedDocumentId = savedDoc.id;
					} else {
						throw new Error('Failed to save document');
					}
					break;

				case 'send_email':
					if (!hasAnyProfileField && !profileWarningDismissed) {
						showProfileWarning = true;
						data.actions[index].status = 'pending';
						currentActionIndex = -1;
						return;
					}
					showProfileWarning = false;

					const emailRecipient = action.details.recipient || data.client.email;
					if (!emailRecipient) {
						throw new Error('Email address is required');
					}
					if (!savedDocumentId) {
						const doc = await api.saveDocumentAPI(getTemplateData(), rawTranscription, 'sent');
						if (doc) savedDocumentId = doc.id;
					}
					if (savedDocumentId) {
						const emailResult = await api.sendDocumentAPI(savedDocumentId, data.documentType, 'email', {
							email: emailRecipient
						});
						if (!emailResult.success) {
							throw new Error(emailResult.error || 'Failed to send email');
						}
					}
					break;

				case 'send_sms':
					const smsRecipient = action.details.recipient || data.client.phone;
					if (!smsRecipient) {
						throw new Error('Phone number is required');
					}
					if (!savedDocumentId) {
						const doc = await api.saveDocumentAPI(getTemplateData(), rawTranscription, 'sent');
						if (doc) savedDocumentId = doc.id;
					}
					if (savedDocumentId) {
						const smsResult = await api.sendDocumentAPI(savedDocumentId, data.documentType, 'sms', {
							phone: smsRecipient
						});
						if (!smsResult.success) {
							throw new Error(smsResult.error || 'Failed to send SMS');
						}
					}
					break;

				case 'schedule':
					await new Promise((r) => setTimeout(r, 1000));
					break;

				case 'save_draft':
					if (!savedDocumentId) {
						const doc = await api.saveDocumentAPI(getTemplateData(), rawTranscription, 'draft');
						if (doc) {
							savedDocumentId = doc.id;
						} else {
							throw new Error('Failed to save draft');
						}
					}
					break;
			}
			data.actions[index].status = 'completed';
			const toastMessages: Record<string, string> = {
				create_document: 'Document created',
				send_email: 'Email sent',
				send_sms: 'SMS sent',
				save_draft: 'Draft saved',
				schedule: 'Scheduled'
			};
			if (toastMessages[action.type]) {
				toast.success(toastMessages[action.type]);
			}
			if (['create_document', 'send_email', 'send_sms', 'save_draft'].includes(action.type)) {
				savePricingMemory();
			}
		} catch (error) {
			console.error('Action failed:', error);
			const errorMessage = error instanceof Error ? error.message : 'Action failed';
			data.actions[index].status = 'failed';
			data.actions[index].error = errorMessage;
			toast.error(errorMessage);
		}

		currentActionIndex = -1;
	}

	async function executeAllActions() {
		if (!canExecute) return;
		isExecuting = true;

		for (const action of sortedActions) {
			if (action.status === 'pending' || action.status === 'failed') {
				await executeAction(action);
			}
		}

		isExecuting = false;

		// Complete the review session whenever a document was created, regardless of other actions
		if (savedDocumentId) {
			await session.completeReviewSession(savedDocumentId, data.documentType);
		}
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Navigate to dashboard with data invalidation to ensure fresh state
	async function goToDashboard() {
		await invalidateAll();
		goto('/dashboard');
	}

	function getActionDescription(action: ActionStep): string {
		switch (action.type) {
			case 'create_document': {
				const key = data.documentType === 'estimate' ? 'review.estimateFor' : 'review.invoiceFor';
				return $t(key).replace('{amount}', formatCurrency(calculatedTotal));
			}
			case 'send_email': {
				const email = action.details.recipient || data.client.email;
				return email || $t('review.tapEditEmail');
			}
			case 'send_sms': {
				const phone = action.details.recipient || data.client.phone;
				return phone || $t('review.tapEditPhone');
			}
			case 'schedule':
				return action.details.frequency
					? `${action.details.frequency.charAt(0).toUpperCase() + action.details.frequency.slice(1)}`
					: $t('review.tapEditFrequency');
			case 'save_draft':
				return $t('review.saveForLater');
			default:
				return '';
		}
	}

	function retryAction(action: ActionStep) {
		const index = data.actions.findIndex((a) => a.id === action.id);
		if (index === -1) return;

		const needsEmail = action.type === 'send_email' && !action.details.recipient && !data.client.email;
		const needsPhone = action.type === 'send_sms' && !action.details.recipient && !data.client.phone;

		if (needsEmail || needsPhone) return;

		data.actions[index].status = 'pending';
		data.actions[index].error = undefined;
		executeAction(data.actions[index]);
	}

	function addAction(type: ActionStep['type']) {
		const newAction: ActionStep = {
			id: crypto.randomUUID(),
			type,
			order: data.actions.length + 1,
			status: 'pending',
			details: {
				recipient:
					type === 'send_email'
						? data.client.email || ''
						: type === 'send_sms'
							? data.client.phone || ''
							: '',
				frequency: type === 'schedule' ? 'once' : '',
				message: ''
			}
		};
		data.actions = [...data.actions, newAction];
		showActionTypePicker = false;
	}

	function addItem() {
		data.items = [
			...data.items,
			{
				id: `item-${Date.now()}`,
				description: '',
				quantity: 1,
				unit: 'unit',
				rate: 0,
				total: 0
			}
		];
	}

	function removeItem(id: string) {
		data.items = data.items.filter((item) => item.id !== id);
	}

	function updateItemTotal(item: LineItem) {
		item.total = item.quantity * item.rate;
	}

	function updateDimensionsQuantity(item: LineItem) {
		if (item.dimensions?.width && item.dimensions?.length) {
			item.quantity = item.dimensions.width * item.dimensions.length;
			updateItemTotal(item);
		}
	}

	function saveSendStateAndNavigate(url: string) {
		if (intentType === 'document_send' && send.sendDocument) {
			const sendState = {
				intentType,
				sendData: send.sendData,
				sendDocument: send.sendDocument,
				sendClientInfo: send.sendClientInfo,
				editableSendEmail: send.editableSendEmail,
				editableSendPhone: send.editableSendPhone
			};
			sessionStorage.setItem('review_send_state', JSON.stringify(sendState));
		}
		goto(url);
	}

	// On mount
	onMount(async () => {
		fetchUserProfile();

		// Check if returning from document view (document_send flow)
		const savedSendState = sessionStorage.getItem('review_send_state');

		if (savedSendState) {
			try {
				const state = JSON.parse(savedSendState);
				intentType = state.intentType || 'document_send';
				send.sendData = state.sendData;
				send.sendDocument = state.sendDocument;
				send.sendClientInfo = state.sendClientInfo;
				send.editableSendEmail = state.editableSendEmail || '';
				send.editableSendPhone = state.editableSendPhone || '';
				isParsing = false;
				sessionStorage.removeItem('review_send_state');
				return;
			} catch (e) {
				console.error('Error restoring send state:', e);
				sessionStorage.removeItem('review_send_state');
			}
		}

		if (pageData.entryMode === 'resume' && pageData.reviewSession) {
			const review = pageData.reviewSession;
			session.reviewSessionId = review.id;
			rawTranscription = review.original_transcript || '';
			intentType = review.intent_type || 'document_action';

			if (review.parsed_data) {
				if (intentType === 'document_action') {
					data = review.parsed_data;
					generateDocNumber();
				} else if (intentType === 'information_query') {
					queryData = review.parsed_data;
					if (review.query_result) {
						queryResult = review.query_result;
					}
				} else if (intentType === 'document_clone') {
					clone.cloneData = review.parsed_data;
					if (clone.cloneData?.sourceClient) {
						await clone.searchSourceDocuments(
							clone.cloneData.sourceClient,
							clone.cloneData.documentType || undefined
						);
					}
				}
			}

			if (review.actions) {
				data.actions = review.actions;
			}

			isParsing = false;
		} else if (pageData.entryMode === 'legacy_resume') {
			const storedReview = sessionStorage.getItem('resume_review');

			if (storedReview) {
				try {
					const review = JSON.parse(storedReview);
					session.reviewSessionId = review.id;
					rawTranscription = review.original_transcript || '';
					intentType = review.intent_type || 'document_action';

					if (review.parsed_data) {
						if (intentType === 'document_action') {
							data = review.parsed_data;
							generateDocNumber();
						} else if (intentType === 'information_query') {
							queryData = review.parsed_data;
							if (review.query_result) {
								queryResult = review.query_result;
							}
						} else if (intentType === 'document_clone') {
							clone.cloneData = review.parsed_data;
							if (clone.cloneData?.sourceClient) {
								await clone.searchSourceDocuments(
									clone.cloneData.sourceClient,
									clone.cloneData.documentType || undefined
								);
							}
						}
					}

					if (review.actions) {
						data.actions = review.actions;
					}

					isParsing = false;
					sessionStorage.removeItem('resume_review');
				} catch (e) {
					console.error('Error resuming review:', e);
					isParsing = false;
					parseError = 'Failed to resume review.';
				}
			} else {
				isParsing = false;
				parseError = 'Session expired. Please try again.';
			}
		} else if (pageData.entryMode === 'new' && pageData.transcript) {
			await parseWithAI(decodeURIComponent(pageData.transcript));
		} else if (pageData.entryMode === 'sessionStorage' || !pageData.entryMode) {
			const savedTranscript = sessionStorage.getItem('review_transcript');
			if (savedTranscript) {
				sessionStorage.removeItem('review_transcript');
				await parseWithAI(savedTranscript);
			} else {
				goToDashboard();
				return;
			}
		}

		fetchItemSuggestions();
	});
</script>

<main class="review-page">
	<!-- Header -->
	<ReviewHeader onBack={() => goToDashboard()} />

	{#if isParsing}
		<!-- Parsing State - Step-based processing UI -->
		<ReviewLoadingState currentStep={parsingStep} />
	{:else if intentType === 'information_query'}
		<!-- Information Query Results -->
		<QueryResultsFlow
			{queryData}
			{queryResult}
			isLoading={isQueryLoading}
			onSelectClient={useSuggestedClient}
		/>
	{:else if intentType === 'document_clone' && !clone.selectedSourceDoc}
		<!-- Document Clone - Select Source -->
		<CloneDocumentFlow
			cloneData={clone.cloneData}
			sourceDocuments={clone.sourceDocuments}
			isSearching={clone.isSearchingDocs}
			clientSuggestions={clone.cloneClientSuggestions}
			onSelectDocument={selectSourceDocumentForClone}
			onSelectClient={clone.useCloneSuggestedClient}
		/>
	{:else if intentType === 'document_merge' && merge.showMergeSelection}
		<!-- Document Merge - Select Sources -->
		<MergeDocumentsFlow
			mergeData={merge.mergeData}
			mergeSourceSelections={merge.mergeSourceSelections}
			onSelectDocument={merge.selectMergeSourceDocument}
			onConfirmMerge={confirmMergeSelections}
		/>
	{:else if intentType === 'document_send'}
		<!-- Document Send Flow -->
		<SendDocumentFlow
			sendData={send.sendData}
			sendDocument={send.sendDocument}
			sendClientInfo={send.sendClientInfo}
			isSendingDocument={send.isSendingDocument}
			sendError={send.sendError}
			sendSuccess={send.sendSuccess}
			onExecuteSend={send.executeSendDocument}
			onLoadDocumentForEditing={send.loadSendDocumentForEditing}
			onSaveDocumentChanges={send.saveSendDocumentChanges}
		/>
	{:else if intentType === 'document_transform'}
		<!-- Document Transform Flow -->
		<div class="content">
			{#if transform.transformSuccess && transform.transformResult}
				<!-- Transform Success State -->
				<DoneState
					title="Transform Complete!"
					message="{transform.transformResult.documentsCreated} document{transform.transformResult
						.documentsCreated !== 1
						? 's'
						: ''} created successfully"
					onViewDocuments={() => goto('/dashboard/documents')}
					onNewRecording={() => goToDashboard()}
				/>
			{:else if transform.isSearchingTransformSource || isParsing}
				<!-- Loading State -->
				<ReviewLoadingState
					message={isParsing ? undefined : 'Finding source document...'}
					currentStep={isParsing ? parsingStep : 0}
				/>
			{:else if transform.transformError && !transform.transformSourceDoc}
				<!-- Error Finding Source - With Suggestions -->
				{@const bestMatch =
					transform.transformClientSuggestions.length > 0 &&
					transform.transformClientSuggestions[0].similarity >= 0.5
						? transform.transformClientSuggestions[0]
						: null}

				<!-- Alert Card -->
				<AlertCard
					variant="warning"
					title="Client not found"
					message="{transform.transformSearchedClient || 'Unknown'} - select a client below"
				/>

				<!-- Client Selection Component -->
				<TransformClientSelector
					suggestions={transform.transformClientSuggestions}
					{bestMatch}
					searchedDocType={transform.transformSearchedDocType}
					bind:manualSearchQuery={transform.manualClientSearchQuery}
					manualSearchResults={transform.manualClientSearchResults}
					isSearching={transform.isSearchingManualClient}
					onSelectClient={transform.retryTransformWithClient}
					onSearch={transform.handleManualClientSearch}
					onBack={() => goToDashboard()}
				/>
			{:else if transform.transformSourceDoc}
				<!-- Transform Review Component -->
				<TransformReview
					sourceDocument={{
						id: transform.transformSourceDoc.id,
						type: transform.transformSourceDoc.type,
						number: transform.transformSourceDoc.number,
						total: transform.transformSourceDoc.total,
						clientName: transform.transformSourceDoc.clientName,
						items: transform.transformSourceDoc.items
					}}
					initialConversion={{
						enabled: transform.transformData?.conversion?.enabled || false,
						targetType:
							transform.transformData?.conversion?.targetType ||
							(transform.transformSourceDoc.type === 'estimate' ? 'invoice' : 'estimate')
					}}
					initialSplit={{
						enabled: transform.transformData?.split?.enabled || false,
						numberOfParts: transform.transformData?.split?.numberOfParts || 2,
						method: transform.transformData?.split?.splitMethod || 'equal'
					}}
					initialSchedule={{
						enabled: transform.transformData?.schedule?.enabled || false,
						frequency: transform.transformData?.schedule?.frequency || null,
						startDate: transform.transformData?.schedule?.startDate
							? new Date(transform.transformData.schedule.startDate)
							: null,
						sendFirst: transform.transformData?.schedule?.sendFirst ?? true
					}}
					onExecute={transform.handleExecuteTransform}
					onBack={() => goToDashboard()}
					isExecuting={transform.isExecutingTransform}
					error={transform.transformError}
				/>
			{:else}
				<!-- Fallback -->
				<div class="send-error-state">
					<AlertCircle size={32} />
					<h3>{$t('review.somethingWentWrong')}</h3>
					<p>{$t('review.unableToLoad')}</p>
					<button class="btn primary" onclick={() => goToDashboard()}>
						{$t('common.back')}
					</button>
				</div>
			{/if}
		</div>
	{:else if allActionsCompleted}
		<!-- All Done State -->
		<DoneState
			documentId={savedDocumentId}
			documentType={data.documentType}
			onDownload={() => handleDownloadPDF()}
			onNewRecording={() => goToDashboard()}
		/>
	{:else}
		<!-- Main Content -->
		<div class="content">
			<!-- AI Summary Card -->
			<SummaryCard summary={data.summary || 'Processing your request...'} />

			<!-- Document Suggestions when AI confidence is low -->
			{#if session.showDocumentSuggestions && session.recentDocuments.length > 0}
				<DocumentSuggestions
					documents={session.recentDocuments}
					onSelect={handleDocumentSuggestionSelect}
					onDismiss={session.dismissDocumentSuggestions}
				/>
			{/if}

			<!-- Document Preview Card -->
			<ReviewPreviewCard
				bind:data
				{documentNumber}
				{calculatedTotal}
				{exactClientMatch}
				{clientSuggestions}
				bind:showClientSuggestions
				{clientFullName}
				{formatCurrency}
				onSearchClients={searchClients}
				onSelectClientFromDropdown={selectClientFromDropdown}
				onApplyClientSuggestion={applyClientSuggestion}
				onParseClientName={parseClientName}
				onDocNumberChange={(n) => (generatedDocNumber = n)}
				onSaveClientInfo={api.saveClientInfo}
			/>

			<!-- Line Items Section -->
			<ReviewLineItems
				bind:items={data.items}
				bind:taxRate={data.taxRate}
				{calculatedSubtotal}
				{calculatedTaxAmount}
				{calculatedTotal}
				{formatCurrency}
				onAddItem={addItem}
				onRemoveItem={removeItem}
				onUpdateItemTotal={updateItemTotal}
				onUpdateDimensionsQuantity={updateDimensionsQuantity}
				onApplySuggestedPrice={applySuggestedPrice}
				onDismissPricingSuggestion={dismissPricingSuggestion}
			/>

			<!-- Action Steps -->
			<ReviewActions
				bind:data
				bind:actions={data.actions}
				{actionConfig}
				{isExecuting}
				{hasValidationErrors}
				{calculatedTotal}
				{formatCurrency}
				bind:showProfileWarning
				{profileMissingFields}
				copyLinkStatus={api.copyLinkStatus}
				{sortedActions}
				reviewSessionId={session.reviewSessionId}
				onSaveSession={() => session.saveReviewSession(getSessionData)}
				onExecuteAction={executeAction}
				onRetryAction={retryAction}
				onAddAction={addAction}
				onHandleDownloadPDF={handleDownloadPDF}
				onSaveDocument={async (actionId) => {
					const doc = await api.saveDocumentAPI(getTemplateData(), rawTranscription, 'draft');
					if (doc) {
						savedDocumentId = doc.id;
						const idx = data.actions.findIndex((a) => a.id === actionId);
						if (idx !== -1) data.actions[idx].status = 'completed';
						// Complete and delete the review session
						await session.completeReviewSession(doc.id, data.documentType);
					}
				}}
				onOpenViewLinkModal={() =>
					api.openViewLinkModal(
						savedDocumentId,
						getTemplateData,
						rawTranscription,
						data.documentType,
						(id) => (savedDocumentId = id)
					)}
				onGetActionDescription={getActionDescription}
				onActionHasEditableData={actionHasEditableData}
				onUpdateActionRecipient={updateActionRecipient}
				onUpdateActionFrequency={updateActionFrequency}
				onDismissProfileWarning={() => (profileWarningDismissed = true)}
			/>
		</div>

		<!-- Execute Button -->
		<ReviewExecuteButton {isExecuting} {canExecute} onExecute={executeAllActions} onLockedClick={showValidationErrors} />
	{/if}
</main>

<!-- Share Link Modal -->
<ShareLinkModal
	open={api.showViewLinkModal}
	linkUrl={api.viewLinkUrl}
	documentType={data.documentType}
	onClose={() => (api.showViewLinkModal = false)}
/>

<!-- Contact Merge Modal -->
<ContactMergeModal
	bind:open={api.showMergeModal}
	conflictData={api.mergeConflictData}
	onClose={() => {
		api.showMergeModal = false;
		api.mergeConflictData = null;
		api.pendingSaveData = null;
	}}
	onDecision={api.handleMergeDecision}
/>

<style>
	.review-page {
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		padding-bottom: env(safe-area-inset-bottom, 0);
		background: transparent;
	}

	/* Content */
	.content {
		flex: 1;
		padding: var(--page-padding-x);
		padding-bottom: calc(100px + env(safe-area-inset-bottom, 0));
		max-width: var(--page-max-width);
		margin: 0 auto;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--section-gap);
	}

	/* Preview Card */

	/* Client + Total side by side */

	/* Client editing form */

	/* Inline search results */

	/* Inline Warning Icons */

	.btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 14px 24px;
		border-radius: 14px;
		font-size: 15px;
		font-weight: 600;
		transition: all 0.2s ease;
	}

	.btn.primary {
		background: linear-gradient(135deg, #0066ff 0%, #0ea5e9 100%);
		color: white;
		box-shadow: 0 4px 20px rgba(0, 102, 255, 0.3);
	}

	/* Spinning animation */
	:global(.spinning) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	:global(.hint-icon) {
		color: var(--gray-300);
	}

	/* Send Error State */
	.send-error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
		padding: var(--space-8) var(--space-4);
		text-align: center;
		color: var(--gray-500);
	}

	.send-error-state h3 {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		color: var(--gray-900);
	}

	.send-error-state p {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--gray-500);
	}

	.send-error-state :global(svg) {
		color: var(--data-amber);
	}

	/* Items Label */
</style>

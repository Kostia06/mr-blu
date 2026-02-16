<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { goto, invalidateAll } from '$app/navigation';
	import FileText from 'lucide-svelte/icons/file-text';
	import Receipt from 'lucide-svelte/icons/receipt';
	import Search from 'lucide-svelte/icons/search';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Calculator from 'lucide-svelte/icons/calculator';
	import X from 'lucide-svelte/icons/x';
	import Mic from 'lucide-svelte/icons/mic';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Pencil from 'lucide-svelte/icons/pencil';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import { onMount } from 'svelte';
	import { t, locale } from '$lib/i18n';
	import { pageTransition } from '$lib/stores/pageTransition';
	import DeleteConfirmModal from '$lib/components/modals/DeleteConfirmModal.svelte';
	import QuickSendModal from '$lib/components/modals/QuickSendModal.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import SwipeableCard from '$lib/components/gestures/SwipeableCard.svelte';
	import DocumentListSkeleton from '$lib/components/documents/DocumentListSkeleton.svelte';
	import { groupDocumentsByMonth, formatSmartTime } from '$lib/utils/format';

	interface LineItem {
		description?: string;
		quantity?: number;
		rate?: number;
		total?: number;
	}

	interface Document {
		id: string;
		type: 'invoice' | 'estimate' | 'contract';
		documentType: string;
		documentNumber?: string;
		title: string;
		client: string;
		clientEmail?: string | null;
		date: string;
		createdAt: string;
		updatedAt: string;
		sentAt: string | null;
		amount?: number;
		status: string;
		lineItems?: LineItem[];
	}

	interface Summaries {
		totalInvoices: number;
		totalEstimates: number;
		totalContracts: number;
		clients: string[];
	}

	let { data } = $props();

	// Desktop detection for showing action buttons instead of swipe
	let isDesktop = $state(false);

	onMount(() => {
		const checkDesktop = () => {
			isDesktop = window.innerWidth >= 768;
		};
		checkDesktop();
		window.addEventListener('resize', checkDesktop);
		return () => window.removeEventListener('resize', checkDesktop);
	});

	// Loading state for skeleton
	let isLoading = $state(false);

	// Modal states
	let showDeleteModal = $state(false);
	let showSendModal = $state(false);
	let selectedDocument = $state<Document | null>(null);
	let searchQuery = $state('');
	let statusFilter = $state<string | null>(null);
	let sortBy = $state<'date' | 'amount' | 'client' | 'status'>('date');
	let sortOrder = $state<'asc' | 'desc'>('desc');

	// Collapsible month sections
	let collapsedMonths = $state<Set<string>>(new Set());

	function toggleMonth(month: string) {
		if (collapsedMonths.has(month)) {
			collapsedMonths.delete(month);
		} else {
			collapsedMonths.add(month);
		}
		collapsedMonths = new Set(collapsedMonths); // Trigger reactivity
	}

	// Type filter using Tabs (synced with URL param via data)
	let typeFilter = $derived(data.activeType || 'all');

	// Tab options for type filter
	const typeTabs = $derived([
		{ id: 'all', label: $t('documents.allTab') },
		{ id: 'invoice', label: $t('documents.invoicesTab') },
		{ id: 'estimate', label: $t('documents.estimatesTab') }
	]);

	// Handle tab change
	function handleTypeChange(tabId: string) {
		if (tabId === 'all') {
			goto('/dashboard/documents', { replaceState: true });
		} else {
			goto(`/dashboard/documents?type=${tabId}`, { replaceState: true });
		}
	}

	// Smart search that parses natural language queries
	function parseSearchQuery(query: string) {
		const lowerQuery = query.toLowerCase();
		let parsedType: string | null = null;
		let parsedClient: string | null = null;
		let parsedStatus: string | null = null;
		let remainingQuery = query;

		// Parse document type
		if (lowerQuery.includes('estimate') || lowerQuery.includes('presupuesto')) {
			parsedType = 'estimate';
			remainingQuery = remainingQuery.replace(/estimates?|presupuestos?/gi, '').trim();
		} else if (lowerQuery.includes('invoice') || lowerQuery.includes('factura')) {
			parsedType = 'invoice';
			remainingQuery = remainingQuery.replace(/invoices?|facturas?/gi, '').trim();
		} else if (lowerQuery.includes('contract') || lowerQuery.includes('contrato')) {
			parsedType = 'contract';
			remainingQuery = remainingQuery.replace(/contracts?|contratos?/gi, '').trim();
		}

		// Parse status
		const statusKeywords = ['draft', 'sent', 'paid', 'pending', 'overdue', 'signed', 'borrador', 'enviado', 'pagado', 'pendiente', 'vencido', 'firmado'];
		for (const status of statusKeywords) {
			if (lowerQuery.includes(status)) {
				// Map Spanish to English status
				const statusMap: Record<string, string> = {
					'borrador': 'draft',
					'enviado': 'sent',
					'pagado': 'paid',
					'pendiente': 'pending',
					'vencido': 'overdue',
					'firmado': 'signed'
				};
				parsedStatus = statusMap[status] || status;
				remainingQuery = remainingQuery.replace(new RegExp(status, 'gi'), '').trim();
				break;
			}
		}

		// Parse client
		const clientPatterns = [/(?:to|for|from|para|de)\s+(\w+)/i, /client[:\s]+(\w+)/i, /cliente[:\s]+(\w+)/i];
		for (const pattern of clientPatterns) {
			const match = remainingQuery.match(pattern);
			if (match) {
				parsedClient = match[1];
				remainingQuery = remainingQuery.replace(match[0], '').trim();
				break;
			}
		}

		// Clean up remaining query
		remainingQuery = remainingQuery
			.replace(/\b(sent|was|were|that|the|all|show|find|get|buscar|mostrar|todos|enviados?)\b/gi, '')
			.trim();

		return {
			type: parsedType,
			client: parsedClient,
			status: parsedStatus,
			textQuery: remainingQuery
		};
	}

	const filteredDocs = $derived(() => {
		const parsed = parseSearchQuery(searchQuery);

		const filtered = data.documents.filter((doc: Document) => {
			// Tab filter (unless search specifies type)
			const effectiveType = parsed.type || (typeFilter !== 'all' ? typeFilter : null);
			const matchesTab = !effectiveType || doc.type === effectiveType;

			// Status filter (from dropdown or search)
			const effectiveStatus = parsed.status || statusFilter;
			const matchesStatus = !effectiveStatus || doc.status === effectiveStatus;

			// Client filter from search
			const matchesClient =
				!parsed.client || doc.client.toLowerCase().includes(parsed.client.toLowerCase());

			// Comprehensive text search
			if (parsed.textQuery) {
				const query = parsed.textQuery.toLowerCase();

				// Search by title
				const matchesTitle = doc.title.toLowerCase().includes(query);

				// Search by client name
				const matchesClientText = doc.client.toLowerCase().includes(query);

				// Search by document number (EST-2026-0001, INV-2026-0002, etc.)
				const docNumber = getDocNumber(doc).toLowerCase();
				const matchesDocNumber = docNumber.includes(query);

				// Search by amount (e.g., "500", "$500", "6318")
				const amountStr = doc.amount ? doc.amount.toString() : '';
				const matchesAmount = amountStr.includes(query.replace(/[$,]/g, ''));

				// Search by date (e.g., "january", "jan", "2026", "01/30")
				const dateObj = new Date(doc.date);
				const dateFormats = [
					dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toLowerCase(),
					dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase(),
					dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toLowerCase(),
					dateObj.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }).toLowerCase(),
					dateObj.getFullYear().toString(),
					(dateObj.getMonth() + 1).toString().padStart(2, '0'),
					dateObj.getDate().toString()
				];
				const matchesDate = dateFormats.some((fmt) => fmt.includes(query));

				// Search by line item descriptions
				const matchesLineItems = doc.lineItems?.some(
					(item) => item.description && item.description.toLowerCase().includes(query)
				);

				// Match if any search criteria matches
				const matchesText =
					matchesTitle ||
					matchesClientText ||
					matchesDocNumber ||
					matchesAmount ||
					matchesDate ||
					matchesLineItems;

				if (!matchesText) return false;
			}

			return matchesTab && matchesStatus && matchesClient;
		});

		// Sort the filtered results
		return filtered.sort((a: Document, b: Document) => {
			let comparison = 0;
			switch (sortBy) {
				case 'date':
					comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
					break;
				case 'amount':
					comparison = (b.amount || 0) - (a.amount || 0);
					break;
				case 'client':
					comparison = a.client.localeCompare(b.client);
					break;
				case 'status':
					comparison = a.status.localeCompare(b.status);
					break;
			}
			return sortOrder === 'desc' ? comparison : -comparison;
		});
	});

	// Grouped documents by month
	const groupedDocs = $derived(() => {
		return groupDocumentsByMonth(filteredDocs(), $locale);
	});

	function formatAmount(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Generate document number display
	function getDocNumber(doc: Document): string {
		if (doc.documentNumber) return doc.documentNumber;
		const prefix = doc.type === 'invoice' ? 'INV' : doc.type === 'estimate' ? 'EST' : 'CON';
		const year = new Date(doc.date).getFullYear();
		// Use last 4 chars of ID
		const suffix = doc.id.slice(-4).toUpperCase();
		return `${prefix}-${year}-${suffix}`;
	}

	function clearFilters() {
		statusFilter = null;
		searchQuery = '';
	}

	const hasActiveFilters = $derived(statusFilter !== null || searchQuery !== '');


	// Swipe handlers
	function openDeleteModal(doc: Document) {
		selectedDocument = doc;
		showDeleteModal = true;
	}

	function openSendModal(doc: Document) {
		if (['sent', 'paid'].includes(doc.status)) return;
		selectedDocument = doc;
		showSendModal = true;
	}

	async function handleDelete(documentId: string, documentType: string) {
		// Optimistically remove from local data
		data.documents = data.documents.filter((d) => d.id !== documentId);

		// Fire API delete in background
		fetch(`/api/documents/${documentId}?type=${documentType}`, {
			method: 'DELETE'
		}).then((response) => {
			if (!response.ok) {
				console.error('Failed to delete document');
			}
			invalidateAll();
		});
	}

	function handleSendSuccess() {
		// Refresh the page data to update status
		invalidateAll();
	}
</script>

<div class="documents-page">
	<!-- Header (Settings style - centered title) -->
	<header class="page-header" in:fly={{ y: -20, duration: 400, easing: cubicOut }}>
		<button
			class="back-btn"
			onclick={() => pageTransition.navigate('/dashboard')}
			aria-label={$t('common.back')}
		>
			<ChevronLeft size={22} strokeWidth={2} />
		</button>
		<h1 class="page-title">{$t('documents.title')}</h1>
		<div class="header-spacer"></div>
	</header>

	<!-- Search -->
	<div class="search-wrapper">
		<span class="search-icon">
			<Search size={16} strokeWidth={2} />
		</span>
		<input
			type="text"
			placeholder={$t('documents.searchPlaceholder')}
			bind:value={searchQuery}
			class="search-input"
		/>
		{#if searchQuery}
			<button
				class="clear-search"
				onclick={() => (searchQuery = '')}
				aria-label={$t('documents.clearSearch')}
			>
				<X size={14} />
			</button>
		{/if}
	</div>

	<!-- Type Filter Tabs (iOS Segmented Control Style) -->
	<div class="type-tabs-wrapper">
		<Tabs
			tabs={typeTabs}
			bind:activeTab={typeFilter}
			variant="pills"
			fullWidth
			size="sm"
			onchange={handleTypeChange}
		/>
	</div>


	<!-- Document List -->
	<div class="content-scroll">
		{#if isLoading}
			<DocumentListSkeleton count={5} />
		{:else if filteredDocs().length === 0}
			<div class="empty-state">
				<div class="empty-icon">
					<FileText size={48} strokeWidth={1.5} />
				</div>
				<h3 class="empty-title">
					{#if hasActiveFilters}
						{$t('documents.emptyFiltered')}
					{:else}
						{$t('documents.emptyTitle')}
					{/if}
				</h3>
				<p class="empty-subtitle">
					{#if hasActiveFilters}
						{$t('documents.tryAdjusting')}
					{:else}
						{$t('documents.emptyDescription')}
					{/if}
				</p>
				{#if hasActiveFilters}
					<button class="action-btn secondary" onclick={clearFilters}>
						<X size={18} strokeWidth={2} />
						{$t('documents.clearFilters')}
					</button>
				{:else}
					<button class="action-btn primary" onclick={() => goto('/dashboard')}>
						<Mic size={18} strokeWidth={2} />
						{$t('documents.createDocument')}
					</button>
				{/if}
			</div>
		{:else}
			<!-- Results header with count -->
			<div class="results-header">
				<span class="results-count">
					{filteredDocs().length === 1
						? $t('documents.documentCount').replace('{n}', '1')
						: $t('documents.documentsCount').replace('{n}', String(filteredDocs().length))}
					{#if hasActiveFilters}
						<span class="filtered-label">({$t('documents.filtered')})</span>
					{/if}
				</span>
			</div>

			<!-- Grouped Document List -->
			<div class="doc-list">
				{#each [...groupedDocs().entries()] as [month, docs], groupIndex}
					<div class="month-group" in:fly={{ y: 20, duration: 300, delay: groupIndex * 50, easing: cubicOut }}>
						<!-- Clickable month header -->
						<button class="month-header-btn" onclick={() => toggleMonth(month)}>
							<span class="month-label">{month}</span>
							<span class="month-count">{docs.length}</span>
							<span class="month-chevron" class:collapsed={collapsedMonths.has(month)}>
								<ChevronDown size={16} />
							</span>
						</button>

						{#if !collapsedMonths.has(month)}
						<div class="month-docs-container" transition:fly={{ y: -10, duration: 200 }}>
							{#each docs as doc, i}
								<div class="doc-card-wrapper">
									{#if isDesktop}
										<!-- Desktop: No swipe, show action buttons -->
										<div class="doc-card">
											<a href="/dashboard/documents/{doc.id}?type={doc.type}" class="doc-card-link">
												<div
													class="doc-icon"
													class:invoice={doc.type === 'invoice'}
													class:estimate={doc.type === 'estimate'}
												>
													{#if doc.type === 'invoice'}
														<Receipt size={20} strokeWidth={1.5} />
													{:else if doc.type === 'estimate'}
														<Calculator size={20} strokeWidth={1.5} />
													{:else}
														<FileText size={20} strokeWidth={1.5} />
													{/if}
												</div>
												<div class="doc-info">
													<span class="doc-client">{doc.client}</span>
													<span class="doc-subtitle">
														{getDocNumber(doc)} · {formatSmartTime(doc.date, $locale)}
													</span>
												</div>
											</a>
											<div class="doc-actions">
												<button
													class="action-icon-btn edit"
													onclick={() => goto(`/dashboard/documents/${doc.id}?type=${doc.type}&edit=true`)}
													aria-label={$t('common.edit')}
												>
													<Pencil size={16} />
												</button>
												<button
													class="action-icon-btn delete"
													onclick={() => openDeleteModal(doc)}
													aria-label={$t('common.delete')}
												>
													<Trash2 size={16} />
												</button>
											</div>
											<div class="doc-end">
												{#if (doc.type === 'invoice' || doc.type === 'estimate') && doc.amount}
													<span class="doc-amount" class:estimate={doc.type === 'estimate'}>
														{formatAmount(doc.amount)}
													</span>
												{/if}
											</div>
										</div>
									{:else}
										<!-- Mobile: Swipeable card -->
										<SwipeableCard
											onSwipeLeft={() => openDeleteModal(doc)}
											onSwipeRight={() => openSendModal(doc)}
											rightDisabled={['sent', 'paid'].includes(doc.status)}
										>
											<a href="/dashboard/documents/{doc.id}?type={doc.type}" class="doc-card">
												<div
													class="doc-icon"
													class:invoice={doc.type === 'invoice'}
													class:estimate={doc.type === 'estimate'}
												>
													{#if doc.type === 'invoice'}
														<Receipt size={20} strokeWidth={1.5} />
													{:else if doc.type === 'estimate'}
														<Calculator size={20} strokeWidth={1.5} />
													{:else}
														<FileText size={20} strokeWidth={1.5} />
													{/if}
												</div>
												<div class="doc-info">
													<span class="doc-client">{doc.client}</span>
													<span class="doc-subtitle">
														{getDocNumber(doc)} · {formatSmartTime(doc.date, $locale)}
													</span>
												</div>
												<div class="doc-end">
													{#if (doc.type === 'invoice' || doc.type === 'estimate') && doc.amount}
														<span class="doc-amount" class:estimate={doc.type === 'estimate'}>
															{formatAmount(doc.amount)}
														</span>
													{/if}
												</div>
											</a>
										</SwipeableCard>
									{/if}
								</div>
							{/each}
						</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Delete Confirmation Modal -->
<DeleteConfirmModal
	bind:open={showDeleteModal}
	document={selectedDocument
		? {
				id: selectedDocument.id,
				type: selectedDocument.type,
				title: selectedDocument.title,
				client: selectedDocument.client,
				amount: selectedDocument.amount
			}
		: null}
	onClose={() => {
		showDeleteModal = false;
		selectedDocument = null;
	}}
	onConfirm={handleDelete}
/>

<!-- Quick Send Modal -->
<QuickSendModal
	bind:open={showSendModal}
	document={selectedDocument
		? {
				id: selectedDocument.id,
				type: selectedDocument.type,
				title: selectedDocument.title,
				client: selectedDocument.client,
				clientEmail: selectedDocument.clientEmail,
				amount: selectedDocument.amount
			}
		: null}
	onClose={() => {
		showSendModal = false;
		selectedDocument = null;
	}}
	onSuccess={handleSendSuccess}
/>

<style>
	.documents-page {
		height: 100vh;
		height: 100dvh;
		display: flex;
		flex-direction: column;
		background: transparent;
		overflow: hidden;
		padding: var(--page-padding-x, 20px);
		padding-top: calc(12px + var(--safe-area-top, 0px));
		padding-bottom: 0;
		box-sizing: border-box;
	}


	/* Header (Settings style - centered title) */
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20px;
		flex-shrink: 0;
		max-width: var(--page-max-width, 600px);
		margin-left: auto;
		margin-right: auto;
		width: 100%;
	}

	.back-btn {
		width: var(--btn-height-md, 44px);
		height: var(--btn-height-md, 44px);
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--glass-white-50, rgba(255, 255, 255, 0.5));
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: none;
		border-radius: var(--radius-button, 14px);
		color: var(--gray-600, #475569);
		cursor: pointer;
		transition: all var(--duration-fast, 0.15s) ease;
	}

	.back-btn:hover {
		background: var(--glass-white-70, rgba(255, 255, 255, 0.7));
		color: var(--gray-900, #0f172a);
	}

	.back-btn:active {
		transform: scale(0.95);
	}

	.page-title {
		font-family: var(--font-display, system-ui);
		font-size: 18px;
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		margin: 0;
		letter-spacing: -0.02em;
	}

	.header-spacer {
		width: 44px;
	}

	/* Search */
	.search-wrapper {
		position: relative;
		width: 100%;
		max-width: var(--page-max-width, 600px);
		margin-left: auto;
		margin-right: auto;
		display: flex;
		align-items: center;
		margin-bottom: 12px;
		flex-shrink: 0;
	}

	.search-icon {
		position: absolute;
		left: 14px;
		color: var(--gray-400, #94a3b8);
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 12px 40px 12px 42px;
		background: rgba(255, 255, 255, 0.5);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: none;
		border-radius: var(--radius-input, 12px);
		color: var(--gray-900, #0f172a);
		font-size: 15px;
		transition: all 0.2s ease;
	}

	.search-input::placeholder {
		color: var(--gray-400, #94a3b8);
	}

	.search-input:focus {
		outline: none;
		background: rgba(255, 255, 255, 0.7);
	}

	.clear-search {
		position: absolute;
		right: 12px;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--gray-200, #e2e8f0);
		border: none;
		border-radius: 50%;
		color: var(--gray-500, #64748b);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.clear-search:hover {
		background: var(--gray-300, #cbd5e1);
		color: var(--gray-900, #0f172a);
	}

	/* Type Tabs */
	.type-tabs-wrapper {
		margin-bottom: 12px;
		flex-shrink: 0;
		max-width: var(--page-max-width, 600px);
		margin-left: auto;
		margin-right: auto;
		width: 100%;
	}

	/* Scrollable Content */
	.content-scroll {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
		padding-bottom: calc(100px + var(--safe-area-bottom, 0px));
		max-width: var(--page-max-width, 600px);
		width: 100%;
		margin: 0 auto;
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE/Edge */
	}

	.content-scroll::-webkit-scrollbar {
		display: none; /* Chrome, Safari, Opera */
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80px 20px;
		text-align: center;
	}

	.empty-icon {
		width: 96px;
		height: 96px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.6);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: none;
		border-radius: 50%;
		color: var(--blu-primary, #0066ff);
		margin-bottom: 24px;
		box-shadow: 0 8px 32px rgba(0, 102, 255, 0.1);
	}

	.empty-title {
		font-family: var(--font-display, system-ui);
		font-size: 20px;
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		margin: 0 0 8px;
	}

	.empty-subtitle {
		font-size: 15px;
		color: var(--gray-500, #64748b);
		margin: 0 0 28px;
		max-width: 260px;
		line-height: 1.5;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 14px 24px;
		border: none;
		border-radius: var(--radius-button, 14px);
		font-size: 15px;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-btn.primary {
		background: var(--blu-primary, #0066ff);
		color: white;
		box-shadow: 0 4px 24px rgba(0, 102, 255, 0.35);
	}

	.action-btn.primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 32px rgba(0, 102, 255, 0.45);
	}

	.action-btn.secondary {
		background: var(--gray-100, #f1f5f9);
		color: var(--gray-600, #475569);
	}

	.action-btn.secondary:hover {
		background: var(--gray-200, #e2e8f0);
	}

	/* Results Header */
	.results-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
	}

	.results-count {
		font-size: 13px;
		color: var(--gray-500, #64748b);
	}

	.filtered-label {
		color: var(--blu-primary, #0066ff);
	}

	/* Document List */
	.doc-list {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.month-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	/* Clickable month header */
	.month-header-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px;
		background: transparent;
		border: none;
		cursor: pointer;
		width: fit-content;
		transition: opacity 0.15s ease;
	}

	.month-header-btn:hover {
		opacity: 0.7;
	}

	.month-label {
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--gray-500, #64748b);
	}

	.month-count {
		font-size: 11px;
		font-weight: 500;
		color: var(--gray-400, #94a3b8);
		background: rgba(148, 163, 184, 0.15);
		padding: 2px 8px;
		border-radius: 10px;
	}

	.month-chevron {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--gray-400, #94a3b8);
		transition: transform 0.2s ease;
	}

	.month-chevron.collapsed {
		transform: rotate(-90deg);
	}

	/* Glass container for documents - like settings sections */
	.month-docs-container {
		display: flex;
		flex-direction: column;
		background: rgba(255, 255, 255, 0.4);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.5);
		border-radius: var(--radius-card, 20px);
		overflow: hidden;
	}

	.doc-card-wrapper {
		border-bottom: 1px solid rgba(0, 0, 0, 0.04);
	}

	.doc-card-wrapper:last-child {
		border-bottom: none;
	}

	.doc-card {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 16px;
		background: transparent;
		border: none;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.doc-card:hover {
		background: rgba(255, 255, 255, 0.4);
	}

	/* Desktop: card contains link + action buttons */
	.doc-card-link {
		display: flex;
		align-items: center;
		gap: 14px;
		flex: 1;
		min-width: 0;
		text-decoration: none;
	}

	/* Desktop action buttons */
	.doc-actions {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}

	.action-icon-btn {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--glass-white-50, rgba(255, 255, 255, 0.5));
		border: none;
		border-radius: 10px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.action-icon-btn.edit {
		color: var(--gray-500, #64748b);
	}

	.action-icon-btn.edit:hover {
		background: rgba(0, 102, 255, 0.1);
		color: var(--blu-primary, #0066ff);
	}

	.action-icon-btn.delete {
		color: var(--gray-400, #94a3b8);
	}

	.action-icon-btn.delete:hover {
		background: rgba(239, 68, 68, 0.1);
		color: var(--data-red, #ef4444);
	}

	.doc-icon {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-button, 14px);
		flex-shrink: 0;
	}

	/* Icon colors: Invoice = Green, Estimate = Blue */
	.doc-icon.invoice {
		background: rgba(52, 199, 89, 0.12);
		color: #34C759;
	}

	.doc-icon.estimate {
		background: rgba(0, 102, 255, 0.1);
		color: #0066FF;
	}

	/* Default for contracts */
	.doc-icon:not(.invoice):not(.estimate) {
		background: rgba(0, 102, 255, 0.08);
		color: var(--blu-primary, #0066ff);
	}

	.doc-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.doc-client {
		font-size: 16px;
		font-weight: 600;
		color: var(--gray-900, #0f172a);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.doc-subtitle {
		font-size: 13px;
		color: var(--gray-500, #64748b);
	}

	.doc-end {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		margin-left: auto;
	}

	.doc-amount {
		font-size: 16px;
		font-weight: 600;
		color: var(--data-green, #10b981);
	}

	/* Mobile adjustments */
	@media (max-width: 400px) {
		.doc-client {
			font-size: 15px;
		}

		.doc-amount {
			font-size: 15px;
		}
	}
</style>

<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { goto, invalidateAll } from '$app/navigation';
	import FileText from 'lucide-svelte/icons/file-text';
	import Receipt from 'lucide-svelte/icons/receipt';
	import Search from 'lucide-svelte/icons/search';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Calculator from 'lucide-svelte/icons/calculator';
	import X from 'lucide-svelte/icons/x';
	import ArrowUpDown from 'lucide-svelte/icons/arrow-up-down';
	import Mic from 'lucide-svelte/icons/mic';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import Clock from 'lucide-svelte/icons/clock';
	import Send from 'lucide-svelte/icons/send';
	import { t } from '$lib/i18n';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import { pageTransition } from '$lib/stores/pageTransition';
	import DeleteConfirmModal from '$lib/components/modals/DeleteConfirmModal.svelte';
	import QuickSendModal from '$lib/components/modals/QuickSendModal.svelte';

	interface Document {
		id: string;
		type: 'invoice' | 'estimate' | 'contract';
		documentType: string;
		title: string;
		client: string;
		clientEmail?: string | null;
		date: string;
		createdAt: string;
		updatedAt: string;
		sentAt: string | null;
		amount?: number;
		status: string;
	}

	interface Summaries {
		totalInvoices: number;
		totalEstimates: number;
		totalContracts: number;
		clients: string[];
	}

	let { data } = $props();

	// Modal states
	let showDeleteModal = $state(false);
	let showSendModal = $state(false);
	let selectedDocument = $state<Document | null>(null);
	let searchQuery = $state('');
	let showFilters = $state(false);
	let statusFilter = $state<string | null>(null);
	let clientFilter = $state<string | null>(null);
	let sortBy = $state<'date' | 'amount' | 'client' | 'status'>('date');
	let sortOrder = $state<'asc' | 'desc'>('desc');
	let showSortMenu = $state(false);

	// Smart search that parses natural language queries
	function parseSearchQuery(query: string) {
		const lowerQuery = query.toLowerCase();
		let parsedType: string | null = null;
		let parsedClient: string | null = null;
		let parsedStatus: string | null = null;
		let remainingQuery = query;

		// Parse document type
		if (lowerQuery.includes('estimate')) {
			parsedType = 'estimate';
			remainingQuery = remainingQuery.replace(/estimates?/gi, '').trim();
		} else if (lowerQuery.includes('invoice')) {
			parsedType = 'invoice';
			remainingQuery = remainingQuery.replace(/invoices?/gi, '').trim();
		} else if (lowerQuery.includes('contract')) {
			parsedType = 'contract';
			remainingQuery = remainingQuery.replace(/contracts?/gi, '').trim();
		}

		// Parse status
		const statusKeywords = ['draft', 'sent', 'paid', 'pending', 'overdue', 'signed'];
		for (const status of statusKeywords) {
			if (lowerQuery.includes(status)) {
				parsedStatus = status;
				remainingQuery = remainingQuery.replace(new RegExp(status, 'gi'), '').trim();
				break;
			}
		}

		// Parse client
		const clientPatterns = [/(?:to|for|from)\s+(\w+)/i, /client[:\s]+(\w+)/i];
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
			.replace(/\b(sent|was|were|that|the|all|show|find|get)\b/gi, '')
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
			const effectiveType = parsed.type || (data.activeType !== 'all' ? data.activeType : null);
			const matchesTab = !effectiveType || doc.type === effectiveType;

			// Status filter (from dropdown or search)
			const effectiveStatus = parsed.status || statusFilter;
			const matchesStatus = !effectiveStatus || doc.status === effectiveStatus;

			// Client filter (from dropdown or search)
			const effectiveClient = parsed.client || clientFilter;
			const matchesClient =
				!effectiveClient || doc.client.toLowerCase().includes(effectiveClient.toLowerCase());

			// Text search
			const matchesText =
				!parsed.textQuery ||
				doc.title.toLowerCase().includes(parsed.textQuery.toLowerCase()) ||
				doc.client.toLowerCase().includes(parsed.textQuery.toLowerCase());

			return matchesTab && matchesStatus && matchesClient && matchesText;
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

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		// Show exact date and time
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function formatAmount(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function clearFilters() {
		statusFilter = null;
		clientFilter = null;
		searchQuery = '';
	}

	const hasActiveFilters = $derived(
		statusFilter !== null || clientFilter !== null || searchQuery !== ''
	);

	function setSort(field: 'date' | 'amount' | 'client' | 'status') {
		if (sortBy === field) {
			sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
		} else {
			sortBy = field;
			sortOrder = 'desc';
		}
		showSortMenu = false;
	}

	const sortLabels = $derived({
		date: $t('documents.sortDate'),
		amount: $t('documents.sortAmount'),
		client: $t('documents.sortClient'),
		status: $t('documents.sortStatus')
	});

	// Document type filter options
	const typeOptions = $derived([
		{ key: 'all', label: $t('common.all'), count: data.documents.length },
		{ key: 'invoice', label: $t('dashboard.invoices'), count: data.summaries.totalInvoices },
		{ key: 'estimate', label: $t('documents.estimates'), count: data.summaries.totalEstimates },
		{ key: 'contract', label: $t('documents.contracts'), count: data.summaries.totalContracts }
	]);

	let showTypeDropdown = $state(false);

	const currentTypeLabel = $derived(() => {
		const option = typeOptions.find((o) => o.key === data.activeType);
		return option ? option.label : $t('common.all');
	});

	function selectType(type: string) {
		showTypeDropdown = false;
		if (type === 'all') {
			goto('/dashboard/documents');
		} else {
			goto(`/dashboard/documents?type=${type}`);
		}
	}

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
		const response = await fetch(`/api/documents/${documentId}?type=${documentType}`, {
			method: 'DELETE'
		});

		if (!response.ok) {
			const result = await response.json();
			throw new Error(result.error || 'Failed to delete document');
		}

		// Refresh the page data
		await invalidateAll();
	}

	function handleSendSuccess() {
		// Refresh the page data to update status
		invalidateAll();
	}

	// Format exact time for timestamps
	function formatRelativeTime(dateString: string | null) {
		if (!dateString) return '';
		const date = new Date(dateString);
		// Show exact date and time
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	// Check if timestamps should be shown (has been modified or sent)
	function hasTimestamps(doc: Document) {
		return doc.updatedAt !== doc.createdAt || doc.sentAt;
	}

	// Expanded timestamps state
	let expandedTimestamps = $state<Set<string>>(new Set());

	function toggleTimestamps(docId: string, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (expandedTimestamps.has(docId)) {
			expandedTimestamps.delete(docId);
		} else {
			expandedTimestamps.add(docId);
		}
		expandedTimestamps = new Set(expandedTimestamps);
	}
</script>

<div class="documents-page">
	<!-- Header -->
	<header class="page-header">
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

	<!-- Filter Bar -->
	<div class="filter-bar">
		<!-- Type Dropdown -->
		<div class="type-dropdown-wrapper">
			<button
				class="type-dropdown-btn"
				class:active={data.activeType !== 'all'}
				onclick={() => (showTypeDropdown = !showTypeDropdown)}
			>
				<FileText size={16} strokeWidth={1.5} />
				<span>{currentTypeLabel()}</span>
				<span class="chevron-icon" class:rotated={showTypeDropdown}>
					<ChevronDown size={14} />
				</span>
			</button>
			{#if showTypeDropdown}
				<div class="type-dropdown-menu" in:fly={{ y: -8, duration: 150, easing: cubicOut }}>
					{#each typeOptions as option}
						<button
							class="type-option"
							class:active={data.activeType === option.key}
							onclick={() => selectType(option.key)}
						>
							<span class="type-option-label">{option.label}</span>
							<span class="type-option-count">{option.count}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Status Filter -->
		<div class="filter-dropdown-wrapper">
			<button
				class="filter-dropdown-btn"
				class:active={statusFilter !== null}
				onclick={() => (showFilters = !showFilters)}
			>
				<span>{statusFilter ? statusFilter : $t('documents.status')}</span>
				<span class="chevron-icon" class:rotated={showFilters}>
					<ChevronDown size={14} />
				</span>
			</button>
			{#if showFilters}
				<div class="filter-dropdown-menu" in:fly={{ y: -8, duration: 150, easing: cubicOut }}>
					<button
						class="filter-option"
						class:active={statusFilter === null}
						onclick={() => {
							statusFilter = null;
							showFilters = false;
						}}
					>
						{$t('documents.allStatuses')}
					</button>
					{#each ['draft', 'sent', 'pending', 'paid', 'overdue', 'signed'] as status}
						<button
							class="filter-option"
							class:active={statusFilter === status}
							onclick={() => {
								statusFilter = status;
								showFilters = false;
							}}
						>
							<span class="status-dot {status}"></span>
							{$t(`documents.${status}`)}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		{#if hasActiveFilters}
			<button class="clear-btn" onclick={clearFilters}>
				<X size={14} />
			</button>
		{/if}
	</div>

	<!-- Document List -->
	<div class="content-scroll">
		{#if filteredDocs().length === 0}
			<div class="empty-state">
				<div class="empty-icon">
					<FileText size={36} strokeWidth={1.5} />
				</div>
				<h3 class="empty-title">
					{#if hasActiveFilters}
						{$t('documents.noMatch')}
					{:else}
						{$t('documents.empty')}
					{/if}
				</h3>
				<p class="empty-subtitle">
					{#if hasActiveFilters}
						{$t('documents.tryAdjusting')}
					{:else}
						{$t('documents.emptySubtitle')}
					{/if}
				</p>
				{#if hasActiveFilters}
					<button class="action-btn secondary" onclick={clearFilters}>
						<X size={18} strokeWidth={2} />
						{$t('documents.clearFilters')}
					</button>
				{:else}
					<a href="/dashboard" class="action-btn primary">
						<Mic size={18} strokeWidth={2} />
						{$t('documents.new')}
					</a>
				{/if}
			</div>
		{:else}
			<!-- Results header with count and sort -->
			<div class="results-header">
				<span class="results-count">
					{filteredDocs().length === 1
						? $t('documents.documentCount').replace('{n}', '1')
						: $t('documents.documentsCount').replace('{n}', String(filteredDocs().length))}
					{#if hasActiveFilters}
						<span class="filtered-label">({$t('documents.filtered')})</span>
					{/if}
				</span>
				<div class="sort-dropdown-wrapper">
					<button class="sort-btn" onclick={() => (showSortMenu = !showSortMenu)}>
						<ArrowUpDown size={14} />
						<span>{sortLabels[sortBy]}</span>
						<span class="sort-order">{sortOrder === 'desc' ? '↓' : '↑'}</span>
					</button>
					{#if showSortMenu}
						<div class="sort-menu" in:fly={{ y: -5, duration: 150 }}>
							{#each Object.entries(sortLabels) as [key, label]}
								<button
									class="sort-menu-item"
									class:active={sortBy === key}
									onclick={() => setSort(key as 'date' | 'amount' | 'client' | 'status')}
								>
									{label}
									{#if sortBy === key}
										<span class="sort-indicator">{sortOrder === 'desc' ? '↓' : '↑'}</span>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<div class="doc-list">
				{#each filteredDocs() as doc, i}
					<div
						class="doc-card-wrapper"
						in:fly={{ y: 20, duration: 300, delay: 50 + i * 30, easing: cubicOut }}
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
									<span class="doc-title">{doc.title}</span>
									<div class="doc-meta-row">
										<span class="doc-meta">
											{doc.client} · {formatDate(doc.date)}
										</span>
										{#if hasTimestamps(doc)}
											<button
												class="timestamps-toggle"
												onclick={(e) => toggleTimestamps(doc.id, e)}
												aria-label="Show timestamps"
											>
												<Clock size={12} />
											</button>
										{/if}
									</div>
									{#if expandedTimestamps.has(doc.id)}
										<div class="doc-timestamps" transition:fly={{ y: -5, duration: 150 }}>
											<span class="timestamp">
												<span class="timestamp-label">{$t('timestamps.created')}:</span>
												{formatRelativeTime(doc.createdAt)}
											</span>
											{#if doc.updatedAt !== doc.createdAt}
												<span class="timestamp">
													<span class="timestamp-label">{$t('timestamps.modified')}:</span>
													{formatRelativeTime(doc.updatedAt)}
												</span>
											{/if}
											{#if doc.sentAt}
												<span class="timestamp sent">
													<Send size={10} />
													<span class="timestamp-label">{$t('timestamps.sent')}:</span>
													{formatRelativeTime(doc.sentAt)}
												</span>
											{/if}
										</div>
									{/if}
								</div>
								<div class="doc-end">
									{#if (doc.type === 'invoice' || doc.type === 'estimate') && doc.amount}
										<span class="doc-amount" class:estimate={doc.type === 'estimate'}
											>{formatAmount(doc.amount)}</span
										>
									{/if}
									<div class="doc-actions">
									<button
										class="action-icon-btn edit"
										onclick={(e) => { e.preventDefault(); e.stopPropagation(); pageTransition.navigate(`/dashboard/documents/${doc.id}?type=${doc.type}&edit=true`); }}
										aria-label="Edit"
									>
										<Pencil size={14} />
									</button>
									<button
										class="action-icon-btn delete"
										onclick={(e) => { e.preventDefault(); e.stopPropagation(); openDeleteModal(doc); }}
										aria-label="Delete"
									>
										<Trash2 size={14} />
									</button>
								</div>
								</div>
							</a>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Close dropdowns when clicking outside -->
{#if showSortMenu || showTypeDropdown || showFilters}
	<button
		class="overlay"
		onclick={() => {
			showSortMenu = false;
			showTypeDropdown = false;
			showFilters = false;
		}}
		aria-label={$t('aria.closeMenu')}
	></button>
{/if}

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

	/* Header */
	.page-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
		flex-shrink: 0;
	}

	.back-btn {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.5);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: none;
		border-radius: var(--radius-button, 14px);
		color: var(--gray-600, #475569);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.back-btn:hover {
		background: rgba(255, 255, 255, 0.7);
		color: var(--gray-900, #0f172a);
	}

	.back-btn:active {
		transform: scale(0.95);
	}

	.page-title {
		flex: 1;
		font-family: var(--font-display, system-ui);
		font-size: 22px;
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		margin: 0;
		letter-spacing: -0.02em;
	}

	.header-spacer {
		width: 40px;
	}

	/* Search */
	.search-wrapper {
		position: relative;
		width: 100%;
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

	/* Filter Bar */
	.filter-bar {
		display: flex;
		gap: 8px;
		align-items: center;
		margin-bottom: 16px;
		flex-shrink: 0;
	}

	.type-dropdown-wrapper,
	.filter-dropdown-wrapper {
		position: relative;
	}

	.type-dropdown-btn,
	.filter-dropdown-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		background: rgba(255, 255, 255, 0.5);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: none;
		border-radius: 100px;
		color: var(--gray-700, #374151);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.type-dropdown-btn:hover,
	.filter-dropdown-btn:hover {
		background: rgba(255, 255, 255, 0.7);
	}

	.type-dropdown-btn.active,
	.filter-dropdown-btn.active {
		background: var(--blu-primary, #0066ff);
		color: white;
	}

	.chevron-icon {
		display: flex;
		transition: transform 0.2s ease;
	}

	.chevron-icon.rotated {
		transform: rotate(180deg);
	}

	.type-dropdown-menu,
	.filter-dropdown-menu {
		position: absolute;
		top: calc(100% + 8px);
		left: 0;
		min-width: 180px;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-radius: var(--radius-button, 14px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
		overflow: hidden;
		z-index: 100;
	}

	.type-option,
	.filter-option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		width: 100%;
		padding: 12px 16px;
		background: transparent;
		border: none;
		color: var(--gray-700, #374151);
		font-size: 14px;
		cursor: pointer;
		transition: all 0.15s ease;
		text-align: left;
	}

	.type-option:hover,
	.filter-option:hover {
		background: rgba(0, 102, 255, 0.05);
	}

	.type-option.active,
	.filter-option.active {
		background: rgba(0, 102, 255, 0.1);
		color: var(--blu-primary, #0066ff);
		font-weight: 500;
	}

	.type-option-count {
		font-size: 12px;
		color: var(--gray-400, #9ca3af);
		font-weight: 500;
	}

	.type-option.active .type-option-count {
		color: var(--blu-primary, #0066ff);
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		margin-right: 4px;
	}

	.status-dot.draft {
		background: var(--gray-400, #9ca3af);
	}
	.status-dot.sent {
		background: var(--blu-primary, #0066ff);
	}
	.status-dot.pending {
		background: var(--data-orange, #f59e0b);
	}
	.status-dot.paid {
		background: var(--data-green, #10b981);
	}
	.status-dot.overdue {
		background: var(--data-red, #ef4444);
	}
	.status-dot.signed {
		background: var(--data-purple, #8b5cf6);
	}

	.filter-option {
		justify-content: flex-start;
	}

	.clear-btn {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(239, 68, 68, 0.1);
		border: none;
		border-radius: 50%;
		color: var(--data-red, #ef4444);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.clear-btn:hover {
		background: rgba(239, 68, 68, 0.15);
	}

	/* Scrollable Content */
	.content-scroll {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
		padding-bottom: calc(100px + var(--safe-area-bottom, 0px));
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
		width: 88px;
		height: 88px;
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

	.sort-dropdown-wrapper {
		position: relative;
	}

	.sort-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 12px;
		background: transparent;
		border: none;
		border-radius: var(--radius-input, 12px);
		color: var(--gray-600, #475569);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.sort-btn:hover {
		background: rgba(255, 255, 255, 0.5);
		color: var(--gray-900, #0f172a);
	}

	.sort-order {
		font-size: 11px;
		color: var(--gray-400, #94a3b8);
	}

	.sort-menu {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		min-width: 140px;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: none;
		border-radius: var(--radius-button, 14px);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
		overflow: hidden;
		z-index: 50;
	}

	.sort-menu-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 12px 16px;
		background: transparent;
		border: none;
		color: var(--gray-700, #334155);
		font-size: 14px;
		cursor: pointer;
		transition: all 0.15s ease;
		text-align: left;
	}

	.sort-menu-item:hover {
		background: rgba(0, 102, 255, 0.05);
	}

	.sort-menu-item.active {
		color: var(--blu-primary, #0066ff);
		font-weight: 500;
	}

	.sort-indicator {
		font-size: 12px;
		color: var(--gray-400, #94a3b8);
	}

	.overlay {
		position: fixed;
		inset: 0;
		background: transparent;
		border: none;
		z-index: 45;
		cursor: default;
	}

	/* Document List */
	.doc-list {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.doc-card-wrapper {
		margin-bottom: 8px;
	}

	.doc-card {
		display: flex;
		align-items: flex-start;
		gap: 14px;
		padding: 16px;
		background: rgba(255, 255, 255, 0.4);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: none;
		border-radius: var(--radius-button, 14px);
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.doc-card:hover {
		background: rgba(255, 255, 255, 0.6);
	}

	.doc-icon {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 102, 255, 0.08);
		border-radius: var(--radius-button, 14px);
		color: var(--blu-primary, #0066ff);
		flex-shrink: 0;
	}

	.doc-icon.invoice {
		background: rgba(16, 185, 129, 0.1);
		color: var(--data-green, #10b981);
	}

	.doc-icon.estimate {
		background: rgba(14, 165, 233, 0.1);
		color: #0ea5e9;
	}

	.doc-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
		align-self: center;
	}

	.doc-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--gray-900, #0f172a);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.doc-meta-row {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.doc-meta {
		font-size: 13px;
		color: var(--gray-500, #64748b);
	}

	.timestamps-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		padding: 0;
		background: var(--gray-100, #f1f5f9);
		border: none;
		border-radius: 50%;
		color: var(--gray-400, #9ca3af);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.timestamps-toggle:hover {
		background: var(--gray-200, #e2e8f0);
		color: var(--gray-600, #475569);
	}

	.doc-timestamps {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 4px;
	}

	.timestamp {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 11px;
		color: var(--gray-400, #9ca3af);
		background: var(--gray-50, #f8fafc);
		padding: 3px 8px;
		border-radius: 6px;
	}

	.timestamp.sent {
		color: var(--blu-primary, #0066ff);
		background: rgba(0, 102, 255, 0.08);
	}

	.timestamp-label {
		font-weight: 500;
	}

	.doc-end {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-shrink: 0;
	}

	.doc-amount {
		font-size: 15px;
		font-weight: 600;
		color: var(--data-green, #10b981);
	}

	.doc-amount.estimate {
		color: #0ea5e9;
	}


	.doc-actions {
		display: flex;
		gap: 6px;
	}

	.action-icon-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-icon-btn.edit {
		background: rgba(0, 102, 255, 0.08);
		color: var(--blu-primary, #0066ff);
	}

	.action-icon-btn.edit:hover {
		background: rgba(0, 102, 255, 0.15);
	}

	.action-icon-btn.delete {
		background: rgba(239, 68, 68, 0.08);
		color: #ef4444;
	}

	.action-icon-btn.delete:hover {
		background: rgba(239, 68, 68, 0.15);
	}

	/* Mobile adjustments */
	@media (max-width: 400px) {
		.doc-end {
			flex-direction: column;
			align-items: flex-end;
			gap: 6px;
		}

		.doc-amount {
			font-size: 14px;
		}
	}

</style>

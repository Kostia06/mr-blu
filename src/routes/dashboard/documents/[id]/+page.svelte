<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Download from 'lucide-svelte/icons/download';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import MoreHorizontal from 'lucide-svelte/icons/more-horizontal';
	import Copy from 'lucide-svelte/icons/copy';
	import Share2 from 'lucide-svelte/icons/share-2';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Mail from 'lucide-svelte/icons/mail';
	import X from 'lucide-svelte/icons/x';
	import Check from 'lucide-svelte/icons/check';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Plus from 'lucide-svelte/icons/plus';
	import FileText from 'lucide-svelte/icons/file-text';
	import Receipt from 'lucide-svelte/icons/receipt';
	import User from 'lucide-svelte/icons/user';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Calendar from 'lucide-svelte/icons/calendar';
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import DocumentTemplate from '$lib/components/DocumentTemplate.svelte';
	import type { DocumentData } from '$lib/components/DocumentTemplate.svelte';
	import { t } from '$lib/i18n';
	import { toast } from '$lib/stores/toast';

	let { data } = $props();

	const doc = $derived(data.document);

	const backUrl = $derived(
		$page.url.searchParams.get('from') === 'review' ? '/dashboard/review' : '/dashboard/documents'
	);

	let showMenu = $state(false);
	let isDeleting = $state(false);
	let isSending = $state(false);
	let isGenerating = $state(false);
	let isSaving = $state(false);

	// Edit mode state
	let isEditing = $state(false);
	let editExitedManually = $state(false); // Prevents auto-edit from re-triggering after save
	let saveError = $state('');
	let saveSuccess = $state(false);

	// Editable document data
	interface EditableLineItem {
		id: string;
		description: string;
		quantity: number;
		unit: string;
		rate: number;
		total: number;
	}

	// Initialize with defaults - startEditing() will populate from doc
	let editData = $state({
		type: 'invoice' as string,
		invoice_number: '',
		client: '',
		clientDetails: {
			email: '',
			phone: '',
			address: ''
		},
		line_items: [] as EditableLineItem[],
		tax_rate: 0,
		due_date: '',
		notes: ''
	});

	// Calculated totals
	const calculatedSubtotal = $derived(
		editData.line_items.reduce((sum, item) => sum + (item.total || 0), 0)
	);

	const calculatedTaxAmount = $derived(
		editData.tax_rate ? calculatedSubtotal * (editData.tax_rate / 100) : 0
	);

	const calculatedTotal = $derived(calculatedSubtotal + calculatedTaxAmount);

	// Email modal state
	let showEmailModal = $state(false);
	let emailInput = $state('');
	let sendSuccess = $state(false);
	let sendError = $state('');

	// Resolve sender name with fallback to user_metadata
	const senderName = $derived.by(() => {
		if (data.profile?.full_name) return data.profile.full_name;
		const meta = data.user?.user_metadata;
		if (meta?.first_name && meta?.last_name) return `${meta.first_name} ${meta.last_name}`;
		return meta?.first_name || meta?.last_name || undefined;
	});

	// Transform the database document to DocumentTemplate format
	const templateDocument = $derived<DocumentData>({
		documentType: doc.documentType || doc.type || 'Invoice',
		documentNumber: doc.invoice_number || `#${doc.id?.slice(0, 8)}`,
		client: {
			name: doc.client || 'Unknown Client',
			email: doc.clientDetails?.email || undefined,
			phone: doc.clientDetails?.phone || undefined,
			address: doc.clientDetails?.address || undefined
		},
		from: {
			name: senderName || undefined,
			businessName: data.profile?.business_name || undefined,
			email: data.profile?.email || undefined,
			phone: data.profile?.phone || undefined,
			address: data.profile?.address || undefined,
			website: data.profile?.website || undefined
		},
		lineItems: (doc.line_items || []).map((item: any) => {
			let dims: string | undefined;
			if (typeof item.dimensions === 'string') {
				dims = item.dimensions.includes('undefined') ? undefined : item.dimensions;
			} else if (item.dimensions?.width && item.dimensions?.length) {
				dims = `${item.dimensions.width} × ${item.dimensions.length} ${item.dimensions.unit || 'ft'}`;
			}
			return {
				description: item.description || 'Item',
				quantity: item.quantity || 1,
				unit: item.unit || 'ea',
				rate: item.rate || item.total || 0,
				total: item.total || 0,
				measurementType: item.measurementType,
				dimensions: dims
			};
		}),
		subtotal: doc.subtotal || doc.total || 0,
		taxRate: doc.tax_rate || 0,
		taxAmount: doc.tax_amount || 0,
		total: doc.total || 0,
		date: doc.created_at || new Date().toISOString(),
		dueDate: doc.due_date || undefined,
		notes: doc.notes || undefined
	});

	// Auto-start editing if ?edit=true (but not if we just exited edit mode manually)
	$effect(() => {
		if ($page.url.searchParams.get('edit') === 'true' && doc && !isEditing && !editExitedManually) {
			startEditing();
		}
	});

	// Normalize tax rate - handle both decimal (0.08) and percentage (8) formats
	function normalizeTaxRate(rate: number | null | undefined): number {
		if (!rate) return 0;
		// If rate is less than 1, it's likely a decimal (0.08 for 8%) - convert to percentage
		// If rate is >= 1, it's already a percentage (8 for 8%)
		return rate < 1 ? rate * 100 : rate;
	}

	// Start editing
	function startEditing() {
		editData = {
			type: doc?.type || 'invoice',
			invoice_number: doc?.invoice_number || '',
			client: doc?.client || '',
			clientDetails: {
				email: doc?.clientDetails?.email || '',
				phone: doc?.clientDetails?.phone || '',
				address: doc?.clientDetails?.address || ''
			},
			line_items: (doc?.line_items || []).map((item: any, i: number) => ({
				id: `item-${i}-${Date.now()}`,
				description: item.description || '',
				quantity: item.quantity || 1,
				unit: item.unit || 'ea',
				rate: item.rate || 0,
				total: item.total || 0
			})),
			tax_rate: normalizeTaxRate(doc?.tax_rate),
			due_date: doc?.due_date || '',
			notes: doc?.notes || ''
		};
		isEditing = true;
		showMenu = false;
	}

	// Cancel editing - navigate back to documents list
	function cancelEditing() {
		goto('/dashboard/documents');
	}

	// Go back from edit mode - navigate to documents list
	function handleBackFromEdit() {
		goto('/dashboard/documents');
	}

	// Save changes
	async function saveChanges() {
		if (isSaving) return;

		isSaving = true;
		saveError = '';

		try {
			const response = await fetch(`/api/documents/${doc.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					table: 'invoices',
					type: editData.type,
					invoice_number: editData.invoice_number,
					client_name: editData.client,
					client_details: {
						email: editData.clientDetails.email || null,
						phone: editData.clientDetails.phone || null,
						address: editData.clientDetails.address || null
					},
					line_items: editData.line_items.map((item) => ({
						description: item.description,
						quantity: item.quantity,
						unit: item.unit,
						rate: item.rate,
						total: item.total
					})),
					subtotal: calculatedSubtotal,
					tax_rate: editData.tax_rate,
					tax_amount: calculatedTaxAmount,
					total: calculatedTotal,
					due_date: editData.due_date || null,
					notes: editData.notes || null
				})
			});

			const result = await response.json();

			if (response.ok && result.success) {
				// Reload the page data to reflect changes
				await invalidateAll();
				editExitedManually = true; // Prevent auto-edit effect from re-triggering
				isEditing = false;
				saveSuccess = true;
				// Remove ?edit=true from URL to stay in view mode
				if ($page.url.searchParams.has('edit')) {
					const url = new URL($page.url);
					url.searchParams.delete('edit');
					await goto(url.pathname + url.search, { replaceState: true, noScroll: true });
				}
				setTimeout(() => {
					saveSuccess = false;
				}, 3000);
			} else {
				saveError = result.error || 'Failed to save changes';
			}
		} catch (error) {
			console.error('Save error:', error);
			saveError = 'Network error. Please try again.';
		} finally {
			isSaving = false;
		}
	}

	// Line item helpers
	function updateItemTotal(item: EditableLineItem) {
		item.total = (item.quantity || 0) * (item.rate || 0);
	}

	function addLineItem() {
		editData.line_items = [
			...editData.line_items,
			{
				id: `item-${Date.now()}`,
				description: '',
				quantity: 1,
				unit: 'ea',
				rate: 0,
				total: 0
			}
		];
	}

	function removeLineItem(id: string) {
		editData.line_items = editData.line_items.filter((item) => item.id !== id);
	}

	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2
		}).format(amount);
	}

	// Download PDF via server-side puppeteer rendering
	async function handleDownload() {
		if (isGenerating) return;
		isGenerating = true;

		try {
			const response = await fetch('/api/documents/pdf', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(templateDocument)
			});

			if (!response.ok) throw new Error('PDF generation failed');

			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${templateDocument.documentType}-${templateDocument.documentNumber}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			toast.success('PDF downloaded');
		} catch (error) {
			console.error('Failed to generate PDF:', error);
			toast.error($t('docDetail.failedPdf'));
		} finally {
			isGenerating = false;
		}
	}

	async function handleDelete() {
		if (!confirm($t('docDetail.confirmDelete'))) return;

		// Navigate immediately, delete in background
		goto('/dashboard/documents');
		fetch(`/api/documents/${doc.id}`, { method: 'DELETE' }).catch((error) => {
			console.error('Delete error:', error);
		});
	}

	// Send email handler
	async function handleSendEmail() {
		const clientEmail = doc.clientDetails?.email;

		if (!clientEmail) {
			emailInput = '';
			showEmailModal = true;
			showMenu = false;
			return;
		}

		await sendEmail(clientEmail);
	}

	async function sendEmail(recipientEmail: string) {
		if (isSending) return;

		isSending = true;
		sendError = '';
		sendSuccess = false;

		try {
			const response = await fetch('/api/documents/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					documentId: doc.id,
					documentType: doc.type || 'invoice',
					method: 'email',
					recipient: {
						email: recipientEmail,
						name: doc.client || ''
					}
				})
			});

			const result = await response.json();

			if (response.ok && result.success) {
				sendSuccess = true;
				showEmailModal = false;
				toast.success($t('docDetail.emailSuccess'));
				setTimeout(() => {
					sendSuccess = false;
				}, 3000);
			} else {
				sendError = result.error || $t('docDetail.failedEmail');
			}
		} catch (error) {
			console.error('Send email error:', error);
			sendError = $t('docDetail.networkError');
		} finally {
			isSending = false;
		}
	}

	function handleEmailSubmit(e: Event) {
		e.preventDefault();
		if (emailInput && isValidEmail(emailInput)) {
			sendEmail(emailInput);
		}
	}

	function isValidEmail(email: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	function closeEmailModal() {
		showEmailModal = false;
		emailInput = '';
		sendError = '';
	}

	function toggleMenu() {
		showMenu = !showMenu;
	}
	function closeMenu() {
		showMenu = false;
	}
</script>

<svelte:window onclick={closeMenu} />

<main class="document-page">
	<!-- Header -->
	<header class="page-header" in:fly={{ y: -20, duration: 400, easing: cubicOut }}>
		<button
			class="back-btn"
			onclick={() => (isEditing ? handleBackFromEdit() : goto(backUrl))}
			aria-label={$t('common.back')}
		>
			<ChevronLeft size={22} strokeWidth={2} />
		</button>

		{#if isEditing}
			<span class="header-title">{$t('docDetail.editDocument')}</span>
		{/if}

		<div class="header-spacer"></div>

		<div class="header-actions">
			{#if isEditing}
				<button class="cancel-btn" onclick={cancelEditing} disabled={isSaving}>
					{$t('docDetail.cancel')}
				</button>
				<button class="save-btn" onclick={saveChanges} disabled={isSaving}>
					{#if isSaving}
						<Loader2 size={16} class="spinning" />
					{:else}
						<Check size={16} />
					{/if}
					<span>{isSaving ? $t('docDetail.saving') : $t('docDetail.save')}</span>
				</button>
			{:else}
				<button class="edit-btn" onclick={startEditing}>
					<Pencil size={16} />
					<span>{$t('docDetail.edit')}</span>
				</button>
				<button
					class="menu-btn"
					onclick={(e) => {
						e.stopPropagation();
						toggleMenu();
					}}
					aria-label={$t('aria.moreOptions')}
				>
					<MoreHorizontal size={20} strokeWidth={2} />
				</button>
				{#if showMenu}
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<div
						class="dropdown-menu"
						in:fly={{ y: -10, duration: 150 }}
						onclick={(e) => e.stopPropagation()}
						onkeydown={(e) => e.key === 'Escape' && closeMenu()}
						role="menu"
						tabindex="-1"
					>
						<button class="menu-item" onclick={handleSendEmail} disabled={isSending}>
							<Mail size={16} />
							<span>{isSending ? $t('docDetail.sending') : $t('docDetail.sendEmail')}</span>
						</button>
						<button class="menu-item" onclick={handleDownload} disabled={isGenerating}>
							<Download size={16} />
							<span>{isGenerating ? $t('docDetail.generating') : $t('docDetail.downloadPdf')}</span>
						</button>
						<button class="menu-item">
							<Copy size={16} />
							<span>{$t('docDetail.duplicate')}</span>
						</button>
						<button class="menu-item">
							<Share2 size={16} />
							<span>{$t('docDetail.shareLink')}</span>
						</button>
						<div class="menu-divider"></div>
						<button class="menu-item danger" onclick={handleDelete} disabled={isDeleting}>
							<Trash2 size={16} />
							<span>{isDeleting ? $t('docDetail.deleting') : $t('docDetail.delete')}</span>
						</button>
					</div>
				{/if}
			{/if}
		</div>
	</header>

	{#if saveError}
		<div class="error-banner" in:fly={{ y: -20, duration: 200 }}>
			<span>{saveError}</span>
			<button onclick={() => (saveError = '')}>
				<X size={16} />
			</button>
		</div>
	{/if}

	<!-- Edit Mode -->
	{#if isEditing}
		<div class="edit-container" in:fly={{ y: 20, duration: 400, easing: cubicOut }}>
			<!-- Document Type Section -->
			<section class="edit-section">
				<h3 class="section-label">{$t('docDetail.documentType')}</h3>
				<div class="type-toggle">
					<button
						class="type-btn"
						class:active={editData.type === 'invoice'}
						onclick={() => (editData.type = 'invoice')}
					>
						<Receipt size={18} />
						<span>{$t('docDetail.invoice')}</span>
					</button>
					<button
						class="type-btn"
						class:active={editData.type === 'estimate'}
						onclick={() => (editData.type = 'estimate')}
					>
						<FileText size={18} />
						<span>{$t('docDetail.estimate')}</span>
					</button>
				</div>
			</section>

			<!-- Document Number -->
			<section class="edit-section">
				<label class="field-label" for="doc-number">{$t('docDetail.documentNumber')}</label>
				<input
					id="doc-number"
					type="text"
					class="field-input"
					bind:value={editData.invoice_number}
					placeholder="INV-2024-001"
				/>
			</section>

			<!-- Client Information -->
			<section class="edit-section">
				<h3 class="section-label">
					<User size={16} />
					{$t('docDetail.clientInfo')}
				</h3>
				<div class="field-group">
					<div class="field">
						<label class="field-label" for="client-name">{$t('docDetail.clientName')}</label>
						<input
							id="client-name"
							type="text"
							class="field-input"
							bind:value={editData.client}
							placeholder="Client name"
						/>
					</div>
					<div class="field">
						<label class="field-label" for="client-email">{$t('docDetail.clientEmail')}</label>
						<input
							id="client-email"
							type="email"
							class="field-input"
							bind:value={editData.clientDetails.email}
							placeholder={$t('docDetail.emailPlaceholder')}
						/>
					</div>
					<div class="field">
						<label class="field-label" for="client-phone">{$t('docDetail.clientPhone')}</label>
						<input
							id="client-phone"
							type="tel"
							class="field-input"
							bind:value={editData.clientDetails.phone}
							placeholder="(555) 123-4567"
						/>
					</div>
					<div class="field">
						<label class="field-label" for="client-address">{$t('docDetail.clientAddress')}</label>
						<input
							id="client-address"
							type="text"
							class="field-input"
							bind:value={editData.clientDetails.address}
							placeholder="123 Main St, City, ST 12345"
						/>
					</div>
				</div>
			</section>

			<!-- Line Items -->
			<section class="edit-section">
				<h3 class="section-label">
					<DollarSign size={16} />
					{$t('docDetail.lineItems')}
				</h3>
				<div class="line-items-list">
					{#each editData.line_items as item, index (item.id)}
						<div class="line-item-card" in:fly={{ y: 10, duration: 200 }}>
							<div class="line-item-header">
								<span class="item-number">{index + 1}</span>
								<button
									class="remove-item-btn"
									onclick={() => removeLineItem(item.id)}
									aria-label="Remove item"
								>
									<X size={14} />
								</button>
							</div>
							<div class="line-item-fields">
								<div class="field full">
									<label class="field-label-sm" for="item-desc-{item.id}"
										>{$t('docDetail.description')}</label
									>
									<input
										id="item-desc-{item.id}"
										type="text"
										class="field-input"
										bind:value={item.description}
										placeholder={$t('placeholder.description')}
									/>
								</div>
								<div class="field-row">
									<div class="field">
										<label class="field-label-sm" for="item-qty-{item.id}"
											>{$t('docDetail.quantity')}</label
										>
										<input
											id="item-qty-{item.id}"
											type="number"
											class="field-input"
											bind:value={item.quantity}
											oninput={() => updateItemTotal(item)}
											min="0"
											step="0.01"
										/>
									</div>
									<div class="field">
										<label class="field-label-sm" for="item-unit-{item.id}"
											>{$t('docDetail.unit')}</label
										>
										<input
											id="item-unit-{item.id}"
											type="text"
											class="field-input"
											bind:value={item.unit}
											placeholder="ea"
										/>
									</div>
									<div class="field">
										<label class="field-label-sm" for="item-rate-{item.id}"
											>{$t('docDetail.rate')}</label
										>
										<input
											id="item-rate-{item.id}"
											type="number"
											class="field-input"
											bind:value={item.rate}
											oninput={() => updateItemTotal(item)}
											min="0"
											step="0.01"
										/>
									</div>
									<div class="field">
										<span class="field-label-sm">{$t('docDetail.total')}</span>
										<div class="field-value">{formatCurrency(item.total)}</div>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
				<button class="add-item-btn" onclick={addLineItem}>
					<Plus size={16} />
					<span>{$t('docDetail.addLineItem')}</span>
				</button>
			</section>

			<!-- Tax & Due Date -->
			<section class="edit-section">
				<div class="field-row-2">
					<div class="field">
						<label class="field-label" for="tax-rate">{$t('docDetail.taxRate')} (%)</label>
						<input
							id="tax-rate"
							type="number"
							class="field-input"
							bind:value={editData.tax_rate}
							min="0"
							max="100"
							step="0.01"
							placeholder="0"
						/>
					</div>
					<div class="field">
						<label class="field-label" for="due-date">
							<Calendar size={14} />
							{$t('docDetail.dueDate')}
						</label>
						<input id="due-date" type="date" class="field-input" bind:value={editData.due_date} />
					</div>
				</div>
			</section>

			<!-- Totals Summary -->
			<section class="totals-section">
				<div class="total-row">
					<span>{$t('docDetail.subtotal')}</span>
					<span>{formatCurrency(calculatedSubtotal)}</span>
				</div>
				{#if editData.tax_rate > 0}
					<div class="total-row">
						<span>{$t('docDetail.tax')} ({editData.tax_rate.toFixed(1)}%)</span>
						<span>{formatCurrency(calculatedTaxAmount)}</span>
					</div>
				{/if}
				<div class="total-row grand">
					<span>{$t('docDetail.total')}</span>
					<span>{formatCurrency(calculatedTotal)}</span>
				</div>
			</section>

			<!-- Notes -->
			<section class="edit-section">
				<label class="field-label" for="notes">{$t('docDetail.notes')}</label>
				<textarea
					id="notes"
					class="field-textarea"
					bind:value={editData.notes}
					placeholder={$t('placeholder.addNote')}
					rows="3"
				></textarea>
			</section>
		</div>
	{:else}
		<!-- View Mode - Document Content -->
		<div class="document-container" in:fly={{ y: 20, duration: 500, delay: 100, easing: cubicOut }}>
			<DocumentTemplate document={templateDocument} />
		</div>
	{/if}
</main>

<!-- Email Modal -->
{#if showEmailModal}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="modal-backdrop"
		transition:fade={{ duration: 200 }}
		onclick={closeEmailModal}
		onkeydown={(e) => e.key === 'Escape' && closeEmailModal()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="modal-content"
			in:fly={{ y: 20, duration: 300, easing: cubicOut }}
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="document"
		>
			<div class="modal-header">
				<h2>{$t('docDetail.emailModalTitle')}</h2>
				<button class="modal-close" onclick={closeEmailModal} aria-label={$t('common.close')}>
					<X size={20} />
				</button>
			</div>
			<form onsubmit={handleEmailSubmit}>
				<div class="modal-body">
					<p class="modal-description">{$t('docDetail.emailModalDesc')}</p>
					<label class="email-label">
						<span>{$t('docDetail.emailAddress')}</span>
						<input
							type="email"
							bind:value={emailInput}
							placeholder={$t('docDetail.emailPlaceholder')}
							required
							autocomplete="email"
							class="email-input"
						/>
					</label>
					{#if sendError}
						<p class="error-message">{sendError}</p>
					{/if}
				</div>
				<div class="modal-footer">
					<button type="button" class="btn-secondary" onclick={closeEmailModal}
						>{$t('common.cancel')}</button
					>
					<button
						type="submit"
						class="btn-primary"
						disabled={isSending || !emailInput || !isValidEmail(emailInput)}
					>
						{#if isSending}
							<Loader2 size={16} class="spinning" />
							<span>{$t('docDetail.sending')}</span>
						{:else}
							<Mail size={16} />
							<span>{$t('docDetail.sendEmail')}</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}


<style>
	.document-page {
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
		padding: var(--page-padding-x, var(--space-5));
		padding-top: calc(var(--space-3) + var(--safe-area-top, 0px));
		padding-bottom: 0;
	}

	/* Header */
	.page-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-5);
		max-width: var(--page-max-width, 600px);
		margin-left: auto;
		margin-right: auto;
		width: 100%;
	}

	.header-title {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--gray-900);
	}

	.back-btn,
	.menu-btn {
		width: var(--btn-height-md, 44px);
		height: var(--btn-height-md, 44px);
		display: flex;
		align-items: center;
		justify-content: center;
		background: white;
		border: 1px solid var(--blu-border);
		border-radius: var(--radius-button);
		color: var(--gray-600);
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.back-btn:hover,
	.menu-btn:hover {
		background: var(--gray-100);
		color: var(--gray-900);
	}

	.header-spacer {
		flex: 1;
	}
	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		position: relative;
	}

	.edit-btn,
	.save-btn,
	.cancel-btn {
		display: flex;
		align-items: center;
		gap: var(--space-1-5);
		padding: var(--space-2-5) var(--space-4);
		border-radius: var(--radius-input);
		font-size: var(--text-sm);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.edit-btn {
		background: white;
		border: 1px solid var(--blu-border);
		color: var(--gray-700);
	}

	.edit-btn:hover {
		background: var(--gray-100);
		color: var(--gray-900);
	}

	.save-btn {
		background: var(--blu-primary);
		border: none;
		color: white;
		box-shadow: 0 2px 8px rgba(0, 102, 255, 0.25);
	}

	.save-btn:hover:not(:disabled) {
		background: var(--blu-primary-hover);
	}

	.save-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.cancel-btn {
		background: transparent;
		border: 1px solid var(--blu-border);
		color: var(--gray-600);
	}

	.cancel-btn:hover:not(:disabled) {
		background: var(--gray-100);
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + var(--space-2));
		right: 0;
		background: white;
		border: 1px solid var(--blu-border);
		border-radius: var(--radius-button);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
		min-width: 180px;
		overflow: hidden;
		z-index: 50;
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-3-5) var(--space-4);
		background: none;
		border: none;
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--gray-700);
		cursor: pointer;
		text-align: left;
	}

	.menu-item:hover {
		background: var(--gray-50);
	}
	.menu-item.danger {
		color: var(--data-red);
	}
	.menu-item.danger:hover {
		background: rgba(239, 68, 68, 0.06);
	}
	.menu-item:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.menu-divider {
		height: 1px;
		background: var(--blu-border);
		margin: var(--space-1) 0;
	}

	/* Error Banner */
	.error-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3) var(--space-4);
		max-width: var(--page-max-width, 600px);
		margin: 0 auto;
		width: 100%;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: var(--radius-input);
		color: var(--data-red-hover);
		font-size: var(--text-sm);
	}

	.error-banner button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: transparent;
		border: none;
		border-radius: 6px;
		color: var(--data-red-hover);
		cursor: pointer;
	}

	.error-banner button:hover {
		background: rgba(220, 38, 38, 0.1);
	}

	/* Edit Container */
	.edit-container {
		flex: 1;
		padding-bottom: 120px;
		max-width: var(--page-max-width, 600px);
		margin: 0 auto;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.edit-section {
		background: white;
		border: 1px solid var(--blu-border);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
	}

	.section-label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--gray-500);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		margin: 0 0 var(--space-4);
	}

	.field-label {
		display: flex;
		align-items: center;
		gap: var(--space-1-5);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--gray-600);
		margin-bottom: var(--space-2);
	}

	.field-label-sm {
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--gray-500);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		margin-bottom: var(--space-1-5);
	}

	.field-input {
		width: 100%;
		padding: var(--space-3) var(--space-3-5);
		background: var(--gray-50);
		border: 1px solid var(--blu-border);
		border-radius: var(--radius-sm);
		font-size: var(--text-base);
		color: var(--gray-900);
		transition: all var(--duration-fast) ease;
	}

	.field-input:focus {
		outline: none;
		background: white;
		border-color: var(--blu-primary);
		box-shadow: var(--shadow-input-focus);
	}

	.field-input::placeholder {
		color: var(--gray-400);
	}

	.field-textarea {
		width: 100%;
		padding: var(--space-3) var(--space-3-5);
		background: var(--gray-50);
		border: 1px solid var(--blu-border);
		border-radius: var(--radius-sm);
		font-size: var(--text-base);
		color: var(--gray-900);
		resize: vertical;
		min-height: 80px;
		font-family: inherit;
		transition: all var(--duration-fast) ease;
	}

	.field-textarea:focus {
		outline: none;
		background: white;
		border-color: var(--blu-primary);
		box-shadow: var(--shadow-input-focus);
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-3-5);
	}

	.field {
		display: flex;
		flex-direction: column;
	}

	.field.full {
		width: 100%;
	}

	.field-row {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr;
		gap: var(--space-2-5);
	}

	.field-row-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3-5);
	}

	.field-value {
		padding: var(--space-3) var(--space-3-5);
		background: var(--gray-100);
		border: 1px solid var(--blu-border);
		border-radius: var(--radius-sm);
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--data-green);
	}

	/* Type Toggle */
	.type-toggle {
		display: flex;
		gap: var(--space-2-5);
	}

	.type-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3-5);
		background: var(--gray-50);
		border: 2px solid var(--blu-border);
		border-radius: var(--radius-input);
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--gray-500);
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.type-btn:hover {
		background: var(--gray-100);
		color: var(--gray-700);
	}

	.type-btn.active {
		background: var(--glass-primary-8);
		border-color: var(--blu-primary);
		color: var(--blu-primary);
	}

	/* Line Items */
	.line-items-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	.line-item-card {
		background: var(--gray-50);
		border: 1px solid var(--blu-border);
		border-radius: var(--radius-input);
		padding: var(--space-3-5);
	}

	.line-item-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-3);
	}

	.item-number {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--blu-border);
		border-radius: 6px;
		font-size: var(--text-xs);
		font-weight: 700;
		color: var(--gray-500);
	}

	.remove-item-btn {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: 1px solid #fecaca;
		border-radius: 6px;
		color: var(--data-red);
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.remove-item-btn:hover {
		background: rgba(239, 68, 68, 0.1);
	}

	.line-item-fields {
		display: flex;
		flex-direction: column;
		gap: var(--space-2-5);
	}

	.add-item-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-3-5);
		background: rgba(0, 102, 255, 0.06);
		border: 2px dashed rgba(0, 102, 255, 0.3);
		border-radius: var(--radius-input);
		color: var(--blu-primary);
		font-size: var(--text-sm);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.add-item-btn:hover {
		background: var(--glass-primary-10);
		border-color: var(--blu-primary);
	}

	/* Totals Section */
	.totals-section {
		background: white;
		border: 1px solid var(--blu-border);
		border-radius: var(--radius-lg);
		padding: var(--space-5);
	}

	.total-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-2-5) 0;
		font-size: var(--text-base);
		color: var(--gray-600);
	}

	.total-row + .total-row {
		border-top: 1px solid var(--gray-100);
	}

	.total-row.grand {
		padding-top: var(--space-3-5);
		margin-top: var(--space-1);
		border-top: 2px solid var(--blu-border);
		font-size: var(--text-lg);
		font-weight: 700;
		color: var(--gray-900);
	}

	.total-row.grand span:last-child {
		color: var(--data-green);
	}

	/* Document Container (View Mode) */
	.document-container {
		flex: 1;
		padding-bottom: 120px;
		max-width: var(--page-max-width, 600px);
		margin: 0 auto;
		width: 100%;
	}

	/* Spinning animation */
	:global(.spinning) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* Modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		z-index: 200;
	}

	.modal-content {
		background: white;
		border-radius: var(--radius-lg);
		width: 100%;
		max-width: 420px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-5) var(--space-6);
		border-bottom: 1px solid var(--blu-border);
	}

	.modal-header h2 {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--blu-text);
		margin: 0;
	}

	.modal-close {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		border-radius: 8px;
		color: var(--blu-text-muted);
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.modal-close:hover {
		background: var(--gray-100);
		color: var(--blu-text);
	}

	.modal-body {
		padding: var(--space-6);
	}

	.modal-description {
		font-size: var(--text-sm);
		color: var(--blu-text-muted);
		margin: 0 0 var(--space-5);
		line-height: 1.5;
	}

	.email-label {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.email-label span {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--gray-700);
	}

	.email-input {
		width: 100%;
		padding: var(--space-3-5) var(--space-4);
		border: 1px solid var(--blu-border);
		border-radius: var(--radius-input);
		font-size: var(--text-base);
		color: var(--blu-text);
		background: var(--gray-50);
		transition: all var(--duration-fast) ease;
	}

	.email-input:focus {
		outline: none;
		border-color: var(--blu-primary);
		background: white;
		box-shadow: var(--shadow-input-focus);
	}

	.email-input::placeholder {
		color: var(--gray-400);
	}

	.error-message {
		font-size: var(--text-sm);
		color: var(--data-red);
		margin: var(--space-3) 0 0;
	}

	.modal-footer {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-4) var(--space-6) var(--space-6);
	}

	.btn-secondary,
	.btn-primary {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3-5) var(--space-5);
		border-radius: var(--radius-input);
		font-size: var(--text-base);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.btn-secondary {
		background: white;
		border: 1px solid var(--blu-border);
		color: var(--blu-text-muted);
	}

	.btn-secondary:hover {
		background: var(--gray-50);
		color: var(--gray-700);
	}

	.btn-primary {
		background: var(--blu-primary);
		border: none;
		color: white;
		box-shadow: 0 4px 12px rgba(0, 102, 255, 0.25);
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--blu-primary-hover);
		transform: translateY(-1px);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.back-btn,
		.menu-btn,
		.edit-btn,
		.save-btn,
		.cancel-btn,
		.type-btn,
		.add-item-btn,
		.menu-item {
			transition: none;
		}
		:global(.spinning) {
			animation: none;
		}
	}

	/* Mobile */
	@media (max-width: 600px) {
		.document-container,
		.edit-container {
			padding-bottom: 100px;
		}

		.field-row {
			grid-template-columns: 1fr 1fr;
		}

		.field-row-2 {
			grid-template-columns: 1fr;
		}

		.edit-section {
			padding: var(--space-4);
		}
	}
</style>

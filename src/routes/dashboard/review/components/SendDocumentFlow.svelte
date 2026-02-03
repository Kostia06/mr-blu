<script lang="ts">
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import Mail from 'lucide-svelte/icons/mail';
	import MessageSquare from 'lucide-svelte/icons/message-square';
	import FileText from 'lucide-svelte/icons/file-text';
	import Receipt from 'lucide-svelte/icons/receipt';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Check from 'lucide-svelte/icons/check';
	import X from 'lucide-svelte/icons/x';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Plus from 'lucide-svelte/icons/plus';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChevronUp from 'lucide-svelte/icons/chevron-up';
	import { ReviewLoadingState } from './';

	// Types
	interface LineItem {
		id: string;
		description: string;
		quantity: number;
		unit: string;
		rate: number;
		total: number;
	}

	interface SourceDocument {
		id: string;
		type: 'invoice' | 'estimate' | 'contract';
		title: string;
		client: string;
		clientId?: string | null;
		clientEmail?: string | null;
		clientPhone?: string | null;
		amount: number;
		date: string;
		status: string;
		lineItems?: LineItem[];
	}

	interface SendData {
		clientName: string;
		documentType: string | null;
		deliveryMethod: 'email' | 'sms' | 'whatsapp';
		summary: string;
	}

	interface ClientInfo {
		email?: string;
		phone?: string;
	}

	interface Props {
		sendData: SendData | null;
		sendDocument: SourceDocument | null;
		sendClientInfo: ClientInfo | null;
		isSendingDocument: boolean;
		sendError: string | null;
		sendSuccess: boolean;
		onExecuteSend: (email: string, phone: string) => void;
		onLoadDocumentForEditing: () => Promise<LineItem[]>;
		onSaveDocumentChanges: (items: LineItem[], taxRate: number) => Promise<boolean>;
	}

	let {
		sendData,
		sendDocument,
		sendClientInfo,
		isSendingDocument,
		sendError,
		sendSuccess,
		onExecuteSend,
		onLoadDocumentForEditing,
		onSaveDocumentChanges
	}: Props = $props();

	// Local state
	let editableSendEmail = $state('');
	let editableSendPhone = $state('');
	let isEditingSendDocument = $state(false);
	let sendDocumentItems = $state<LineItem[]>([]);
	let sendDocumentTaxRate = $state(0);
	let expandedSendItemId = $state<string | null>(null);
	let isSavingSendDocument = $state(false);
	let isUpdatingClientInfo = $state(false);

	// Computed values
	const sendDocumentSubtotal = $derived(
		sendDocumentItems.reduce((sum, item) => sum + (item.total || 0), 0)
	);
	const sendDocumentTaxAmount = $derived(sendDocumentSubtotal * (sendDocumentTaxRate / 100));
	const sendDocumentTotal = $derived(sendDocumentSubtotal + sendDocumentTaxAmount);

	// Initialize editable fields when sendClientInfo changes
	$effect(() => {
		if (sendClientInfo) {
			editableSendEmail = sendClientInfo.email || '';
			editableSendPhone = sendClientInfo.phone || '';
		}
	});

	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2
		}).format(amount);
	}

	// Format date for query results
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

	// Format currency for amounts
	function formatQueryAmount(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Load document for editing
	async function loadSendDocumentForEditing() {
		const items = await onLoadDocumentForEditing();
		sendDocumentItems = items;
		isEditingSendDocument = true;
	}

	// Cancel editing
	function cancelSendDocumentEditing() {
		isEditingSendDocument = false;
		sendDocumentItems = [];
		expandedSendItemId = null;
	}

	// Save changes
	async function saveSendDocumentChanges() {
		isSavingSendDocument = true;
		const success = await onSaveDocumentChanges(sendDocumentItems, sendDocumentTaxRate);
		isSavingSendDocument = false;
		if (success) {
			isEditingSendDocument = false;
		}
	}

	// Update item total when qty/rate changes
	function updateSendItemTotal(item: LineItem) {
		item.total = (item.quantity || 0) * (item.rate || 0);
	}

	// Remove item
	function removeSendItem(itemId: string) {
		sendDocumentItems = sendDocumentItems.filter((i) => i.id !== itemId);
	}

	// Add new item
	function addSendItem() {
		const newItem: LineItem = {
			id: `item-${Date.now()}`,
			description: '',
			quantity: 1,
			unit: 'ea',
			rate: 0,
			total: 0
		};
		sendDocumentItems = [...sendDocumentItems, newItem];
		expandedSendItemId = newItem.id;
	}

	// Execute send
	function handleSend() {
		onExecuteSend(editableSendEmail, editableSendPhone);
	}

	function saveSendStateAndNavigate(path: string) {
		goto(path);
	}
</script>

<div class="content">
	<div class="summary-card send-mode">
		<div class="summary-header">
			<Mail size={16} class="summary-icon" />
			<span>{$t('review.sendingDocument')}</span>
		</div>
		<p class="summary-text">{sendData?.summary || 'Finding document to send...'}</p>
	</div>

	{#if isSendingDocument && !sendDocument}
		<!-- Loading State -->
		<ReviewLoadingState
			message="Searching for {sendData?.clientName}'s {sendData?.documentType || 'document'}..."
		/>
	{:else if sendError}
		<!-- Error State (only for critical errors like document not found) -->
		<div class="send-error-card">
			<AlertCircle size={24} />
			<p>{sendError}</p>
			<div class="send-error-actions">
				<button class="btn secondary" onclick={() => goto('/dashboard')}>
					Back to Dashboard
				</button>
				<button class="btn secondary" onclick={() => goto('/dashboard/documents')}>
					Browse Documents
				</button>
			</div>
		</div>
	{:else if sendSuccess}
		<!-- Success State -->
		<div class="send-success-card">
			<div class="send-success-icon">
				<Check size={48} strokeWidth={2} />
			</div>
			<h2>{$t('review.sent')}</h2>
			<p>
				{sendDocument?.title} has been sent via {sendData?.deliveryMethod}
				{#if sendData?.deliveryMethod === 'email'}
					to {editableSendEmail || sendClientInfo?.email}
				{:else}
					to {editableSendPhone || sendClientInfo?.phone}
				{/if}
			</p>
			<div class="send-success-actions">
				<button class="btn primary" onclick={() => goto('/dashboard/documents')}>
					{$t('review.viewDocuments')}
				</button>
				<button class="btn secondary" onclick={() => goto('/dashboard/record')}>
					{$t('review.newRecording')}
				</button>
			</div>
		</div>
	{:else if sendDocument}
		<!-- Document Found - Ready to Send -->
		<div class="send-preview">
			{#if isEditingSendDocument}
				<!-- Editing Mode -->
				<h3 class="send-preview-title">{$t('review.editDocument')}</h3>

				<div class="send-edit-card">
					<div class="send-doc-header">
						<div
							class="send-doc-icon"
							class:invoice={sendDocument.type === 'invoice'}
							class:estimate={sendDocument.type === 'estimate'}
						>
							{#if sendDocument.type === 'invoice'}
								<Receipt size={24} />
							{:else}
								<FileText size={24} />
							{/if}
						</div>
						<div class="send-doc-info">
							<span class="send-doc-title">{sendDocument.title}</span>
							<span class="send-doc-client">{sendDocument.client}</span>
						</div>
					</div>

					<!-- Line Items -->
					<div class="send-line-items">
						<div class="send-items-header">
							<span
								>{sendDocumentItems.length !== 1
									? $t('review.lineItemsCount').replace('{n}', String(sendDocumentItems.length))
									: $t('review.lineItemCount').replace(
											'{n}',
											String(sendDocumentItems.length)
										)}</span
							>
						</div>

						{#if sendDocumentItems.length > 0}
							<div class="send-items-list">
								{#each sendDocumentItems as item, index (item.id)}
									{@const isExpanded = expandedSendItemId === item.id}
									<div class="send-item-card" class:expanded={isExpanded}>
										<button
											class="send-item-header"
											onclick={() => (expandedSendItemId = isExpanded ? null : item.id)}
										>
											<span class="send-item-num">{index + 1}</span>
											<div class="send-item-summary">
												<span class="send-item-desc">{item.description || 'Untitled item'}</span>
												<span class="send-item-meta">
													{item.quantity}
													{item.unit} × {formatCurrency(item.rate)}
												</span>
											</div>
											<span class="send-item-total">{formatCurrency(item.total)}</span>
											{#if isExpanded}
												<ChevronUp size={16} class="expand-icon" />
											{:else}
												<ChevronDown size={16} class="expand-icon" />
											{/if}
										</button>

										{#if isExpanded}
											<div class="send-item-edit">
												<div class="edit-field full">
													<label for="send-item-desc-{item.id}">{$t('review.description')}</label>
													<input
														id="send-item-desc-{item.id}"
														type="text"
														bind:value={item.description}
														placeholder={$t('placeholder.description')}
													/>
												</div>
												<div class="edit-row">
													<div class="edit-field">
														<label for="send-item-qty-{item.id}">{$t('review.quantity')}</label>
														<input
															id="send-item-qty-{item.id}"
															type="number"
															bind:value={item.quantity}
															oninput={() => updateSendItemTotal(item)}
															min="0"
															step="0.01"
														/>
													</div>
													<div class="edit-field">
														<label for="send-item-unit-{item.id}">{$t('review.unit')}</label>
														<input
															id="send-item-unit-{item.id}"
															type="text"
															bind:value={item.unit}
															placeholder={$t('placeholder.unit')}
														/>
													</div>
													<div class="edit-field">
														<label for="send-item-rate-{item.id}">{$t('review.rate')}</label>
														<input
															id="send-item-rate-{item.id}"
															type="number"
															bind:value={item.rate}
															oninput={() => updateSendItemTotal(item)}
															min="0"
															step="0.01"
														/>
													</div>
												</div>
												<div class="edit-actions">
													<button class="delete-item-btn" onclick={() => removeSendItem(item.id)}>
														<Trash2 size={14} />
														Delete
													</button>
												</div>
											</div>
										{/if}
									</div>
								{/each}
							</div>
						{/if}

						<button class="add-item-btn" onclick={addSendItem}>
							<Plus size={16} />
							{$t('review.addLineItem')}
						</button>
					</div>

					<!-- Totals -->
					<div class="send-totals">
						<div class="send-total-row">
							<span>{$t('review.subtotal')}</span>
							<span>{formatCurrency(sendDocumentSubtotal)}</span>
						</div>
						<div class="send-total-row tax-row">
							<span>{$t('review.tax')}</span>
							<div class="tax-input-wrapper">
								<input
									type="number"
									class="tax-input"
									bind:value={sendDocumentTaxRate}
									min="0"
									max="100"
									step="0.1"
								/>
								<span class="tax-percent">%</span>
							</div>
							<span>{formatCurrency(sendDocumentTaxAmount)}</span>
						</div>
						<div class="send-total-row grand-total">
							<span>{$t('review.total')}</span>
							<span>{formatCurrency(sendDocumentTotal)}</span>
						</div>
					</div>
				</div>

				<div class="send-edit-actions">
					<button
						class="btn primary"
						disabled={isSavingSendDocument}
						onclick={saveSendDocumentChanges}
					>
						{#if isSavingSendDocument}
							<Loader2 size={18} class="spinning" />
							Saving...
						{:else}
							<Check size={18} />
							Save Changes
						{/if}
					</button>
					<button class="btn secondary" onclick={cancelSendDocumentEditing}> Cancel </button>
				</div>
			{:else}
				<!-- Preview Mode -->
				<h3 class="send-preview-title">{$t('review.readyToSend')}</h3>

				<div class="send-doc-card">
					<div
						class="send-doc-icon"
						class:invoice={sendDocument.type === 'invoice'}
						class:estimate={sendDocument.type === 'estimate'}
					>
						{#if sendDocument.type === 'invoice'}
							<Receipt size={24} />
						{:else}
							<FileText size={24} />
						{/if}
					</div>
					<div class="send-doc-info">
						<span class="send-doc-title">{sendDocument.title}</span>
						<span class="send-doc-client">{sendDocument.client}</span>
						<span class="send-doc-meta"
							>{formatQueryDate(sendDocument.date)} • {formatQueryAmount(sendDocument.amount)}</span
						>
					</div>
					<button
						class="send-edit-btn"
						onclick={loadSendDocumentForEditing}
						title="Edit document values"
					>
						<Pencil size={16} />
					</button>
				</div>

				<!-- Editable Contact Info -->
				<div class="send-contact-form">
					<div class="send-method-label">
						{#if sendData?.deliveryMethod === 'email'}
							<Mail size={18} />
							<span>{$t('review.sendViaEmailTo')}</span>
						{:else if sendData?.deliveryMethod === 'sms'}
							<MessageSquare size={18} />
							<span>{$t('review.sendViaSmsTo')}</span>
						{:else}
							<MessageSquare size={18} />
							<span>{$t('review.sendViaWhatsappTo')}</span>
						{/if}
					</div>

					{#if sendData?.deliveryMethod === 'email'}
						<input
							type="email"
							class="send-contact-input"
							placeholder={$t('placeholder.email')}
							bind:value={editableSendEmail}
						/>
						{#if !editableSendEmail && !sendClientInfo?.email}
							<p class="send-contact-hint">
								{$t('review.noEmailOnFile', { name: sendDocument.client })}
							</p>
						{/if}
					{:else}
						<input
							type="tel"
							class="send-contact-input"
							placeholder={$t('placeholder.phone')}
							bind:value={editableSendPhone}
						/>
						{#if !editableSendPhone && !sendClientInfo?.phone}
							<p class="send-contact-hint">
								{$t('review.noPhoneOnFile', { name: sendDocument.client })}
							</p>
						{/if}
					{/if}

					{#if sendDocument.clientId && ((editableSendEmail && editableSendEmail !== sendClientInfo?.email) || (editableSendPhone && editableSendPhone !== sendClientInfo?.phone))}
						<p class="send-contact-save-note">
							<Check size={14} />
							{$t('review.savedToProfile')}
						</p>
					{/if}
				</div>

				<div class="send-actions">
					<button
						class="btn primary"
						disabled={isSendingDocument || isUpdatingClientInfo}
						onclick={handleSend}
					>
						{#if isSendingDocument || isUpdatingClientInfo}
							<Loader2 size={18} class="spinning" />
							{isUpdatingClientInfo ? $t('review.updating') : $t('review.sending')}
						{:else}
							<Mail size={18} />
							{$t('review.sendNow')}
						{/if}
					</button>
					<button
						class="btn secondary"
						onclick={() =>
							saveSendStateAndNavigate('/dashboard/documents/' + sendDocument?.id + '?from=review')}
					>
						{$t('review.viewDocument')}
					</button>
					<button class="btn secondary" onclick={() => goto('/dashboard')}>
						{$t('common.cancel')}
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.content {
		flex: 1;
		padding: var(--page-padding-x);
		max-width: var(--page-max-width);
		margin: 0 auto;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--section-gap);
	}

	/* Summary Card */
	.summary-card {
		background: var(--glass-primary-5);
		border: 1px solid var(--glass-primary-15);
		border-radius: var(--radius-card);
		padding: var(--space-5);
	}

	.summary-card.send-mode {
		border-color: rgba(139, 92, 246, 0.3);
		background: rgba(139, 92, 246, 0.08);
	}

	.summary-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-2-5);
		color: #a78bfa;
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
	}

	.summary-text {
		font-size: var(--text-base);
		line-height: 1.5;
		color: var(--gray-700);
		margin: 0;
	}

	/* Error Card */
	.send-error-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 40px 24px;
		background: rgba(239, 68, 68, 0.08);
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: 16px;
		text-align: center;
	}

	.send-error-card :global(svg) {
		color: #f87171;
	}

	.send-error-card p {
		color: var(--gray-600);
		font-size: 14px;
		margin: 0;
	}

	.send-error-actions {
		display: flex;
		gap: 12px;
		margin-top: 8px;
	}

	/* Success Card */
	.send-success-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		padding: 48px 24px;
		text-align: center;
	}

	.send-success-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 80px;
		height: 80px;
		background: rgba(34, 197, 94, 0.15);
		border-radius: 50%;
		color: #22c55e;
	}

	.send-success-card h2 {
		font-size: 24px;
		font-weight: 600;
		color: var(--gray-900);
		margin: 0;
	}

	.send-success-card p {
		color: var(--gray-500);
		font-size: 14px;
		margin: 0;
	}

	.send-success-actions {
		display: flex;
		gap: 12px;
		margin-top: 8px;
	}

	/* Preview */
	.send-preview {
		padding: 20px 0;
	}

	.send-preview-title {
		font-size: 14px;
		font-weight: 500;
		color: var(--gray-500);
		margin: 0 0 16px;
	}

	.send-doc-card {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 20px;
		background: transparent;
		border: 1px solid var(--gray-200);
		border-radius: 16px;
		margin-bottom: 20px;
	}

	.send-doc-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 52px;
		height: 52px;
		border-radius: 12px;
		background: rgba(139, 92, 246, 0.15);
		color: #a78bfa;
		flex-shrink: 0;
	}

	.send-doc-icon.invoice {
		background: rgba(14, 165, 233, 0.15);
		color: #38bdf8;
	}

	.send-doc-icon.estimate {
		background: rgba(34, 197, 94, 0.15);
		color: #22c55e;
	}

	.send-doc-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
		min-width: 0;
	}

	.send-doc-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--gray-900);
	}

	.send-doc-client {
		font-size: 14px;
		color: var(--gray-600);
	}

	.send-doc-meta {
		font-size: 13px;
		color: var(--gray-500);
	}

	/* Contact Form */
	.send-contact-form {
		margin-bottom: 24px;
	}

	.send-method-label {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #a78bfa;
		font-weight: 500;
		font-size: 14px;
		margin-bottom: 10px;
	}

	.send-contact-input {
		width: 100%;
		padding: 14px 16px;
		background: transparent;
		border: 1px solid var(--gray-200);
		border-radius: 12px;
		color: var(--gray-900);
		font-size: 15px;
		outline: none;
		transition: all 0.2s ease;
	}

	.send-contact-input:focus {
		border-color: #a78bfa;
		background: var(--white);
	}

	.send-contact-input::placeholder {
		color: var(--gray-400);
	}

	.send-contact-hint {
		margin-top: 8px;
		font-size: 13px;
		color: var(--gray-500);
	}

	.send-contact-save-note {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 10px;
		font-size: 12px;
		color: #22c55e;
	}

	/* Edit Button */
	.send-edit-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: rgba(0, 102, 255, 0.1);
		border: none;
		border-radius: 10px;
		color: #0066ff;
		cursor: pointer;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.send-edit-btn:hover {
		background: rgba(0, 102, 255, 0.2);
		transform: scale(1.05);
	}

	/* Edit Card */
	.send-edit-card {
		background: var(--white);
		border: 1px solid var(--gray-200);
		border-radius: 16px;
		overflow: hidden;
		margin-bottom: 20px;
	}

	.send-doc-header {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 20px;
		background: transparent;
		border-bottom: 1px solid var(--gray-200);
	}

	/* Line Items */
	.send-line-items {
		padding: 16px;
	}

	.send-items-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
		font-size: 13px;
		font-weight: 500;
		color: var(--gray-500);
	}

	.send-items-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 12px;
	}

	.send-item-card {
		background: transparent;
		border: 1px solid var(--gray-200);
		border-radius: 12px;
		overflow: hidden;
		transition: all 0.2s ease;
	}

	.send-item-card.expanded {
		border-color: #0066ff;
		box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
	}

	.send-item-header {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 14px 16px;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
	}

	.send-item-num {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: var(--gray-200);
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
		color: var(--gray-500);
		flex-shrink: 0;
	}

	.send-item-card.expanded .send-item-num {
		background: #0066ff;
		color: white;
	}

	.send-item-summary {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.send-item-desc {
		font-size: 14px;
		font-weight: 500;
		color: var(--gray-900);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.send-item-meta {
		font-size: 12px;
		color: var(--gray-500);
	}

	.send-item-total {
		font-size: 14px;
		font-weight: 600;
		color: var(--gray-900);
	}

	.send-item-edit {
		padding: 16px;
		background: var(--white);
		border-top: 1px solid var(--gray-200);
	}

	/* Edit Fields */
	.edit-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.edit-field.full {
		margin-bottom: 12px;
	}

	.edit-field label {
		font-size: 12px;
		font-weight: 500;
		color: var(--gray-500);
	}

	.edit-field input {
		width: 100%;
		padding: 10px 12px;
		background: var(--gray-50);
		border: 1px solid var(--gray-200);
		border-radius: 8px;
		font-size: 14px;
		color: var(--gray-900);
	}

	.edit-field input:focus {
		outline: none;
		border-color: #0066ff;
		background: var(--white);
	}

	.edit-row {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 10px;
		margin-bottom: 12px;
	}

	.edit-actions {
		display: flex;
		justify-content: flex-end;
	}

	.delete-item-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 12px;
		background: transparent;
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: 8px;
		color: #f87171;
		font-size: 13px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.delete-item-btn:hover {
		background: rgba(239, 68, 68, 0.1);
		border-color: rgba(239, 68, 68, 0.3);
	}

	.add-item-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		padding: 12px;
		background: transparent;
		border: 1px dashed var(--gray-300);
		border-radius: 10px;
		color: var(--gray-500);
		font-size: 14px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.add-item-btn:hover {
		background: var(--gray-50);
		border-color: #0066ff;
		color: #0066ff;
	}

	/* Totals */
	.send-totals {
		padding: 16px;
		border-top: 1px solid var(--gray-200);
		background: var(--gray-50);
	}

	.send-total-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 0;
		font-size: 14px;
		color: var(--gray-500);
	}

	.send-total-row.tax-row {
		gap: 12px;
	}

	.send-total-row.tax-row span:first-child {
		flex: 1;
	}

	.tax-input-wrapper {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.tax-input {
		width: 60px;
		padding: 6px 8px;
		background: var(--white);
		border: 1px solid var(--gray-200);
		border-radius: 6px;
		font-size: 14px;
		color: var(--gray-900);
		text-align: right;
	}

	.tax-input:focus {
		outline: none;
		border-color: #0066ff;
	}

	.tax-percent {
		font-size: 14px;
		color: var(--gray-500);
	}

	.send-total-row.grand-total {
		padding-top: 12px;
		margin-top: 8px;
		border-top: 1px solid var(--gray-200);
		font-size: 16px;
		font-weight: 600;
		color: var(--gray-900);
	}

	.send-edit-actions {
		display: flex;
		gap: 12px;
	}

	.send-edit-actions .btn {
		flex: 1;
	}

	.send-actions {
		display: flex;
		gap: 12px;
	}

	.send-actions .btn {
		flex: 1;
	}

	/* Button styles */
	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 14px 20px;
		border-radius: 12px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
	}

	.btn.primary {
		background: linear-gradient(135deg, #0066ff, #0052cc);
		color: white;
		box-shadow: 0 4px 12px rgba(0, 102, 255, 0.25);
	}

	.btn.primary:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 6px 16px rgba(0, 102, 255, 0.35);
	}

	.btn.primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn.secondary {
		background: var(--gray-100);
		color: var(--gray-600);
		border: 1px solid var(--gray-200);
	}

	.btn.secondary:hover {
		background: var(--gray-200);
		color: var(--gray-900);
	}

	/* Spinner */
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
</style>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import FileText from 'lucide-svelte/icons/file-text';
	import Receipt from 'lucide-svelte/icons/receipt';
	import Mail from 'lucide-svelte/icons/mail';
	import Check from 'lucide-svelte/icons/check';
	import Play from 'lucide-svelte/icons/play';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Plus from 'lucide-svelte/icons/plus';
	import X from 'lucide-svelte/icons/x';
	import Download from 'lucide-svelte/icons/download';
	import Database from 'lucide-svelte/icons/database';
	import Eye from 'lucide-svelte/icons/eye';
	import RotateCcw from 'lucide-svelte/icons/rotate-ccw';

	interface ActionStep {
		id: string;
		type: 'create_document' | 'send_email' | 'send_sms' | 'schedule' | 'save_draft';
		order: number;
		status: 'pending' | 'in_progress' | 'completed' | 'failed';
		details: {
			recipient?: string;
			frequency?: string;
			message?: string;
		};
		error?: string;
	}

	interface ParsedData {
		documentType: 'invoice' | 'estimate';
		client: {
			name: string | null;
			firstName: string | null;
			lastName: string | null;
			email: string | null;
			phone: string | null;
			address: string | null;
		};
		actions: ActionStep[];
		[key: string]: any;
	}

	let {
		data = $bindable(),
		actions = $bindable(),
		actionConfig,
		isExecuting,
		hasValidationErrors,
		calculatedTotal,
		formatCurrency,
		showProfileWarning = $bindable(),
		profileMissingFields,
		copyLinkStatus,
		sortedActions,
		onExecuteAction,
		onAddAction,
		onHandleDownloadPDF,
		onSaveDocument,
		onOpenViewLinkModal,
		onGetActionDescription,
		onActionHasEditableData,
		onUpdateActionRecipient,
		onUpdateActionFrequency,
		onRetryAction,
		onDismissProfileWarning,
		reviewSessionId,
		onSaveSession
	}: {
		data: ParsedData;
		actions: ActionStep[];
		actionConfig: Record<string, { icon: typeof FileText; labelKey: string; color: string }>;
		isExecuting: boolean;
		hasValidationErrors: boolean;
		calculatedTotal: number;
		formatCurrency: (amount: number) => string;
		showProfileWarning: boolean;
		profileMissingFields: string[];
		copyLinkStatus: 'idle' | 'loading' | 'copied' | 'error';
		sortedActions: ActionStep[];
		onExecuteAction: (action: ActionStep) => void;
		onAddAction: (type: ActionStep['type']) => void;
		onHandleDownloadPDF: () => Promise<void>;
		onSaveDocument: (actionId: string) => Promise<void>;
		onOpenViewLinkModal: () => void;
		onGetActionDescription: (action: ActionStep) => string;
		onActionHasEditableData: (action: ActionStep) => boolean;
		onUpdateActionRecipient: (action: ActionStep, value: string) => void;
		onUpdateActionFrequency: (action: ActionStep, frequency: string) => void;
		onRetryAction: (action: ActionStep) => void;
		onDismissProfileWarning?: () => void;
		reviewSessionId?: string | null;
		onSaveSession?: () => Promise<void>;
	} = $props();

	// Internal state
	let editingActionId = $state<string | null>(null);
	let showActionTypePicker = $state(false);
	let warningEl = $state<HTMLElement | null>(null);

	$effect(() => {
		if (showProfileWarning && warningEl) {
			warningEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	});

	function toggleActionEdit(actionId: string) {
		editingActionId = editingActionId === actionId ? null : actionId;
	}
</script>

<div class="actions-section">
	<h3 class="section-title">{$t('review.actions')}</h3>

	<!-- Profile Completeness Warning -->
	{#if showProfileWarning && profileMissingFields.length > 0}
		<div class="profile-warning" bind:this={warningEl}>
			<div class="warning-content">
				<AlertTriangle size={20} />
				<div class="warning-text">
					<p class="warning-title">{$t('review.completeProfile')}</p>
					<ul class="missing-fields">
						{#each profileMissingFields as field}
							<li>{field}</li>
						{/each}
					</ul>
				</div>
			</div>
			<div class="warning-actions">
				<button
					class="warning-btn secondary"
					onclick={() => {
						showProfileWarning = false;
						onDismissProfileWarning?.();
						const sendAction = data.actions.find(
							(a) => a.type === 'send_email' && a.status === 'pending'
						);
						if (sendAction) onExecuteAction(sendAction);
					}}
				>
					{$t('review.sendAnyway')}
				</button>
				<button class="warning-btn primary" onclick={async () => {
					await onSaveSession?.();
					goto(`/dashboard/settings/business?from=review${reviewSessionId ? `&session=${reviewSessionId}` : ''}`);
				}}>
					{$t('review.goToProfile')}
				</button>
			</div>
		</div>
	{/if}

	<div class="action-list">
		{#each sortedActions as action, index (action.id)}
			{@const config = actionConfig[action.type] || {
				icon: FileText,
				labelKey: 'review.createDocument',
				color: '#94a3b8'
			}}
			{@const isEditing = editingActionId === action.id}
			<div
				class="action-card"
				class:completed={action.status === 'completed'}
				class:in-progress={action.status === 'in_progress'}
				class:failed={action.status === 'failed'}
				class:editing={isEditing}
			>
				<div class="action-main">
					<div class="action-number">{index + 1}</div>

					<div class="action-icon" style="--action-color: {config.color}">
						{#if action.status === 'in_progress'}
							<Loader2 size={20} class="spinning" />
						{:else if action.status === 'completed'}
							<Check size={20} />
						{:else if action.status === 'failed'}
							<AlertCircle size={20} />
						{:else}
							<config.icon size={20} />
						{/if}
					</div>

					<div class="action-content">
						<span class="action-label">{$t(config.labelKey)}</span>
						<span class="action-desc">{onGetActionDescription(action)}</span>
						{#if action.status === 'failed' && action.error}
							<span class="action-error">{action.error}</span>
						{/if}
					</div>

					<div class="action-buttons">
						{#if onActionHasEditableData(action) && action.status === 'pending' && !isExecuting}
							<button
								class="action-edit"
								class:active={isEditing}
								onclick={() => toggleActionEdit(action.id)}
								aria-label="Edit action"
							>
								<Pencil size={14} />
							</button>
						{/if}

						{#if action.status === 'pending' && !isExecuting}
							<button
								class="action-play"
								onclick={() => onExecuteAction(action)}
								disabled={hasValidationErrors}
								aria-label="Execute action"
							>
								<Play size={16} />
							</button>
						{:else if action.status === 'failed' && !isExecuting}
							<button
								class="action-edit"
								class:active={isEditing}
								onclick={() => toggleActionEdit(action.id)}
								aria-label="Edit and retry action"
							>
								<Pencil size={14} />
							</button>
							<button
								class="action-retry"
								onclick={() => onRetryAction(action)}
								aria-label="Retry action"
							>
								<RotateCcw size={16} />
							</button>
						{:else if action.status === 'completed'}
							<div class="action-done">
								<Check size={16} />
							</div>
						{/if}
					</div>
				</div>

				<!-- Inline Edit Form -->
				{#if isEditing}
					<div class="action-edit-form">
						{#if action.type === 'create_document'}
							<div class="edit-form-field">
								<span class="edit-form-label">{$t('review.documentType')}</span>
								<div class="doc-type-toggle">
									<button
										class="doc-type-btn"
										class:active={data.documentType === 'invoice'}
										onclick={() => (data.documentType = 'invoice')}
									>
										<Receipt size={16} />
										Invoice
									</button>
									<button
										class="doc-type-btn"
										class:active={data.documentType === 'estimate'}
										onclick={() => (data.documentType = 'estimate')}
									>
										<FileText size={16} />
										Estimate
									</button>
								</div>
							</div>
							<div class="edit-form-field-row">
								<div class="edit-form-field half">
									<label for="action-client-firstname-{action.id}">{$t('profile.firstName')}</label>
									<input
										id="action-client-firstname-{action.id}"
										type="text"
										bind:value={data.client.firstName}
										placeholder={$t('placeholder.firstName')}
									/>
								</div>
								<div class="edit-form-field half">
									<label for="action-client-lastname-{action.id}">{$t('profile.lastName')}</label>
									<input
										id="action-client-lastname-{action.id}"
										type="text"
										bind:value={data.client.lastName}
										placeholder={$t('placeholder.lastName')}
									/>
								</div>
							</div>
							<div class="edit-form-field">
								<span class="edit-form-label">{$t('review.totalAmountLabel')}</span>
								<div class="amount-display">{formatCurrency(calculatedTotal)}</div>
								<span class="field-hint">{$t('review.totalAmountHint')}</span>
							</div>
							<div class="edit-form-field">
								<span class="edit-form-label">{$t('review.saveShareOptions')}</span>
								<div class="save-options">
									<button
										class="save-option-btn"
										onclick={async () => {
											await onHandleDownloadPDF();
											editingActionId = null;
										}}
										disabled={hasValidationErrors}
									>
										<Download size={16} />
										<span>{$t('review.download')}</span>
										<span class="save-hint">{$t('review.saveAsPdf')}</span>
									</button>
									<button
										class="save-option-btn view-link"
										onclick={onOpenViewLinkModal}
										disabled={hasValidationErrors || copyLinkStatus === 'loading'}
									>
										{#if copyLinkStatus === 'loading'}
											<Loader2 size={16} class="animate-spin" />
										{:else}
											<Eye size={16} />
										{/if}
										<span>{$t('review.viewLink')}</span>
										<span class="save-hint">{$t('review.getShareableLink')}</span>
									</button>
									<button
										class="save-option-btn primary"
										onclick={async () => {
											await onSaveDocument(action.id);
											editingActionId = null;
										}}
										disabled={hasValidationErrors}
									>
										<Database size={16} />
										<span>{$t('review.save')}</span>
										<span class="save-hint">{$t('review.storeInDatabase')}</span>
									</button>
								</div>
							</div>
						{:else if action.type === 'send_email'}
							<div class="edit-form-field">
								<label for="action-email-{action.id}">{$t('review.recipientEmail')}</label>
								<input
									id="action-email-{action.id}"
									type="email"
									value={action.details.recipient || data.client.email || ''}
									oninput={(e) =>
										onUpdateActionRecipient(action, (e.target as HTMLInputElement).value)}
									placeholder={$t('placeholder.email')}
								/>
								{#if data.client.email && action.details.recipient !== data.client.email}
									<button
										class="use-client-btn"
										onclick={() => onUpdateActionRecipient(action, data.client.email || '')}
									>
										Use client email ({data.client.email})
									</button>
								{/if}
							</div>
							<div class="edit-form-field">
								<label for="action-email-msg-{action.id}">{$t('review.customMessage')}</label>
								<input
									id="action-email-msg-{action.id}"
									type="text"
									value={action.details.message || ''}
									oninput={(e) => {
										const idx = data.actions.findIndex((a) => a.id === action.id);
										if (idx !== -1)
											data.actions[idx].details.message = (e.target as HTMLInputElement).value;
									}}
									placeholder={$t('placeholder.addNote')}
								/>
							</div>
						{:else if action.type === 'send_sms'}
							<div class="edit-form-field">
								<label for="action-phone-{action.id}">{$t('review.recipientPhone')}</label>
								<input
									id="action-phone-{action.id}"
									type="tel"
									value={action.details.recipient || data.client.phone || ''}
									oninput={(e) =>
										onUpdateActionRecipient(action, (e.target as HTMLInputElement).value)}
									placeholder={$t('placeholder.phone')}
								/>
								{#if data.client.phone && action.details.recipient !== data.client.phone}
									<button
										class="use-client-btn"
										onclick={() => onUpdateActionRecipient(action, data.client.phone || '')}
									>
										{$t('review.useClientPhone', { phone: data.client.phone })}
									</button>
								{/if}
							</div>
							<div class="edit-form-field">
								<label for="action-sms-msg-{action.id}">{$t('review.customMessageOptional')}</label>
								<input
									id="action-sms-msg-{action.id}"
									type="text"
									value={action.details.message || ''}
									oninput={(e) => {
										const idx = data.actions.findIndex((a) => a.id === action.id);
										if (idx !== -1)
											data.actions[idx].details.message = (e.target as HTMLInputElement).value;
									}}
									placeholder={$t('review.addPersonalNote')}
								/>
							</div>
						{:else if action.type === 'schedule'}
							<div class="edit-form-field">
								<span class="edit-form-label">{$t('review.frequency')}</span>
								<div class="frequency-options">
									{#each ['weekly', 'biweekly', 'monthly'] as freq}
										<button
											class="freq-btn"
											class:active={action.details.frequency === freq}
											onclick={() => onUpdateActionFrequency(action, freq)}
										>
											{$t(`review.${freq}`)}
										</button>
									{/each}
								</div>
							</div>
							<div class="edit-form-field">
								<label for="action-schedule-date-{action.id}">{$t('review.startDate')}</label>
								<input
									id="action-schedule-date-{action.id}"
									type="date"
									value={action.details.recipient || new Date().toISOString().split('T')[0]}
									oninput={(e) =>
										onUpdateActionRecipient(action, (e.target as HTMLInputElement).value)}
								/>
							</div>
						{:else if action.type === 'save_draft'}
							<div class="edit-form-field">
								<label for="action-draft-notes-{action.id}">{$t('review.draftNotesOptional')}</label
								>
								<input
									id="action-draft-notes-{action.id}"
									type="text"
									value={action.details.message || ''}
									oninput={(e) => {
										const idx = data.actions.findIndex((a) => a.id === action.id);
										if (idx !== -1)
											data.actions[idx].details.message = (e.target as HTMLInputElement).value;
									}}
									placeholder={$t('review.addDraftNotes')}
								/>
							</div>
							<div class="status-info">
								<span class="status-label">{$t('review.statusAfterSave')}</span>
								<span class="status-badge draft">{$t('review.draft')}</span>
							</div>
						{/if}
						<button class="done-edit-btn" onclick={() => (editingActionId = null)}>
							<Check size={14} />
							{$t('common.done')}
						</button>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	{#if !showActionTypePicker}
		<button class="add-action-btn" onclick={() => (showActionTypePicker = true)}>
			<Plus size={16} />
			{$t('review.addAction')}
		</button>
	{:else}
		<div class="action-type-picker">
			<div class="picker-header">
				<span class="picker-title">{$t('review.chooseActionType')}</span>
				<button class="picker-close" onclick={() => (showActionTypePicker = false)}>
					<X size={16} />
				</button>
			</div>
			<div class="picker-options">
				{#each Object.entries(actionConfig) as [type, config]}
					<button class="picker-option" onclick={() => onAddAction(type as ActionStep['type'])}>
						<div class="picker-icon" style="color: {config.color}; background: {config.color}1a">
							<config.icon size={18} />
						</div>
						<span>{$t(config.labelKey)}</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.actions-section {
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(5, 150, 105, 0.04));
		padding: var(--space-4);
		border-radius: var(--radius-card);
	}

	.section-title {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--gray-500);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 var(--space-3);
	}

	.profile-warning {
		background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
		border: 1px solid #f59e0b;
		border-radius: var(--radius-input);
		padding: var(--space-4);
		margin-bottom: var(--space-4);
	}

	.warning-content {
		display: flex;
		gap: var(--space-3);
		color: #92400e;
	}

	.warning-text {
		flex: 1;
	}

	.warning-title {
		font-weight: 600;
		margin: 0 0 var(--space-2);
		font-size: var(--text-sm);
	}

	.missing-fields {
		margin: 0;
		padding-left: var(--space-5);
		font-size: var(--text-sm);
		color: #b45309;
	}

	.missing-fields li {
		margin: var(--space-0-5) 0;
	}

	.warning-actions {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-3);
		padding-left: var(--space-8);
	}

	.warning-btn {
		padding: var(--space-2) var(--space-4);
		border-radius: 8px;
		font-size: var(--text-sm);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.warning-btn.secondary {
		background: transparent;
		border: 1px solid #d97706;
		color: #92400e;
	}

	.warning-btn.secondary:hover {
		background: rgba(217, 119, 6, 0.1);
	}

	.warning-btn.primary {
		background: #f59e0b;
		border: none;
		color: white;
	}

	.warning-btn.primary:hover {
		background: #d97706;
	}

	.action-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2-5);
	}

	.action-card {
		display: flex;
		flex-direction: column;
		background: transparent;
		border: 1px solid var(--gray-200);
		border-radius: var(--radius-button);
		transition: all var(--duration-fast) ease;
		overflow: hidden;
	}

	.action-card.editing {
		border-color: rgba(14, 165, 233, 0.3);
	}

	.action-main {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3-5) var(--space-4);
	}

	.action-card.completed {
		background: rgba(16, 185, 129, 0.08);
		border-color: rgba(16, 185, 129, 0.2);
	}

	.action-card.in-progress {
		background: rgba(14, 165, 233, 0.08);
		border-color: rgba(14, 165, 233, 0.3);
	}

	.action-card.failed {
		background: rgba(239, 68, 68, 0.08);
		border-color: rgba(239, 68, 68, 0.2);
	}

	.action-number {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--gray-200);
		border-radius: 8px;
		font-size: var(--text-xs);
		font-weight: 700;
		color: var(--gray-500);
	}

	.action-card.completed .action-number {
		background: rgba(16, 185, 129, 0.2);
		color: #34d399;
	}

	.action-icon {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: color-mix(in srgb, var(--action-color) 15%, transparent);
		border-radius: var(--radius-input);
		color: var(--action-color);
	}

	.action-card.completed .action-icon {
		background: rgba(16, 185, 129, 0.15);
		color: #34d399;
	}

	.action-content {
		flex: 1;
		min-width: 0;
	}

	.action-label {
		display: block;
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--gray-900);
	}

	.action-desc {
		display: block;
		font-size: var(--text-xs);
		color: var(--gray-500);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.action-play {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(14, 165, 233, 0.15);
		border-radius: var(--radius-sm);
		color: #0ea5e9;
		transition: all var(--duration-fast) ease;
	}

	.action-play:hover:not(:disabled) {
		background: rgba(14, 165, 233, 0.25);
		transform: scale(1.05);
	}

	.action-play:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.action-done {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(16, 185, 129, 0.15);
		border-radius: var(--radius-sm);
		color: #34d399;
	}

	.action-buttons {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.action-edit {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--gray-200);
		border-radius: 8px;
		color: var(--gray-500);
		transition: all var(--duration-fast) ease;
	}

	.action-edit:hover {
		background: var(--gray-300);
		color: var(--gray-900);
	}

	.action-edit.active {
		background: rgba(14, 165, 233, 0.2);
		color: #38bdf8;
	}

	.action-edit-form {
		padding: 0 var(--space-4) var(--space-3-5) var(--space-4);
		border-top: 1px solid var(--gray-200);
		animation: slideDown var(--duration-fast) ease;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.edit-form-field-row {
		display: flex;
		gap: var(--space-3);
		margin-top: var(--space-3);
	}

	.edit-form-field-row .edit-form-field.half {
		flex: 1;
		margin-top: 0;
	}

	.edit-form-field {
		margin-top: var(--space-3);
	}

	.edit-form-field label,
	.edit-form-field .edit-form-label {
		display: block;
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--gray-500);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		margin-bottom: var(--space-1-5);
	}

	.edit-form-field input {
		width: 100%;
		padding: var(--space-2-5) var(--space-3);
		background: var(--white);
		border: 1px solid var(--gray-200);
		border-radius: 8px;
		color: var(--gray-900);
		font-size: var(--text-sm);
	}

	.edit-form-field input:focus {
		outline: none;
		border-color: rgba(14, 165, 233, 0.5);
	}

	.use-client-btn {
		margin-top: var(--space-2);
		padding: var(--space-1-5) var(--space-2-5);
		background: rgba(14, 165, 233, 0.1);
		border-radius: 6px;
		color: #38bdf8;
		font-size: var(--text-xs);
		transition: all var(--duration-fast) ease;
	}

	.use-client-btn:hover {
		background: rgba(14, 165, 233, 0.2);
	}

	.frequency-options {
		display: flex;
		gap: var(--space-2);
	}

	.freq-btn {
		flex: 1;
		padding: var(--space-2-5);
		background: transparent;
		border: 1px solid var(--gray-200);
		border-radius: 8px;
		color: var(--gray-500);
		font-size: var(--text-xs);
		font-weight: 500;
		transition: all var(--duration-fast) ease;
	}

	.freq-btn.active {
		background: rgba(245, 158, 11, 0.15);
		border-color: rgba(245, 158, 11, 0.3);
		color: #fbbf24;
	}

	.done-edit-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-1-5);
		width: 100%;
		margin-top: var(--space-3);
		padding: var(--space-2-5);
		background: rgba(14, 165, 233, 0.15);
		border-radius: 8px;
		color: #38bdf8;
		font-size: var(--text-sm);
		font-weight: 500;
		transition: all var(--duration-fast) ease;
	}

	.done-edit-btn:hover {
		background: rgba(14, 165, 233, 0.25);
	}

	.doc-type-toggle {
		display: flex;
		gap: var(--space-2);
	}

	.doc-type-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3);
		background: transparent;
		border: 1px solid var(--gray-200);
		border-radius: var(--radius-sm);
		color: var(--gray-500);
		font-size: var(--text-sm);
		font-weight: 500;
		transition: all var(--duration-fast) ease;
	}

	.doc-type-btn.active {
		background: rgba(14, 165, 233, 0.15);
		border-color: rgba(14, 165, 233, 0.3);
		color: #38bdf8;
	}

	.doc-type-btn:hover:not(.active) {
		background: var(--gray-100);
		color: var(--gray-900);
	}

	.amount-display {
		padding: var(--space-3);
		background: rgba(16, 185, 129, 0.1);
		border: 1px solid rgba(16, 185, 129, 0.2);
		border-radius: 8px;
		color: #34d399;
		font-size: var(--text-lg);
		font-weight: 700;
		text-align: center;
	}

	.field-hint {
		display: block;
		margin-top: var(--space-1-5);
		font-size: var(--text-xs);
		color: var(--gray-500);
	}

	.status-info {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3);
		background: transparent;
		border-radius: 8px;
		margin-top: var(--space-3);
	}

	.status-label {
		font-size: var(--text-xs);
		color: var(--gray-500);
	}

	.status-badge {
		padding: var(--space-1) var(--space-2-5);
		border-radius: 6px;
		font-size: var(--text-xs);
		font-weight: 600;
		text-transform: uppercase;
	}

	.status-badge.draft {
		background: rgba(100, 116, 139, 0.2);
		color: var(--gray-400);
	}

	.save-options {
		display: flex;
		gap: var(--space-2-5);
	}

	.save-option-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-3-5) var(--space-3);
		background: transparent;
		border: 1px solid var(--gray-200);
		border-radius: var(--radius-input);
		color: var(--gray-600);
		font-size: var(--text-sm);
		font-weight: 500;
		transition: all var(--duration-fast) ease;
	}

	.save-option-btn:hover:not(:disabled) {
		background: var(--gray-100);
		border-color: #cbd5e1;
	}

	.save-option-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.save-option-btn.primary {
		background: rgba(14, 165, 233, 0.15);
		border-color: rgba(14, 165, 233, 0.3);
		color: #38bdf8;
	}

	.save-option-btn.primary:hover:not(:disabled) {
		background: rgba(14, 165, 233, 0.25);
	}

	.save-hint {
		font-size: 10px;
		font-weight: 400;
		color: var(--gray-400);
	}

	.save-option-btn.primary .save-hint {
		color: rgba(56, 189, 248, 0.6);
	}

	.add-action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-3);
		margin-top: var(--space-3);
		border: 2px dashed rgba(16, 185, 129, 0.4);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--data-green);
		font-size: var(--text-sm);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.add-action-btn:hover {
		background: rgba(16, 185, 129, 0.08);
		border-color: var(--data-green);
	}

	.action-type-picker {
		margin-top: var(--space-3);
		background: white;
		border: 1px solid var(--gray-200);
		border-radius: var(--radius-button);
		padding: var(--space-4);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}

	.picker-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-3);
	}

	.picker-title {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--gray-500);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.picker-close {
		background: none;
		border: none;
		color: var(--gray-400);
		cursor: pointer;
		padding: var(--space-1);
		border-radius: 6px;
	}

	.picker-close:hover {
		background: var(--gray-100);
		color: var(--gray-600);
	}

	.picker-options {
		display: flex;
		flex-direction: column;
		gap: var(--space-1-5);
	}

	.picker-option {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2-5) var(--space-3);
		border: 1px solid var(--gray-150);
		border-radius: var(--radius-sm);
		background: white;
		cursor: pointer;
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--gray-700);
		transition: all var(--duration-fast) ease;
	}

	.picker-option:hover {
		background: var(--gray-50);
		border-color: var(--gray-300);
	}

	.picker-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		border-radius: 8px;
		flex-shrink: 0;
	}

	.action-retry {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(239, 68, 68, 0.15);
		border-radius: var(--radius-sm);
		color: var(--data-red);
		transition: all var(--duration-fast) ease;
	}

	.action-retry:hover {
		background: rgba(239, 68, 68, 0.25);
		transform: scale(1.05);
	}

	.action-error {
		display: block;
		font-size: var(--text-xs);
		color: var(--data-red);
		margin-top: var(--space-0-5);
	}

	:global(.spinning) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>

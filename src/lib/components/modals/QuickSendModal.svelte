<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { t } from '$lib/i18n';
	import Send from 'lucide-svelte/icons/send';
	import Mail from 'lucide-svelte/icons/mail';
	import Check from 'lucide-svelte/icons/check';
	import X from 'lucide-svelte/icons/x';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';

	interface DocumentInfo {
		id: string;
		type: 'invoice' | 'estimate' | 'contract';
		title: string;
		client: string;
		clientEmail?: string | null;
		amount?: number;
	}

	interface Props {
		open: boolean;
		document: DocumentInfo | null;
		onClose: () => void;
		onSuccess: () => void;
	}

	let { open = $bindable(), document, onClose, onSuccess }: Props = $props();

	let email = $state('');
	let customMessage = $state('');
	let isSending = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	// Email validation
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	const isEmailValid = $derived(emailRegex.test(email));

	function formatAmount(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function handleClose() {
		if (isSending) return;
		email = '';
		customMessage = '';
		error = null;
		success = false;
		open = false;
		onClose();
	}

	async function handleSend() {
		if (!document || !isEmailValid || isSending) return;

		isSending = true;
		error = null;

		try {
			const response = await fetch('/api/documents/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					documentId: document.id,
					documentType: document.type,
					method: 'email',
					recipient: {
						email,
						name: document.client
					},
					customMessage: customMessage || undefined
				})
			});

			const result = await response.json();

			if (!response.ok || !result.success) {
				throw new Error(result.error || 'Failed to send document');
			}

			success = true;

			// Close after success animation
			setTimeout(() => {
				handleClose();
				onSuccess();
			}, 1500);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to send document';
			isSending = false;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && !isSending) {
			handleClose();
		}
		if (e.key === 'Enter' && isEmailValid && !isSending && !success) {
			handleSend();
		}
	}

	// Pre-fill email when modal opens
	$effect(() => {
		if (open && document?.clientEmail) {
			email = document.clientEmail;
		}
	});

	// Reset state when modal opens
	$effect(() => {
		if (open) {
			customMessage = '';
			error = null;
			success = false;
			isSending = false;
		}
	});
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if open && document}
	<!-- Backdrop -->
	<button
		class="modal-backdrop"
		onclick={handleClose}
		aria-label={$t('aria.closeModal')}
		transition:fade={{ duration: 200 }}
	></button>

	<!-- Modal -->
	<div
		class="modal-container"
		role="dialog"
		aria-modal="true"
		aria-labelledby="send-modal-title"
		transition:fly={{ y: 50, duration: 300, easing: cubicOut }}
	>
		<div class="modal-content">
			<!-- Close button -->
			<button class="close-btn" onclick={handleClose} aria-label={$t('common.close')}>
				<X size={20} />
			</button>

			{#if success}
				<!-- Success state -->
				<div class="modal-step success-state" in:fade={{ duration: 300 }}>
					<div class="icon-wrapper success">
						<Check size={36} />
					</div>
					<h2 class="modal-title">{$t('review.sent')}</h2>
					<p class="success-message">
						{$t('review.sentToRecipient').replace('{recipient}', email)}
					</p>
				</div>
			{:else}
				<!-- Send form -->
				<div class="modal-step">
					<div class="icon-wrapper send">
						<Send size={28} />
					</div>

					<h2 id="send-modal-title" class="modal-title">
						{$t('docDetail.sendToClient')}
					</h2>

					<!-- Document info -->
					<div class="document-info">
						<span class="doc-title">{document.title}</span>
						{#if document.amount}
							<span class="doc-amount">{formatAmount(document.amount)}</span>
						{/if}
					</div>

					<!-- Email input -->
					<div class="input-group">
						<label for="recipient-email" class="input-label">
							<Mail size={16} />
							{$t('review.recipientEmail')}
						</label>
						<input
							id="recipient-email"
							type="email"
							class="email-input"
							class:valid={isEmailValid && email.length > 0}
							class:invalid={!isEmailValid && email.length > 0}
							bind:value={email}
							placeholder={$t('docDetail.emailPlaceholder')}
							disabled={isSending}
						/>
					</div>

					<!-- Optional message -->
					<div class="input-group">
						<label for="custom-message" class="input-label optional">
							{$t('review.customMessage')}
						</label>
						<textarea
							id="custom-message"
							class="message-input"
							bind:value={customMessage}
							placeholder={$t('placeholder.addNote')}
							rows="2"
							disabled={isSending}
						></textarea>
					</div>

					{#if error}
						<div class="error-message">
							<AlertCircle size={14} />
							<span>{error}</span>
						</div>
					{/if}

					<div class="modal-actions">
						<button class="btn secondary" onclick={handleClose} disabled={isSending}>
							{$t('common.cancel')}
						</button>
						<button class="btn primary" onclick={handleSend} disabled={!isEmailValid || isSending}>
							{#if isSending}
								<span class="spinner"></span>
								{$t('docDetail.sending')}
							{:else}
								<Send size={18} />
								{$t('docDetail.sendEmail')}
							{/if}
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		z-index: 1000;
		border: none;
		cursor: default;
	}

	.modal-container {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		z-index: 1001;
		padding: 0;
	}

	.modal-content {
		position: relative;
		background: rgba(255, 255, 255, 0.98);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		padding: 32px 24px calc(24px + var(--safe-area-bottom, 0px));
		max-width: 400px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
	}

	.modal-content::before {
		content: '';
		position: absolute;
		top: 8px;
		left: 50%;
		transform: translateX(-50%);
		width: 36px;
		height: 5px;
		background: #D1D1D6;
		border-radius: 3px;
	}

	.close-btn {
		position: absolute;
		top: 12px;
		right: 12px;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--gray-100, #f1f5f9);
		border: none;
		border-radius: 50%;
		color: var(--gray-500, #64748b);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.close-btn:hover {
		background: var(--gray-200, #e2e8f0);
		color: var(--gray-700, #334155);
	}

	.modal-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.icon-wrapper {
		width: 72px;
		height: 72px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		margin-bottom: 16px;
	}

	.icon-wrapper.send {
		background: rgba(0, 102, 255, 0.1);
		color: var(--blu-primary, #0066ff);
	}

	.icon-wrapper.success {
		background: rgba(16, 185, 129, 0.15);
		color: #10b981;
		animation: successPop 0.4s ease-out;
	}

	@keyframes successPop {
		0% {
			transform: scale(0.5);
			opacity: 0;
		}
		50% {
			transform: scale(1.1);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	.modal-title {
		font-family: var(--font-display, system-ui);
		font-size: 22px;
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		margin: 0 0 12px;
	}

	.success-state .modal-title {
		color: #10b981;
	}

	.success-message {
		font-size: 15px;
		color: var(--gray-600, #475569);
		margin: 0;
	}

	.document-info {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		background: var(--gray-50, #f8fafc);
		border-radius: 10px;
		margin-bottom: 20px;
		width: 100%;
	}

	.doc-title {
		flex: 1;
		font-size: 14px;
		font-weight: 500;
		color: var(--gray-700, #334155);
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.doc-amount {
		font-size: 15px;
		font-weight: 600;
		color: var(--data-green, #10b981);
	}

	.input-group {
		width: 100%;
		margin-bottom: 16px;
	}

	.input-label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		font-weight: 500;
		color: var(--gray-600, #475569);
		margin-bottom: 8px;
		text-align: left;
	}

	.input-label.optional::after {
		content: '';
	}

	.email-input,
	.message-input {
		width: 100%;
		padding: 14px 16px;
		background: var(--gray-50, #f8fafc);
		border: 2px solid var(--gray-200, #e2e8f0);
		border-radius: 12px;
		font-size: 15px;
		color: var(--gray-900, #0f172a);
		transition: all 0.2s ease;
	}

	.email-input:focus,
	.message-input:focus {
		outline: none;
		border-color: var(--blu-primary, #0066ff);
		background: white;
	}

	.email-input.valid {
		border-color: #10b981;
	}

	.email-input.invalid {
		border-color: #ef4444;
	}

	.message-input {
		resize: none;
		font-family: inherit;
	}

	.email-input::placeholder,
	.message-input::placeholder {
		color: var(--gray-400, #9ca3af);
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 14px;
		background: rgba(239, 68, 68, 0.1);
		border-radius: 8px;
		color: #dc2626;
		font-size: 13px;
		margin-bottom: 16px;
		width: 100%;
	}

	.modal-actions {
		display: flex;
		gap: 12px;
		width: 100%;
	}

	.btn {
		flex: 1;
		padding: 14px 20px;
		border: none;
		border-radius: 12px;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.btn.secondary {
		background: var(--gray-100, #f1f5f9);
		color: var(--gray-700, #334155);
	}

	.btn.secondary:hover:not(:disabled) {
		background: var(--gray-200, #e2e8f0);
	}

	.btn.primary {
		background: var(--blu-primary, #0066ff);
		color: white;
	}

	.btn.primary:hover:not(:disabled) {
		background: #0052cc;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

</style>

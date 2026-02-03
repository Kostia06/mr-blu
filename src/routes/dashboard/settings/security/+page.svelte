<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { goto } from '$app/navigation';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import History from 'lucide-svelte/icons/history';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import X from 'lucide-svelte/icons/x';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import { locale, t } from '$lib/i18n';
	import { FormSection } from '$lib/components/forms';

	let { data } = $props();

	// Subscribe to locale for date formatting
	let currentLocale = $state('en');
	$effect(() => {
		const unsub = locale.subscribe((v) => (currentLocale = v));
		return unsub;
	});

	// Subscribe to translations
	let translate = $state((key: string) => key);
	$effect(() => {
		const unsub = t.subscribe((v) => (translate = v));
		return unsub;
	});

	const user = $derived(data.session?.user);

	// Format last sign in based on current locale
	const getLastSignIn = $derived(() => {
		if (!user?.last_sign_in_at) return 'Unknown';
		return new Date(user.last_sign_in_at).toLocaleDateString(
			currentLocale === 'es' ? 'es-ES' : 'en-US',
			{
				month: 'short',
				day: 'numeric',
				year: 'numeric',
				hour: 'numeric',
				minute: '2-digit'
			}
		);
	});

	// Delete account modal state
	let showDeleteModal = $state(false);
	let deleteConfirmText = $state('');
	let isDeleting = $state(false);
	let deleteError = $state('');

	// Get the required confirmation phrase
	const confirmPhrase = $derived(translate('security.deleteConfirmPhrase'));
	const canDelete = $derived(
		deleteConfirmText.toLowerCase().trim() === confirmPhrase.toLowerCase()
	);

	function openDeleteModal() {
		showDeleteModal = true;
		deleteConfirmText = '';
		deleteError = '';
	}

	function closeDeleteModal() {
		showDeleteModal = false;
		deleteConfirmText = '';
		deleteError = '';
	}

	async function handleDeleteAccount() {
		if (!canDelete || isDeleting) return;

		isDeleting = true;
		deleteError = '';

		try {
			const response = await fetch('/api/user/delete', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to delete account');
			}

			// Redirect to home after successful deletion
			goto('/');
		} catch (err) {
			deleteError = err instanceof Error ? err.message : 'Failed to delete account';
			isDeleting = false;
		}
	}
</script>

<main class="security-page">
	<!-- Header -->
	<header class="page-header" in:fly={{ y: -20, duration: 400, easing: cubicOut }}>
		<button
			class="back-btn"
			onclick={() => goto('/dashboard/settings')}
			aria-label={translate('common.backToSettings')}
		>
			<ChevronLeft size={22} strokeWidth={2} />
		</button>
		<h1 class="page-title">{translate('security.title')}</h1>
		<div class="header-spacer"></div>
	</header>

	<div class="page-content" in:fly={{ y: 20, duration: 500, delay: 100, easing: cubicOut }}>
		<!-- Sessions -->
		<FormSection title={translate('settings.sessionsTitle')} variant="card">
			<div class="security-item">
				<div class="item-icon">
					<History size={18} strokeWidth={1.5} />
				</div>
				<div class="item-content">
					<span class="item-label">{translate('security.lastSignIn')}</span>
					<span class="item-desc">{getLastSignIn()}</span>
				</div>
			</div>
		</FormSection>

		<!-- Danger Zone -->
		<FormSection title={translate('settings.dangerZoneTitle')} variant="card">
			<button class="security-item danger" onclick={openDeleteModal}>
				<div class="item-icon danger">
					<AlertTriangle size={18} strokeWidth={1.5} />
				</div>
				<div class="item-content">
					<span class="item-label danger">{translate('security.deleteAccount')}</span>
					<span class="item-desc">{translate('security.deleteAccountDesc')}</span>
				</div>
				<div class="item-action">
					<ChevronRight size={18} strokeWidth={1.5} />
				</div>
			</button>
		</FormSection>
	</div>
</main>

<!-- Delete Account Modal -->
{#if showDeleteModal}
	<div class="modal-overlay" transition:fade={{ duration: 200 }} role="presentation">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="modal-backdrop"
			onclick={closeDeleteModal}
			role="button"
			tabindex="-1"
			aria-label={translate('aria.closeModal')}
		></div>
		<div
			class="modal-content"
			transition:scale={{ start: 0.95, duration: 200, easing: cubicOut }}
			role="dialog"
			aria-modal="true"
			aria-labelledby="delete-modal-title"
		>
			<button class="modal-close" onclick={closeDeleteModal} aria-label={translate('common.close')}>
				<X size={20} strokeWidth={2} />
			</button>

			<div class="modal-icon">
				<AlertTriangle size={32} strokeWidth={1.5} />
			</div>

			<h2 id="delete-modal-title" class="modal-title">
				{translate('security.deleteConfirmTitle')}
			</h2>
			<p class="modal-desc">{translate('security.deleteConfirmDesc')}</p>

			<div class="confirm-input-wrapper">
				<label for="confirm-delete" class="confirm-label">
					{translate('security.deleteConfirmLabel').replace('{phrase}', confirmPhrase)}
				</label>
				<input
					id="confirm-delete"
					type="text"
					class="confirm-input"
					bind:value={deleteConfirmText}
					placeholder={confirmPhrase}
					autocomplete="off"
					autocapitalize="off"
					spellcheck="false"
				/>
			</div>

			{#if deleteError}
				<p class="delete-error" in:fly={{ y: -10, duration: 200 }}>{deleteError}</p>
			{/if}

			<div class="modal-actions">
				<button class="btn-cancel" onclick={closeDeleteModal} disabled={isDeleting}>
					{translate('security.cancel')}
				</button>
				<button
					class="btn-delete"
					onclick={handleDeleteAccount}
					disabled={!canDelete || isDeleting}
				>
					{#if isDeleting}
						<Loader2 size={16} class="spin" />
						<span>{translate('security.deleting')}</span>
					{:else}
						<span>{translate('security.deleteButton')}</span>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.security-page {
		min-height: 100vh;
		background: transparent;
	}

	/* Header */
	.page-header {
		position: sticky;
		top: 0;
		z-index: var(--z-sticky);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3) var(--page-padding-x);
		padding-top: calc(var(--space-3) + var(--safe-area-top, 0px));
		background: transparent;
	}

	.back-btn {
		width: var(--btn-height-md);
		height: var(--btn-height-md);
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--glass-white-50);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid var(--glass-white-30);
		border-radius: var(--radius-button);
		color: var(--gray-600);
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.back-btn:hover {
		background: var(--glass-white-70);
		color: var(--gray-900);
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
		width: 40px;
	}

	/* Page Content */
	.page-content {
		padding: var(--page-padding-x, 20px);
		max-width: var(--page-max-width, 600px);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--section-gap, 24px);
		padding-bottom: 100px;
	}

	/* Security Items */
	.security-item {
		display: flex;
		align-items: center;
		gap: 14px;
		width: 100%;
		padding: 16px;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
	}

	.security-item:not(:last-child) {
		border-bottom: 1px solid var(--gray-100, #f1f5f9);
	}

	.security-item:hover {
		background: transparent;
	}

	.security-item.danger:hover {
		background: rgba(239, 68, 68, 0.04);
	}

	.security-item:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.item-icon {
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 102, 255, 0.1);
		border-radius: var(--radius-input, 12px);
		color: var(--blu-primary, #0066ff);
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.item-icon.danger {
		background: rgba(239, 68, 68, 0.1);
		color: var(--data-red, #ef4444);
	}

	.item-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.item-label {
		font-size: 15px;
		font-weight: 500;
		color: var(--gray-900, #0f172a);
	}

	.item-label.danger {
		color: var(--data-red, #ef4444);
	}

	.item-desc {
		font-size: 13px;
		color: var(--gray-500, #64748b);
	}

	.item-action {
		color: var(--gray-400, #94a3b8);
		flex-shrink: 0;
	}

	.item-action :global(.spin) {
		animation: spin 1s linear infinite;
		color: var(--gray-500, #64748b);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		z-index: 100;
	}

	.modal-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(15, 23, 42, 0.6);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}

	.modal-content {
		position: relative;
		background: var(--white, #dbe8f4);
		border: 1px solid var(--gray-200, #e2e8f0);
		border-radius: var(--radius-card, 20px);
		padding: 28px;
		max-width: 400px;
		width: 100%;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	}

	.modal-close {
		position: absolute;
		top: 16px;
		right: 16px;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--gray-100, #f1f5f9);
		border: none;
		border-radius: var(--radius-input, 12px);
		color: var(--gray-500, #64748b);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.modal-close:hover {
		background: var(--gray-200, #e2e8f0);
		color: var(--gray-900, #0f172a);
	}

	.modal-icon {
		width: 72px;
		height: 72px;
		background: rgba(239, 68, 68, 0.1);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--data-red, #ef4444);
		margin: 0 auto 20px;
	}

	.modal-title {
		font-family: var(--font-display, system-ui);
		font-size: 20px;
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		text-align: center;
		margin: 0 0 8px;
		letter-spacing: -0.02em;
	}

	.modal-desc {
		font-size: 14px;
		color: var(--gray-600, #475569);
		text-align: center;
		line-height: 1.5;
		margin: 0 0 24px;
	}

	.confirm-input-wrapper {
		margin-bottom: 20px;
	}

	.confirm-label {
		display: block;
		font-size: 13px;
		font-weight: 500;
		color: var(--gray-700, #334155);
		margin-bottom: 8px;
	}

	.confirm-input {
		width: 100%;
		padding: 14px 16px;
		background: transparent;
		border: 1px solid var(--gray-200, #e2e8f0);
		border-radius: var(--radius-input, 12px);
		color: var(--gray-900, #0f172a);
		font-size: 15px;
		transition: all 0.2s ease;
	}

	.confirm-input::placeholder {
		color: var(--gray-400, #94a3b8);
	}

	.confirm-input:focus {
		outline: none;
		border-color: var(--data-red, #ef4444);
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
	}

	.delete-error {
		color: var(--data-red, #ef4444);
		font-size: 13px;
		font-weight: 500;
		margin: 0 0 16px;
		text-align: center;
	}

	.modal-actions {
		display: flex;
		gap: 12px;
	}

	.btn-cancel,
	.btn-delete {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 14px 20px;
		border-radius: var(--radius-button, 14px);
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-cancel {
		background: var(--gray-100, #f1f5f9);
		border: 1px solid var(--gray-200, #e2e8f0);
		color: var(--gray-700, #334155);
	}

	.btn-cancel:hover:not(:disabled) {
		background: var(--gray-200, #e2e8f0);
	}

	.btn-delete {
		background: var(--data-red, #ef4444);
		border: none;
		color: white;
	}

	.btn-delete:hover:not(:disabled) {
		background: #dc2626;
	}

	.btn-delete:disabled,
	.btn-cancel:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-delete :global(.spin) {
		animation: spin 1s linear infinite;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.back-btn,
		.security-item,
		.item-icon,
		.modal-close,
		.confirm-input,
		.btn-cancel,
		.btn-delete {
			transition: none;
		}

		.item-action :global(.spin),
		.btn-delete :global(.spin) {
			animation: none;
		}
	}
</style>

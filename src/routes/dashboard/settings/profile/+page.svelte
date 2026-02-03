<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { goto, invalidate } from '$app/navigation';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Check from 'lucide-svelte/icons/check';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Mail from 'lucide-svelte/icons/mail';
	import User from 'lucide-svelte/icons/user';
	import { Avatar } from '$lib/components/ui';
	import { FormInput, FormSection } from '$lib/components/forms';
	import { t } from '$lib/i18n';

	let { data } = $props();

	const user = $derived(data.session?.user);

	// Form fields - initialize with empty values, then sync from user in effect
	let firstName = $state('');
	let lastName = $state('');
	let email = $state('');
	let newEmail = $state('');
	let phone = $state('');
	let initialized = $state(false);

	// Initialize form fields from user data (runs once when user is available)
	$effect(() => {
		if (user && !initialized) {
			firstName =
				user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '';
			lastName =
				user.user_metadata?.last_name ||
				user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ||
				'';
			email = user.email || '';
			phone = user.user_metadata?.phone || '';
			initialized = true;
		}
	});

	let saving = $state(false);
	let saved = $state(false);
	let error = $state('');
	let successMessage = $state('');

	let showEmailChange = $state(false);
	let emailChanging = $state(false);
	let emailError = $state('');

	const displayName = $derived(`${firstName} ${lastName}`.trim() || email.split('@')[0] || 'User');

	async function handleSave() {
		saving = true;
		error = '';
		successMessage = '';

		try {
			const response = await fetch('/api/user/profile', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					first_name: firstName,
					last_name: lastName,
					full_name: `${firstName} ${lastName}`.trim(),
					phone
				})
			});

			if (!response.ok) throw new Error('Failed to save');

			// Refresh user data across the app
			await invalidate('app:user');

			saved = true;
			successMessage = $t('profile.saved');
			setTimeout(() => {
				saved = false;
				successMessage = '';
			}, 3000);
		} catch (err) {
			error = $t('profile.failed');
		} finally {
			saving = false;
		}
	}

	async function handleEmailChange() {
		if (!newEmail || newEmail === email) return;

		emailChanging = true;
		emailError = '';
		successMessage = '';

		try {
			const response = await fetch('/api/user/email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ newEmail })
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to update email');
			}

			// Refresh user data across the app
			await invalidate('app:user');

			successMessage = data.message || 'Confirmation email sent. Check your inbox.';
			showEmailChange = false;
			newEmail = '';
		} catch (err) {
			emailError = err instanceof Error ? err.message : 'Failed to update email';
		} finally {
			emailChanging = false;
		}
	}
</script>

<main class="profile-page">
	<!-- Header -->
	<header class="page-header" in:fly={{ y: -20, duration: 400, easing: cubicOut }}>
		<button
			class="back-btn"
			onclick={() => goto('/dashboard/settings')}
			aria-label={$t('common.backToSettings')}
		>
			<ChevronLeft size={22} strokeWidth={2} />
		</button>
		<h1 class="page-title">{$t('profile.title')}</h1>
		<button class="save-btn" class:saved onclick={handleSave} disabled={saving}>
			{#if saving}
				<Loader2 size={16} class="spin" />
			{:else if saved}
				<Check size={16} strokeWidth={2.5} />
			{:else}
				{$t('common.save')}
			{/if}
		</button>
	</header>

	<div class="page-content" in:fly={{ y: 20, duration: 500, delay: 100, easing: cubicOut }}>
		<!-- Personal Information -->
		<FormSection title={$t('profile.personalInfo')} variant="card">
			<div class="form-row">
				<FormInput
					label={$t('profile.firstName')}
					name="firstName"
					bind:value={firstName}
					placeholder={$t('placeholder.firstName')}
				>
					{#snippet icon()}
						<User size={18} />
					{/snippet}
				</FormInput>
			</div>

			<FormInput
				label={$t('profile.lastName')}
				name="lastName"
				bind:value={lastName}
				placeholder={$t('placeholder.lastName')}
			/>

			<FormInput
				label={$t('profile.phoneNumber')}
				name="phone"
				type="tel"
				bind:value={phone}
				placeholder={$t('placeholder.phone')}
				hint={$t('profile.phoneHint')}
			/>
		</FormSection>

		<!-- Email Section -->
		<FormSection
			title={$t('profile.emailAddress')}
			description={$t('profile.emailDesc')}
			variant="card"
		>
			<div class="email-display">
				<div class="email-icon">
					<Mail size={20} strokeWidth={1.5} />
				</div>
				<div class="email-info">
					<span class="email-value">{email}</span>
					<span class="email-label">{$t('profile.primaryEmail')}</span>
				</div>
				<button
					type="button"
					class="change-btn"
					onclick={() => (showEmailChange = !showEmailChange)}
				>
					{showEmailChange ? $t('common.cancel') : $t('profile.change')}
				</button>
			</div>

			{#if showEmailChange}
				<div class="email-change-panel" in:fly={{ y: -10, duration: 200 }}>
					<FormInput
						label={$t('profile.newEmail')}
						name="newEmail"
						type="email"
						bind:value={newEmail}
						placeholder={$t('placeholder.email')}
						error={emailError}
					/>
					<button
						type="button"
						class="confirm-btn"
						onclick={handleEmailChange}
						disabled={emailChanging || !newEmail}
					>
						{#if emailChanging}
							<Loader2 size={16} class="spin" />
							<span>{$t('docDetail.sending')}</span>
						{:else}
							<Mail size={16} />
							<span>{$t('profile.sendConfirmation')}</span>
						{/if}
					</button>
				</div>
			{/if}
		</FormSection>

		<!-- Messages -->
		{#if successMessage}
			<div class="message success" in:fly={{ y: 10, duration: 200 }}>
				<Check size={18} strokeWidth={2.5} />
				<span>{successMessage}</span>
			</div>
		{/if}

		{#if error}
			<div class="message error" in:fly={{ y: 10, duration: 200 }}>
				<span>{error}</span>
			</div>
		{/if}
	</div>
</main>

<style>
	.profile-page {
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
		border: none;
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

	.save-btn {
		min-width: 72px;
		height: 36px;
		padding: 0 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		background: var(--blu-primary, #0066ff);
		border: none;
		border-radius: var(--radius-input, 12px);
		color: white;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.save-btn:hover:not(:disabled) {
		background: var(--blu-primary-hover, #0052cc);
	}

	.save-btn:active:not(:disabled) {
		transform: scale(0.97);
	}

	.save-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.save-btn.saved {
		background: var(--data-green, #10b981);
	}

	.save-btn :global(.spin) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
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

	/* Form row for side-by-side fields */
	.form-row {
		display: grid;
		grid-template-columns: 1fr;
		gap: 16px;
	}

	/* Email Display */
	.email-display {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 16px;
		background: transparent;
		border-radius: var(--radius-input, 12px);
	}

	.email-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background: var(--white, #dbe8f4);
		border-radius: var(--radius-input, 12px);
		color: var(--blu-primary, #0066ff);
		flex-shrink: 0;
	}

	.email-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.email-value {
		font-size: 15px;
		font-weight: 500;
		color: var(--gray-900, #0f172a);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.email-label {
		font-size: 12px;
		color: var(--gray-500, #64748b);
	}

	.change-btn {
		padding: 8px 14px;
		background: rgba(255, 255, 255, 0.5);
		border: none;
		border-radius: var(--radius-input, 12px);
		color: var(--gray-600, #475569);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.change-btn:hover {
		background: rgba(255, 255, 255, 0.7);
	}

	/* Email Change Panel */
	.email-change-panel {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 16px;
		background: transparent;
		border-radius: var(--radius-input, 12px);
		margin-top: 12px;
	}

	.confirm-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 14px 20px;
		background: var(--blu-primary, #0066ff);
		border: none;
		border-radius: var(--radius-button, 14px);
		color: white;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.confirm-btn:hover:not(:disabled) {
		background: var(--blu-primary-hover, #0052cc);
	}

	.confirm-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.confirm-btn :global(.spin) {
		animation: spin 1s linear infinite;
	}

	/* Messages */
	.message {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 16px;
		border-radius: var(--radius-button, 14px);
		font-size: 14px;
		font-weight: 500;
	}

	.message.success {
		background: var(--status-paid-bg, rgba(16, 185, 129, 0.1));
		color: var(--data-green, #10b981);
	}

	.message.error {
		background: var(--status-overdue-bg, rgba(239, 68, 68, 0.1));
		color: var(--data-red, #ef4444);
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.back-btn,
		.save-btn,
		.change-btn,
		.confirm-btn {
			transition: none;
		}

		.save-btn :global(.spin),
		.confirm-btn :global(.spin) {
			animation: none;
		}
	}
</style>

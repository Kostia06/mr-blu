<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { goto, invalidate } from '$app/navigation';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Check from 'lucide-svelte/icons/check';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Building2 from 'lucide-svelte/icons/building-2';
	import Globe from 'lucide-svelte/icons/globe';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Hash from 'lucide-svelte/icons/hash';
	import { FormInput, FormSection } from '$lib/components/forms';
	import { t } from '$lib/i18n';

	let { data } = $props();

	const user = $derived(data.session?.user);
	const business = $derived(user?.user_metadata?.business || {});

	// Form fields - initialize with empty values, then sync from business in effect
	let companyName = $state('');
	let address = $state('');
	let city = $state('');
	let stateCode = $state('');
	let zipCode = $state('');
	let taxId = $state('');
	let website = $state('');
	let initialized = $state(false);

	// Initialize form fields from business data (runs once when data is available)
	$effect(() => {
		if (business && !initialized) {
			companyName = business.name || '';
			address = business.address || '';
			city = business.city || '';
			stateCode = business.state || '';
			zipCode = business.zip || '';
			taxId = business.tax_id || '';
			website = business.website || '';
			initialized = true;
		}
	});

	let saving = $state(false);
	let saved = $state(false);
	let error = $state('');
	let successMessage = $state('');

	async function handleSave() {
		saving = true;
		error = '';
		successMessage = '';

		try {
			const response = await fetch('/api/user/business', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					business: {
						name: companyName,
						address,
						city,
						state: stateCode,
						zip: zipCode,
						tax_id: taxId,
						website
					}
				})
			});

			if (!response.ok) throw new Error('Failed to save');

			// Refresh user data across the app
			await invalidate('app:user');

			saved = true;
			successMessage = $t('settings.businessUpdated');
			setTimeout(() => {
				saved = false;
				successMessage = '';
			}, 3000);
		} catch (err) {
			error = $t('settings.businessFailed');
		} finally {
			saving = false;
		}
	}
</script>

<main class="business-page">
	<!-- Header -->
	<header class="page-header" in:fly={{ y: -20, duration: 400, easing: cubicOut }}>
		<button
			class="back-btn"
			onclick={() => goto('/dashboard/settings')}
			aria-label={$t('common.backToSettings')}
		>
			<ChevronLeft size={22} strokeWidth={2} />
		</button>
		<h1 class="page-title">{$t('settings.businessTitle')}</h1>
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
		<!-- Company Information -->
		<FormSection title={$t('settings.companyInfo')} variant="card">
			<FormInput
				label={$t('settings.companyNameLabel')}
				name="companyName"
				bind:value={companyName}
				placeholder={$t('placeholder.companyName')}
			>
				{#snippet icon()}
					<Building2 size={18} />
				{/snippet}
			</FormInput>

			<FormInput
				label={$t('settings.websiteLabel')}
				name="website"
				type="url"
				bind:value={website}
				placeholder="https://yourcompany.com"
			>
				{#snippet icon()}
					<Globe size={18} />
				{/snippet}
			</FormInput>

			<FormInput
				label={$t('settings.taxIdLabel')}
				name="taxId"
				bind:value={taxId}
				placeholder={$t('placeholder.ein')}
				hint={$t('settings.taxIdHint')}
			>
				{#snippet icon()}
					<Hash size={18} />
				{/snippet}
			</FormInput>
		</FormSection>

		<!-- Business Address -->
		<FormSection
			title={$t('settings.businessAddressTitle')}
			description={$t('settings.businessAddressDesc')}
			variant="card"
		>
			<FormInput
				label={$t('settings.streetAddress')}
				name="address"
				bind:value={address}
				placeholder="123 Main Street"
			>
				{#snippet icon()}
					<MapPin size={18} />
				{/snippet}
			</FormInput>

			<div class="form-grid">
				<FormInput
					label={$t('settings.cityLabel')}
					name="city"
					bind:value={city}
					placeholder={$t('placeholder.city')}
				/>
				<div class="form-grid-row">
					<FormInput
						label={$t('settings.stateLabel')}
						name="state"
						bind:value={stateCode}
						placeholder={$t('placeholder.state')}
					/>
					<FormInput
						label={$t('settings.zipLabel')}
						name="zipCode"
						bind:value={zipCode}
						placeholder="78701"
					/>
				</div>
			</div>
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
	.business-page {
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

	/* Form Grid */
	.form-grid {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.form-grid-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
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
		.save-btn {
			transition: none;
		}

		.save-btn :global(.spin) {
			animation: none;
		}
	}
</style>

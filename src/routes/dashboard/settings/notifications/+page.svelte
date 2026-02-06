<script lang="ts">
	import { fly, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { goto, invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Receipt from 'lucide-svelte/icons/receipt';
	import FileText from 'lucide-svelte/icons/file-text';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Check from 'lucide-svelte/icons/check';
	import BellRing from 'lucide-svelte/icons/bell-ring';
	import Info from 'lucide-svelte/icons/info';
	import { FormSection } from '$lib/components/forms';
	import { t } from '$lib/i18n';

	interface NotificationPreferences {
		emailOnInvoiceSent: boolean;
		emailOnInvoicePaid: boolean;
		emailOnEstimateSent: boolean;
		emailWeeklySummary: boolean;
	}

	let preferences = $state<NotificationPreferences>({
		emailOnInvoiceSent: true,
		emailOnInvoicePaid: true,
		emailOnEstimateSent: true,
		emailWeeklySummary: false
	});

	let loading = $state(true);
	let saving = $state(false);
	let saved = $state(false);
	let error = $state('');

	// Count enabled notifications
	const enabledCount = $derived(Object.values(preferences).filter(Boolean).length);

	onMount(async () => {
		try {
			const response = await fetch('/api/user/notifications');
			if (response.ok) {
				const data = await response.json();
				preferences = data.preferences;
			}
		} catch (err) {
			console.error('Failed to load preferences:', err);
		} finally {
			loading = false;
		}
	});

	async function savePreferences() {
		saving = true;
		error = '';

		try {
			const response = await fetch('/api/user/notifications', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ preferences })
			});

			if (!response.ok) {
				throw new Error('Failed to save');
			}

			// Refresh user data across the app
			await invalidate('app:user');

			saved = true;
			setTimeout(() => (saved = false), 2000);
		} catch (err) {
			error = 'Failed to save notification preferences';
		} finally {
			saving = false;
		}
	}

	function togglePreference(key: keyof NotificationPreferences) {
		preferences[key] = !preferences[key];
		savePreferences();
	}

	const notificationOptions: {
		key: keyof NotificationPreferences;
		icon: typeof Receipt;
		label: string;
		desc: string;
	}[] = [
		{
			key: 'emailOnInvoiceSent',
			icon: Receipt,
			label: 'Invoice Sent',
			desc: 'Get notified when an invoice is sent to a client'
		},
		{
			key: 'emailOnInvoicePaid',
			icon: Check,
			label: 'Invoice Paid',
			desc: 'Get notified when a client pays an invoice'
		},
		{
			key: 'emailOnEstimateSent',
			icon: FileText,
			label: 'Estimate Sent',
			desc: 'Get notified when an estimate is sent to a client'
		},
		{
			key: 'emailWeeklySummary',
			icon: BarChart3,
			label: 'Weekly Summary',
			desc: 'Receive a weekly summary of your activity'
		}
	];
</script>

<main class="notifications-page">
	<!-- Header -->
	<header class="page-header" in:fly={{ y: -20, duration: 400, easing: cubicOut }}>
		<button
			class="back-btn"
			onclick={() => goto('/dashboard/settings')}
			aria-label={$t('common.backToSettings')}
		>
			<ChevronLeft size={22} strokeWidth={2} />
		</button>
		<h1 class="page-title">{$t('settings.notifications')}</h1>
		<div class="header-status">
			{#if saving}
				<div class="status-indicator saving" in:scale={{ start: 0.5, duration: 150 }}>
					<Loader2 size={16} class="spin" />
				</div>
			{:else if saved}
				<div class="status-indicator saved" in:scale={{ start: 0.5, duration: 150 }}>
					<Check size={16} strokeWidth={2.5} />
				</div>
			{:else}
				<div class="header-spacer"></div>
			{/if}
		</div>
	</header>

	<div class="page-content" in:fly={{ y: 20, duration: 500, delay: 100, easing: cubicOut }}>
		<!-- Status Preview -->
		<section class="status-preview">
			<div class="preview-bell" class:active={enabledCount > 0}>
				<BellRing size={32} strokeWidth={1.5} />
				{#if enabledCount > 0}
					<div class="notification-badge">{enabledCount}</div>
				{/if}
			</div>
			<p class="preview-label">
				{#if loading}
					Loading...
				{:else if enabledCount === 0}
					All notifications disabled
				{:else}
					{enabledCount} notification{enabledCount !== 1 ? 's' : ''} enabled
				{/if}
			</p>
		</section>

		{#if loading}
			<div class="loading-state">
				<div class="skeleton-card"></div>
				<div class="skeleton-card"></div>
				<div class="skeleton-card"></div>
				<div class="skeleton-card"></div>
			</div>
		{:else}
			<!-- Email Notifications -->
			<FormSection
				title={$t('settings.emailNotificationsTitle')}
				description={$t('settings.emailNotificationsDesc')}
				variant="card"
			>
				<div class="notification-list">
					{#each notificationOptions as option (option.key)}
						{@const Icon = option.icon}
						<button
							class="notification-item"
							class:enabled={preferences[option.key]}
							onclick={() => togglePreference(option.key)}
							aria-pressed={preferences[option.key]}
						>
							<div class="item-icon" class:selected={preferences[option.key]}>
								<Icon size={18} strokeWidth={1.5} />
							</div>
							<div class="item-content">
								<span class="item-label">{option.label}</span>
								<span class="item-desc">{option.desc}</span>
							</div>
							<div class="toggle-switch" class:active={preferences[option.key]}>
								<div class="toggle-thumb"></div>
							</div>
						</button>
					{/each}
				</div>
			</FormSection>

			{#if error}
				<div class="error-message" in:fly={{ y: 10, duration: 200 }}>
					<span>{error}</span>
				</div>
			{/if}
		{/if}

		<!-- Info Note -->
		<div class="info-note">
			<Info size={18} strokeWidth={1.5} />
			<p>Changes are saved automatically when you toggle a setting.</p>
		</div>
	</div>
</main>

<style>
	.notifications-page {
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

	.header-status {
		width: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.header-spacer {
		width: 40px;
	}

	.status-indicator {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
	}

	.status-indicator.saving {
		color: var(--gray-500, #64748b);
	}

	.status-indicator.saved {
		color: var(--data-green, #10b981);
		background: rgba(16, 185, 129, 0.1);
	}

	.status-indicator :global(.spin) {
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

	/* Status Preview */
	.status-preview {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 32px 0;
	}

	.preview-bell {
		position: relative;
		width: 88px;
		height: 88px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--white, #dbe8f4);
		border: 1px solid var(--gray-200, #e2e8f0);
		border-radius: 50%;
		color: var(--gray-400, #94a3b8);
		transition: all 0.3s ease;
	}

	.preview-bell.active {
		color: var(--blu-primary, #0066ff);
		box-shadow: 0 8px 32px rgba(0, 102, 255, 0.12);
	}

	.notification-badge {
		position: absolute;
		top: 4px;
		right: 4px;
		min-width: 22px;
		height: 22px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--blu-primary, #0066ff);
		border: 2px solid var(--white, #dbe8f4);
		border-radius: 100px;
		color: white;
		font-size: 11px;
		font-weight: 700;
		padding: 0 6px;
	}

	.preview-label {
		margin-top: 16px;
		font-size: 14px;
		font-weight: 500;
		color: var(--gray-600, #475569);
	}

	/* Loading State */
	.loading-state {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.skeleton-card {
		height: 76px;
		background: linear-gradient(
			90deg,
			var(--gray-100, #f1f5f9) 25%,
			var(--gray-50, #f8fafc) 50%,
			var(--gray-100, #f1f5f9) 75%
		);
		background-size: 200% 100%;
		border-radius: var(--radius-button, 14px);
		animation: shimmer 1.5s ease-in-out infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	/* Notification List */
	.notification-list {
		display: flex;
		flex-direction: column;
	}

	.notification-item {
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

	.notification-item:not(:last-child) {
		border-bottom: 1px solid var(--gray-100, #f1f5f9);
	}

	.notification-item:hover {
		background: transparent;
	}

	.notification-item.enabled {
		background: rgba(0, 102, 255, 0.04);
	}

	.item-icon {
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--gray-100, #f1f5f9);
		border-radius: var(--radius-input, 12px);
		color: var(--gray-500, #64748b);
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.item-icon.selected {
		background: rgba(0, 102, 255, 0.1);
		color: var(--blu-primary, #0066ff);
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

	.item-desc {
		font-size: 13px;
		color: var(--gray-500, #64748b);
	}

	/* Toggle Switch */
	.toggle-switch {
		width: 48px;
		height: 28px;
		background: var(--gray-200, #e2e8f0);
		border-radius: 100px;
		position: relative;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		flex-shrink: 0;
	}

	.toggle-switch.active {
		background: var(--blu-primary, #0066ff);
	}

	.toggle-thumb {
		width: 22px;
		height: 22px;
		background: var(--white, #dbe8f4);
		border-radius: 50%;
		position: absolute;
		top: 3px;
		left: 3px;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
	}

	.toggle-switch.active .toggle-thumb {
		transform: translateX(20px);
	}

	/* Error Message */
	.error-message {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 16px;
		background: var(--status-overdue-bg, rgba(239, 68, 68, 0.1));
		border-radius: var(--radius-button, 14px);
		color: var(--data-red, #ef4444);
		font-size: 14px;
		font-weight: 500;
	}

	/* Info Note */
	.info-note {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		background: var(--gray-100, #f1f5f9);
		border-radius: var(--radius-button, 14px);
		color: var(--gray-500, #64748b);
	}

	.info-note p {
		margin: 0;
		font-size: 13px;
		line-height: 1.5;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.back-btn,
		.preview-bell,
		.notification-item,
		.item-icon,
		.toggle-switch,
		.toggle-thumb {
			transition: none;
		}

		.skeleton-card {
			animation: none;
		}

		.status-indicator :global(.spin) {
			animation: none;
		}
	}
</style>

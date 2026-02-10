<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { SCROLL_DOWN_THRESHOLD, SCROLL_UP_THRESHOLD, SCROLL_HEADER_MIN_Y } from '$lib/constants';
	import User from 'lucide-svelte/icons/user';
	import Building2 from 'lucide-svelte/icons/building-2';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Globe from 'lucide-svelte/icons/globe';
	import BellRing from 'lucide-svelte/icons/bell-ring';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import { SettingsSection, SettingsItem } from '$lib/components/settings';
	import { t } from '$lib/i18n';

	let { data } = $props();

	// Scroll-based header visibility
	let headerHidden = $state(false);
	let lastScrollY = $state(0);
	let ticking = $state(false);

	function handleScroll() {
		const currentScrollY = window.scrollY;

		if (!ticking) {
			requestAnimationFrame(() => {
				const delta = currentScrollY - lastScrollY;

				// Hide header when scrolling down significantly, show when scrolling up
				if (delta > SCROLL_DOWN_THRESHOLD && currentScrollY > SCROLL_HEADER_MIN_Y) {
					headerHidden = true;
				} else if (delta < -SCROLL_UP_THRESHOLD || currentScrollY <= SCROLL_HEADER_MIN_Y) {
					headerHidden = false;
				}

				lastScrollY = currentScrollY;
				ticking = false;
			});
			ticking = true;
		}
	}

	onMount(() => {
		window.addEventListener('scroll', handleScroll, { passive: true });
	});

	onDestroy(() => {
		window.removeEventListener('scroll', handleScroll);
	});

	const settingsSections = $derived([
		{
			title: $t('settings.account'),
			items: [
				{
					icon: User,
					label: $t('settings.profile'),
					value: $t('settings.nameEmail'),
					href: '/dashboard/settings/profile'
				},
				{
					icon: Building2,
					label: $t('settings.business'),
					value: $t('settings.companyInfoBranding'),
					href: '/dashboard/settings/business'
				}
			]
		},
		{
			title: $t('settings.preferences'),
			items: [
				{
					icon: BellRing,
					label: $t('settings.notifications'),
					value: $t('settings.notificationsDesc'),
					href: '/dashboard/settings/notifications'
				},
				{
					icon: Globe,
					label: $t('settings.language'),
					value: $t('settings.appLanguage'),
					href: '/dashboard/settings/language'
				}
			]
		}
	]);
</script>

<main class="settings-page">
	<!-- Custom Header -->
	<header
		class="page-header"
		class:header-hidden={headerHidden}
		in:fly={{ y: -20, duration: 400, easing: cubicOut }}
	>
		<button
			class="back-btn"
			onclick={() => goto('/dashboard')}
			aria-label={$t('aria.backToDashboard')}
		>
			<ChevronLeft size={22} strokeWidth={2} />
		</button>
		<h1 class="page-title">{$t('settings.title')}</h1>
		<div class="header-spacer"></div>
	</header>

	<div class="page-content" in:fly={{ y: 20, duration: 500, delay: 100, easing: cubicOut }}>
		<!-- Settings Sections -->
		{#each settingsSections as section, sectionIndex}
			<div
				class="section-wrapper"
				in:fly={{ y: 20, duration: 400, delay: 200 + sectionIndex * 50, easing: cubicOut }}
			>
				<SettingsSection title={section.title}>
					{#each section.items as item}
						<SettingsItem label={item.label} value={item.value} href={item.href}>
							{#snippet icon()}
								{@const Icon = item.icon}
								<Icon size={18} strokeWidth={1.5} />
							{/snippet}
						</SettingsItem>
					{/each}
				</SettingsSection>
			</div>
		{/each}

		<!-- Logout Section -->
		<div class="section-wrapper" in:fly={{ y: 20, duration: 400, delay: 400, easing: cubicOut }}>
			<form method="POST" action="/auth/logout" class="logout-form">
				<button type="submit" class="logout-btn">
					<span class="logout-icon">
						<LogOut size={18} strokeWidth={2} />
					</span>
					<span>{$t('settings.signOut')}</span>
				</button>
			</form>
		</div>

		<!-- Version -->
		<p class="version-text">{$t('settings.versionNumber')}</p>
	</div>
</main>

<style>
	.settings-page {
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
		max-width: var(--page-max-width, 600px);
		margin-left: auto;
		margin-right: auto;
		width: 100%;
		transition:
			transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
			opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		will-change: transform, opacity;
	}

	.page-header.header-hidden {
		transform: translateY(-100%);
		opacity: 0;
		pointer-events: none;
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
		width: 40px;
	}

	/* Page Content */
	.page-content {
		padding: var(--page-padding-x, 20px);
		max-width: var(--page-max-width, 600px);
		width: 100%;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		justify-content: center;
		min-height: calc(100vh - 60px);
		gap: var(--section-gap, 24px);
		padding-bottom: 100px;
	}

	/* Section wrapper */
	.section-wrapper {
		/* Wrapper for animations */
	}

	/* Logout Form */
	.logout-form {
		margin-top: 8px;
	}

	.logout-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		width: 100%;
		padding: 16px 24px;
		background: transparent;
		border: none;
		border-radius: var(--radius-button, 14px);
		color: var(--data-red, #ef4444);
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.logout-btn:hover {
		background: var(--status-overdue-bg, rgba(239, 68, 68, 0.1));
	}

	.logout-btn:active {
		transform: scale(0.98);
	}

	.logout-icon {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Version */
	.version-text {
		text-align: center;
		font-size: 12px;
		color: var(--gray-400, #94a3b8);
		margin: 8px 0 0;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.page-header,
		.back-btn,
		.logout-btn {
			transition: none;
		}

		.page-header.header-hidden {
			transform: none;
			opacity: 1;
			pointer-events: auto;
		}
	}
</style>

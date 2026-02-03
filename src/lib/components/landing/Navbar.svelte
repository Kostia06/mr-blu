<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { browser } from '$app/environment';
	import Menu from 'lucide-svelte/icons/menu';
	import X from 'lucide-svelte/icons/x';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Globe from 'lucide-svelte/icons/globe';
	import LayoutDashboard from 'lucide-svelte/icons/layout-dashboard';
	import { locale, setLocale, t } from '$lib/i18n';
	import type { Session } from '@supabase/supabase-js';

	let { session = null }: { session?: Session | null } = $props();

	let hidden = $state(false);
	let mobileMenuOpen = $state(false);
	let currentLocale = $state('en');
	let lastScrollY = 0;

	// Subscribe to locale
	$effect(() => {
		const unsub = locale.subscribe((v) => (currentLocale = v));
		return unsub;
	});

	function toggleLanguage() {
		const newLocale = currentLocale === 'en' ? 'es' : 'en';
		setLocale(newLocale);
	}

	onMount(() => {
		let ticking = false;

		const handleScroll = () => {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(() => {
				const currentScrollY = window.scrollY;

				if (currentScrollY > lastScrollY && currentScrollY > 100) {
					hidden = true;
				} else if (currentScrollY < lastScrollY || currentScrollY <= 50) {
					hidden = false;
				}

				lastScrollY = currentScrollY;
				ticking = false;
			});
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	});

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
		if (browser) {
			document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
		}
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
		if (browser) {
			document.body.style.overflow = '';
		}
	}
</script>

<a href="#main-content" class="skip-link">{$t('landing.nav.skipToContent')}</a>

<header class="navbar" class:hidden>
	<nav class="nav-container" aria-label="Main navigation">
		<div class="nav-content">
			<!-- Logo -->
			<a href="/" class="logo-link" aria-label="mrblu Home">
				<span class="logo-text">mrblu</span>
			</a>

			<!-- Desktop CTA -->
			<div class="nav-actions">
				<!-- Language Toggle -->
				<button class="lang-toggle" onclick={toggleLanguage} aria-label={$t('aria.switchLanguage')}>
					<Globe size={16} strokeWidth={2} />
					<span>{currentLocale.toUpperCase()}</span>
				</button>

				{#if session}
					<a href="/dashboard" class="cta-button">
						<LayoutDashboard size={14} strokeWidth={2.5} />
						<span>{$t('landing.nav.dashboard')}</span>
					</a>
				{:else}
					<a href="/login" class="cta-button">
						<span>{$t('landing.nav.getStarted')}</span>
						<ArrowRight size={14} strokeWidth={2.5} />
					</a>
				{/if}

				<!-- Mobile Menu Button -->
				<button
					class="mobile-menu-btn"
					onclick={toggleMobileMenu}
					aria-expanded={mobileMenuOpen}
					aria-label={mobileMenuOpen ? $t('aria.closeMenu') : $t('aria.openMenu')}
				>
					<Menu size={20} strokeWidth={2} />
				</button>
			</div>
		</div>
	</nav>
</header>

<!-- Mobile Menu -->
{#if mobileMenuOpen}
	<div
		class="mobile-overlay"
		role="button"
		tabindex="-1"
		onclick={closeMobileMenu}
		onkeydown={(e) => e.key === 'Escape' && closeMobileMenu()}
		in:fade={{ duration: 200 }}
		out:fade={{ duration: 150 }}
	></div>

	<div
		class="mobile-sheet"
		in:fly={{ y: -20, duration: 250, easing: cubicOut }}
		out:fly={{ y: -20, duration: 150 }}
	>
		<div class="mobile-sheet-header">
			<a href="/" class="mobile-logo" onclick={closeMobileMenu}>
				<span class="logo-text">mrblu</span>
			</a>
			<button class="mobile-close" onclick={closeMobileMenu} aria-label={$t('aria.closeMenu')}>
				<X size={20} strokeWidth={2} />
			</button>
		</div>

		<nav class="mobile-nav">
			<a href="#features" class="mobile-link" onclick={closeMobileMenu}
				>{$t('landing.nav.features')}</a
			>
			<a href="#how-it-works" class="mobile-link" onclick={closeMobileMenu}
				>{$t('landing.nav.howItWorks')}</a
			>
			<a href="#use-cases" class="mobile-link" onclick={closeMobileMenu}
				>{$t('landing.nav.useCases')}</a
			>
		</nav>

		<div class="mobile-footer">
			<button class="mobile-lang-toggle" onclick={toggleLanguage}>
				<Globe size={16} strokeWidth={2} />
				<span>{currentLocale === 'en' ? 'Español' : 'English'}</span>
			</button>
			{#if session}
				<a href="/dashboard" class="mobile-cta" onclick={closeMobileMenu}>
					<LayoutDashboard size={16} strokeWidth={2.5} />
					<span>{$t('landing.nav.goToDashboard')}</span>
				</a>
			{:else}
				<a href="/login" class="mobile-cta">
					<span>{$t('landing.nav.getStartedFree')}</span>
					<ArrowRight size={16} strokeWidth={2.5} />
				</a>
			{/if}
		</div>
	</div>
{/if}

<style>
	.skip-link {
		position: absolute;
		top: 16px;
		left: 16px;
		z-index: 100;
		padding: 12px 24px;
		background: var(--blu-primary);
		color: white;
		font-weight: 600;
		border-radius: 8px;
		text-decoration: none;
		transform: translateY(calc(-100% - 16px));
		transition: transform 0.2s ease;
	}

	.skip-link:focus {
		transform: translateY(0);
	}

	/* Navbar */
	.navbar {
		position: fixed;
		top: 16px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 50;
		width: calc(100% - 32px);
		max-width: 400px;
	}

	.nav-container {
		width: 100%;
	}

	.nav-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 8px 8px 14px;
		background: rgba(219, 232, 244, 0.95);
		border: 1px solid #e2e8f0;
		border-radius: 100px;
		transition:
			background 0.3s ease,
			border-color 0.3s ease,
			box-shadow 0.3s ease;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	}

	/* Logo */
	.logo-link {
		text-decoration: none;
	}

	.logo-text {
		font-size: 18px;
		font-weight: 700;
		color: var(--blu-primary, #0066ff);
		letter-spacing: -0.5px;
	}

	/* Actions */
	.nav-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	/* Language Toggle */
	.lang-toggle {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 8px 12px;
		background: transparent;
		border: none;
		color: #64748b;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		border-radius: 100px;
		transition: all 0.2s ease;
	}

	.lang-toggle:hover {
		color: #0f172a;
		background: #f1f5f9;
	}

	.cta-button {
		display: none;
		align-items: center;
		gap: 6px;
		padding: 10px 16px;
		background: var(--blu-primary);
		color: white;
		font-size: 13px;
		font-weight: 600;
		text-decoration: none;
		border-radius: 100px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 2px 10px rgba(0, 102, 255, 0.2);
	}

	.cta-button:hover {
		background: #0052cc;
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(0, 102, 255, 0.3);
	}

	@media (min-width: 400px) {
		.cta-button {
			display: flex;
		}
	}

	/* Mobile Menu Button */
	.mobile-menu-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background: #f1f5f9;
		border: none;
		color: #64748b;
		cursor: pointer;
		border-radius: 50%;
		transition: all 0.2s ease;
	}

	.mobile-menu-btn:hover {
		background: #e2e8f0;
		color: #0f172a;
	}

	@media (min-width: 400px) {
		.mobile-menu-btn {
			display: none;
		}
	}

	/* Mobile Overlay */
	.mobile-overlay {
		position: fixed;
		inset: 0;
		z-index: 60;
		background: rgba(0, 0, 0, 0.6);
	}

	/* Mobile Sheet */
	.mobile-sheet {
		position: fixed;
		top: 16px;
		left: 16px;
		right: 16px;
		z-index: 70;
		background: rgba(219, 232, 244, 0.98);
		backdrop-filter: blur(20px);
		border: 1px solid #e2e8f0;
		border-radius: 20px;
		overflow: hidden;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	.mobile-sheet-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 16px;
		border-bottom: 1px solid #e2e8f0;
	}

	.mobile-logo {
		text-decoration: none;
	}

	.mobile-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background: #f1f5f9;
		border: none;
		color: #64748b;
		cursor: pointer;
		border-radius: 50%;
		transition: all 0.2s ease;
	}

	.mobile-close:hover {
		color: #0f172a;
		background: #e2e8f0;
	}

	/* Mobile Nav */
	.mobile-nav {
		padding: 12px 8px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.mobile-link {
		display: block;
		padding: 14px 16px;
		font-size: 15px;
		font-weight: 500;
		color: #64748b;
		text-decoration: none;
		border-radius: 12px;
		transition: all 0.2s ease;
	}

	.mobile-link:hover {
		color: #0f172a;
		background: #f1f5f9;
	}

	/* Mobile Footer */
	.mobile-footer {
		padding: 12px 16px 16px;
		border-top: 1px solid #e2e8f0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.mobile-lang-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		padding: 12px 16px;
		background: #f1f5f9;
		border: none;
		color: #64748b;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		border-radius: 12px;
		transition: all 0.2s ease;
	}

	.mobile-lang-toggle:hover {
		background: #e2e8f0;
		color: #0f172a;
	}

	.mobile-cta {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		padding: 14px 20px;
		background: var(--blu-primary);
		color: white;
		font-size: 15px;
		font-weight: 600;
		text-decoration: none;
		border-radius: 12px;
		transition: all 0.2s ease;
	}

	.mobile-cta:hover {
		background: #0052cc;
	}
</style>

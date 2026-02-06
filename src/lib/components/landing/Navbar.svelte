<script lang="ts">
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Globe from 'lucide-svelte/icons/globe';
	import LayoutDashboard from 'lucide-svelte/icons/layout-dashboard';
	import { locale, setLocale, t } from '$lib/i18n';
	import type { Session } from '@supabase/supabase-js';

	let { session = null }: { session?: Session | null } = $props();

	let currentLocale = $state('en');

	// Subscribe to locale
	$effect(() => {
		const unsub = locale.subscribe((v) => (currentLocale = v));
		return unsub;
	});

	function toggleLanguage() {
		const newLocale = currentLocale === 'en' ? 'es' : 'en';
		setLocale(newLocale);
	}
</script>

<a href="#main-content" class="skip-link">{$t('landing.nav.skipToContent')}</a>

<header class="navbar">
	<nav class="nav-container" aria-label="Main navigation">
		<div class="nav-content">
			<!-- Logo -->
			<a href="/" class="logo-link" aria-label="mrblu Home">
				<span class="logo-text">mrblu</span>
			</a>

			<!-- Actions -->
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
			</div>
		</div>
	</nav>
</header>

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
		top: 0;
		left: 0;
		right: 0;
		z-index: 50;
		padding: 0 24px;
	}

	.nav-container {
		width: 100%;
		max-width: 1280px;
		margin: 0 auto;
	}

	.nav-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 0;
		background: transparent;
		transition: padding 0.3s ease;
	}

	@media (min-width: 768px) {
		.navbar {
			padding: 0 40px;
		}
	}

	/* Logo */
	.logo-link {
		text-decoration: none;
	}

	.logo-text {
		font-size: 28px;
		font-weight: 800;
		color: var(--blu-primary, #0066ff);
		letter-spacing: -0.5px;
	}

	/* Actions */
	.nav-actions {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 5px;
		background: rgba(255, 255, 255, 0.6);
		backdrop-filter: blur(24px) saturate(180%);
		-webkit-backdrop-filter: blur(24px) saturate(180%);
		border: 1px solid rgba(255, 255, 255, 0.7);
		border-radius: 100px;
		box-shadow:
			0 4px 24px rgba(0, 0, 0, 0.08),
			inset 0 1px 1px rgba(255, 255, 255, 0.6);
	}

	/* Language Toggle */
	.lang-toggle {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 10px 14px;
		background: transparent;
		border: none;
		color: var(--gray-600, #475569);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		border-radius: 100px;
		transition: all 0.2s ease;
	}

	.lang-toggle:hover {
		color: var(--blu-primary, #0066ff);
		background: rgba(0, 102, 255, 0.08);
	}

	.cta-button {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 18px;
		background: var(--blu-primary, #0066ff);
		color: white;
		font-size: 14px;
		font-weight: 600;
		text-decoration: none;
		border-radius: 100px;
		transition: all 0.2s ease;
		box-shadow: 0 2px 10px rgba(0, 102, 255, 0.25);
	}

	.cta-button:hover {
		background: #0052cc;
		box-shadow: 0 4px 16px rgba(0, 102, 255, 0.35);
	}
</style>

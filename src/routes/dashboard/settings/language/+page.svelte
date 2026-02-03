<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { goto } from '$app/navigation';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Check from 'lucide-svelte/icons/check';
	import Globe from 'lucide-svelte/icons/globe';
	import Info from 'lucide-svelte/icons/info';
	import { locale, setLocale, t } from '$lib/i18n';
	import { FormSection } from '$lib/components/forms';

	let currentLocale = $state('en');

	// Subscribe to locale
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

	const languages = [
		{ code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
		{ code: 'es', name: 'Español', native: 'Spanish', flag: '🇪🇸' }
	];

	function selectLanguage(code: string) {
		setLocale(code);
	}

	const selectedLanguage = $derived(
		languages.find((l) => l.code === currentLocale) || languages[0]
	);
</script>

<main class="language-page">
	<!-- Header -->
	<header class="page-header" in:fly={{ y: -20, duration: 400, easing: cubicOut }}>
		<button
			class="back-btn"
			onclick={() => goto('/dashboard/settings')}
			aria-label={translate('common.backToSettings')}
		>
			<ChevronLeft size={22} strokeWidth={2} />
		</button>
		<h1 class="page-title">{translate('settings.languageTitle')}</h1>
		<div class="header-spacer"></div>
	</header>

	<div class="page-content" in:fly={{ y: 20, duration: 500, delay: 100, easing: cubicOut }}>
		<!-- Preview Section -->
		<section class="language-preview">
			<div class="preview-globe">
				<Globe size={32} strokeWidth={1.5} />
				<div class="current-flag">{selectedLanguage.flag}</div>
			</div>
			<p class="preview-label">{selectedLanguage.name}</p>
		</section>

		<!-- Language Selection -->
		<FormSection
			title={translate('settings.selectLanguage')}
			description={translate('settings.languageDesc')}
			variant="card"
		>
			<div class="language-list">
				{#each languages as lang (lang.code)}
					<button
						class="language-item"
						class:selected={currentLocale === lang.code}
						onclick={() => selectLanguage(lang.code)}
						aria-pressed={currentLocale === lang.code}
					>
						<div class="language-flag-container">
							<span class="language-flag">{lang.flag}</span>
						</div>
						<div class="language-info">
							<span class="language-name">{lang.name}</span>
							<span class="language-native">{lang.native}</span>
						</div>
						{#if currentLocale === lang.code}
							<div class="language-check" in:fly={{ scale: 0.5, duration: 150 }}>
								<Check size={14} strokeWidth={3} />
							</div>
						{/if}
					</button>
				{/each}
			</div>
		</FormSection>

		<!-- Info Note -->
		<div class="info-note">
			<Info size={18} strokeWidth={1.5} />
			<p>{translate('settings.languageHint')}</p>
		</div>
	</div>
</main>

<style>
	.language-page {
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

	/* Language Preview */
	.language-preview {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 32px 0;
	}

	.preview-globe {
		position: relative;
		width: 88px;
		height: 88px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--white, #dbe8f4);
		border: 1px solid var(--gray-200, #e2e8f0);
		border-radius: 50%;
		color: var(--blu-primary, #0066ff);
		box-shadow: 0 8px 32px rgba(0, 102, 255, 0.1);
	}

	.current-flag {
		position: absolute;
		bottom: -4px;
		right: -4px;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--white, #dbe8f4);
		border: 2px solid var(--gray-50, #f8fafc);
		border-radius: 50%;
		font-size: 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.preview-label {
		margin-top: 16px;
		font-size: 14px;
		font-weight: 500;
		color: var(--gray-600, #475569);
	}

	/* Language List */
	.language-list {
		display: flex;
		flex-direction: column;
	}

	.language-item {
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

	.language-item:not(:last-child) {
		border-bottom: 1px solid var(--gray-100, #f1f5f9);
	}

	.language-item:hover {
		background: transparent;
	}

	.language-item.selected {
		background: rgba(0, 102, 255, 0.04);
	}

	.language-flag-container {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--gray-100, #f1f5f9);
		border-radius: var(--radius-input, 12px);
		flex-shrink: 0;
	}

	.language-item.selected .language-flag-container {
		background: rgba(0, 102, 255, 0.1);
	}

	.language-flag {
		font-size: 24px;
		line-height: 1;
	}

	.language-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.language-name {
		font-size: 15px;
		font-weight: 500;
		color: var(--gray-900, #0f172a);
	}

	.language-native {
		font-size: 13px;
		color: var(--gray-500, #64748b);
	}

	.language-check {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--blu-primary, #0066ff);
		border-radius: 50%;
		color: white;
		flex-shrink: 0;
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
		.language-item {
			transition: none;
		}
	}
</style>

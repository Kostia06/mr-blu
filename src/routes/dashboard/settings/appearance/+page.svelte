<script lang="ts">
	import { fly, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { goto } from '$app/navigation';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';
	import Monitor from 'lucide-svelte/icons/monitor';
	import Check from 'lucide-svelte/icons/check';
	import Palette from 'lucide-svelte/icons/palette';
	import { theme, type Theme } from '$lib/stores/theme';
	import { onMount } from 'svelte';
	import { FormSection } from '$lib/components/forms';
	import { t } from '$lib/i18n';

	let currentTheme = $state<Theme>('system');

	onMount(() => {
		theme.initialize();
		const unsubscribe = theme.subscribe((value) => {
			currentTheme = value;
		});
		return unsubscribe;
	});

	const themeOptions = $derived([
		{
			value: 'light' as Theme,
			icon: Sun,
			label: $t('settings.themeLight'),
			desc: $t('settings.themeLightDesc')
		},
		{
			value: 'dark' as Theme,
			icon: Moon,
			label: $t('settings.themeDark'),
			desc: $t('settings.themeDarkDesc')
		},
		{
			value: 'system' as Theme,
			icon: Monitor,
			label: $t('settings.themeSystem'),
			desc: $t('settings.themeSystemDesc')
		}
	]);

	function selectTheme(newTheme: Theme) {
		theme.setTheme(newTheme);
	}
</script>

<main class="appearance-page">
	<!-- Header -->
	<header class="page-header" in:fly={{ y: -20, duration: 400, easing: cubicOut }}>
		<button
			class="back-btn"
			onclick={() => goto('/dashboard/settings')}
			aria-label={$t('common.backToSettings')}
		>
			<ChevronLeft size={22} strokeWidth={2} />
		</button>
		<h1 class="page-title">{$t('settings.appearance')}</h1>
		<div class="header-spacer"></div>
	</header>

	<div class="page-content" in:fly={{ y: 20, duration: 500, delay: 100, easing: cubicOut }}>
		<!-- Preview Card -->
		<section class="preview-section">
			<div class="preview-card" class:dark={currentTheme === 'dark'}>
				<div class="preview-header">
					<div class="preview-dots">
						<span></span>
						<span></span>
						<span></span>
					</div>
				</div>
				<div class="preview-content">
					<div class="preview-sidebar">
						<div class="preview-nav-item active"></div>
						<div class="preview-nav-item"></div>
						<div class="preview-nav-item"></div>
					</div>
					<div class="preview-main">
						<div class="preview-title"></div>
						<div class="preview-line"></div>
						<div class="preview-line short"></div>
					</div>
				</div>
			</div>
			<p class="preview-label">
				{currentTheme === 'light'
					? 'Light mode'
					: currentTheme === 'dark'
						? 'Dark mode'
						: 'Matches your system'}
			</p>
		</section>

		<!-- Theme Selection -->
		<FormSection title={$t('settings.themeTitle')} variant="card">
			<div class="theme-options">
				{#each themeOptions as option}
					{@const Icon = option.icon}
					<button
						class="theme-option"
						class:selected={currentTheme === option.value}
						onclick={() => selectTheme(option.value)}
						aria-pressed={currentTheme === option.value}
					>
						<div class="option-icon" class:selected={currentTheme === option.value}>
							<Icon size={20} strokeWidth={1.5} />
						</div>
						<div class="option-content">
							<span class="option-label">{option.label}</span>
							<span class="option-desc">{option.desc}</span>
						</div>
						{#if currentTheme === option.value}
							<div class="option-check" in:scale={{ start: 0.5, duration: 150 }}>
								<Check size={14} strokeWidth={3} />
							</div>
						{/if}
					</button>
				{/each}
			</div>
		</FormSection>

		<!-- Info Note -->
		<div class="info-note">
			<Palette size={18} strokeWidth={1.5} />
			<p>Your theme preference is saved locally on this device.</p>
		</div>
	</div>
</main>

<style>
	.appearance-page {
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

	/* Preview Section */
	.preview-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 24px 0;
	}

	.preview-card {
		width: 200px;
		height: 140px;
		background: var(--white, #dbe8f4);
		border: 1px solid var(--gray-200, #e2e8f0);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
	}

	.preview-card.dark {
		background: #1e293b;
		border-color: #334155;
	}

	.preview-header {
		height: 24px;
		background: var(--gray-100, #f1f5f9);
		display: flex;
		align-items: center;
		padding: 0 10px;
	}

	.preview-card.dark .preview-header {
		background: #334155;
	}

	.preview-dots {
		display: flex;
		gap: 4px;
	}

	.preview-dots span {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--gray-300, #cbd5e1);
	}

	.preview-card.dark .preview-dots span {
		background: #475569;
	}

	.preview-dots span:first-child {
		background: #ef4444;
	}

	.preview-dots span:nth-child(2) {
		background: #f59e0b;
	}

	.preview-dots span:nth-child(3) {
		background: #22c55e;
	}

	.preview-content {
		display: flex;
		height: calc(100% - 24px);
		padding: 10px;
		gap: 10px;
	}

	.preview-sidebar {
		width: 36px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.preview-nav-item {
		height: 8px;
		background: var(--gray-200, #e2e8f0);
		border-radius: 4px;
	}

	.preview-card.dark .preview-nav-item {
		background: #475569;
	}

	.preview-nav-item.active {
		background: var(--blu-primary, #0066ff);
	}

	.preview-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.preview-title {
		height: 12px;
		width: 70%;
		background: var(--gray-300, #cbd5e1);
		border-radius: 4px;
	}

	.preview-card.dark .preview-title {
		background: #64748b;
	}

	.preview-line {
		height: 8px;
		background: var(--gray-200, #e2e8f0);
		border-radius: 4px;
	}

	.preview-card.dark .preview-line {
		background: #475569;
	}

	.preview-line.short {
		width: 60%;
	}

	.preview-label {
		margin-top: 16px;
		font-size: 14px;
		font-weight: 500;
		color: var(--gray-600, #475569);
	}

	/* Theme Options */
	.theme-options {
		display: flex;
		flex-direction: column;
	}

	.theme-option {
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

	.theme-option:not(:last-child) {
		border-bottom: 1px solid var(--gray-100, #f1f5f9);
	}

	.theme-option:hover {
		background: transparent;
	}

	.theme-option.selected {
		background: rgba(0, 102, 255, 0.04);
	}

	.option-icon {
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--gray-100, #f1f5f9);
		border-radius: var(--radius-input, 12px);
		color: var(--gray-500, #64748b);
		transition: all 0.2s ease;
	}

	.option-icon.selected {
		background: rgba(0, 102, 255, 0.1);
		color: var(--blu-primary, #0066ff);
	}

	.option-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.option-label {
		font-size: 15px;
		font-weight: 500;
		color: var(--gray-900, #0f172a);
	}

	.option-desc {
		font-size: 13px;
		color: var(--gray-500, #64748b);
	}

	.option-check {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--blu-primary, #0066ff);
		border-radius: 50%;
		color: white;
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
		.preview-card,
		.theme-option,
		.option-icon {
			transition: none;
		}
	}
</style>

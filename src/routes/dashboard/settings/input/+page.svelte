<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { goto } from '$app/navigation';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Mic from 'lucide-svelte/icons/mic';
	import Keyboard from 'lucide-svelte/icons/keyboard';
	import Send from 'lucide-svelte/icons/send';
	import FileText from 'lucide-svelte/icons/file-text';
	import Check from 'lucide-svelte/icons/check';
	import Info from 'lucide-svelte/icons/info';
	import { inputPreferences, type InputMode } from '$lib/stores/inputPreferences';
	import { onMount } from 'svelte';
	import { FormSection } from '$lib/components/forms';
	import { t } from '$lib/i18n';

	let currentMode = $state<InputMode>('voice');
	let autoSubmitVoice = $state(true);
	let showTranscript = $state(true);

	onMount(() => {
		inputPreferences.initialize();
		const unsubscribe = inputPreferences.subscribe((value) => {
			currentMode = value.mode;
			autoSubmitVoice = value.autoSubmitVoice;
			showTranscript = value.showTranscript;
		});
		return unsubscribe;
	});

	const modeOptions: { value: InputMode; icon: typeof Mic; label: string; desc: string }[] = [
		{ value: 'voice', icon: Mic, label: 'Voice', desc: 'Speak to create documents' },
		{ value: 'text', icon: Keyboard, label: 'Text', desc: 'Type your requests' }
	];

	function selectMode(newMode: InputMode) {
		inputPreferences.setMode(newMode);
	}

	function toggleAutoSubmit() {
		inputPreferences.setAutoSubmitVoice(!autoSubmitVoice);
	}

	function toggleShowTranscript() {
		inputPreferences.setShowTranscript(!showTranscript);
	}
</script>

<main class="input-page">
	<!-- Header -->
	<header class="page-header" in:fly={{ y: -20, duration: 400, easing: cubicOut }}>
		<button
			class="back-btn"
			onclick={() => goto('/dashboard/settings')}
			aria-label={$t('common.backToSettings')}
		>
			<ChevronLeft size={22} strokeWidth={2} />
		</button>
		<h1 class="page-title">{$t('settings.input')}</h1>
		<div class="header-spacer"></div>
	</header>

	<div class="page-content" in:fly={{ y: 20, duration: 500, delay: 100, easing: cubicOut }}>
		<!-- Mode Preview -->
		<section class="mode-preview">
			<div class="preview-container" class:text-mode={currentMode === 'text'}>
				{#if currentMode === 'voice'}
					<div class="preview-icon voice">
						<Mic size={32} strokeWidth={1.5} />
						<div class="pulse-ring"></div>
						<div class="pulse-ring delay"></div>
					</div>
				{:else}
					<div class="preview-icon text">
						<Keyboard size={32} strokeWidth={1.5} />
					</div>
				{/if}
			</div>
			<p class="preview-label">
				{currentMode === 'voice' ? 'Tap and speak to create' : 'Type your requests'}
			</p>
		</section>

		<!-- Input Mode Selection -->
		<FormSection
			title={$t('settings.inputModeTitle')}
			description={$t('settings.inputModeDesc')}
			variant="card"
		>
			<div class="mode-options">
				{#each modeOptions as option (option.value)}
					{@const Icon = option.icon}
					<button
						class="mode-option"
						class:selected={currentMode === option.value}
						onclick={() => selectMode(option.value)}
						aria-pressed={currentMode === option.value}
					>
						<div class="option-icon" class:selected={currentMode === option.value}>
							<Icon size={20} strokeWidth={1.5} />
						</div>
						<div class="option-content">
							<span class="option-label">{option.label}</span>
							<span class="option-desc">{option.desc}</span>
						</div>
						{#if currentMode === option.value}
							<div class="option-check" in:fly={{ scale: 0.5, duration: 150 }}>
								<Check size={14} strokeWidth={3} />
							</div>
						{/if}
					</button>
				{/each}
			</div>
		</FormSection>

		<!-- Voice Options -->
		<FormSection title={$t('settings.voiceOptionsTitle')} variant="card">
			<button class="toggle-option" onclick={toggleAutoSubmit}>
				<div class="option-icon" class:selected={autoSubmitVoice}>
					<Send size={18} strokeWidth={1.5} />
				</div>
				<div class="option-content">
					<span class="option-label">Auto-submit</span>
					<span class="option-desc">Process automatically when you stop speaking</span>
				</div>
				<div class="toggle-switch" class:active={autoSubmitVoice}>
					<div class="toggle-thumb"></div>
				</div>
			</button>

			<button class="toggle-option" onclick={toggleShowTranscript}>
				<div class="option-icon" class:selected={showTranscript}>
					<FileText size={18} strokeWidth={1.5} />
				</div>
				<div class="option-content">
					<span class="option-label">Live transcript</span>
					<span class="option-desc">Display text while recording</span>
				</div>
				<div class="toggle-switch" class:active={showTranscript}>
					<div class="toggle-thumb"></div>
				</div>
			</button>
		</FormSection>

		<!-- Info Note -->
		<div class="info-note">
			<Info size={18} strokeWidth={1.5} />
			<p>You can switch modes anytime from the main recording screen.</p>
		</div>
	</div>
</main>

<style>
	.input-page {
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

	/* Mode Preview */
	.mode-preview {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 32px 0;
	}

	.preview-container {
		width: 120px;
		height: 120px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--white, #dbe8f4);
		border: 1px solid var(--gray-200, #e2e8f0);
		border-radius: 50%;
		box-shadow: 0 8px 32px rgba(0, 102, 255, 0.1);
		transition: all 0.3s ease;
	}

	.preview-container.text-mode {
		border-radius: var(--radius-card, 20px);
	}

	.preview-icon {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.preview-icon.voice {
		color: var(--blu-primary, #0066ff);
	}

	.preview-icon.text {
		color: var(--gray-600, #475569);
	}

	.pulse-ring {
		position: absolute;
		width: 100%;
		height: 100%;
		border: 2px solid var(--blu-primary, #0066ff);
		border-radius: 50%;
		opacity: 0;
		animation: pulse 2s ease-out infinite;
	}

	.pulse-ring.delay {
		animation-delay: 1s;
	}

	@keyframes pulse {
		0% {
			transform: scale(1);
			opacity: 0.5;
		}
		100% {
			transform: scale(2.5);
			opacity: 0;
		}
	}

	.preview-label {
		margin-top: 16px;
		font-size: 14px;
		font-weight: 500;
		color: var(--gray-600, #475569);
	}

	/* Mode Options */
	.mode-options {
		display: flex;
		flex-direction: column;
	}

	.mode-option,
	.toggle-option {
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

	.mode-option:not(:last-child),
	.toggle-option:not(:last-child) {
		border-bottom: 1px solid var(--gray-100, #f1f5f9);
	}

	.mode-option:hover,
	.toggle-option:hover {
		background: transparent;
	}

	.mode-option.selected {
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
		flex-shrink: 0;
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
		min-width: 0;
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
		flex-shrink: 0;
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
		.preview-container,
		.mode-option,
		.toggle-option,
		.option-icon,
		.toggle-switch,
		.toggle-thumb {
			transition: none;
		}

		.pulse-ring {
			animation: none;
			display: none;
		}
	}
</style>

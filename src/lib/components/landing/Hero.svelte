<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { backOut, cubicOut, elasticOut } from 'svelte/easing';
	import Button from '$lib/components/ui/Button.svelte';
	import Play from 'lucide-svelte/icons/play';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
	import { t } from '$lib/i18n';

	let mounted = $state(false);

	// Animation sequence states
	let showBadge = $state(false);
	let showHeadline = $state(false);
	let showSubheadline = $state(false);
	let showCta = $state(false);
	let showTrust = $state(false);
	let showPhone = $state(false);
	let showScroll = $state(false);

	onMount(() => {
		mounted = true;

		// Staggered animation sequence (complete within 1.5s)
		setTimeout(() => (showBadge = true), 100);
		setTimeout(() => (showHeadline = true), 250);
		setTimeout(() => (showSubheadline = true), 450);
		setTimeout(() => (showCta = true), 600);
		setTimeout(() => (showTrust = true), 750);
		setTimeout(() => (showPhone = true), 400);
		setTimeout(() => (showScroll = true), 1200);
	});
</script>

<section class="hero">
	<!-- Background Effects -->
	<div class="hero-bg">
		<div class="gradient-orb orb-1"></div>
		<div class="gradient-orb orb-2"></div>
		<div class="gradient-orb orb-3"></div>
		<div class="grid-overlay"></div>
	</div>

	<div class="hero-container">
		<div class="hero-grid">
			<!-- Content Column -->
			<div class="hero-content">
				<!-- Badge -->
				{#if showBadge}
					<div class="hero-badge" in:fly={{ y: 20, duration: 500, easing: cubicOut }}>
						<span class="badge-dot"></span>
						<span>{$t('landing.hero.badge')}</span>
					</div>
				{/if}

				<!-- Headline -->
				{#if showHeadline}
					<h1 class="hero-headline" in:fly={{ y: 30, duration: 600, easing: cubicOut }}>
						<span class="headline-line">{$t('landing.hero.word1')}</span>
						<span class="headline-line gradient-text">{$t('landing.hero.word2')}</span>
						<span class="headline-line">{$t('landing.hero.word3')}</span>
					</h1>
				{/if}

				<!-- Subheadline -->
				{#if showSubheadline}
					<p class="hero-subheadline" in:fly={{ y: 20, duration: 500, easing: cubicOut }}>
						{$t('landing.hero.subheadline')}
					</p>
				{/if}

				<!-- CTA Buttons -->
				{#if showCta}
					<div class="hero-cta" in:scale={{ start: 0.95, duration: 400, easing: backOut }}>
						<Button href="/login" variant="primary" size="lg" pulse={true}>
							{$t('landing.hero.ctaPrimary')}
							<ArrowRight size={20} class="cta-arrow" />
						</Button>
						<Button href="#how-it-works" variant="secondary" size="lg">
							<Play size={18} />
							{$t('landing.hero.watchDemo')}
						</Button>
					</div>
				{/if}

				<!-- Trust Bar -->
				{#if showTrust}
					<div class="trust-bar" in:fade={{ duration: 400 }}>
						<div class="trust-item">
							<CheckCircle2 size={16} class="trust-icon" />
							<span>{$t('landing.hero.trust1')}</span>
						</div>
						<span class="trust-divider"></span>
						<div class="trust-item">
							<CheckCircle2 size={16} class="trust-icon" />
							<span>{$t('landing.hero.trust2')}</span>
						</div>
						<span class="trust-divider"></span>
						<div class="trust-item">
							<CheckCircle2 size={16} class="trust-icon" />
							<span>{$t('landing.hero.trust3')}</span>
						</div>
					</div>
				{/if}
			</div>

			<!-- Phone Mockup Preview (Mobile only - desktop uses GlobalPhone) -->
			{#if showPhone}
				<div class="hero-phone-preview" in:fly={{ x: 50, duration: 700, easing: cubicOut }}>
					<div class="phone-preview-frame">
						<div class="phone-preview-notch"></div>
						<div class="phone-preview-screen">
							<div class="preview-content">
								<div class="preview-header">
									<span class="preview-back">‹</span>
									<span>{$t('landing.hero.newRecording')}</span>
								</div>
								<div class="preview-timer">00:00</div>
								<div class="preview-mic">
									<div class="mic-button">
										<svg
											width="24"
											height="24"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
										>
											<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
											<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
											<line x1="12" y1="19" x2="12" y2="23" />
										</svg>
									</div>
								</div>
								<div class="preview-waveform">
									{#each Array(20) as _, i}
										<div
											class="waveform-bar"
											style="--delay: {i * 50}ms; --height: {20 + Math.random() * 40}%"
										></div>
									{/each}
								</div>
							</div>
						</div>
						<div class="phone-preview-home"></div>
					</div>
					<div class="phone-glow"></div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Scroll Indicator -->
	{#if showScroll}
		<div class="scroll-indicator" in:fade={{ duration: 500 }}>
			<div class="scroll-line"></div>
			<span>{$t('landing.hero.scrollToExplore')}</span>
		</div>
	{/if}
</section>

<style>
	.hero {
		position: relative;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		padding-top: 100px; /* Account for navbar */
	}

	.hero-bg {
		position: absolute;
		inset: 0;
		background: var(--blu-bg-dark);
		overflow: hidden;
	}

	.gradient-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
		opacity: 0.6;
	}

	.orb-1 {
		width: 600px;
		height: 600px;
		background: radial-gradient(circle, rgba(0, 102, 255, 0.3) 0%, transparent 70%);
		top: -200px;
		right: -100px;
		animation: float-slow 20s ease-in-out infinite;
	}

	.orb-2 {
		width: 400px;
		height: 400px;
		background: radial-gradient(circle, rgba(14, 165, 233, 0.25) 0%, transparent 70%);
		bottom: 10%;
		left: -100px;
		animation: float-slow 25s ease-in-out infinite reverse;
	}

	.orb-3 {
		width: 300px;
		height: 300px;
		background: radial-gradient(circle, rgba(30, 58, 138, 0.3) 0%, transparent 70%);
		top: 40%;
		left: 30%;
		animation: float-slow 18s ease-in-out infinite;
	}

	@keyframes float-slow {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		33% {
			transform: translate(30px, -30px) scale(1.05);
		}
		66% {
			transform: translate(-20px, 20px) scale(0.95);
		}
	}

	.grid-overlay {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(219, 232, 244, 0.02) 1px, transparent 1px),
			linear-gradient(90deg, rgba(219, 232, 244, 0.02) 1px, transparent 1px);
		background-size: 60px 60px;
		mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 100%);
	}

	.hero-container {
		position: relative;
		z-index: 10;
		flex: 1;
		display: flex;
		align-items: center;
		max-width: 1280px;
		margin: 0 auto;
		padding: 40px 24px;
		width: 100%;
	}

	.hero-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 48px;
		align-items: center;
		width: 100%;
	}

	@media (min-width: 1024px) {
		.hero-grid {
			grid-template-columns: 1fr 1fr;
			gap: 80px;
		}
	}

	/* Content Column */
	.hero-content {
		text-align: center;
	}

	@media (min-width: 1024px) {
		.hero-content {
			text-align: left;
		}
	}

	/* Badge */
	.hero-badge {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		background: rgba(var(--blu-primary-rgb), 0.1);
		border: 1px solid rgba(var(--blu-primary-rgb), 0.2);
		border-radius: 9999px;
		margin-bottom: 24px;
	}

	.badge-dot {
		width: 8px;
		height: 8px;
		background: var(--blu-accent);
		border-radius: 50%;
		animation: pulse-dot 2s ease-in-out infinite;
	}

	@keyframes pulse-dot {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.6;
			transform: scale(0.9);
		}
	}

	.hero-badge span:last-child {
		font-size: 13px;
		font-weight: 600;
		color: var(--blu-accent);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Headline */
	.hero-headline {
		font-family: var(--font-display);
		font-size: var(--text-5xl);
		font-weight: 800;
		line-height: 1.05;
		letter-spacing: -0.03em;
		color: white;
		margin: 0 0 24px;
	}

	.headline-line {
		display: block;
	}

	.gradient-text {
		background: var(--blu-gradient-primary);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* Subheadline */
	.hero-subheadline {
		font-size: var(--text-xl);
		line-height: 1.6;
		color: rgba(219, 232, 244, 0.7);
		margin: 0 0 32px;
		max-width: 500px;
	}

	@media (min-width: 1024px) {
		.hero-subheadline {
			margin-left: 0;
			margin-right: auto;
		}
	}

	@media (max-width: 1023px) {
		.hero-subheadline {
			margin-left: auto;
			margin-right: auto;
		}
	}

	.subheadline-emphasis {
		color: var(--blu-accent);
	}

	/* CTA Buttons */
	.hero-cta {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
		margin-bottom: 32px;
		justify-content: center;
	}

	@media (min-width: 1024px) {
		.hero-cta {
			justify-content: flex-start;
		}
	}

	:global(.cta-arrow) {
		margin-left: 4px;
		transition: transform 0.2s ease;
	}

	:global(.hero-cta a:hover .cta-arrow) {
		transform: translateX(4px);
	}

	/* Trust Bar */
	.trust-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 12px;
	}

	@media (min-width: 1024px) {
		.trust-bar {
			justify-content: flex-start;
		}
	}

	.trust-item {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 14px;
		color: rgba(219, 232, 244, 0.6);
	}

	:global(.trust-icon) {
		color: var(--blu-accent);
	}

	.trust-divider {
		width: 4px;
		height: 4px;
		background: rgba(219, 232, 244, 0.2);
		border-radius: 50%;
	}

	@media (max-width: 640px) {
		.trust-divider {
			display: none;
		}

		.trust-bar {
			flex-direction: column;
			gap: 8px;
		}
	}

	/* Phone Preview (shown on mobile/tablet, hidden on desktop where GlobalPhone takes over) */
	.hero-phone-preview {
		display: block;
		position: relative;
		justify-self: center;
	}

	@media (min-width: 1024px) {
		.hero-phone-preview {
			display: none; /* GlobalPhone handles desktop */
		}
	}

	.phone-preview-frame {
		position: relative;
		width: 260px;
		height: 520px;
		background: linear-gradient(145deg, #1f1f1f 0%, #2d2d2d 50%, #1a1a1a 100%);
		border-radius: 44px;
		padding: 10px;
		box-shadow:
			0 0 0 1px rgba(219, 232, 244, 0.1),
			inset 0 1px 1px rgba(219, 232, 244, 0.1),
			0 50px 100px rgba(0, 0, 0, 0.5),
			0 20px 40px rgba(0, 102, 255, 0.2);
	}

	.phone-preview-notch {
		position: absolute;
		top: 10px;
		left: 50%;
		transform: translateX(-50%);
		width: 90px;
		height: 26px;
		background: #1a1a1a;
		border-radius: 0 0 16px 16px;
		z-index: 10;
	}

	.phone-preview-screen {
		width: 100%;
		height: 100%;
		background: #0a1628;
		border-radius: 36px;
		overflow: hidden;
	}

	.phone-preview-home {
		position: absolute;
		bottom: 8px;
		left: 50%;
		transform: translateX(-50%);
		width: 100px;
		height: 4px;
		background: rgba(219, 232, 244, 0.25);
		border-radius: 2px;
	}

	.phone-glow {
		position: absolute;
		inset: -40px;
		border-radius: 60px;
		background: radial-gradient(ellipse at center, rgba(14, 165, 233, 0.3) 0%, transparent 70%);
		filter: blur(40px);
		z-index: -1;
	}

	/* Preview Content */
	.preview-content {
		padding: 50px 20px 20px;
		text-align: center;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.preview-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		font-size: 16px;
		font-weight: 600;
		color: white;
		margin-bottom: 40px;
	}

	.preview-back {
		position: absolute;
		left: 20px;
		color: var(--blu-accent);
		font-size: 24px;
	}

	.preview-timer {
		font-family: var(--font-display);
		font-size: 48px;
		font-weight: 700;
		color: white;
		margin-bottom: 40px;
	}

	.preview-mic {
		margin-bottom: 40px;
	}

	.mic-button {
		width: 72px;
		height: 72px;
		background: var(--blu-primary);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto;
		color: white;
		box-shadow: 0 0 30px rgba(var(--blu-primary-rgb), 0.5);
		animation: mic-pulse 2s ease-in-out infinite;
	}

	@keyframes mic-pulse {
		0%,
		100% {
			box-shadow: 0 0 20px rgba(var(--blu-primary-rgb), 0.4);
		}
		50% {
			box-shadow: 0 0 40px rgba(var(--blu-primary-rgb), 0.6);
		}
	}

	.preview-waveform {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 3px;
		height: 60px;
		margin-top: auto;
	}

	.waveform-bar {
		width: 3px;
		height: var(--height, 30%);
		background: var(--blu-accent);
		border-radius: 2px;
		animation: wave 1s ease-in-out infinite;
		animation-delay: var(--delay, 0ms);
	}

	@keyframes wave {
		0%,
		100% {
			transform: scaleY(0.5);
			opacity: 0.5;
		}
		50% {
			transform: scaleY(1);
			opacity: 1;
		}
	}

	/* Scroll Indicator */
	.scroll-indicator {
		position: absolute;
		bottom: 40px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		z-index: 5;
	}

	.scroll-line {
		width: 1px;
		height: 40px;
		background: linear-gradient(to bottom, var(--blu-primary), transparent);
		animation: scroll-bounce 2s ease-in-out infinite;
	}

	@keyframes scroll-bounce {
		0%,
		100% {
			transform: scaleY(1);
			opacity: 1;
		}
		50% {
			transform: scaleY(0.5);
			opacity: 0.5;
		}
	}

	.scroll-indicator span {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: rgba(219, 232, 244, 0.4);
	}

	@media (max-width: 768px) {
		.hero {
			padding-top: 80px;
		}

		.hero-headline {
			font-size: var(--text-4xl);
		}

		.scroll-indicator {
			display: none;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.gradient-orb,
		.badge-dot,
		.mic-button,
		.waveform-bar,
		.scroll-line {
			animation: none;
		}
	}
</style>

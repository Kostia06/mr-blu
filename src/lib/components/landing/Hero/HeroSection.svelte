<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import Check from 'lucide-svelte/icons/check';
	import LayoutDashboard from 'lucide-svelte/icons/layout-dashboard';
	import HeroHeadline from './HeroHeadline.svelte';
	import HeroPhone from './HeroPhone.svelte';
	import GridBackground from '../shared/GridBackground.svelte';
	import { t } from '$lib/i18n';
	import type { Session } from '@supabase/supabase-js';
	let { session = null }: { session?: Session | null } = $props();

	const trustPoints = $derived([
		$t('landing.hero.trust1'),
		$t('landing.hero.trust2'),
		$t('landing.hero.trust3')
	]);

	let visible = $state(false);

	// Magnetic button effect
	function handleMouseMove(e: MouseEvent) {
		const button = e.currentTarget as HTMLElement;
		const rect = button.getBoundingClientRect();
		const x = e.clientX - rect.left - rect.width / 2;
		const y = e.clientY - rect.top - rect.height / 2;

		const magnetStrength = 0.3;
		button.style.transform = `translate(${x * magnetStrength}px, ${y * magnetStrength}px) scale(1.02)`;

		const inner = button.querySelector('.btn-inner') as HTMLElement;
		if (inner) {
			inner.style.transform = `translate(${-x * 0.1}px, ${-y * 0.1}px)`;
		}
	}

	function handleMouseLeave(e: MouseEvent) {
		const button = e.currentTarget as HTMLElement;
		button.style.transform = '';
		const inner = button.querySelector('.btn-inner') as HTMLElement;
		if (inner) {
			inner.style.transform = '';
		}
	}

	onMount(() => {
		requestAnimationFrame(() => {
			visible = true;
		});
	});
</script>

<section class="hero" id="main-content" class:visible>
	<!-- Background grid overlay -->
	<GridBackground opacity={0.3} size={60} fade={true} />

	<div class="hero-container">
		<div class="hero-content">
			<!-- Badge -->
			<div class="badge">
				<span class="badge-glow"></span>
				<Sparkles size={14} strokeWidth={2.5} />
				<span>{$t('landing.hero.badge')}</span>
			</div>

			<!-- Headline -->
			<HeroHeadline />

			<!-- CTAs -->
			<div class="cta-container">
				{#if session}
					<a
						href="/dashboard"
						class="cta-btn cta-primary magnetic"
						onmousemove={handleMouseMove}
						onmouseleave={handleMouseLeave}
					>
						<span class="btn-inner">
							<LayoutDashboard size={18} strokeWidth={2.5} />
							<span>{$t('landing.hero.ctaDashboard')}</span>
						</span>
						<span class="btn-shine"></span>
					</a>
				{:else}
					<a
						href="/login"
						class="cta-btn cta-primary magnetic"
						onmousemove={handleMouseMove}
						onmouseleave={handleMouseLeave}
					>
						<span class="btn-inner">
							<span>{$t('landing.hero.ctaPrimary')}</span>
							<ArrowRight size={18} strokeWidth={2.5} />
						</span>
						<span class="btn-shine"></span>
					</a>
				{/if}
				<a
					href="#how-it-works"
					class="cta-btn cta-secondary magnetic"
					onmousemove={handleMouseMove}
					onmouseleave={handleMouseLeave}
				>
					<span class="btn-inner">
						<span>{$t('landing.hero.ctaSecondary')}</span>
					</span>
				</a>
			</div>

			<!-- Trust indicators -->
			<div class="trust-indicators">
				{#each trustPoints as point, i (point)}
					<div class="trust-item" style="--index: {i}">
						<span class="trust-icon">
							<Check size={14} strokeWidth={3} />
						</span>
						<span>{point}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Phone mockup -->
		<div class="hero-visual">
			<HeroPhone />
		</div>
	</div>
</section>

<style>
	.hero {
		position: relative;
		min-height: 100vh;
		display: flex;
		align-items: center;
		padding: 120px 24px 80px;
		overflow-x: hidden;
		overflow-y: visible;
		background: transparent;
	}

	.hero-container {
		position: relative;
		z-index: 2;
		width: 100%;
		max-width: 1280px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr;
		gap: 60px;
		align-items: center;
	}

	@media (min-width: 1024px) {
		.hero-container {
			grid-template-columns: 1fr 1fr;
			gap: 80px;
		}
	}

	.hero-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	@media (min-width: 1024px) {
		.hero-content {
			align-items: flex-start;
			text-align: left;
		}
	}

	/* Badge */
	.badge {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		background: rgba(0, 102, 255, 0.08);
		border: 1px solid rgba(0, 102, 255, 0.15);
		border-radius: 100px;
		font-size: 13px;
		font-weight: 600;
		color: var(--blu-primary, #0066ff);
		margin-bottom: 24px;
		overflow: hidden;
		opacity: 0;
		transform: translateY(16px);
		transition:
			opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.visible .badge {
		opacity: 1;
		transform: translateY(0);
	}

	.badge-glow {
		position: absolute;
		inset: 0;
		background: linear-gradient(90deg, transparent, rgba(0, 102, 255, 0.2), transparent);
		animation: badge-shimmer 3s ease-in-out infinite;
	}

	@keyframes badge-shimmer {
		0% {
			transform: translateX(-100%);
		}
		50%,
		100% {
			transform: translateX(100%);
		}
	}

	/* CTAs */
	.cta-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		margin-top: 32px;
		width: 100%;
		max-width: 360px;
	}

	@media (min-width: 480px) {
		.cta-container {
			flex-direction: row;
			align-items: center;
			justify-content: center;
			max-width: none;
		}
	}

	@media (min-width: 1024px) {
		.cta-container {
			justify-content: flex-start;
		}
	}

	.cta-btn {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 16px 28px;
		font-size: 15px;
		font-weight: 600;
		text-decoration: none;
		border-radius: 12px;
		transition:
			transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			box-shadow 0.3s ease,
			opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1);
		overflow: hidden;
		will-change: transform;
		opacity: 0;
		transition-delay: 0.6s;
	}

	.cta-btn:nth-child(2) {
		transition-delay: 0.7s;
	}

	.visible .cta-btn {
		opacity: 1;
	}

	.cta-btn.magnetic {
		cursor: pointer;
	}

	.btn-inner {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		transition: transform 0.15s ease;
		position: relative;
		z-index: 2;
	}

	/* Shine effect */
	.btn-shine {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
		transform: translateX(-100%);
		transition: transform 0.5s ease;
	}

	.cta-btn:hover .btn-shine {
		transform: translateX(100%);
	}

	.cta-btn::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.cta-btn:hover::before {
		opacity: 1;
	}

	.cta-primary {
		background: linear-gradient(135deg, var(--blu-primary, #0066ff) 0%, #0052cc 100%);
		color: white;
		box-shadow:
			0 4px 20px rgba(0, 102, 255, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.cta-primary:hover {
		box-shadow:
			0 8px 40px rgba(0, 102, 255, 0.4),
			0 0 60px rgba(0, 102, 255, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.cta-secondary {
		background: rgba(255, 255, 255, 0.8);
		color: var(--gray-700, #334155);
		border: 1px solid var(--gray-200, #e2e8f0);
	}

	.cta-secondary:hover {
		background: rgba(255, 255, 255, 0.95);
		border-color: var(--gray-300, #cbd5e1);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
	}

	/* Trust indicators */
	.trust-indicators {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 16px;
		margin-top: 32px;
	}

	@media (min-width: 1024px) {
		.trust-indicators {
			justify-content: flex-start;
		}
	}

	.trust-item {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		color: var(--gray-600, #475569);
		opacity: 0;
		transform: translateY(12px);
		transition:
			opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
		transition-delay: calc(0.8s + var(--index) * 0.1s);
	}

	.visible .trust-item {
		opacity: 1;
		transform: translateY(0);
	}

	.trust-item:hover {
		transform: translateX(4px);
	}

	.trust-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		background: rgba(16, 185, 129, 0.1);
		border-radius: 50%;
	}

	.trust-icon :global(svg) {
		color: var(--data-green, #10b981);
	}

	/* Hero visual */
	.hero-visual {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		opacity: 0;
		transform: translateY(24px);
		transition:
			opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
		transition-delay: 0.3s;
	}

	.visible .hero-visual {
		opacity: 1;
		transform: translateY(0);
	}

	@media (max-width: 1023px) {
		.hero-visual {
			order: -1;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.badge,
		.cta-btn,
		.trust-item,
		.hero-visual {
			opacity: 1;
			transform: none;
			transition: none;
		}

		.cta-btn.magnetic:hover {
			transform: none !important;
		}

		.btn-inner {
			transform: none !important;
		}

		.badge-glow,
		.btn-shine {
			display: none;
		}
	}
</style>

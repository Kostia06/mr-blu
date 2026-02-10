<script lang="ts">
	import { onMount } from 'svelte';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import LayoutDashboard from 'lucide-svelte/icons/layout-dashboard';
	import HeroHeadline from './HeroHeadline.svelte';
	import HeroPhone from './HeroPhone.svelte';
	import { t } from '$lib/i18n';
	import type { Session } from '@supabase/supabase-js';
	let { session = null }: { session?: Session | null } = $props();

	let visible = $state(false);

	onMount(() => {
		requestAnimationFrame(() => {
			visible = true;
		});
	});
</script>

<section class="hero" id="main-content" class:visible>
	<div class="hero-container">
		<div class="hero-content">
			<HeroHeadline />

			<div class="cta-container">
				{#if session}
					<a href="/dashboard" class="cta-btn">
						<LayoutDashboard size={18} strokeWidth={2.5} />
						<span>{$t('landing.hero.ctaDashboard')}</span>
					</a>
				{:else}
					<a href="/login" class="cta-btn">
						<span>{$t('landing.hero.ctaPrimary')}</span>
						<ArrowRight size={18} strokeWidth={2.5} />
					</a>
				{/if}
			</div>
		</div>

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
		overflow-x: clip;
		background: transparent;
	}

	.hero-container {
		position: relative;
		z-index: 2;
		width: 100%;
		max-width: 600px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 40px;
		align-items: center;
	}

	@media (min-width: 768px) {
		.hero-container {
			max-width: 700px;
			gap: 50px;
		}
	}

	@media (min-width: 1024px) {
		.hero-container {
			max-width: 800px;
		}
	}

	.hero-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		order: 1;
	}

	/* CTA */
	.cta-container {
		display: flex;
		justify-content: center;
		margin-top: 32px;
	}

	.cta-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 16px 32px;
		font-size: 15px;
		font-weight: 600;
		text-decoration: none;
		border-radius: 100px;
		background: var(--blu-primary, #0066ff);
		color: white;
		transition:
			box-shadow 0.2s ease,
			background 0.2s ease,
			opacity 0.6s ease;
		opacity: 0;
		transition-delay: 0.4s;
	}

	.visible .cta-btn {
		opacity: 1;
	}

	.cta-btn:hover {
		background: #0052cc;
		box-shadow: 0 4px 20px rgba(0, 102, 255, 0.3);
	}

	/* Hero visual */
	.hero-visual {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		width: 100%;
		order: -1;
		opacity: 0;
		transform: translateY(24px);
		transition:
			opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
		transition-delay: 0.2s;
	}

	.visible .hero-visual {
		opacity: 1;
		transform: translateY(0);
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.cta-btn,
		.hero-visual {
			opacity: 1;
			transform: none;
			transition: none;
		}
	}
</style>

<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Check from 'lucide-svelte/icons/check';
	import LayoutDashboard from 'lucide-svelte/icons/layout-dashboard';
	import SectionWrapper from '../shared/SectionWrapper.svelte';
	import GradientOrb from '../shared/GradientOrb.svelte';
	import { t } from '$lib/i18n';
	import type { Session } from '@supabase/supabase-js';

	let { session = null }: { session?: Session | null } = $props();

	let sectionRef: HTMLDivElement;

	const trustBadges = $derived([
		$t('landing.cta.trust1'),
		$t('landing.cta.trust2'),
		$t('landing.cta.trust3')
	]);

	onMount(() => {
		if (!browser) return;

		import('gsap').then(({ gsap }) => {
			import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
				gsap.registerPlugin(ScrollTrigger);

				ScrollTrigger.create({
					trigger: sectionRef,
					start: 'top 75%',
					onEnter: () => {
						gsap.fromTo(
							sectionRef.querySelector('.cta-content'),
							{ y: 40, opacity: 0 },
							{ y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' }
						);
					},
					once: true
				});
			});
		});
	});
</script>

<SectionWrapper id="cta" background="white" padding="large">
	<div class="cta-section" bind:this={sectionRef}>
		<!-- Background orbs -->
		<GradientOrb
			color="rgba(0, 102, 255, 0.08)"
			size={400}
			top="20%"
			left="-10%"
			blur={100}
			opacity={0.5}
		/>
		<GradientOrb
			color="rgba(14, 165, 233, 0.06)"
			size={350}
			bottom="10%"
			right="-5%"
			blur={80}
			opacity={0.4}
		/>

		<div class="cta-content">
			<h2 class="cta-title">
				{session ? $t('landing.cta.titleLoggedIn') : $t('landing.cta.title')}
			</h2>
			<p class="cta-description">
				{session ? $t('landing.cta.descriptionLoggedIn') : $t('landing.cta.description')}
			</p>

			{#if session}
				<a href="/dashboard" class="cta-button">
					<LayoutDashboard size={20} strokeWidth={2.5} />
					<span>{$t('landing.hero.ctaDashboard')}</span>
				</a>
			{:else}
				<a href="/login" class="cta-button">
					<span>{$t('landing.hero.ctaPrimary')}</span>
					<ArrowRight size={20} strokeWidth={2.5} />
				</a>

				<div class="trust-badges">
					{#each trustBadges as badge (badge)}
						<div class="trust-badge">
							<Check size={14} strokeWidth={3} />
							<span>{badge}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</SectionWrapper>

<style>
	.cta-section {
		position: relative;
		text-align: center;
		max-width: 700px;
		margin: 0 auto;
	}

	.cta-content {
		position: relative;
		z-index: 1;
		opacity: 0;
	}

	.cta-title {
		font-family: var(--font-display);
		font-size: clamp(2rem, 6vw, 3.5rem);
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		margin: 0 0 16px 0;
		letter-spacing: -0.02em;
		line-height: 1.1;
	}

	.cta-description {
		font-size: 18px;
		color: var(--gray-600, #475569);
		margin: 0 0 32px 0;
		line-height: 1.6;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		padding: 18px 36px;
		background: var(--blu-primary, #0066ff);
		color: white;
		font-size: 17px;
		font-weight: 600;
		text-decoration: none;
		border-radius: 14px;
		transition: all 0.3s ease;
		box-shadow: 0 4px 24px rgba(0, 102, 255, 0.35);
	}

	.cta-button:hover {
		background: var(--blu-primary-hover, #0052cc);
		transform: translateY(-3px);
		box-shadow: 0 8px 32px rgba(0, 102, 255, 0.45);
	}

	.trust-badges {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 20px;
		margin-top: 32px;
	}

	.trust-badge {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		color: var(--gray-600, #475569);
	}

	.trust-badge :global(svg) {
		color: var(--data-green, #10b981);
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.cta-content {
			opacity: 1;
		}

		.cta-button:hover {
			transform: none;
		}
	}
</style>

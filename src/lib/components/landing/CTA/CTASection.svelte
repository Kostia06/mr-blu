<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import LayoutDashboard from 'lucide-svelte/icons/layout-dashboard';
	import SectionWrapper from '../shared/SectionWrapper.svelte';
	import { t } from '$lib/i18n';
	import type { Session } from '@supabase/supabase-js';

	let { session = null }: { session?: Session | null } = $props();

	let sectionRef: HTMLDivElement;

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
			{/if}
		</div>
	</div>
</SectionWrapper>

<style>
	.cta-section {
		text-align: center;
		max-width: 700px;
		margin: 0 auto;
	}

	.cta-content {
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
		border-radius: 100px;
		transition:
			background 0.2s ease,
			box-shadow 0.2s ease;
	}

	.cta-button:hover {
		background: var(--blu-primary-hover, #0052cc);
		box-shadow: 0 4px 20px rgba(0, 102, 255, 0.3);
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.cta-content {
			opacity: 1;
		}
	}
</style>

<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Mic from 'lucide-svelte/icons/mic';
	import Zap from 'lucide-svelte/icons/zap';
	import FileStack from 'lucide-svelte/icons/file-stack';
	import Shield from 'lucide-svelte/icons/shield';
	import FeatureCard from './FeatureCard.svelte';
	import SectionWrapper from '../shared/SectionWrapper.svelte';
	import { t } from '$lib/i18n';

	let sectionRef: HTMLDivElement;

	const features = $derived([
		{
			title: $t('landing.features.feature1Title'),
			description: $t('landing.features.feature1Desc'),
			icon: Mic,
			accent: 'blue' as const
		},
		{
			title: $t('landing.features.feature2Title'),
			description: $t('landing.features.feature2Desc'),
			icon: Zap,
			accent: 'cyan' as const
		},
		{
			title: $t('landing.features.feature3Title'),
			description: $t('landing.features.feature3Desc'),
			icon: FileStack,
			accent: 'green' as const
		},
		{
			title: $t('landing.features.feature4Title'),
			description: $t('landing.features.feature4Desc'),
			icon: Shield,
			accent: 'amber' as const
		}
	]);

	onMount(() => {
		if (!browser) return;

		import('gsap').then(({ gsap }) => {
			import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
				gsap.registerPlugin(ScrollTrigger);

				ScrollTrigger.create({
					trigger: sectionRef,
					start: 'top 70%',
					onEnter: () => {
						const cards = sectionRef.querySelectorAll('.bento-item');
						gsap.fromTo(
							cards,
							{ y: 40, opacity: 0 },
							{
								y: 0,
								opacity: 1,
								duration: 0.6,
								ease: 'power2.out',
								stagger: 0.1
							}
						);
					},
					once: true
				});
			});
		});
	});
</script>

<SectionWrapper id="features" background="white">
	<div class="features-section" bind:this={sectionRef}>
		<div class="section-header">
			<h2 class="section-title">{$t('landing.features.title')}</h2>
			<p class="section-description">
				{$t('landing.features.description')}
			</p>
		</div>

		<div class="features-grid">
			{#each features as feature, i (feature.title)}
				<div class="feature-item" style="--delay: {i * 100}ms">
					<FeatureCard {...feature} />
				</div>
			{/each}
		</div>
	</div>
</SectionWrapper>

<style>
	.features-section {
		width: 100%;
	}

	.section-header {
		text-align: center;
		margin-bottom: 60px;
	}

	.section-title {
		font-family: var(--font-display);
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		margin: 0 0 16px 0;
		letter-spacing: -0.02em;
	}

	.section-description {
		font-size: 18px;
		color: var(--gray-600, #475569);
		max-width: 520px;
		margin: 0 auto;
		line-height: 1.6;
	}

	/* Features Grid - Clean 2x2 */
	.features-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 24px;
		max-width: 900px;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		.features-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 28px;
		}
	}

	.feature-item {
		opacity: 0;
		animation: feature-fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
		animation-delay: var(--delay, 0ms);
	}

	@keyframes feature-fade-in {
		from {
			opacity: 0;
			transform: translateY(24px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.feature-item {
			opacity: 1;
			animation: none;
		}
	}
</style>

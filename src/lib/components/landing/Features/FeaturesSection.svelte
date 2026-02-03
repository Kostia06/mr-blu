<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Mic from 'lucide-svelte/icons/mic';
	import Zap from 'lucide-svelte/icons/zap';
	import FileStack from 'lucide-svelte/icons/file-stack';
	import Shield from 'lucide-svelte/icons/shield';
	import Clock from 'lucide-svelte/icons/clock';
	import FeatureCard from './FeatureCard.svelte';
	import StatCard from './StatCard.svelte';
	import SectionWrapper from '../shared/SectionWrapper.svelte';
	import { t } from '$lib/i18n';

	let sectionRef: HTMLDivElement;

	const features = $derived([
		{
			title: $t('landing.features.feature1Title'),
			description: $t('landing.features.feature1Desc'),
			icon: Mic,
			size: 'large' as const,
			accent: 'blue' as const
		},
		{
			title: $t('landing.features.feature2Title'),
			description: $t('landing.features.feature2Desc'),
			icon: Zap,
			size: 'normal' as const,
			accent: 'cyan' as const
		},
		{
			title: $t('landing.features.feature3Title'),
			description: $t('landing.features.feature3Desc'),
			icon: FileStack,
			size: 'normal' as const,
			accent: 'green' as const
		},
		{
			title: $t('landing.features.feature4Title'),
			description: $t('landing.features.feature4Desc'),
			icon: Shield,
			size: 'normal' as const,
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
			<span class="section-label">{$t('landing.features.label')}</span>
			<h2 class="section-title">{$t('landing.features.title')}</h2>
			<p class="section-description">
				{$t('landing.features.description')}
			</p>
		</div>

		<div class="bento-grid">
			<!-- Voice-First (large) -->
			<div class="bento-item bento-large">
				<FeatureCard {...features[0]} />
			</div>

			<!-- Instant Processing -->
			<div class="bento-item">
				<FeatureCard {...features[1]} />
			</div>

			<!-- Multi-Doc -->
			<div class="bento-item">
				<FeatureCard {...features[2]} />
			</div>

			<!-- Security -->
			<div class="bento-item">
				<FeatureCard {...features[3]} />
			</div>

			<!-- Stat Card -->
			<div class="bento-item">
				<StatCard
					value="5"
					suffix={$t('landing.features.statSuffix')}
					label={$t('landing.features.statLabel')}
				/>
			</div>
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

	.section-label {
		display: inline-block;
		font-size: 13px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--blu-primary, #0066ff);
		margin-bottom: 12px;
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

	/* Bento Grid */
	.bento-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 20px;
	}

	@media (min-width: 640px) {
		.bento-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.bento-grid {
			grid-template-columns: repeat(3, 1fr);
			grid-template-rows: auto auto;
		}

		.bento-large {
			grid-column: span 1;
			grid-row: span 2;
		}
	}

	.bento-item {
		opacity: 0;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.bento-item {
			opacity: 1;
		}
	}
</style>

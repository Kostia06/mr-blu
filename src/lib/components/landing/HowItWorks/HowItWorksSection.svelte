<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Mic from 'lucide-svelte/icons/mic';
	import FileText from 'lucide-svelte/icons/file-text';
	import Send from 'lucide-svelte/icons/send';
	import StepCard from './StepCard.svelte';
	import StepConnector from './StepConnector.svelte';
	import SectionWrapper from '../shared/SectionWrapper.svelte';
	import { t } from '$lib/i18n';

	let sectionRef: HTMLDivElement;
	let animated = $state(false);

	const steps = $derived([
		{
			step: 1,
			title: $t('landing.howItWorks.step1Title'),
			description: $t('landing.howItWorks.step1Desc'),
			icon: Mic
		},
		{
			step: 2,
			title: $t('landing.howItWorks.step2Title'),
			description: $t('landing.howItWorks.step2Desc'),
			icon: FileText
		},
		{
			step: 3,
			title: $t('landing.howItWorks.step3Title'),
			description: $t('landing.howItWorks.step3Desc'),
			icon: Send
		}
	]);

	onMount(() => {
		if (!browser) return;

		import('gsap').then(({ gsap }) => {
			import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
				gsap.registerPlugin(ScrollTrigger);

				// Create scroll trigger
				ScrollTrigger.create({
					trigger: sectionRef,
					start: 'top 70%',
					onEnter: () => {
						animated = true;

						// Animate cards
						const cards = sectionRef.querySelectorAll('.step-card');
						gsap.fromTo(
							cards,
							{ y: 40, opacity: 0 },
							{
								y: 0,
								opacity: 1,
								duration: 0.6,
								ease: 'power2.out',
								stagger: 0.2
							}
						);
					},
					once: true
				});
			});
		});
	});
</script>

<SectionWrapper id="how-it-works" background="gray">
	<div class="how-it-works" bind:this={sectionRef}>
		<div class="section-header">
			<span class="section-label">{$t('landing.howItWorks.label')}</span>
			<h2 class="section-title">{$t('landing.howItWorks.title')}</h2>
			<p class="section-description">
				{$t('landing.howItWorks.description')}
			</p>
		</div>

		<div class="steps-container">
			{#each steps as step, i (step.step)}
				<StepCard {...step} />
				{#if i < steps.length - 1}
					<StepConnector {animated} delay={0.4 + i * 0.3} />
				{/if}
			{/each}
		</div>
	</div>
</SectionWrapper>

<style>
	.how-it-works {
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
		max-width: 480px;
		margin: 0 auto;
		line-height: 1.6;
	}

	.steps-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		align-items: center;
		gap: 24px;
	}

	@media (min-width: 900px) {
		.steps-container {
			flex-direction: row;
			justify-content: center;
			gap: 0;
		}
	}
</style>

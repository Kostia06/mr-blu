<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Star from 'lucide-svelte/icons/star';
	import Quote from 'lucide-svelte/icons/quote';
	import StatsBar from './StatsBar.svelte';
	import SectionWrapper from '../shared/SectionWrapper.svelte';
	import { t } from '$lib/i18n';

	let sectionRef: HTMLDivElement;

	const testimonial = $derived({
		quote: $t('landing.testimonials.quote'),
		author: $t('landing.testimonials.author'),
		role: $t('landing.testimonials.role'),
		avatar: '👷',
		rating: 5
	});

	onMount(() => {
		if (!browser) return;

		import('gsap').then(({ gsap }) => {
			import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
				gsap.registerPlugin(ScrollTrigger);

				ScrollTrigger.create({
					trigger: sectionRef,
					start: 'top 70%',
					onEnter: () => {
						gsap.fromTo(
							sectionRef.querySelector('.stats-container'),
							{ y: 30, opacity: 0 },
							{ y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
						);

						gsap.fromTo(
							sectionRef.querySelector('.testimonial-card'),
							{ y: 40, opacity: 0 },
							{ y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.2 }
						);
					},
					once: true
				});
			});
		});
	});
</script>

<SectionWrapper id="testimonials" background="gray">
	<div class="testimonials-section" bind:this={sectionRef}>
		<div class="section-header">
			<h2 class="section-title">{$t('landing.testimonials.title')}</h2>
		</div>

		<div class="stats-container">
			<StatsBar />
		</div>

		<div class="testimonial-card">
			<div class="quote-icon">
				<Quote size={32} strokeWidth={1.5} />
			</div>

			<blockquote class="quote-text">
				{testimonial.quote}
			</blockquote>

			<div class="testimonial-author">
				<div class="author-avatar">
					{testimonial.avatar}
				</div>
				<div class="author-info">
					<span class="author-name">{testimonial.author}</span>
					<span class="author-role">{testimonial.role}</span>
				</div>
				<div class="author-rating">
					{#each Array(testimonial.rating) as _, i (i)}
						<Star size={16} fill="var(--data-amber, #F59E0B)" stroke="var(--data-amber, #F59E0B)" />
					{/each}
				</div>
			</div>
		</div>
	</div>
</SectionWrapper>

<style>
	.testimonials-section {
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
	}

	.section-header {
		text-align: center;
		margin-bottom: 48px;
	}

	.section-title {
		font-family: var(--font-display);
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		margin: 0;
		letter-spacing: -0.02em;
	}

	.stats-container {
		margin-bottom: 40px;
		opacity: 0;
	}

	.testimonial-card {
		background: var(--white, #dbe8f4);
		border: 1px solid var(--gray-200, #e2e8f0);
		border-radius: 24px;
		padding: 40px;
		text-align: center;
		position: relative;
		opacity: 0;
	}

	@media (min-width: 640px) {
		.testimonial-card {
			padding: 48px 60px;
		}
	}

	.quote-icon {
		color: var(--blu-primary, #0066ff);
		opacity: 0.2;
		margin-bottom: 24px;
	}

	.quote-text {
		font-family: var(--font-body);
		font-size: clamp(1.125rem, 2.5vw, 1.375rem);
		font-weight: 400;
		line-height: 1.7;
		color: var(--gray-700, #334155);
		margin: 0 0 32px 0;
		font-style: italic;
	}

	.testimonial-author {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}

	@media (min-width: 480px) {
		.testimonial-author {
			flex-direction: row;
			justify-content: center;
			gap: 16px;
		}
	}

	.author-avatar {
		width: 48px;
		height: 48px;
		background: linear-gradient(135deg, var(--gray-100) 0%, var(--gray-200) 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24px;
	}

	.author-info {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	@media (min-width: 480px) {
		.author-info {
			align-items: flex-start;
		}
	}

	.author-name {
		font-weight: 600;
		color: var(--gray-900, #0f172a);
		font-size: 15px;
	}

	.author-role {
		font-size: 13px;
		color: var(--gray-500, #64748b);
	}

	.author-rating {
		display: flex;
		gap: 2px;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.stats-container,
		.testimonial-card {
			opacity: 1;
		}
	}
</style>

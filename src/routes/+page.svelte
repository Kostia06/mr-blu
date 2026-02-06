<script lang="ts">
	import Navbar from '$lib/components/landing/Navbar.svelte';
	import BackgroundBlobs from '$lib/components/landing/shared/BackgroundBlobs.svelte';
	import NoiseOverlay from '$lib/components/landing/shared/NoiseOverlay.svelte';
	import { HeroSection } from '$lib/components/landing/Hero';
	import LazySection from '$lib/components/landing/LazySection.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import { t } from '$lib/i18n';

	let { data }: { data: Record<string, any> } = $props();
</script>

<svelte:head>
	<title>{$t('landing.meta.title')}</title>
	<meta name="description" content={$t('landing.meta.description')} />
</svelte:head>
<NoiseOverlay opacity={0.02} />

<div class="landing-page">
	<!-- Global animated background blobs (same as dashboard) -->
	<BackgroundBlobs intensity="subtle" />

	<Navbar session={data?.session ?? null} />

	<main>
		<HeroSection session={data?.session ?? null} />
		<LazySection>
			{#await import('$lib/components/landing/HowItWorks') then { HowItWorksSection }}
				<HowItWorksSection />
			{/await}
		</LazySection>
		<LazySection>
			{#await import('$lib/components/landing/Features') then { FeaturesSection }}
				<FeaturesSection />
			{/await}
		</LazySection>
		<LazySection>
			{#await import('$lib/components/landing/Testimonials') then { TestimonialsSection }}
				<TestimonialsSection />
			{/await}
		</LazySection>
		<LazySection>
			{#await import('$lib/components/landing/CTA') then { CTASection }}
				<CTASection session={data?.session ?? null} />
			{/await}
		</LazySection>
	</main>

	<Footer />
</div>

<style>
	@keyframes content-reveal {
		0% {
			opacity: 0;
			transform: translateY(10px);
		}
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.landing-page {
		position: relative;
		min-height: 100vh;
		background: var(--white, #dbe8f4);
		overflow-x: clip;
		-webkit-overflow-scrolling: touch;
	}

	main {
		position: relative;
		z-index: 1;
		animation: content-reveal 400ms ease-out 600ms forwards;
		opacity: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		main {
			animation: none;
			opacity: 1;
		}
	}
</style>

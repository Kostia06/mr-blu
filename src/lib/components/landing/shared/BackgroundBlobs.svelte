<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { performanceStore, getAnimationConfig } from '$lib/utils/performance';

	interface Props {
		variant?: 'hero' | 'sections' | 'full';
		intensity?: 'subtle' | 'normal' | 'vivid';
	}

	let { variant = 'full', intensity = 'normal' }: Props = $props();

	// svelte-ignore non_reactive_update
	let containerRef: HTMLDivElement;
	// svelte-ignore non_reactive_update
	let blob1Ref: HTMLDivElement;
	// svelte-ignore non_reactive_update
	let blob2Ref: HTMLDivElement;
	// svelte-ignore non_reactive_update
	let blob3Ref: HTMLDivElement;
	// svelte-ignore non_reactive_update
	let blob4Ref: HTMLDivElement;

	const opacityMap = {
		subtle: { primary: 0.2, secondary: 0.15, tertiary: 0.12, quaternary: 0.15 },
		normal: { primary: 0.35, secondary: 0.25, tertiary: 0.2, quaternary: 0.25 },
		vivid: { primary: 0.45, secondary: 0.35, tertiary: 0.3, quaternary: 0.35 }
	};

	const opacities = $derived(opacityMap[intensity]);

	// Get device capabilities for adaptive animations
	const capabilities = $derived(
		browser ? $performanceStore : { isLowEnd: false, isMobile: false, hasReducedMotion: false }
	);
	const config = $derived(getAnimationConfig());

	// Determine which blobs to show based on device
	const showAllBlobs = $derived(!capabilities.isLowEnd || config.blobs.count >= 4);
	const showSecondaryBlobs = $derived(config.blobs.count >= 2);

	let gsapCleanup: (() => void) | null = null;

	onMount(() => {
		if (!browser) return;

		const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (prefersReducedMotion) return;

		// Skip GSAP entirely on low-end devices - use CSS animations instead
		if (capabilities.isLowEnd) return;

		import('gsap').then(({ gsap }) => {
			const blobs = [blob1Ref, blob2Ref, blob3Ref, blob4Ref].filter(Boolean);
			// eslint-disable-next-line no-undef
		const tweens: gsap.core.Tween[] = [];

			// Simplified floating animation
			blobs.forEach((blob, index) => {
				if (!blob) return;

				// Reduce animation complexity on mobile
				const baseDuration = capabilities.isMobile ? 20 : 15;
				const baseRange = capabilities.isMobile ? 10 : 20;

				const duration = baseDuration + index * 3;
				const xRange = baseRange + index * (capabilities.isMobile ? 5 : 10);
				const yRange = baseRange + index * (capabilities.isMobile ? 4 : 8);
				const delay = index * 2;

				const tween = gsap.to(blob, {
					x: `random(-${xRange}, ${xRange})`,
					y: `random(-${yRange}, ${yRange})`,
					scale: `random(0.97, 1.03)`,
					duration: duration,
					ease: 'sine.inOut',
					repeat: -1,
					yoyo: true,
					delay: delay
				});
				tweens.push(tween);
			});

			gsapCleanup = () => {
				tweens.forEach((t) => t.kill());
			};
		});
	});

	onDestroy(() => {
		gsapCleanup?.();
	});
</script>

{#if !capabilities.isLowEnd || config.blobs.count > 0}
	<div
		class="blobs-container variant-{variant}"
		class:css-only={capabilities.isLowEnd}
		bind:this={containerRef}
	>
		<!-- Primary blob - Top right (blue to cyan) - always shown -->
		<div class="blob blob-1" style="--opacity: {opacities.primary}" bind:this={blob1Ref}></div>

		<!-- Secondary blob - Left middle (blue to cyan light) -->
		{#if showSecondaryBlobs}
			<div class="blob blob-2" style="--opacity: {opacities.secondary}" bind:this={blob2Ref}></div>
		{/if}

		<!-- Tertiary blob - Bottom right (cyan to indigo) -->
		{#if showAllBlobs}
			<div class="blob blob-3" style="--opacity: {opacities.tertiary}" bind:this={blob3Ref}></div>
		{/if}

		<!-- Quaternary blob - Bottom left (blue gradient) -->
		{#if showAllBlobs}
			<div class="blob blob-4" style="--opacity: {opacities.quaternary}" bind:this={blob4Ref}></div>
		{/if}
	</div>
{/if}

<style>
	/* Entrance animation - ONLY uses transform and opacity (GPU-composited, no CLS) */
	@keyframes blob-entrance {
		0% {
			transform: scale(0.8);
			opacity: 0;
		}
		100% {
			transform: scale(1);
			opacity: var(--opacity, 0.25);
		}
	}

	/* Simple CSS-only floating animation for low-end devices */
	@keyframes blob-drift-simple {
		0%,
		100% {
			transform: translate(0, 0);
		}
		50% {
			transform: translate(10px, -10px);
		}
	}

	.blobs-container {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 0;
		overflow: clip;
		contain: strict;
		/* Safari: force compositing layer to properly clip blurred children */
		-webkit-mask-image: -webkit-radial-gradient(white, white);
	}

	.variant-hero {
		position: absolute;
	}

	.blob {
		position: absolute;
		border-radius: 50%;
		filter: blur(100px);
		opacity: var(--opacity, 0.25);
		/* Use entrance animation that only animates transform/opacity */
		animation: blob-entrance 600ms cubic-bezier(0.32, 0.72, 0, 1) forwards;
		/* Start invisible, animation will fade in */
		opacity: 0;
	}

	/* CSS-only mode for low-end devices - simple animation, no GSAP */
	.css-only .blob {
		animation: blob-drift-simple 20s ease-in-out infinite;
		opacity: var(--opacity, 0.25);
	}

	/* Primary blob - Top right - FIXED POSITION (no animation of layout props) */
	.blob-1 {
		width: 600px;
		height: 600px;
		top: -200px;
		right: -150px;
		background: linear-gradient(135deg, #0066ff 0%, #0ea5e9 100%);
		animation-delay: 0ms;
	}

	/* Secondary blob - Left middle */
	.blob-2 {
		width: 500px;
		height: 500px;
		top: 35%;
		left: -200px;
		background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
		animation-delay: 50ms;
	}

	/* Tertiary blob - Bottom right */
	.blob-3 {
		width: 450px;
		height: 450px;
		bottom: 10%;
		right: -100px;
		background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
		animation-delay: 100ms;
	}

	/* Quaternary blob - Bottom left */
	.blob-4 {
		width: 400px;
		height: 400px;
		bottom: -150px;
		left: 15%;
		background: linear-gradient(135deg, #0066ff 0%, #3b82f6 100%);
		animation-delay: 150ms;
	}

	/* Mobile optimizations - smaller blobs */
	@media (max-width: 768px) {
		.blob-1 {
			width: 350px;
			height: 350px;
			top: -100px;
			right: -100px;
		}

		.blob-2 {
			width: 300px;
			height: 300px;
			left: -150px;
		}

		.blob-3 {
			width: 280px;
			height: 280px;
			right: -80px;
		}

		.blob-4 {
			width: 250px;
			height: 250px;
			bottom: -100px;
		}
	}

	/* Tablet optimizations */
	@media (min-width: 769px) and (max-width: 1024px) {
		.blob-1 {
			width: 450px;
			height: 450px;
		}

		.blob-2 {
			width: 400px;
			height: 400px;
		}

		.blob-3 {
			width: 350px;
			height: 350px;
		}

		.blob-4 {
			width: 320px;
			height: 320px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.blob {
			animation: none;
			opacity: var(--opacity, 0.25);
		}
	}
</style>

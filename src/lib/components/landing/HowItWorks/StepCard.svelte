<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	interface Props {
		step: number;
		title: string;
		description: string;
		icon: any;
	}

	let { step, title, description, icon: Icon }: Props = $props();

	let cardRef: HTMLDivElement;
	let glareRef: HTMLDivElement;

	function handleMouseMove(e: MouseEvent) {
		if (!cardRef || !browser) return;

		const rect = cardRef.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const centerX = rect.width / 2;
		const centerY = rect.height / 2;

		const rotateX = (y - centerY) / 12;
		const rotateY = (centerX - x) / 12;

		cardRef.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;

		// Move glare
		if (glareRef) {
			const glareX = (x / rect.width) * 100;
			const glareY = (y / rect.height) * 100;
			glareRef.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.2) 0%, transparent 50%)`;
		}
	}

	function handleMouseLeave() {
		if (cardRef) {
			cardRef.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
		}
		if (glareRef) {
			glareRef.style.background = 'transparent';
		}
	}

	onMount(() => {
		if (!browser) return;

		// Check for touch device or reduced motion
		const isTouchDevice = 'ontouchstart' in window;
		const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (isTouchDevice || prefersReducedMotion) return;

		cardRef?.addEventListener('mousemove', handleMouseMove);
		cardRef?.addEventListener('mouseleave', handleMouseLeave);

		return () => {
			cardRef?.removeEventListener('mousemove', handleMouseMove);
			cardRef?.removeEventListener('mouseleave', handleMouseLeave);
		};
	});
</script>

<div class="step-card" bind:this={cardRef}>
	<div class="card-glare" bind:this={glareRef}></div>
	<div class="step-number">
		<span>{step}</span>
	</div>
	<div class="step-icon">
		<Icon size={28} strokeWidth={1.5} />
	</div>
	<h3 class="step-title">{title}</h3>
	<p class="step-description">{description}</p>
</div>

<style>
	.step-card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 32px 24px;
		background: var(--white, #dbe8f4);
		border: 1px solid var(--gray-200, #e2e8f0);
		border-radius: 20px;
		transition:
			transform 0.15s ease-out,
			box-shadow 0.4s ease,
			border-color 0.3s ease;
		transform-style: preserve-3d;
		will-change: transform;
		overflow: visible;
		width: 100%;
		max-width: 320px;
	}

	@media (min-width: 900px) {
		.step-card {
			padding: 40px 36px;
			min-width: 260px;
			max-width: 300px;
		}
	}

	.step-card::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 20px;
		background: var(--white, #dbe8f4);
		z-index: -1;
	}

	.card-glare {
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: 20px;
		z-index: 0;
	}

	.step-card:hover {
		border-color: var(--blu-primary, #0066ff);
		box-shadow:
			0 20px 60px -20px rgba(0, 102, 255, 0.3),
			0 0 50px -15px rgba(0, 102, 255, 0.2);
	}

	.step-number {
		position: absolute;
		top: -12px;
		left: 50%;
		transform: translateX(-50%);
		width: 24px;
		height: 24px;
		background: linear-gradient(135deg, var(--blu-primary, #0066ff) 0%, #0ea5e9 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2;
		box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease;
	}

	.step-card:hover .step-number {
		transform: translateX(-50%) scale(1.15);
		box-shadow: 0 6px 20px rgba(0, 102, 255, 0.4);
	}

	.step-number span {
		font-size: 12px;
		font-weight: 700;
		color: white;
	}

	.step-icon {
		position: relative;
		z-index: 1;
		width: 64px;
		height: 64px;
		background: linear-gradient(135deg, rgba(0, 102, 255, 0.1) 0%, rgba(14, 165, 233, 0.08) 100%);
		border-radius: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--blu-primary, #0066ff);
		margin-bottom: 20px;
		transition: transform 0.3s ease;
	}

	.step-card:hover .step-icon {
		transform: scale(1.1) translateZ(15px);
	}

	.step-title {
		position: relative;
		z-index: 1;
		font-family: var(--font-display);
		font-size: 20px;
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		margin: 0 0 8px 0;
		letter-spacing: -0.01em;
	}

	.step-description {
		position: relative;
		z-index: 1;
		font-size: 15px;
		line-height: 1.6;
		color: var(--gray-600, #475569);
		margin: 0;
		max-width: 300px;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.step-card {
			transition: none;
		}

		.step-card:hover {
			transform: none !important;
		}

		.step-card:hover .step-icon {
			transform: none;
		}
	}
</style>

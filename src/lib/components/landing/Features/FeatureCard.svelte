<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description: string;
		icon: any;
		size?: 'normal' | 'large' | 'wide';
		accent?: 'blue' | 'cyan' | 'green' | 'amber';
		children?: Snippet;
	}

	let {
		title,
		description,
		icon: Icon,
		size = 'normal',
		accent = 'blue',
		children
	}: Props = $props();

	let cardRef: HTMLDivElement;
	let glareRef: HTMLDivElement;

	const accentColors = {
		blue: 'var(--blu-primary, #0066FF)',
		cyan: 'var(--blu-accent-cyan, #0EA5E9)',
		green: 'var(--data-green, #10B981)',
		amber: 'var(--data-amber, #F59E0B)'
	};

	function handleMouseMove(e: MouseEvent) {
		if (!cardRef || !browser) return;

		const rect = cardRef.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const centerX = rect.width / 2;
		const centerY = rect.height / 2;

		const rotateX = (y - centerY) / 15;
		const rotateY = (centerX - x) / 15;

		cardRef.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

		// Move glare
		if (glareRef) {
			const glareX = (x / rect.width) * 100;
			const glareY = (y / rect.height) * 100;
			glareRef.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`;
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

<div class="feature-card size-{size}" style="--accent: {accentColors[accent]}" bind:this={cardRef}>
	<div class="card-glare" bind:this={glareRef}></div>
	<div class="card-icon">
		<Icon size={size === 'large' ? 32 : 24} strokeWidth={1.5} />
	</div>
	<div class="card-content">
		<h3 class="card-title">{title}</h3>
		<p class="card-description">{description}</p>
	</div>
	{#if children}
		<div class="card-extra">
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.feature-card {
		position: relative;
		display: flex;
		flex-direction: column;
		padding: 28px;
		background: var(--white, #dbe8f4);
		border: 1px solid var(--gray-200, #e2e8f0);
		border-radius: 20px;
		transition:
			transform 0.15s ease-out,
			box-shadow 0.4s ease,
			border-color 0.3s ease;
		height: 100%;
		transform-style: preserve-3d;
		will-change: transform;
		overflow: hidden;
	}

	/* Animated border glow */
	.feature-card::before {
		content: '';
		position: absolute;
		inset: -2px;
		border-radius: 22px;
		background: linear-gradient(
			135deg,
			var(--accent) 0%,
			transparent 40%,
			transparent 60%,
			var(--accent) 100%
		);
		opacity: 0;
		z-index: -1;
		transition: opacity 0.4s ease;
	}

	.feature-card::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 20px;
		background: var(--white, #dbe8f4);
		z-index: -1;
	}

	/* Inner glow effect */
	.card-glare {
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: 20px;
		z-index: 1;
		transition: opacity 0.3s ease;
	}

	/* Glow orb that follows mouse */
	.feature-card:hover .card-glare::before {
		content: '';
		position: absolute;
		width: 150px;
		height: 150px;
		background: radial-gradient(
			circle,
			color-mix(in srgb, var(--accent) 15%, transparent) 0%,
			transparent 70%
		);
		border-radius: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
		animation: float-glow 3s ease-in-out infinite;
	}

	@keyframes float-glow {
		0%,
		100% {
			opacity: 0.5;
			transform: translate(-50%, -50%) scale(1);
		}
		50% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1.2);
		}
	}

	.feature-card:hover {
		border-color: var(--accent);
		box-shadow:
			0 20px 60px -20px color-mix(in srgb, var(--accent) 40%, transparent),
			0 0 40px -10px color-mix(in srgb, var(--accent) 20%, transparent);
	}

	.feature-card:hover::before {
		opacity: 0.5;
		animation: border-shimmer 2s linear infinite;
	}

	@keyframes border-shimmer {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}

	.size-large {
		padding: 36px;
	}

	.size-large .card-title {
		font-size: 24px;
	}

	.size-large .card-description {
		font-size: 16px;
	}

	.card-icon {
		position: relative;
		z-index: 2;
		width: 52px;
		height: 52px;
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--accent) 12%, transparent) 0%,
			color-mix(in srgb, var(--accent) 6%, transparent) 100%
		);
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--accent);
		margin-bottom: 20px;
		flex-shrink: 0;
		transition: transform 0.3s ease;
	}

	.feature-card:hover .card-icon {
		transform: scale(1.1) translateZ(20px);
	}

	.size-large .card-icon {
		width: 64px;
		height: 64px;
		border-radius: 16px;
	}

	.card-content {
		position: relative;
		z-index: 2;
		flex: 1;
	}

	.card-title {
		font-family: var(--font-display);
		font-size: 18px;
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		margin: 0 0 8px 0;
		letter-spacing: -0.01em;
	}

	.card-description {
		font-size: 14px;
		line-height: 1.6;
		color: var(--gray-600, #475569);
		margin: 0;
	}

	.card-extra {
		position: relative;
		z-index: 2;
		margin-top: 20px;
		padding-top: 20px;
		border-top: 1px solid var(--gray-100, #f1f5f9);
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.feature-card {
			transition: none;
		}

		.feature-card:hover {
			transform: none !important;
		}

		.feature-card:hover .card-icon {
			transform: none;
		}
	}
</style>

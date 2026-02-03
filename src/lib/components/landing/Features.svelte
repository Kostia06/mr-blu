<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import Mic from 'lucide-svelte/icons/mic';
	import Zap from 'lucide-svelte/icons/zap';
	import FileText from 'lucide-svelte/icons/file-text';
	import Send from 'lucide-svelte/icons/send';
	import Shield from 'lucide-svelte/icons/shield';
	import Clock from 'lucide-svelte/icons/clock';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	const features = [
		{
			icon: Mic,
			title: 'Voice-First Design',
			description:
				'Just speak naturally. Our AI understands context, extracts details, and formats everything professionally.',
			gradient: 'from-blue-500 to-cyan-400'
		},
		{
			icon: Zap,
			title: 'Instant Processing',
			description:
				'From voice to polished document in under 30 seconds. No waiting, no manual formatting.',
			gradient: 'from-amber-500 to-orange-400'
		},
		{
			icon: FileText,
			title: 'Multiple Document Types',
			description:
				'Invoices, quotes, contracts, site reports, meeting notes—all from a single voice memo.',
			gradient: 'from-emerald-500 to-teal-400'
		},
		{
			icon: Send,
			title: 'One-Tap Delivery',
			description:
				'Send via email, SMS, or shareable link. Your client gets a professional PDF instantly.',
			gradient: 'from-purple-500 to-pink-400'
		},
		{
			icon: Shield,
			title: 'Bank-Level Security',
			description: 'Your data is encrypted end-to-end. We never share or sell your information.',
			gradient: 'from-indigo-500 to-blue-400'
		},
		{
			icon: Clock,
			title: 'Save 5+ Hours Weekly',
			description: 'Stop typing on tiny screens after long job days. Get your evenings back.',
			gradient: 'from-rose-500 to-red-400'
		}
	];

	// Scroll progress state
	let scrollProgress = $state(0);
	let sectionRef: HTMLElement;
	let rafId: number | null = null;

	// Calculate which features to show based on scroll progress
	// Show 2 features at a time (one on each side of phone)
	let currentPair = $derived(Math.floor(scrollProgress * 3)); // 0, 1, or 2 (3 pairs)
	let pairProgress = $derived((scrollProgress * 3) % 1);

	// Get features for left and right sides
	let leftFeature = $derived(features[currentPair * 2] || features[0]);
	let rightFeature = $derived(features[currentPair * 2 + 1] || features[1]);

	// Opacity for feature cards
	let featureOpacity = $derived.by(() => {
		if (pairProgress < 0.2) return pairProgress / 0.2;
		if (pairProgress > 0.8) return (1 - pairProgress) / 0.2;
		return 1;
	});

	// Header opacity - fades out as you scroll
	let headerOpacity = $derived(Math.max(0, 1 - scrollProgress * 4));

	onMount(() => {
		if (!browser) return;

		function updateScrollProgress() {
			if (!sectionRef) return;

			const rect = sectionRef.getBoundingClientRect();
			const viewportHeight = window.innerHeight;
			const sectionHeight = sectionRef.offsetHeight;
			const scrollableDistance = sectionHeight - viewportHeight;

			let progress: number;

			if (scrollableDistance <= 0) {
				progress = rect.top <= 0 ? 1 : 0;
			} else {
				progress = Math.max(0, Math.min(1, -rect.top / scrollableDistance));
			}

			scrollProgress = progress;
			rafId = requestAnimationFrame(updateScrollProgress);
		}

		rafId = requestAnimationFrame(updateScrollProgress);

		return () => {
			if (rafId) cancelAnimationFrame(rafId);
		};
	});

	onDestroy(() => {
		if (rafId) cancelAnimationFrame(rafId);
	});
</script>

<section id="features" class="features" bind:this={sectionRef}>
	<!-- Background gradient -->
	<div class="background-gradient"></div>

	<!-- Sticky container -->
	<div class="sticky-container">
		<!-- Section Header (fades out) -->
		<div
			class="section-header"
			style="opacity: {headerOpacity}; transform: translateY({-scrollProgress * 30}px)"
		>
			<span class="section-label">Features</span>
			<h2 class="section-title">
				Everything you need,<br /><span class="gradient-text">nothing you don't</span>
			</h2>
			<p class="section-description">
				Built specifically for contractors, tradies, and field workers who need to create
				professional documents without the hassle.
			</p>
		</div>

		<!-- Content layout with phone in center -->
		<div class="content-layout">
			<!-- Left feature -->
			<div class="feature-panel left" style="opacity: {featureOpacity}">
				{#key currentPair}
					<div class="feature-card" in:fly={{ x: -50, duration: 400, easing: cubicOut }}>
						<div class="feature-icon-wrapper">
							<div class="feature-icon bg-gradient-to-br {leftFeature.gradient}">
								<leftFeature.icon size={24} strokeWidth={2} />
							</div>
							<div class="icon-glow bg-gradient-to-br {leftFeature.gradient}"></div>
						</div>
						<h3 class="feature-title">{leftFeature.title}</h3>
						<p class="feature-description">{leftFeature.description}</p>
					</div>
				{/key}
			</div>

			<!-- Phone spacer (GlobalPhone is fixed positioned) -->
			<div class="phone-spacer"></div>

			<!-- Right feature -->
			<div class="feature-panel right" style="opacity: {featureOpacity}">
				{#key currentPair}
					<div class="feature-card" in:fly={{ x: 50, duration: 400, easing: cubicOut }}>
						<div class="feature-icon-wrapper">
							<div class="feature-icon bg-gradient-to-br {rightFeature.gradient}">
								<rightFeature.icon size={24} strokeWidth={2} />
							</div>
							<div class="icon-glow bg-gradient-to-br {rightFeature.gradient}"></div>
						</div>
						<h3 class="feature-title">{rightFeature.title}</h3>
						<p class="feature-description">{rightFeature.description}</p>
					</div>
				{/key}
			</div>
		</div>

		<!-- Progress dots -->
		<div class="progress-dots">
			{#each [0, 1, 2] as i}
				<div class="dot" class:active={currentPair === i}></div>
			{/each}
		</div>
	</div>

	<!-- Scroll spacer -->
	<div class="scroll-spacer"></div>
</section>

<style>
	.features {
		position: relative;
		height: 250vh;
		background: var(--blu-bg-dark);
		overflow: hidden;
	}

	.background-gradient {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			ellipse 80% 50% at 50% 30%,
			rgba(0, 102, 255, 0.08) 0%,
			transparent 70%
		);
		pointer-events: none;
	}

	.sticky-container {
		position: sticky;
		top: 0;
		height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 0 24px;
		z-index: 1;
	}

	.section-header {
		position: absolute;
		top: 80px;
		left: 50%;
		transform: translateX(-50%);
		text-align: center;
		z-index: 10;
		transition: opacity 0.3s ease;
		pointer-events: none;
	}

	.section-label {
		display: inline-block;
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: var(--blu-primary);
		margin-bottom: 16px;
		padding: 8px 16px;
		background: rgba(var(--blu-primary-rgb), 0.1);
		border-radius: 20px;
	}

	.section-title {
		font-family: var(--font-display);
		font-size: var(--text-4xl);
		font-weight: 700;
		color: white;
		margin: 0 0 16px;
		letter-spacing: -0.02em;
	}

	.gradient-text {
		background: var(--blu-gradient-primary);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.section-description {
		font-size: var(--text-lg);
		color: rgba(219, 232, 244, 0.6);
		max-width: 500px;
		margin: 0 auto;
	}

	.content-layout {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 40px;
		width: 100%;
		max-width: 1200px;
	}

	.feature-panel {
		flex: 1;
		max-width: 320px;
		transition: opacity 0.3s ease;
	}

	.feature-panel.left {
		display: flex;
		justify-content: flex-end;
	}

	.feature-panel.right {
		display: flex;
		justify-content: flex-start;
	}

	.phone-spacer {
		flex-shrink: 0;
		width: 300px;
		height: 600px;
	}

	.feature-card {
		padding: 28px;
		background: rgba(219, 232, 244, 0.03);
		border: 1px solid rgba(219, 232, 244, 0.06);
		border-radius: 20px;
		max-width: 280px;
	}

	.feature-icon-wrapper {
		position: relative;
		width: 52px;
		height: 52px;
		margin-bottom: 20px;
	}

	.feature-icon {
		position: relative;
		z-index: 1;
		width: 52px;
		height: 52px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 14px;
		color: white;
	}

	.icon-glow {
		position: absolute;
		inset: 0;
		border-radius: 14px;
		opacity: 0.4;
		filter: blur(14px);
	}

	.feature-title {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 600;
		color: white;
		margin: 0 0 10px;
	}

	.feature-description {
		font-size: var(--text-sm);
		color: rgba(219, 232, 244, 0.5);
		line-height: 1.6;
		margin: 0;
	}

	.progress-dots {
		position: absolute;
		bottom: 40px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 12px;
		z-index: 10;
	}

	.dot {
		width: 8px;
		height: 8px;
		background: rgba(219, 232, 244, 0.2);
		border-radius: 50%;
		transition: all 0.3s ease;
	}

	.dot.active {
		background: var(--blu-primary);
		box-shadow: 0 0 12px rgba(var(--blu-primary-rgb), 0.5);
	}

	.scroll-spacer {
		height: 150vh;
		pointer-events: none;
	}

	/* Tablet */
	@media (max-width: 1023px) {
		.features {
			height: 200vh;
		}

		.content-layout {
			flex-direction: column;
			gap: 20px;
		}

		.feature-panel {
			max-width: 100%;
		}

		.feature-panel.left,
		.feature-panel.right {
			justify-content: center;
		}

		.phone-spacer {
			width: 260px;
			height: 520px;
		}

		.scroll-spacer {
			height: 100vh;
		}
	}

	/* Mobile */
	@media (max-width: 768px) {
		.features {
			height: 180vh;
		}

		.sticky-container {
			padding: 0 16px;
		}

		.section-header {
			top: 40px;
			padding: 0 16px;
		}

		.section-title {
			font-size: var(--text-3xl);
		}

		.feature-card {
			padding: 20px;
		}

		.scroll-spacer {
			height: 80vh;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.feature-card {
			transition: none;
		}
	}
</style>

<script lang="ts">
	import BottomNav from '$lib/components/BottomNav.svelte';
	import FeedbackButton from '$lib/components/FeedbackButton.svelte';
	import { TutorialProvider } from '$lib/tutorial';
	import { page } from '$app/stores';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import { onMount } from 'svelte';
	import { pageTransition } from '$lib/stores/pageTransition';
	import { performanceStore } from '$lib/utils/performance';

	let { children } = $props();

	// Reactive performance quality
	let quality = $state<'high' | 'medium' | 'low' | 'minimal'>('high');
	$effect(() => {
		const unsub = performanceStore.quality.subscribe((q) => {
			quality = q;
		});
		return unsub;
	});

	// Show loading state while data is being fetched
	let isLoading = $derived($page.data === undefined);

	// Hide BottomNav on review page
	let hideBottomNav = $derived($page.url.pathname.startsWith('/dashboard/review'));

	// Animation state from store
	let animationState = $state<
		'idle' | 'entering' | 'exiting' | 'content-entering' | 'content-exiting'
	>('entering');

	// Subscribe to the store
	$effect(() => {
		const unsubscribe = pageTransition.subscribe((value) => {
			animationState = value;
		});
		return unsubscribe;
	});

	onMount(() => {
		// After entrance animation completes, set to idle
		setTimeout(() => {
			pageTransition.setIdle();
		}, 1000);
	});
</script>

{#if isLoading}
	<div class="loading-screen">
		<div class="loading-content">
			<div class="loading-spinner">
				<Loader2 size={32} strokeWidth={2} />
			</div>
			<p class="loading-text">Loading...</p>
		</div>
	</div>
{:else}
	<div class="dashboard-shell">
		<!-- Decorative Background -->
		{#if quality === 'high' || quality === 'medium'}
			<div class="bg-decoration" class:quality-medium={quality === 'medium'} aria-hidden="true">
				<div class="blob blob-1"></div>
				<div class="blob blob-2"></div>
				{#if quality === 'high'}
					<div class="blob blob-3"></div>
					<div class="blob blob-4"></div>
				{/if}
			</div>
		{:else}
			<div class="bg-decoration-static" aria-hidden="true"></div>
		{/if}

		<!-- Page Content -->
		<div
			class="dashboard-content"
			class:content-fade-in={animationState === 'entering' || animationState === 'content-entering'}
			class:content-fade-out={animationState === 'exiting' || animationState === 'content-exiting'}
		>
			{@render children()}
		</div>

		<!-- Bottom Navigation (hidden on review page) -->
		{#if !hideBottomNav}
			<BottomNav />
		{/if}

		<!-- Feedback Button -->
		<FeedbackButton />

		<!-- Tutorial System -->
		<TutorialProvider />
	</div>
{/if}

<style>
	/* Loading Screen */
	.loading-screen {
		min-height: 100vh;
		min-height: 100dvh;
		background: #dbe8f4;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.loading-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}

	.loading-spinner {
		color: var(--blu-primary, #0066ff);
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-text {
		font-size: 14px;
		font-weight: 500;
		color: var(--gray-500, #64748b);
		margin: 0;
	}

	.dashboard-shell {
		position: relative;
		min-height: 100vh;
		min-height: 100dvh;
		background: #dbe8f4;
		overflow-x: hidden;
	}

	.bg-decoration {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		overflow: hidden;
	}

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

	@keyframes content-hide {
		0% {
			opacity: 1;
			transform: translateY(0);
		}
		100% {
			opacity: 0;
			transform: translateY(-10px);
		}
	}

	/* Blob morphing animations - GPU-only (transform), no filter/hue-rotate on mobile */
	@keyframes blob-morph-1 {
		0%,
		100% {
			transform: scale(1) translate(0, 0);
		}
		25% {
			transform: scale(1.02) translate(10px, -5px);
		}
		50% {
			transform: scale(0.98) translate(-5px, 10px);
		}
		75% {
			transform: scale(1.01) translate(5px, 5px);
		}
	}

	@keyframes blob-morph-2 {
		0%,
		100% {
			transform: scale(1) translate(0, 0);
		}
		33% {
			transform: scale(1.03) translate(-15px, 10px);
		}
		66% {
			transform: scale(0.97) translate(10px, -10px);
		}
	}

	@keyframes blob-morph-3 {
		0%,
		100% {
			transform: scale(1) translate(0, 0);
		}
		20% {
			transform: scale(0.98) translate(8px, 12px);
		}
		40% {
			transform: scale(1.02) translate(-10px, -8px);
		}
		60% {
			transform: scale(1) translate(5px, -5px);
		}
		80% {
			transform: scale(1.01) translate(-5px, 8px);
		}
	}

	@keyframes blob-morph-4 {
		0%,
		100% {
			transform: scale(1) translate(0, 0);
		}
		50% {
			transform: scale(1.04) translate(-12px, -10px);
		}
	}

	/* Blobs - blue gradient circles */
	.blob {
		position: absolute;
		border-radius: 50%;
		filter: blur(100px);
		animation-timing-function: cubic-bezier(0.32, 0.72, 0, 1);
		animation-fill-mode: both;
	}

	.blob-1 {
		width: 600px;
		height: 600px;
		background: linear-gradient(135deg, #0066ff 0%, #0ea5e9 100%);
		/* Default idle state */
		top: -200px;
		right: -150px;
		opacity: 0.35;
	}

	.blob-2 {
		width: 500px;
		height: 500px;
		background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
		top: 35%;
		left: -200px;
		opacity: 0.25;
	}

	.blob-3 {
		width: 450px;
		height: 450px;
		background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
		bottom: 10%;
		right: -100px;
		opacity: 0.2;
	}

	.blob-4 {
		width: 400px;
		height: 400px;
		background: linear-gradient(135deg, #0066ff 0%, #3b82f6 100%);
		bottom: -150px;
		left: 15%;
		opacity: 0.25;
	}

	/* Idle state - continuous morphing animation */
	.bg-decoration:not(.entering):not(.exiting) .blob-1 {
		animation: blob-morph-1 20s ease-in-out infinite;
	}

	.bg-decoration:not(.entering):not(.exiting) .blob-2 {
		animation: blob-morph-2 25s ease-in-out infinite;
		animation-delay: -5s;
	}

	.bg-decoration:not(.entering):not(.exiting) .blob-3 {
		animation: blob-morph-3 18s ease-in-out infinite;
		animation-delay: -10s;
	}

	.bg-decoration:not(.entering):not(.exiting) .blob-4 {
		animation: blob-morph-4 22s ease-in-out infinite;
		animation-delay: -3s;
	}

	.dashboard-content {
		position: relative;
		z-index: 1;
		min-height: 100vh;
	}

	.dashboard-content.content-fade-in {
		animation: content-reveal 300ms ease-out forwards;
		opacity: 0;
	}

	.dashboard-content.content-fade-out {
		animation: content-hide 150ms ease-out forwards;
	}

	/* Smaller blobs on mobile */
	@media (max-width: 768px) {
		.blob {
			filter: blur(60px);
		}
		.blob-1 {
			width: 250px;
			height: 250px;
			top: -80px;
			right: -60px;
			opacity: 0.25;
		}
		.blob-2 {
			width: 200px;
			height: 200px;
			top: 30%;
			left: -80px;
			opacity: 0.18;
		}
		.blob-3 {
			width: 180px;
			height: 180px;
			bottom: 15%;
			right: -40px;
			opacity: 0.15;
		}
		.blob-4 {
			width: 160px;
			height: 160px;
			bottom: -60px;
			left: 10%;
			opacity: 0.18;
		}
	}

	/* Static gradient fallback for low/minimal quality */
	.bg-decoration-static {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		background:
			radial-gradient(ellipse 600px 600px at 80% -5%, rgba(0, 102, 255, 0.12) 0%, transparent 70%),
			radial-gradient(ellipse 500px 500px at -10% 40%, rgba(59, 130, 246, 0.08) 0%, transparent 70%);
	}

	/* Medium quality: simpler morph, slower */
	.bg-decoration.quality-medium .blob-1 {
		animation-duration: 30s;
	}
	.bg-decoration.quality-medium .blob-2 {
		animation-duration: 35s;
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.blob {
			animation: none;
			filter: blur(100px);
		}
		.blob-1 {
			opacity: 0.35;
			top: -200px;
			right: -150px;
		}
		.blob-2 {
			opacity: 0.25;
			top: 35%;
			left: -200px;
		}
		.blob-3 {
			opacity: 0.2;
			bottom: 10%;
			right: -100px;
		}
		.blob-4 {
			opacity: 0.25;
			bottom: -150px;
			left: 15%;
		}
		.dashboard-content,
		.dashboard-content.content-fade-in,
		.dashboard-content.content-fade-out {
			animation: none;
			opacity: 1;
		}
	}
</style>

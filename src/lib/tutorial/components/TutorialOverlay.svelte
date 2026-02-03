<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import X from 'lucide-svelte/icons/x';
	import { t } from '$lib/i18n';
	import { tutorialStore } from '../store.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Extract actions (these are stable functions, safe to destructure)
	const { nextStep, prevStep, skipTutorial, endTutorial } = tutorialStore;

	// Use derived to reactively track store getters
	const tutorialState = $derived(tutorialStore.state);
	const currentStepData = $derived(tutorialStore.currentStepData);
	const totalSteps = tutorialStore.totalSteps;
	const isLastStep = $derived(tutorialStore.isLastStep);

	// Target element rect
	let targetRect = $state<DOMRect | null>(null);
	let tooltipPosition = $state({ x: 0, y: 0 });
	let tooltipRef = $state<HTMLDivElement | null>(null);

	// Find and track target element
	$effect(() => {
		if (!browser || !tutorialState.isActive || !currentStepData) {
			targetRect = null;
			return;
		}

		const findTarget = () => {
			const step = currentStepData;
			if (!step) return;

			const target = document.querySelector(step.targetSelector);
			if (target) {
				const rect = target.getBoundingClientRect();
				targetRect = rect;
				calculateTooltipPosition(rect, step.position);
			} else {
				// If target not found, show tooltip in center
				targetRect = null;
				tooltipPosition = {
					x: window.innerWidth / 2 - 160,
					y: window.innerHeight / 2 - 100
				};
			}
		};

		findTarget();

		// Re-calculate on resize/scroll
		window.addEventListener('resize', findTarget);
		window.addEventListener('scroll', findTarget, true);

		return () => {
			window.removeEventListener('resize', findTarget);
			window.removeEventListener('scroll', findTarget, true);
		};
	});

	function calculateTooltipPosition(rect: DOMRect, position: string) {
		const step = currentStepData;
		const padding = step?.spotlightPadding || 8;
		const tooltipWidth = 320;
		const tooltipHeight = 200;
		const gap = 16;

		let x = 0;
		let y = 0;

		switch (position) {
			case 'top':
				x = rect.left + rect.width / 2 - tooltipWidth / 2;
				y = rect.top - tooltipHeight - gap - padding;
				break;
			case 'bottom':
				x = rect.left + rect.width / 2 - tooltipWidth / 2;
				y = rect.bottom + gap + padding;
				break;
			case 'left':
				x = rect.left - tooltipWidth - gap - padding;
				y = rect.top + rect.height / 2 - tooltipHeight / 2;
				break;
			case 'right':
				x = rect.right + gap + padding;
				y = rect.top + rect.height / 2 - tooltipHeight / 2;
				break;
			case 'center':
				x = window.innerWidth / 2 - tooltipWidth / 2;
				y = window.innerHeight / 2 - tooltipHeight / 2;
				break;
		}

		// Keep within viewport
		x = Math.max(16, Math.min(x, window.innerWidth - tooltipWidth - 16));
		y = Math.max(16, Math.min(y, window.innerHeight - tooltipHeight - 16));

		tooltipPosition = { x, y };
	}
</script>

{#if tutorialState.isActive && currentStepData}
	<div class="tutorial-overlay">
		<!-- Dark overlay with spotlight cutout -->
		<svg class="spotlight-svg">
			<defs>
				<mask id="spotlight-mask">
					<!-- White = visible (dark overlay) -->
					<rect x="0" y="0" width="100%" height="100%" fill="white" />
					<!-- Black = invisible (spotlight hole) -->
					{#if targetRect}
						{@const padding = currentStepData.spotlightPadding || 8}
						<rect
							x={targetRect.left - padding}
							y={targetRect.top - padding}
							width={targetRect.width + padding * 2}
							height={targetRect.height + padding * 2}
							rx="12"
							fill="black"
						/>
					{/if}
				</mask>
			</defs>

			<!-- Dark overlay -->
			<rect
				x="0"
				y="0"
				width="100%"
				height="100%"
				fill="rgba(0, 0, 0, 0.75)"
				mask="url(#spotlight-mask)"
			/>

			<!-- Spotlight border/glow -->
			{#if targetRect}
				{@const padding = currentStepData.spotlightPadding || 8}
				<rect
					x={targetRect.left - padding}
					y={targetRect.top - padding}
					width={targetRect.width + padding * 2}
					height={targetRect.height + padding * 2}
					rx="12"
					fill="none"
					stroke="#0066FF"
					stroke-width="2"
					class="spotlight-border"
				/>
			{/if}
		</svg>

		<!-- Tooltip -->
		{#key tutorialState.currentStep}
			<div
				bind:this={tooltipRef}
				class="tutorial-tooltip"
				style="left: {tooltipPosition.x}px; top: {tooltipPosition.y}px;"
				in:fly={{ y: 10, duration: 200, easing: cubicOut }}
			>
				<!-- Progress indicator -->
				<div class="progress-row">
					<div class="progress-dots">
						{#each Array(totalSteps) as _, i}
							<div
								class="progress-dot"
								class:active={i <= tutorialState.currentStep}
								class:current={i === tutorialState.currentStep}
							></div>
						{/each}
					</div>
					<span class="progress-text">
						{tutorialState.currentStep + 1} / {totalSteps}
					</span>
				</div>

				<!-- Content -->
				<h3 class="tooltip-title">{$t(currentStepData.title)}</h3>
				<p class="tooltip-description">{$t(currentStepData.description)}</p>

				<!-- Actions -->
				<div class="tooltip-actions">
					<div class="action-left">
						{#if tutorialState.currentStep > 0}
							<button class="nav-btn back" onclick={prevStep}>
								<ChevronLeft size={16} />
								{$t('tutorial.navigation.back')}
							</button>
						{/if}

						{#if currentStepData.showSkip}
							<button class="skip-btn" onclick={skipTutorial}>
								{$t('tutorial.navigation.skipAll')}
							</button>
						{/if}
					</div>

					<button class="nav-btn next" onclick={isLastStep ? endTutorial : nextStep}>
						{isLastStep ? $t('tutorial.navigation.finish') : $t('tutorial.navigation.next')}
						{#if !isLastStep}
							<ChevronRight size={16} />
						{/if}
					</button>
				</div>
			</div>
		{/key}
	</div>
{/if}

<style>
	.tutorial-overlay {
		position: fixed;
		inset: 0;
		z-index: 999;
		pointer-events: none;
	}

	.spotlight-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: auto;
	}

	.spotlight-border {
		animation: pulse-glow 2s ease-in-out infinite;
	}

	@keyframes pulse-glow {
		0%,
		100% {
			opacity: 1;
			filter: drop-shadow(0 0 8px rgba(0, 102, 255, 0.5));
		}
		50% {
			opacity: 0.8;
			filter: drop-shadow(0 0 16px rgba(0, 102, 255, 0.8));
		}
	}

	.tutorial-tooltip {
		position: absolute;
		background: white;
		border-radius: 16px;
		padding: 20px;
		width: 320px;
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
		pointer-events: auto;
	}

	.progress-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}

	.progress-dots {
		display: flex;
		gap: 6px;
	}

	.progress-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--gray-200, #e2e8f0);
		transition: all 0.2s ease;
	}

	.progress-dot.active {
		background: var(--blu-primary, #0066ff);
	}

	.progress-dot.current {
		width: 20px;
		border-radius: 4px;
	}

	.progress-text {
		font-size: 12px;
		color: var(--gray-400, #94a3b8);
	}

	.tooltip-title {
		font-size: 18px;
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		margin: 0 0 8px;
		letter-spacing: -0.01em;
	}

	.tooltip-description {
		font-size: 14px;
		color: var(--gray-600, #475569);
		line-height: 1.6;
		margin: 0 0 20px;
	}

	.tooltip-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.action-left {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.nav-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 10px 16px;
		border: none;
		border-radius: 10px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.nav-btn.back {
		background: rgba(0, 0, 0, 0.05);
		color: var(--gray-600, #475569);
	}

	.nav-btn.back:hover {
		background: rgba(0, 0, 0, 0.1);
	}

	.nav-btn.next {
		background: var(--blu-primary, #0066ff);
		color: white;
	}

	.nav-btn.next:hover {
		background: #0052cc;
	}

	.skip-btn {
		background: none;
		border: none;
		color: var(--gray-400, #94a3b8);
		font-size: 12px;
		cursor: pointer;
		padding: 4px 8px;
		transition: color 0.15s ease;
	}

	.skip-btn:hover {
		color: var(--gray-600, #475569);
	}

	@media (prefers-reduced-motion: reduce) {
		.spotlight-border {
			animation: none;
		}

		.progress-dot {
			transition: none;
		}
	}

	/* Mobile */
	@media (max-width: 480px) {
		.tutorial-tooltip {
			width: calc(100vw - 32px);
			max-width: 320px;
		}

		.tooltip-actions {
			flex-direction: column-reverse;
			gap: 12px;
		}

		.action-left {
			width: 100%;
			justify-content: space-between;
		}

		.nav-btn.next {
			width: 100%;
			justify-content: center;
		}
	}
</style>

<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Lightbulb from 'lucide-svelte/icons/lightbulb';
	import X from 'lucide-svelte/icons/x';
	import { t } from '$lib/i18n';
	import { tutorialStore } from '../store.svelte';
	import { browser } from '$app/environment';

	const { activeHint, dismissHint, disableAllHints } = tutorialStore;

	// Target element rect
	let targetRect = $state<DOMRect | null>(null);
	let position = $state({ x: 0, y: 0 });

	// Find target element
	$effect(() => {
		if (!browser || !activeHint) {
			targetRect = null;
			return;
		}

		const findTarget = () => {
			const target = document.querySelector(activeHint.targetSelector);
			if (target) {
				const rect = target.getBoundingClientRect();
				targetRect = rect;
				calculatePosition(rect);
			} else {
				// Center if target not found
				position = {
					x: window.innerWidth / 2 - 140,
					y: window.innerHeight / 2 - 80
				};
			}
		};

		// Small delay to let UI settle
		const timer = setTimeout(findTarget, 100);

		window.addEventListener('resize', findTarget);
		window.addEventListener('scroll', findTarget, true);

		return () => {
			clearTimeout(timer);
			window.removeEventListener('resize', findTarget);
			window.removeEventListener('scroll', findTarget, true);
		};
	});

	function calculatePosition(rect: DOMRect) {
		const hint = activeHint;
		if (!hint) return;

		const padding = hint.spotlightPadding || 8;
		const tooltipWidth = 280;
		const tooltipHeight = 140;
		const gap = 12;

		let x = 0;
		let y = 0;

		switch (hint.position) {
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

		position = { x, y };
	}

	function handleDismiss() {
		if (activeHint) {
			dismissHint(activeHint.id);
		}
	}

	function handleDisableAll() {
		disableAllHints();
	}
</script>

{#if activeHint}
	<!-- Subtle highlight on target -->
	{#if targetRect}
		{@const padding = activeHint.spotlightPadding || 8}
		<div
			class="hint-highlight"
			style="
				left: {targetRect.left - padding}px;
				top: {targetRect.top - padding}px;
				width: {targetRect.width + padding * 2}px;
				height: {targetRect.height + padding * 2}px;
			"
			transition:fade={{ duration: 200 }}
		></div>
	{/if}

	<!-- Tooltip -->
	<div
		class="hint-tooltip"
		style="left: {position.x}px; top: {position.y}px;"
		in:fly={{ y: 10, duration: 200, easing: cubicOut }}
		out:fade={{ duration: 150 }}
	>
		<!-- Close button -->
		<button class="close-btn" onclick={handleDismiss} aria-label={$t('common.close')}>
			<X size={14} />
		</button>

		<!-- Content -->
		<div class="hint-content">
			<div class="hint-icon">
				<Lightbulb size={16} />
			</div>
			<div class="hint-text">
				<h4 class="hint-title">{$t(activeHint.title)}</h4>
				<p class="hint-description">{$t(activeHint.description)}</p>
			</div>
		</div>

		<!-- Actions -->
		<div class="hint-actions">
			<button class="disable-btn" onclick={handleDisableAll}>
				{$t('tutorial.hints.dontShowAgain')}
			</button>
			<button class="got-it-btn" onclick={handleDismiss}>
				{$t('tutorial.hints.gotIt')}
			</button>
		</div>
	</div>
{/if}

<style>
	.hint-highlight {
		position: fixed;
		border-radius: 12px;
		box-shadow:
			0 0 0 4px rgba(0, 102, 255, 0.25),
			0 0 24px rgba(0, 102, 255, 0.15);
		pointer-events: none;
		z-index: 998;
		animation: pulse-highlight 2s ease-in-out infinite;
	}

	@keyframes pulse-highlight {
		0%,
		100% {
			box-shadow:
				0 0 0 4px rgba(0, 102, 255, 0.25),
				0 0 24px rgba(0, 102, 255, 0.15);
		}
		50% {
			box-shadow:
				0 0 0 6px rgba(0, 102, 255, 0.35),
				0 0 32px rgba(0, 102, 255, 0.25);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hint-highlight {
			animation: none;
		}
	}

	.hint-tooltip {
		position: fixed;
		background: white;
		border-radius: 14px;
		padding: 16px;
		width: 280px;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.12),
			0 0 0 1px rgba(0, 0, 0, 0.05);
		z-index: 999;
	}

	.close-btn {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.05);
		border: none;
		border-radius: 6px;
		color: var(--gray-400, #94a3b8);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.close-btn:hover {
		background: rgba(0, 0, 0, 0.1);
		color: var(--gray-600, #475569);
	}

	.hint-content {
		display: flex;
		gap: 12px;
	}

	.hint-icon {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 102, 255, 0.1);
		border-radius: 8px;
		color: var(--blu-primary, #0066ff);
		flex-shrink: 0;
	}

	.hint-text {
		flex: 1;
		min-width: 0;
	}

	.hint-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--gray-900, #0f172a);
		margin: 0 0 4px;
	}

	.hint-description {
		font-size: 13px;
		color: var(--gray-600, #475569);
		line-height: 1.5;
		margin: 0;
	}

	.hint-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 14px;
		padding-top: 14px;
		border-top: 1px solid var(--gray-100, #f1f5f9);
	}

	.disable-btn {
		background: none;
		border: none;
		color: var(--gray-400, #94a3b8);
		font-size: 12px;
		cursor: pointer;
		padding: 4px;
		transition: color 0.15s ease;
	}

	.disable-btn:hover {
		color: var(--gray-600, #475569);
	}

	.got-it-btn {
		background: none;
		border: none;
		color: var(--blu-primary, #0066ff);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		padding: 4px 8px;
		transition: opacity 0.15s ease;
	}

	.got-it-btn:hover {
		opacity: 0.8;
	}
</style>

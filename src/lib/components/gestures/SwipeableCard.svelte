<script lang="ts">
	import { spring } from 'svelte/motion';
	import { t } from '$lib/i18n';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Send from 'lucide-svelte/icons/send';

	interface Props {
		onSwipeLeft?: () => void;
		onSwipeRight?: () => void;
		rightDisabled?: boolean;
		leftDisabled?: boolean;
		children?: import('svelte').Snippet;
	}

	let {
		onSwipeLeft,
		onSwipeRight,
		rightDisabled = false,
		leftDisabled = false,
		children
	}: Props = $props();

	const SWIPE_THRESHOLD = 80;
	const MAX_SWIPE = 120;

	let cardElement: HTMLDivElement;
	let startX = 0;
	let startY = 0;
	let isDragging = $state(false);
	let isHorizontalSwipe = $state(false);
	let hasMovedSignificantly = $state(false);

	// Check for reduced motion preference
	const prefersReducedMotion =
		typeof window !== 'undefined'
			? window.matchMedia('(prefers-reduced-motion: reduce)').matches
			: false;

	const offsetX = spring(0, {
		stiffness: prefersReducedMotion ? 1 : 0.3,
		damping: prefersReducedMotion ? 1 : 0.8
	});

	const swipeDirection = $derived(() => {
		if ($offsetX > 30) return 'right';
		if ($offsetX < -30) return 'left';
		return null;
	});

	const leftOpacity = $derived(Math.min(1, Math.abs(Math.min(0, $offsetX)) / SWIPE_THRESHOLD));
	const rightOpacity = $derived(Math.min(1, Math.max(0, $offsetX) / SWIPE_THRESHOLD));

	function handleStart(clientX: number, clientY: number) {
		startX = clientX;
		startY = clientY;
		isDragging = true;
		isHorizontalSwipe = false;
		hasMovedSignificantly = false;
	}

	function handleMove(clientX: number, clientY: number) {
		if (!isDragging) return;

		const deltaX = clientX - startX;
		const deltaY = clientY - startY;

		// Determine swipe direction on first significant movement
		if (!isHorizontalSwipe && !hasMovedSignificantly) {
			if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
				hasMovedSignificantly = true;
				isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
			}
		}

		if (!isHorizontalSwipe) return;

		// Prevent vertical scroll during horizontal swipe
		// Apply resistance at edges and respect disabled states
		let newOffset = deltaX;

		// Block swipe in disabled direction
		if (rightDisabled && newOffset > 0) {
			newOffset = newOffset * 0.2; // Heavy resistance
		}
		if (leftDisabled && newOffset < 0) {
			newOffset = newOffset * 0.2; // Heavy resistance
		}

		// Apply max swipe limit with resistance
		if (Math.abs(newOffset) > MAX_SWIPE) {
			const excess = Math.abs(newOffset) - MAX_SWIPE;
			newOffset = (newOffset > 0 ? 1 : -1) * (MAX_SWIPE + excess * 0.3);
		}

		offsetX.set(newOffset, { hard: true });
	}

	function handleEnd() {
		if (!isDragging) return;
		isDragging = false;

		const currentOffset = $offsetX;

		// Trigger action if threshold reached
		if (currentOffset < -SWIPE_THRESHOLD && !leftDisabled && onSwipeLeft) {
			onSwipeLeft();
		} else if (currentOffset > SWIPE_THRESHOLD && !rightDisabled && onSwipeRight) {
			onSwipeRight();
		}

		// Snap back
		offsetX.set(0);
	}

	// Touch events
	function onTouchStart(e: TouchEvent) {
		handleStart(e.touches[0].clientX, e.touches[0].clientY);
	}

	function onTouchMove(e: TouchEvent) {
		if (isHorizontalSwipe && isDragging) {
			e.preventDefault();
		}
		handleMove(e.touches[0].clientX, e.touches[0].clientY);
	}

	function onTouchEnd() {
		handleEnd();
	}

	// Mouse events (for desktop support)
	function onMouseDown(e: MouseEvent) {
		// Only primary mouse button
		if (e.button !== 0) return;
		handleStart(e.clientX, e.clientY);
	}

	function onMouseMove(e: MouseEvent) {
		handleMove(e.clientX, e.clientY);
	}

	function onMouseUp() {
		handleEnd();
	}

	function onMouseLeave() {
		if (isDragging) {
			handleEnd();
		}
	}
</script>

<div class="swipeable-wrapper" role="group" aria-label="Swipeable card">
	<!-- Left action indicator (delete) -->
	<div
		class="action-indicator left"
		class:active={swipeDirection() === 'left'}
		style="opacity: {leftOpacity}"
	>
		<div class="action-icon delete">
			<Trash2 size={24} />
		</div>
		<span class="action-label">{$t('swipe.delete')}</span>
	</div>

	<!-- Right action indicator (send) -->
	<div
		class="action-indicator right"
		class:active={swipeDirection() === 'right'}
		class:disabled={rightDisabled}
		style="opacity: {rightOpacity}"
	>
		<div class="action-icon send">
			<Send size={24} />
		</div>
		<span class="action-label">
			{rightDisabled ? $t('swipe.alreadySent') : $t('swipe.send')}
		</span>
	</div>

	<!-- Swipeable content -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={cardElement}
		class="swipeable-content"
		class:dragging={isDragging && isHorizontalSwipe}
		style="transform: translateX({$offsetX}px)"
		ontouchstart={onTouchStart}
		ontouchmove={onTouchMove}
		ontouchend={onTouchEnd}
		onmousedown={onMouseDown}
		onmousemove={onMouseMove}
		onmouseup={onMouseUp}
		onmouseleave={onMouseLeave}
	>
		{@render children?.()}
	</div>
</div>

<style>
	.swipeable-wrapper {
		position: relative;
		overflow: hidden;
		border-radius: var(--radius-button, 14px);
	}

	.swipeable-content {
		position: relative;
		z-index: 1;
		cursor: grab;
		user-select: none;
		-webkit-user-select: none;
		touch-action: pan-y;
	}

	.swipeable-content.dragging {
		cursor: grabbing;
		touch-action: none;
	}

	.action-indicator {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 120px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
		pointer-events: none;
		transition: opacity 0.15s ease;
	}

	.action-indicator.left {
		left: 0;
		background: linear-gradient(90deg, rgba(239, 68, 68, 0.95) 0%, rgba(239, 68, 68, 0.8) 100%);
		border-radius: var(--radius-button, 14px) 0 0 var(--radius-button, 14px);
	}

	.action-indicator.right {
		right: 0;
		background: linear-gradient(270deg, rgba(0, 102, 255, 0.95) 0%, rgba(0, 102, 255, 0.8) 100%);
		border-radius: 0 var(--radius-button, 14px) var(--radius-button, 14px) 0;
	}

	.action-indicator.right.disabled {
		background: linear-gradient(
			270deg,
			rgba(148, 163, 184, 0.95) 0%,
			rgba(148, 163, 184, 0.8) 100%
		);
	}

	.action-icon {
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		color: white;
	}

	.action-icon.delete {
		background: rgba(255, 255, 255, 0.2);
	}

	.action-icon.send {
		background: rgba(255, 255, 255, 0.2);
	}

	.action-label {
		font-size: 12px;
		font-weight: 600;
		color: white;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.action-indicator.active .action-icon {
		transform: scale(1.1);
		transition: transform 0.2s ease;
	}

	/* Reduce motion for accessibility */
	@media (prefers-reduced-motion: reduce) {
		.swipeable-content {
			transition: none !important;
		}

		.action-indicator.active .action-icon {
			transform: none;
		}
	}
</style>

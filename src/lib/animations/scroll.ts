/**
 * Scroll-driven animation utilities
 * High-performance scroll tracking with RAF optimization
 */

export interface ScrollProgressOptions {
	start?: 'top' | 'center' | 'bottom' | number;
	end?: 'top' | 'center' | 'bottom' | number;
	onProgress?: (progress: number) => void;
	onEnter?: () => void;
	onLeave?: () => void;
}

/**
 * Calculate scroll progress for an element
 * Returns a value between 0 and 1 based on element position
 */
export function getScrollProgress(
	element: HTMLElement,
	options: { start?: number; end?: number } = {}
): number {
	const rect = element.getBoundingClientRect();
	const viewportHeight = window.innerHeight;
	const { start = 0, end = 1 } = options;

	// Calculate element's position relative to viewport
	const elementTop = rect.top;
	const elementHeight = rect.height;

	// Start tracking when element enters from bottom
	// End tracking when element leaves from top
	const startOffset = viewportHeight * (1 - start);
	const endOffset = viewportHeight * end;

	const scrollDistance = elementHeight + startOffset - endOffset;
	const scrolled = startOffset - elementTop;

	const progress = Math.max(0, Math.min(1, scrolled / scrollDistance));
	return progress;
}

/**
 * Svelte action for scroll-linked animations
 * Updates a CSS custom property based on scroll progress
 */
export function scrollProgress(
	node: HTMLElement,
	options: ScrollProgressOptions = {}
): { destroy: () => void; update: (options: ScrollProgressOptions) => void } {
	if (typeof window === 'undefined') {
		return { destroy() {}, update() {} };
	}

	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	if (prefersReducedMotion) {
		node.style.setProperty('--scroll-progress', '1');
		return { destroy() {}, update() {} };
	}

	let rafId: number | null = null;
	let lastProgress = -1;
	let hasEntered = false;
	let hasLeft = false;

	const { start = 'bottom', end = 'top', onProgress, onEnter, onLeave } = options;

	// Convert position names to numbers
	const getPositionValue = (pos: string | number): number => {
		if (typeof pos === 'number') return pos;
		switch (pos) {
			case 'top':
				return 0;
			case 'center':
				return 0.5;
			case 'bottom':
				return 1;
			default:
				return 0;
		}
	};

	const startValue = getPositionValue(start);
	const endValue = getPositionValue(end);

	function update() {
		const progress = getScrollProgress(node, { start: startValue, end: endValue });

		// Only update if progress changed significantly (optimization)
		if (Math.abs(progress - lastProgress) > 0.001) {
			lastProgress = progress;
			node.style.setProperty('--scroll-progress', progress.toFixed(4));
			onProgress?.(progress);

			// Handle enter/leave callbacks
			if (progress > 0 && !hasEntered) {
				hasEntered = true;
				hasLeft = false;
				onEnter?.();
			} else if (progress === 0 && hasEntered && !hasLeft) {
				hasLeft = true;
				hasEntered = false;
				onLeave?.();
			}
		}

		rafId = requestAnimationFrame(update);
	}

	// Start the animation loop
	rafId = requestAnimationFrame(update);

	return {
		destroy() {
			if (rafId) {
				cancelAnimationFrame(rafId);
			}
		},
		update(newOptions: ScrollProgressOptions) {
			Object.assign(options, newOptions);
		}
	};
}

/**
 * Action for sticky scroll sections
 * Tracks progress through a tall scrollable section
 */
export function stickyScroll(
	node: HTMLElement,
	options: {
		onProgress?: (progress: number) => void;
		debug?: boolean;
	} = {}
): { destroy: () => void } {
	if (typeof window === 'undefined') {
		return { destroy() {} };
	}

	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	let rafId: number | null = null;
	let lastProgress = -1;

	function update() {
		const rect = node.getBoundingClientRect();
		const viewportHeight = window.innerHeight;

		// Calculate how far we've scrolled through the section
		// Progress is 0 when section top hits viewport top
		// Progress is 1 when section bottom hits viewport bottom
		const sectionHeight = node.offsetHeight;
		const scrollableDistance = sectionHeight - viewportHeight;

		let progress: number;

		if (scrollableDistance <= 0) {
			progress = rect.top <= 0 ? 1 : 0;
		} else {
			progress = Math.max(0, Math.min(1, -rect.top / scrollableDistance));
		}

		if (prefersReducedMotion) {
			progress = Math.round(progress * 2) / 2; // Snap to 0, 0.5, or 1
		}

		if (Math.abs(progress - lastProgress) > 0.0005) {
			lastProgress = progress;
			node.style.setProperty('--sticky-progress', progress.toFixed(4));
			options.onProgress?.(progress);

			if (options.debug) {
				console.log('Sticky progress:', progress.toFixed(3));
			}
		}

		rafId = requestAnimationFrame(update);
	}

	rafId = requestAnimationFrame(update);

	return {
		destroy() {
			if (rafId) {
				cancelAnimationFrame(rafId);
			}
		}
	};
}

/**
 * Interpolate between values based on progress
 */
export function lerp(start: number, end: number, progress: number): number {
	return start + (end - start) * progress;
}

/**
 * Map progress to a segment (for multi-stage animations)
 * Returns 0-1 within the specified segment
 */
export function mapToSegment(progress: number, segmentStart: number, segmentEnd: number): number {
	if (progress <= segmentStart) return 0;
	if (progress >= segmentEnd) return 1;
	return (progress - segmentStart) / (segmentEnd - segmentStart);
}

/**
 * Easing functions for scroll animations
 */
export const easings = {
	linear: (t: number) => t,
	easeInQuad: (t: number) => t * t,
	easeOutQuad: (t: number) => t * (2 - t),
	easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
	easeOutCubic: (t: number) => --t * t * t + 1,
	easeInOutCubic: (t: number) =>
		t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
	easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
	easeOutBack: (t: number) => {
		const c1 = 1.70158;
		const c3 = c1 + 1;
		return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
	}
};

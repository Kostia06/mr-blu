/**
 * Smooth scroll utility
 * Note: Lenis dependency was removed as it was unused/not providing value.
 * This provides a native smooth scroll fallback.
 */
import { browser } from '$app/environment';

// Stub implementation that uses native smooth scroll
export function initSmoothScroll() {
	if (!browser) return null;

	// Check for reduced motion preference
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (prefersReducedMotion) return null;

	// Enable smooth scroll via CSS
	document.documentElement.style.scrollBehavior = 'smooth';

	return true;
}

export function getLenis() {
	return null;
}

export function destroySmoothScroll() {
	if (browser) {
		document.documentElement.style.scrollBehavior = '';
	}
}

export function scrollTo(
	target: string | number | HTMLElement,
	options?: { offset?: number; duration?: number }
) {
	if (!browser) return;

	const offset = options?.offset || 0;

	if (typeof target === 'number') {
		window.scrollTo({
			top: target + offset,
			behavior: 'smooth'
		});
	} else if (typeof target === 'string') {
		const element = document.querySelector(target);
		if (element) {
			const rect = element.getBoundingClientRect();
			window.scrollTo({
				top: window.scrollY + rect.top + offset,
				behavior: 'smooth'
			});
		}
	} else if (target instanceof HTMLElement) {
		const rect = target.getBoundingClientRect();
		window.scrollTo({
			top: window.scrollY + rect.top + offset,
			behavior: 'smooth'
		});
	}
}

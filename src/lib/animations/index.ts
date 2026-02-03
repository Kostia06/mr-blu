/**
 * Mr.Blu Animation Utilities
 * Premium animations with spring physics and intersection observer triggers
 */

import { cubicOut, backOut, elasticOut } from 'svelte/easing';

// Re-export scroll utilities
export * from './scroll';

// ============================================
// SVELTE TRANSITIONS
// ============================================

interface TransitionOptions {
	delay?: number;
	duration?: number;
	easing?: (t: number) => number;
}

/**
 * Fade up transition - element fades in while translating up
 */
export function fadeUp(
	node: HTMLElement,
	{ delay = 0, duration = 600, easing = cubicOut }: TransitionOptions = {}
) {
	return {
		delay,
		duration,
		easing,
		css: (t: number) => `
			opacity: ${t};
			transform: translateY(${(1 - t) * 30}px);
		`
	};
}

/**
 * Fade down transition
 */
export function fadeDown(
	node: HTMLElement,
	{ delay = 0, duration = 600, easing = cubicOut }: TransitionOptions = {}
) {
	return {
		delay,
		duration,
		easing,
		css: (t: number) => `
			opacity: ${t};
			transform: translateY(${(1 - t) * -30}px);
		`
	};
}

/**
 * Slide in from direction with spring physics
 */
export function slideIn(
	node: HTMLElement,
	{
		delay = 0,
		duration = 700,
		easing = backOut,
		direction = 'left'
	}: TransitionOptions & { direction?: 'left' | 'right' | 'up' | 'down' } = {}
) {
	const transforms = {
		left: (t: number) => `translateX(${(1 - t) * -60}px)`,
		right: (t: number) => `translateX(${(1 - t) * 60}px)`,
		up: (t: number) => `translateY(${(1 - t) * 60}px)`,
		down: (t: number) => `translateY(${(1 - t) * -60}px)`
	};

	return {
		delay,
		duration,
		easing,
		css: (t: number) => `
			opacity: ${t};
			transform: ${transforms[direction](t)};
		`
	};
}

/**
 * Scale transition with spring overshoot
 */
export function scaleIn(
	node: HTMLElement,
	{ delay = 0, duration = 500, easing = backOut }: TransitionOptions = {}
) {
	return {
		delay,
		duration,
		easing,
		css: (t: number) => `
			opacity: ${t};
			transform: scale(${0.9 + t * 0.1});
		`
	};
}

/**
 * Spring bounce transition
 */
export function springBounce(
	node: HTMLElement,
	{ delay = 0, duration = 800, easing = elasticOut }: TransitionOptions = {}
) {
	return {
		delay,
		duration,
		easing,
		css: (t: number) => `
			opacity: ${Math.min(t * 2, 1)};
			transform: scale(${0.5 + t * 0.5}) translateY(${(1 - t) * 40}px);
		`
	};
}

// ============================================
// SVELTE ACTIONS (use:directive)
// ============================================

interface RevealOptions {
	threshold?: number;
	once?: boolean;
	rootMargin?: string;
	delay?: number;
	duration?: number;
	y?: number;
	scale?: number;
}

/**
 * Reveal on scroll action - triggers animation when element enters viewport
 */
export function reveal(node: HTMLElement, options: RevealOptions = {}) {
	// SSR guard
	if (typeof window === 'undefined') {
		return { destroy() {} };
	}

	const {
		threshold = 0.15,
		once = true,
		rootMargin = '0px',
		delay = 0,
		duration = 600,
		y = 40,
		scale = 1
	} = options;

	// Check for reduced motion preference
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	if (prefersReducedMotion) {
		node.style.opacity = '1';
		return { destroy() {} };
	}

	// Set initial state
	node.style.opacity = '0';
	node.style.transform = `translateY(${y}px) scale(${scale})`;
	node.style.transition = `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
	node.style.transitionDelay = `${delay}ms`;

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					node.style.opacity = '1';
					node.style.transform = 'translateY(0) scale(1)';
					if (once) observer.unobserve(node);
				} else if (!once) {
					node.style.opacity = '0';
					node.style.transform = `translateY(${y}px) scale(${scale})`;
				}
			});
		},
		{ threshold, rootMargin }
	);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		},
		update(newOptions: RevealOptions) {
			Object.assign(options, newOptions);
		}
	};
}

interface StaggerOptions {
	staggerDelay?: number;
	baseDelay?: number;
	threshold?: number;
	once?: boolean;
	y?: number;
}

/**
 * Stagger children animation - animates children in sequence
 */
export function stagger(node: HTMLElement, options: StaggerOptions = {}) {
	// SSR guard
	if (typeof window === 'undefined') {
		return { destroy() {} };
	}

	const { staggerDelay = 100, baseDelay = 0, threshold = 0.1, once = true, y = 30 } = options;

	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const children = Array.from(node.children) as HTMLElement[];

	if (prefersReducedMotion) {
		children.forEach((child) => {
			child.style.opacity = '1';
		});
		return { destroy() {} };
	}

	// Set initial state for all children
	children.forEach((child, index) => {
		child.style.opacity = '0';
		child.style.transform = `translateY(${y}px)`;
		child.style.transition = `opacity 500ms cubic-bezier(0.16, 1, 0.3, 1), transform 500ms cubic-bezier(0.16, 1, 0.3, 1)`;
		child.style.transitionDelay = `${baseDelay + index * staggerDelay}ms`;
	});

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					children.forEach((child) => {
						child.style.opacity = '1';
						child.style.transform = 'translateY(0)';
					});
					if (once) observer.unobserve(node);
				} else if (!once) {
					children.forEach((child, index) => {
						child.style.opacity = '0';
						child.style.transform = `translateY(${y}px)`;
					});
				}
			});
		},
		{ threshold }
	);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		}
	};
}

interface ParallaxOptions {
	speed?: number;
	direction?: 'up' | 'down';
}

/**
 * Parallax scroll effect
 */
export function parallax(node: HTMLElement, options: ParallaxOptions = {}) {
	// SSR guard
	if (typeof window === 'undefined') {
		return { destroy() {} };
	}

	const { speed = 0.5, direction = 'up' } = options;

	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	if (prefersReducedMotion) {
		return { destroy() {} };
	}

	function handleScroll() {
		const rect = node.getBoundingClientRect();
		const viewportHeight = window.innerHeight;

		// Calculate how far the element is from the center of the viewport
		const elementCenter = rect.top + rect.height / 2;
		const viewportCenter = viewportHeight / 2;
		const distance = elementCenter - viewportCenter;

		// Apply parallax transform
		const multiplier = direction === 'up' ? -1 : 1;
		const translateY = distance * speed * multiplier * 0.1;

		node.style.transform = `translateY(${translateY}px)`;
	}

	window.addEventListener('scroll', handleScroll, { passive: true });
	handleScroll(); // Initial position

	return {
		destroy() {
			window.removeEventListener('scroll', handleScroll);
		}
	};
}

/**
 * Ripple effect on click
 */
export function ripple(node: HTMLElement) {
	// SSR guard
	if (typeof window === 'undefined') {
		return { destroy() {} };
	}

	function handleClick(event: MouseEvent) {
		const rect = node.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		const rippleEl = document.createElement('span');
		rippleEl.className = 'ripple-effect';
		rippleEl.style.cssText = `
			position: absolute;
			left: ${x}px;
			top: ${y}px;
			width: 0;
			height: 0;
			background: rgba(255, 255, 255, 0.3);
			border-radius: 50%;
			transform: translate(-50%, -50%);
			pointer-events: none;
			animation: ripple-animation 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
		`;

		// Ensure node has position relative
		const computedStyle = getComputedStyle(node);
		if (computedStyle.position === 'static') {
			node.style.position = 'relative';
		}
		node.style.overflow = 'hidden';

		node.appendChild(rippleEl);

		setTimeout(() => rippleEl.remove(), 600);
	}

	node.addEventListener('click', handleClick);

	return {
		destroy() {
			node.removeEventListener('click', handleClick);
		}
	};
}

/**
 * Magnetic hover effect
 */
export function magnetic(node: HTMLElement, options: { strength?: number } = {}) {
	// SSR guard
	if (typeof window === 'undefined') {
		return { destroy() {} };
	}

	const { strength = 0.3 } = options;

	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	if (prefersReducedMotion) {
		return { destroy() {} };
	}

	function handleMouseMove(event: MouseEvent) {
		const rect = node.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;

		const deltaX = (event.clientX - centerX) * strength;
		const deltaY = (event.clientY - centerY) * strength;

		node.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
	}

	function handleMouseLeave() {
		node.style.transform = 'translate(0, 0)';
		node.style.transition = 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)';
	}

	function handleMouseEnter() {
		node.style.transition = 'transform 100ms ease-out';
	}

	node.addEventListener('mousemove', handleMouseMove);
	node.addEventListener('mouseleave', handleMouseLeave);
	node.addEventListener('mouseenter', handleMouseEnter);

	return {
		destroy() {
			node.removeEventListener('mousemove', handleMouseMove);
			node.removeEventListener('mouseleave', handleMouseLeave);
			node.removeEventListener('mouseenter', handleMouseEnter);
		}
	};
}

/**
 * Tilt 3D effect on hover
 */
export function tilt(node: HTMLElement, options: { maxTilt?: number; scale?: number } = {}) {
	// SSR guard
	if (typeof window === 'undefined') {
		return { destroy() {} };
	}

	const { maxTilt = 10, scale = 1.02 } = options;

	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	if (prefersReducedMotion) {
		return { destroy() {} };
	}

	node.style.transformStyle = 'preserve-3d';
	node.style.transition = 'transform 150ms ease-out';

	function handleMouseMove(event: MouseEvent) {
		const rect = node.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;

		const percentX = (event.clientX - centerX) / (rect.width / 2);
		const percentY = (event.clientY - centerY) / (rect.height / 2);

		const rotateX = -percentY * maxTilt;
		const rotateY = percentX * maxTilt;

		node.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
	}

	function handleMouseLeave() {
		node.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
	}

	node.addEventListener('mousemove', handleMouseMove);
	node.addEventListener('mouseleave', handleMouseLeave);

	return {
		destroy() {
			node.removeEventListener('mousemove', handleMouseMove);
			node.removeEventListener('mouseleave', handleMouseLeave);
		}
	};
}

/**
 * Count up animation for numbers
 */
export function countUp(
	node: HTMLElement,
	options: { target: number; duration?: number; prefix?: string; suffix?: string } = { target: 0 }
) {
	// SSR guard
	if (typeof window === 'undefined') {
		return { destroy() {} };
	}

	const { target, duration = 2000, prefix = '', suffix = '' } = options;

	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	if (prefersReducedMotion) {
		node.textContent = `${prefix}${target}${suffix}`;
		return { destroy() {} };
	}

	let hasAnimated = false;

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting && !hasAnimated) {
					hasAnimated = true;
					animateCount();
				}
			});
		},
		{ threshold: 0.5 }
	);

	function animateCount() {
		const startTime = performance.now();
		const startValue = 0;

		function updateCount(currentTime: number) {
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / duration, 1);

			// Ease out cubic
			const easeProgress = 1 - Math.pow(1 - progress, 3);
			const currentValue = Math.round(startValue + (target - startValue) * easeProgress);

			node.textContent = `${prefix}${currentValue.toLocaleString()}${suffix}`;

			if (progress < 1) {
				requestAnimationFrame(updateCount);
			}
		}

		requestAnimationFrame(updateCount);
	}

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		}
	};
}

/**
 * Typewriter effect
 */
export function typewriter(
	node: HTMLElement,
	options: { speed?: number; delay?: number; cursor?: boolean } = {}
) {
	// SSR guard
	if (typeof window === 'undefined') {
		return { destroy() {} };
	}

	const { speed = 50, delay = 0, cursor = true } = options;

	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const text = node.textContent || '';

	if (prefersReducedMotion) {
		return { destroy() {} };
	}

	node.textContent = '';
	if (cursor) {
		node.style.borderRight = '2px solid var(--blu-primary)';
	}

	let hasAnimated = false;

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting && !hasAnimated) {
					hasAnimated = true;
					setTimeout(() => animate(), delay);
				}
			});
		},
		{ threshold: 0.5 }
	);

	function animate() {
		let index = 0;
		const interval = setInterval(() => {
			if (index < text.length) {
				node.textContent = text.slice(0, index + 1);
				index++;
			} else {
				clearInterval(interval);
				if (cursor) {
					setTimeout(() => {
						node.style.borderRight = 'none';
					}, 500);
				}
			}
		}, speed);
	}

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		}
	};
}

// Add CSS keyframe for ripple
if (typeof document !== 'undefined') {
	const style = document.createElement('style');
	style.textContent = `
		@keyframes ripple-animation {
			to {
				width: 400px;
				height: 400px;
				opacity: 0;
			}
		}
	`;
	document.head.appendChild(style);
}

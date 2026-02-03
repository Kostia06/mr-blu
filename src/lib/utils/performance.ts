import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * Device capability detection for adaptive animations
 */
export interface DeviceCapabilities {
	isLowEnd: boolean;
	isMobile: boolean;
	hasReducedMotion: boolean;
	cpuCores: number;
	deviceMemory: number | null;
	connectionType: string | null;
}

export type AnimationQuality = 'high' | 'medium' | 'low' | 'minimal';

/**
 * Detects device capabilities for performance optimization
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
	if (!browser) {
		return {
			isLowEnd: false,
			isMobile: false,
			hasReducedMotion: false,
			cpuCores: 4,
			deviceMemory: null,
			connectionType: null
		};
	}

	const cpuCores = navigator.hardwareConcurrency || 4;
	const deviceMemory = (navigator as any).deviceMemory || null;
	const connection = (navigator as any).connection;
	const connectionType = connection?.effectiveType || null;

	const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;

	// Low-end device criteria:
	// - Less than 4 CPU cores
	// - Less than 4GB RAM (if available)
	// - Slow network connection (2g, 3g)
	// - Mobile device with small screen
	const isLowEnd =
		cpuCores < 4 ||
		(deviceMemory !== null && deviceMemory < 4) ||
		connectionType === '2g' ||
		connectionType === 'slow-2g' ||
		(isMobile && window.innerWidth < 375);

	return {
		isLowEnd,
		isMobile,
		hasReducedMotion,
		cpuCores,
		deviceMemory,
		connectionType
	};
}

/**
 * Determines recommended animation quality based on device capabilities
 */
export function getRecommendedQuality(capabilities: DeviceCapabilities): AnimationQuality {
	if (capabilities.hasReducedMotion) return 'minimal';
	if (capabilities.isLowEnd) return 'low';
	if (capabilities.isMobile) return 'medium';
	return 'high';
}

/**
 * Svelte store for reactive performance state
 */
function createPerformanceStore() {
	const capabilities = writable<DeviceCapabilities>(detectDeviceCapabilities());
	const quality = derived(capabilities, ($caps) => getRecommendedQuality($caps));

	// Update capabilities on resize (for mobile detection)
	if (browser) {
		let resizeTimeout: ReturnType<typeof setTimeout>;
		window.addEventListener(
			'resize',
			() => {
				clearTimeout(resizeTimeout);
				resizeTimeout = setTimeout(() => {
					capabilities.set(detectDeviceCapabilities());
				}, 250);
			},
			{ passive: true }
		);

		// Listen for reduced motion preference changes
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		mediaQuery.addEventListener('change', () => {
			capabilities.set(detectDeviceCapabilities());
		});

		// Listen for connection changes
		const connection = (navigator as any).connection;
		if (connection) {
			connection.addEventListener('change', () => {
				capabilities.set(detectDeviceCapabilities());
			});
		}
	}

	return {
		subscribe: capabilities.subscribe,
		quality,
		getCapabilities: () => get(capabilities),
		getQuality: () => get(quality)
	};
}

export const performanceStore = createPerformanceStore();

/**
 * Animation configuration for different device types
 */
export const mobileAnimationConfig = {
	waveform: {
		barCount: 20,
		updateInterval: 2 // Every other frame (30fps)
	},
	parallax: {
		enabled: false
	},
	blobs: {
		count: 2,
		animationDuration: 20
	},
	stagger: {
		delay: 50,
		maxItems: 6
	},
	gradients: {
		layerCount: 2,
		rotationSpeed: 0.5
	}
};

export const lowEndAnimationConfig = {
	waveform: {
		barCount: 12,
		updateInterval: 3 // ~20fps
	},
	parallax: {
		enabled: false
	},
	blobs: {
		count: 0 // Disabled
	},
	stagger: {
		delay: 0, // No stagger, instant reveal
		maxItems: 4
	},
	gradients: {
		layerCount: 1,
		rotationSpeed: 0 // Static gradient
	}
};

export const highAnimationConfig = {
	waveform: {
		barCount: 40,
		updateInterval: 1 // Every frame (60fps)
	},
	parallax: {
		enabled: true
	},
	blobs: {
		count: 4,
		animationDuration: 15
	},
	stagger: {
		delay: 100,
		maxItems: 20
	},
	gradients: {
		layerCount: 4,
		rotationSpeed: 1
	}
};

/**
 * Gets the appropriate animation config based on current quality
 */
export function getAnimationConfig(quality?: AnimationQuality) {
	const q = quality ?? performanceStore.getQuality();
	switch (q) {
		case 'minimal':
		case 'low':
			return lowEndAnimationConfig;
		case 'medium':
			return mobileAnimationConfig;
		case 'high':
		default:
			return highAnimationConfig;
	}
}

/**
 * Helper to check if animations should be disabled
 */
export function shouldDisableAnimations(): boolean {
	const caps = performanceStore.getCapabilities();
	return caps.hasReducedMotion;
}

/**
 * Helper to check if we're on a low-end device
 */
export function isLowEndDevice(): boolean {
	return performanceStore.getCapabilities().isLowEnd;
}

/**
 * Helper to check if we're on mobile
 */
export function isMobileDevice(): boolean {
	return performanceStore.getCapabilities().isMobile;
}

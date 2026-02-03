/**
 * Centralized GSAP loader for lazy loading GSAP and ScrollTrigger
 * This ensures the library is only loaded once and cached for subsequent uses
 */

import type { gsap as GSAPType } from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';

interface GSAPModules {
	gsap: typeof GSAPType;
	ScrollTrigger: typeof ScrollTriggerType;
}

let gsapPromise: Promise<GSAPModules> | null = null;

/**
 * Lazily loads GSAP and ScrollTrigger
 * Returns cached promise if already loading/loaded
 */
export async function loadGSAP(): Promise<GSAPModules> {
	if (!gsapPromise) {
		gsapPromise = Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
			([gsapModule, scrollTriggerModule]) => {
				const { gsap } = gsapModule;
				const { ScrollTrigger } = scrollTriggerModule;
				gsap.registerPlugin(ScrollTrigger);
				return { gsap, ScrollTrigger };
			}
		);
	}
	return gsapPromise;
}

/**
 * Loads only GSAP without ScrollTrigger (for simpler animations)
 */
let gsapOnlyPromise: Promise<typeof GSAPType> | null = null;

export async function loadGSAPOnly(): Promise<typeof GSAPType> {
	if (!gsapOnlyPromise) {
		gsapOnlyPromise = import('gsap').then(({ gsap }) => gsap);
	}
	return gsapOnlyPromise;
}

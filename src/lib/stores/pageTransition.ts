import { writable, get } from 'svelte/store';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';

export type AnimationState =
	| 'idle'
	| 'entering'
	| 'exiting'
	| 'content-entering'
	| 'content-exiting';

function createPageTransition() {
	const state = writable<AnimationState>('entering');
	const isAnimating = writable(false);

	return {
		subscribe: state.subscribe,
		isAnimating,

		setIdle: () => {
			state.set('idle');
			isAnimating.set(false);
		},

		setEntering: () => {
			state.set('entering');
			isAnimating.set(true);
		},

		setExiting: () => {
			state.set('exiting');
			isAnimating.set(true);
		},

		async navigate(path: string) {
			// Check for reduced motion preference
			if (browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
				goto(path);
				return;
			}

			// Don't animate if already animating
			if (get(isAnimating)) return;

			// For intra-dashboard navigation, only fade content (no blob animation)
			state.set('content-exiting');
			isAnimating.set(true);

			// Wait for content fade out
			await new Promise((r) => setTimeout(r, 200));

			// Navigate
			await goto(path);

			// Fade content back in
			state.set('content-entering');

			// Wait for content fade in
			await new Promise((r) => setTimeout(r, 400));

			// Done
			state.set('idle');
			isAnimating.set(false);
		}
	};
}

export const pageTransition = createPageTransition();

<script lang="ts">
	import { type Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	interface Props {
		id?: string;
		class?: string;
		background?: 'white' | 'gray' | 'gradient' | 'dark';
		padding?: 'default' | 'large' | 'none';
		maxWidth?: 'default' | 'wide' | 'full';
		reveal?: boolean;
		children: Snippet;
	}

	let {
		id,
		class: className = '',
		background = 'white',
		padding = 'default',
		maxWidth = 'default',
		reveal = true,
		children
	}: Props = $props();

	let sectionRef: HTMLElement;
	let revealed = $state(false);

	onMount(() => {
		if (!browser || !reveal) {
			revealed = true;
			return;
		}

		const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (prefersReducedMotion) {
			revealed = true;
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					revealed = true;
					observer.disconnect();
				}
			},
			{ rootMargin: '0px 0px -15% 0px' }
		);

		observer.observe(sectionRef);

		return () => observer.disconnect();
	});

	const bgClasses = {
		white: 'bg-white',
		gray: 'bg-gray',
		gradient: 'bg-gradient',
		dark: 'bg-dark'
	};

	const paddingClasses = {
		default: 'padding-default',
		large: 'padding-large',
		none: 'padding-none'
	};

	const maxWidthClasses = {
		default: 'max-width-default',
		wide: 'max-width-wide',
		full: 'max-width-full'
	};
</script>

<section
	{id}
	class="section-wrapper {bgClasses[background]} {paddingClasses[padding]} {className}"
	class:revealed
	bind:this={sectionRef}
>
	<div class="section-content {maxWidthClasses[maxWidth]}">
		{@render children()}
	</div>
</section>

<style>
	.section-wrapper {
		position: relative;
		width: 100%;
		opacity: 0;
		transform: translateY(40px);
		transition:
			opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1),
			transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.section-wrapper.revealed {
		opacity: 1;
		transform: translateY(0);
	}

	/* Backgrounds — no backdrop-filter for scroll performance */
	.bg-white {
		background: rgba(219, 232, 244, 0.85);
	}

	.bg-gray {
		background: rgba(248, 250, 252, 0.8);
	}

	.bg-gradient {
		background: linear-gradient(180deg, rgba(219, 232, 244, 0.85) 0%, rgba(248, 250, 252, 0.8) 100%);
	}

	.bg-dark {
		background: #1D1D1F;
	}

	/* Padding */
	.padding-default {
		padding: 80px 24px;
	}

	.padding-large {
		padding: 120px 24px;
	}

	.padding-none {
		padding: 0 24px;
	}

	@media (min-width: 768px) {
		.padding-default {
			padding: 120px 40px;
		}

		.padding-large {
			padding: 160px 40px;
		}

		.padding-none {
			padding: 0 40px;
		}
	}

	/* Max Width */
	.section-content {
		width: 100%;
		margin: 0 auto;
	}

	.max-width-default {
		max-width: 1280px;
	}

	.max-width-wide {
		max-width: 1440px;
	}

	.max-width-full {
		max-width: none;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.section-wrapper {
			opacity: 1;
			transform: none;
			transition: none;
		}
	}
</style>

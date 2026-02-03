<script lang="ts">
	import { tilt } from '$lib/animations';

	interface Props {
		variant?: 'glass' | 'solid' | 'outline' | 'gradient';
		hover?: boolean;
		tiltEffect?: boolean;
		padding?: 'none' | 'sm' | 'md' | 'lg';
		class?: string;
		children?: import('svelte').Snippet;
	}

	let {
		variant = 'glass',
		hover = true,
		tiltEffect = false,
		padding = 'md',
		class: className = '',
		children
	}: Props = $props();
</script>

{#if tiltEffect}
	<div
		class="card card-{variant} card-padding-{padding} {className}"
		class:card-hover={hover}
		use:tilt={{ maxTilt: 8, scale: 1.02 }}
	>
		{#if children}
			{@render children()}
		{/if}
	</div>
{:else}
	<div class="card card-{variant} card-padding-{padding} {className}" class:card-hover={hover}>
		{#if children}
			{@render children()}
		{/if}
	</div>
{/if}

<style>
	.card {
		border-radius: var(--radius-lg);
		transition: all var(--duration-normal) var(--ease-out-expo);
		box-shadow: var(--shadow-sm);
	}

	/* Padding variants */
	.card-padding-none {
		padding: 0;
	}

	.card-padding-sm {
		padding: var(--space-4);
	}

	.card-padding-md {
		padding: var(--space-6);
	}

	.card-padding-lg {
		padding: var(--space-8);
	}

	/* Glass variant */
	.card-glass {
		background: var(--glass-white-5);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		border: 1px solid var(--glass-white-10);
		box-shadow:
			var(--blu-shadow-xl),
			0 4px 20px var(--glass-black-20);
	}

	/* Solid variant */
	.card-solid {
		background: var(--blu-bg-card);
		border: 1px solid var(--glass-white-5);
		box-shadow: var(--blu-shadow-card);
	}

	/* Outline variant */
	.card-outline {
		background: transparent;
		border: 1px solid var(--glass-white-10);
	}

	/* Gradient variant */
	.card-gradient {
		background: linear-gradient(to bottom right, var(--glass-white-10), var(--glass-white-5));
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		border: 1px solid var(--glass-white-10);
		box-shadow:
			var(--blu-shadow-xl),
			0 4px 20px var(--glass-black-20);
	}

	/* Hover effects */
	.card-hover {
		cursor: pointer;
	}

	.card-hover:hover {
		border-color: var(--glass-white-20);
		box-shadow:
			var(--blu-shadow-2xl),
			0 8px 32px var(--glass-primary-10);
		transform: translateY(-4px);
	}

	.card-hover:active {
		transform: translateY(-2px) scale(var(--tap-scale));
		transition: transform var(--tap-duration) ease;
	}

	/* Focus styles for accessibility */
	.card:focus-visible {
		outline: 2px solid var(--blu-primary);
		outline-offset: 2px;
	}
</style>

<script lang="ts">
	interface Props {
		opacity?: number;
	}

	let { opacity = 0.03 }: Props = $props();
</script>

<div class="noise-overlay" style="--noise-opacity: {opacity}"></div>

<style>
	.noise-overlay {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 9998;
		opacity: var(--noise-opacity, 0.03);
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
		background-repeat: repeat;
		mix-blend-mode: overlay;
	}

	@media (prefers-reduced-motion: reduce) {
		.noise-overlay {
			display: none;
		}
	}
</style>

<script lang="ts">
	interface Props {
		opacity?: number;
		size?: number;
		color?: string;
		fade?: boolean;
	}

	let {
		opacity = 0.3,
		size = 60,
		color = 'var(--gray-200, #e2e8f0)',
		fade = true
	}: Props = $props();
</script>

<div
	class="grid-background"
	class:fade
	style="
		--grid-opacity: {opacity};
		--grid-size: {size}px;
		--grid-color: {color};
	"
></div>

<style>
	.grid-background {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background-image:
			linear-gradient(var(--grid-color) 1px, transparent 1px),
			linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
		background-size: var(--grid-size) var(--grid-size);
		opacity: var(--grid-opacity);
	}

	.grid-background.fade {
		mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
		-webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
	}
</style>

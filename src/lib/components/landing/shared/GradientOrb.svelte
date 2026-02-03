<script lang="ts">
	interface Props {
		color?: string;
		size?: number;
		top?: string;
		left?: string;
		right?: string;
		bottom?: string;
		blur?: number;
		opacity?: number;
		animate?: boolean;
		delay?: number;
	}

	let {
		color = 'rgba(0, 102, 255, 0.15)',
		size = 300,
		top,
		left,
		right,
		bottom,
		blur = 80,
		opacity = 0.5,
		animate = true,
		delay = 0
	}: Props = $props();
</script>

<div
	class="gradient-orb"
	class:animate
	style="
		--orb-color: {color};
		--orb-size: {size}px;
		--orb-blur: {blur}px;
		--orb-opacity: {opacity};
		--orb-delay: {delay}s;
		{top ? `top: ${top};` : ''}
		{left ? `left: ${left};` : ''}
		{right ? `right: ${right};` : ''}
		{bottom ? `bottom: ${bottom};` : ''}
	"
></div>

<style>
	.gradient-orb {
		position: absolute;
		width: var(--orb-size);
		height: var(--orb-size);
		background: radial-gradient(circle, var(--orb-color) 0%, transparent 70%);
		border-radius: 50%;
		filter: blur(var(--orb-blur));
		opacity: var(--orb-opacity);
		pointer-events: none;
	}

	.gradient-orb.animate {
		animation: float 20s ease-in-out infinite;
		animation-delay: var(--orb-delay);
	}

	@keyframes float {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		25% {
			transform: translate(10px, -15px) scale(1.05);
		}
		50% {
			transform: translate(-5px, 10px) scale(0.95);
		}
		75% {
			transform: translate(-10px, -5px) scale(1.02);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.gradient-orb.animate {
			animation: none;
		}
	}
</style>

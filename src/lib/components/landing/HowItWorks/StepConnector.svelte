<script lang="ts">
	interface Props {
		animated?: boolean;
		delay?: number;
	}

	let { animated = false, delay = 0 }: Props = $props();
</script>

<div class="step-connector" class:animated style="--delay: {delay}s">
	<svg viewBox="0 0 80 20" fill="none" preserveAspectRatio="none">
		<path
			d="M0 10 L80 10"
			stroke="url(#connector-gradient)"
			stroke-width="2"
			stroke-dasharray="6 4"
			class="connector-line"
		/>
		<defs>
			<linearGradient id="connector-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
				<stop offset="0%" stop-color="var(--blu-primary, #0066FF)" />
				<stop offset="100%" stop-color="var(--blu-accent-cyan, #0EA5E9)" />
			</linearGradient>
		</defs>
	</svg>
</div>

<style>
	.step-connector {
		display: none;
		width: 80px;
		height: 20px;
		flex-shrink: 0;
	}

	@media (min-width: 900px) {
		.step-connector {
			display: block;
		}
	}

	.step-connector svg {
		width: 100%;
		height: 100%;
	}

	.connector-line {
		stroke-dashoffset: 100;
		opacity: 0.5;
	}

	.step-connector.animated .connector-line {
		animation: draw-line 1s ease-out forwards;
		animation-delay: var(--delay);
	}

	@keyframes draw-line {
		from {
			stroke-dashoffset: 100;
			opacity: 0.3;
		}
		to {
			stroke-dashoffset: 0;
			opacity: 0.7;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.connector-line {
			stroke-dashoffset: 0;
			opacity: 0.5;
		}

		.step-connector.animated .connector-line {
			animation: none;
		}
	}
</style>

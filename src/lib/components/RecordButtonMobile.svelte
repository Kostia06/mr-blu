<script lang="ts">
	interface Props {
		isRecording?: boolean;
		isPaused?: boolean;
		isDisabled?: boolean;
		audioLevel?: number;
		onclick?: () => void;
	}

	let {
		isRecording = false,
		isPaused = false,
		isDisabled = false,
		audioLevel = 0,
		onclick
	}: Props = $props();

	const isActive = $derived(isRecording && !isPaused);
</script>

<button
	class="record-btn"
	class:recording={isActive}
	class:paused={isPaused}
	class:disabled={isDisabled}
	{onclick}
	disabled={isDisabled}
	aria-label={isRecording ? (isPaused ? 'Resume recording' : 'Stop recording') : 'Start recording'}
>
	<div class="record-btn-wrapper">
		<!-- Pulse rings (only when actively recording) -->
		{#if isActive}
			<div class="pulse-rings">
				<div class="ring"></div>
				<div class="ring delay-1"></div>
				<div class="ring delay-2"></div>
			</div>
		{/if}

		<div class="glow-ring" class:active={isActive}></div>
		<div class="orb" class:active={isActive}>
			<!-- Pulsing center glow -->
			<div class="gradient-pulse"></div>
			<!-- Cloud texture layers -->
			<div class="cloud-layer layer-1"></div>
			<div class="cloud-layer layer-2"></div>
			<div class="cloud-layer layer-3"></div>
			<div class="ambient-light"></div>

			<!-- Stop square (only when actively recording) -->
			{#if isActive}
				<div class="icon-wrapper">
					<div class="stop-square"></div>
				</div>
			{/if}
		</div>
	</div>
</button>

<style>
	.record-btn {
		position: relative;
		width: 200px;
		height: 200px;
		border: none;
		background: transparent;
		cursor: pointer;
		padding: 0;
		outline: none;
		-webkit-tap-highlight-color: transparent;
	}

	.record-btn:focus-visible {
		outline: 3px solid rgba(0, 102, 255, 0.5);
		outline-offset: 8px;
		border-radius: 50%;
	}

	.record-btn.disabled {
		opacity: 0.5;
		cursor: not-allowed;
		pointer-events: none;
	}

	.record-btn-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Pulse rings that emanate outward during recording */
	.pulse-rings {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.ring {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 160px;
		height: 160px;
		border-radius: 50%;
		border: 2px solid rgba(0, 102, 255, 0.12);
		animation: pulse-out 3s ease-out infinite;
	}

	.ring.delay-1 {
		animation-delay: 1s;
	}
	.ring.delay-2 {
		animation-delay: 2s;
	}

	@keyframes pulse-out {
		0% {
			width: 160px;
			height: 160px;
			opacity: 0.4;
		}
		100% {
			width: 260px;
			height: 260px;
			opacity: 0;
		}
	}

	.glow-ring {
		position: absolute;
		inset: -15px;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			rgba(56, 189, 248, 0.15) 0%,
			rgba(14, 165, 233, 0.08) 50%,
			transparent 70%
		);
		opacity: 0.7;
		pointer-events: none;
		filter: blur(12px);
		animation: glowPulse 3s ease-in-out infinite;
	}

	.glow-ring.active {
		background: radial-gradient(
			circle,
			rgba(0, 102, 255, 0.2) 0%,
			rgba(14, 165, 233, 0.12) 50%,
			transparent 70%
		);
		animation: softGlow 2s ease-in-out infinite;
	}

	.orb {
		position: relative;
		width: 160px;
		height: 160px;
		border-radius: 50%;
		overflow: hidden;
		background: radial-gradient(
			ellipse at 50% 40%,
			#bae6fd 0%,
			#7dd3fc 20%,
			#38bdf8 40%,
			#0ea5e9 60%,
			#0284c7 80%,
			#0369a1 100%
		);
		box-shadow:
			0 8px 40px rgba(14, 165, 233, 0.35),
			0 0 60px rgba(56, 189, 248, 0.2),
			inset 0 0 40px rgba(186, 230, 253, 0.3);
		animation:
			orbFloat 6s ease-in-out infinite,
			orbBreathe 4s ease-in-out infinite;
		-webkit-mask-image: -webkit-radial-gradient(white, white);
	}

	.orb.active {
		animation: softBreathe 2s ease-in-out infinite;
	}

	/* Cloud texture layers */
	.cloud-layer {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		pointer-events: none;
		mix-blend-mode: soft-light;
	}

	.cloud-layer.layer-1 {
		background:
			radial-gradient(
				ellipse 120% 100% at 30% 20%,
				rgba(219, 232, 244, 0.7) 0%,
				rgba(219, 232, 244, 0.3) 30%,
				transparent 60%
			),
			radial-gradient(ellipse 80% 60% at 70% 80%, rgba(219, 232, 244, 0.4) 0%, transparent 50%);
		opacity: 0.9;
		animation: cloudDrift1 12s ease-in-out infinite;
	}

	.cloud-layer.layer-2 {
		background:
			radial-gradient(ellipse 100% 80% at 60% 30%, rgba(224, 242, 254, 0.6) 0%, transparent 50%),
			radial-gradient(ellipse 70% 90% at 20% 70%, rgba(186, 230, 253, 0.5) 0%, transparent 45%);
		opacity: 0.8;
		animation: cloudDrift2 15s ease-in-out infinite;
	}

	.cloud-layer.layer-3 {
		background:
			radial-gradient(ellipse 60% 50% at 75% 25%, rgba(219, 232, 244, 0.5) 0%, transparent 40%),
			radial-gradient(ellipse 50% 70% at 35% 60%, rgba(125, 211, 252, 0.4) 0%, transparent 50%);
		opacity: 0.7;
		animation: cloudDrift3 10s ease-in-out infinite;
	}

	.ambient-light {
		position: absolute;
		top: 5%;
		left: 15%;
		width: 50%;
		height: 35%;
		background: radial-gradient(
			ellipse,
			rgba(219, 232, 244, 0.4) 0%,
			rgba(219, 232, 244, 0.15) 40%,
			transparent 70%
		);
		border-radius: 50%;
		pointer-events: none;
		transform: rotate(-10deg);
		opacity: 0.8;
	}

	/* Pulsing center glow */
	.gradient-pulse {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			ellipse at center,
			rgba(186, 230, 253, 0.5) 0%,
			rgba(56, 189, 248, 0.3) 40%,
			transparent 70%
		);
		animation: gradientPulse 4s ease-in-out infinite;
		border-radius: 50%;
	}

	/* Stop square icon */
	.icon-wrapper {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stop-square {
		width: 40px;
		height: 40px;
		background: rgba(255, 255, 255, 0.92);
		border-radius: 10px;
	}

	/* Animations */
	@keyframes orbFloat {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-8px);
		}
	}

	@keyframes orbBreathe {
		0%,
		100% {
			box-shadow:
				0 8px 40px rgba(14, 165, 233, 0.35),
				0 0 60px rgba(56, 189, 248, 0.2),
				inset 0 0 40px rgba(186, 230, 253, 0.3);
		}
		50% {
			box-shadow:
				0 10px 50px rgba(14, 165, 233, 0.4),
				0 0 70px rgba(56, 189, 248, 0.25),
				inset 0 0 50px rgba(186, 230, 253, 0.35);
		}
	}

	@keyframes softBreathe {
		0%,
		100% {
			box-shadow:
				0 8px 32px rgba(0, 102, 255, 0.3),
				0 0 40px rgba(0, 102, 255, 0.1),
				inset 0 0 40px rgba(186, 230, 253, 0.3);
		}
		50% {
			box-shadow:
				0 8px 32px rgba(0, 102, 255, 0.4),
				0 0 60px rgba(0, 102, 255, 0.2),
				inset 0 0 50px rgba(186, 230, 253, 0.35);
		}
	}

	@keyframes softGlow {
		0%,
		100% {
			opacity: 0.6;
			transform: scale(1);
		}
		50% {
			opacity: 0.9;
			transform: scale(1.04);
		}
	}

	@keyframes glowPulse {
		0%,
		100% {
			opacity: 0.5;
			transform: scale(1);
		}
		50% {
			opacity: 0.8;
			transform: scale(1.05);
		}
	}

	@keyframes gradientPulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 0.5;
		}
		50% {
			transform: scale(1.15);
			opacity: 0.8;
		}
	}

	@keyframes cloudDrift1 {
		0%,
		100% {
			transform: translate(0, 0) rotate(0deg);
		}
		25% {
			transform: translate(3%, -2%) rotate(2deg);
		}
		50% {
			transform: translate(1%, 2%) rotate(-1deg);
		}
		75% {
			transform: translate(-2%, 1%) rotate(1deg);
		}
	}

	@keyframes cloudDrift2 {
		0%,
		100% {
			transform: translate(0, 0) rotate(0deg);
		}
		33% {
			transform: translate(-2%, 3%) rotate(-2deg);
		}
		66% {
			transform: translate(2%, -1%) rotate(1deg);
		}
	}

	@keyframes cloudDrift3 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		50% {
			transform: translate(2%, 2%) scale(1.02);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.orb,
		.glow-ring,
		.cloud-layer,
		.gradient-pulse,
		.ring {
			animation: none;
		}

		.orb.active {
			animation: none;
		}
	}
</style>

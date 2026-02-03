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
	aria-label={isRecording ? (isPaused ? 'Resume recording' : 'Pause recording') : 'Start recording'}
>
	<div class="record-btn-wrapper">
		<div class="glow-ring" class:recording={isActive}></div>
		<div class="orb" class:recording={isActive}>
			<!-- Pulsing center glow -->
			<div class="gradient-pulse"></div>
			<!-- Cloud texture layers -->
			<div class="cloud-layer layer-1"></div>
			<div class="cloud-layer layer-2"></div>
			<div class="cloud-layer layer-3"></div>
			<div class="ambient-light"></div>

			<!-- Icons -->
			{#if isActive}
				<!-- Pause icon -->
				<div class="icon-wrapper">
					<div class="pause-bar"></div>
					<div class="pause-bar"></div>
				</div>
			{:else if isPaused}
				<!-- Play icon -->
				<div class="icon-wrapper">
					<div class="play-icon"></div>
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

	.glow-ring.recording {
		background: radial-gradient(
			circle,
			rgba(239, 68, 68, 0.2) 0%,
			rgba(220, 38, 38, 0.1) 50%,
			transparent 70%
		);
		animation: glowPulse 2s ease-in-out infinite;
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
	}

	.orb.recording {
		background: radial-gradient(
			ellipse at 50% 40%,
			#fca5a5 0%,
			#f87171 20%,
			#ef4444 40%,
			#dc2626 60%,
			#b91c1c 80%,
			#991b1b 100%
		);
		box-shadow:
			0 8px 40px rgba(239, 68, 68, 0.35),
			0 0 60px rgba(248, 113, 113, 0.2),
			inset 0 0 40px rgba(254, 202, 202, 0.3);
		animation: orbBreathe 2s ease-in-out infinite;
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

	.orb.recording .gradient-pulse {
		background: radial-gradient(
			ellipse at center,
			rgba(254, 202, 202, 0.5) 0%,
			rgba(248, 113, 113, 0.3) 40%,
			transparent 70%
		);
	}

	/* Icons */
	.icon-wrapper {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
	}

	.pause-bar {
		width: 16px;
		height: 52px;
		background: rgba(255, 255, 255, 0.95);
		border-radius: 6px;
	}

	.play-icon {
		width: 0;
		height: 0;
		border-left: 44px solid rgba(255, 255, 255, 0.95);
		border-top: 28px solid transparent;
		border-bottom: 28px solid transparent;
		margin-left: 8px;
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

	.orb.recording {
		animation: orbBreatheRecording 2s ease-in-out infinite;
	}

	@keyframes orbBreatheRecording {
		0%,
		100% {
			box-shadow:
				0 8px 40px rgba(239, 68, 68, 0.35),
				0 0 60px rgba(248, 113, 113, 0.2),
				inset 0 0 40px rgba(254, 202, 202, 0.3);
		}
		50% {
			box-shadow:
				0 10px 50px rgba(239, 68, 68, 0.45),
				0 0 70px rgba(248, 113, 113, 0.3),
				inset 0 0 50px rgba(254, 202, 202, 0.4);
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
		.gradient-pulse {
			animation: none;
		}
	}
</style>

<script lang="ts">
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import { t } from '$lib/i18n';

	interface Props {
		message?: string;
		currentStep?: number; // 0, 1, or 2
	}

	let { message, currentStep = 0 }: Props = $props();
</script>

<div class="processing-ui">
	<div class="processing-visual">
		<div class="processing-ring"></div>
		<div class="processing-ring inner"></div>
		<div class="processing-icon">
			<Sparkles size={32} strokeWidth={1.5} />
		</div>
	</div>

	<h2 class="processing-title">{$t('dashboard.processing')}</h2>
	<p class="processing-desc">{message || $t('dashboard.aiUnderstanding')}</p>

	<div class="processing-steps">
		<div class="step" class:active={currentStep >= 0}>
			<div class="step-dot"></div>
			<span>{$t('dashboard.parsingRequest')}</span>
		</div>
		<div class="step" class:active={currentStep >= 1}>
			<div class="step-dot"></div>
			<span>{$t('dashboard.identifyingType')}</span>
		</div>
		<div class="step" class:active={currentStep >= 2}>
			<div class="step-dot"></div>
			<span>{$t('dashboard.extractingDetails')}</span>
		</div>
	</div>
</div>

<style>
	.processing-ui {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px var(--page-padding-x, 20px);
		text-align: center;
	}

	.processing-visual {
		position: relative;
		width: 120px;
		height: 120px;
		margin-bottom: var(--space-8, 32px);
	}

	.processing-ring {
		position: absolute;
		inset: 0;
		border: 2px solid transparent;
		border-top-color: var(--blu-primary, #0066ff);
		border-radius: 50%;
		animation: processing-spin 1.2s linear infinite;
	}

	.processing-ring.inner {
		inset: 15px;
		border-top-color: rgba(0, 102, 255, 0.3);
		animation-direction: reverse;
		animation-duration: 0.8s;
	}

	@keyframes processing-spin {
		to {
			transform: rotate(360deg);
		}
	}

	.processing-icon {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--blu-primary, #0066ff);
	}

	.processing-title {
		font-size: 20px;
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		margin: 0 0 8px 0;
		letter-spacing: -0.02em;
	}

	.processing-desc {
		font-size: 15px;
		color: var(--gray-500, #64748b);
		margin: 0 0 32px 0;
	}

	.processing-steps {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.step {
		display: flex;
		align-items: center;
		gap: 12px;
		font-size: 14px;
		color: var(--gray-400, #94a3b8);
		transition: all 0.3s ease;
	}

	.step.active {
		color: var(--blu-primary, #0066ff);
	}

	.step-dot {
		width: 8px;
		height: 8px;
		background: var(--gray-300, #cbd5e1);
		border-radius: 50%;
		transition: all 0.3s ease;
	}

	.step.active .step-dot {
		background: var(--blu-primary, #0066ff);
		animation: dot-pulse 1s ease-in-out infinite;
	}

	@keyframes dot-pulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.3);
			opacity: 0.8;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.processing-ring,
		.step.active .step-dot {
			animation: none;
		}
	}
</style>

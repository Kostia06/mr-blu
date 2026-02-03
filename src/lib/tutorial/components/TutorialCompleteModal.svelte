<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import PartyPopper from 'lucide-svelte/icons/party-popper';
	import Lightbulb from 'lucide-svelte/icons/lightbulb';
	import { t } from '$lib/i18n';
	import { tutorialStore } from '../store.svelte';

	const { closeCompleteModal, state } = tutorialStore;
</script>

{#if state.showCompleteModal}
	<!-- Backdrop -->
	<div class="modal-backdrop" transition:fade={{ duration: 200 }} role="presentation"></div>

	<!-- Modal -->
	<div
		class="modal-container"
		transition:fly={{ y: 20, duration: 300, easing: cubicOut }}
		role="dialog"
		aria-modal="true"
		aria-labelledby="complete-title"
	>
		<div class="modal-content">
			<!-- Confetti-like decorations -->
			<div class="confetti-container">
				<div class="confetti c1"></div>
				<div class="confetti c2"></div>
				<div class="confetti c3"></div>
				<div class="confetti c4"></div>
				<div class="confetti c5"></div>
			</div>

			<!-- Success icon -->
			<div class="modal-icon">
				<PartyPopper size={36} strokeWidth={1.5} />
			</div>

			<!-- Title -->
			<h2 id="complete-title" class="modal-title">
				{$t('tutorial.completeModal.title')}
			</h2>

			<!-- Description -->
			<p class="modal-description">
				{$t('tutorial.completeModal.description')}
			</p>

			<!-- Tip box -->
			<div class="tip-box">
				<div class="tip-icon">
					<Lightbulb size={18} />
				</div>
				<div class="tip-content">
					<span class="tip-label">{$t('tutorial.completeModal.tipTitle')}</span>
					<p class="tip-text">{$t('tutorial.completeModal.tipDescription')}</p>
				</div>
			</div>

			<!-- CTA -->
			<button class="start-btn" onclick={closeCompleteModal}>
				{$t('tutorial.completeModal.startCreating')}
			</button>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		z-index: 1000;
	}

	.modal-container {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		z-index: 1001;
		pointer-events: none;
	}

	.modal-content {
		position: relative;
		background: white;
		border-radius: 24px;
		padding: 32px;
		max-width: 380px;
		width: 100%;
		text-align: center;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
		pointer-events: auto;
		overflow: hidden;
	}

	/* Confetti decorations */
	.confetti-container {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
	}

	.confetti {
		position: absolute;
		width: 10px;
		height: 10px;
		border-radius: 2px;
		animation: confetti-fall 3s ease-out forwards;
	}

	.confetti.c1 {
		background: #0066ff;
		left: 10%;
		animation-delay: 0s;
	}

	.confetti.c2 {
		background: #10b981;
		left: 30%;
		animation-delay: 0.2s;
	}

	.confetti.c3 {
		background: #f59e0b;
		left: 50%;
		animation-delay: 0.1s;
	}

	.confetti.c4 {
		background: #ef4444;
		left: 70%;
		animation-delay: 0.3s;
	}

	.confetti.c5 {
		background: #8b5cf6;
		left: 90%;
		animation-delay: 0.15s;
	}

	@keyframes confetti-fall {
		0% {
			transform: translateY(-20px) rotate(0deg);
			opacity: 1;
		}
		100% {
			transform: translateY(400px) rotate(720deg);
			opacity: 0;
		}
	}

	.modal-icon {
		width: 80px;
		height: 80px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.25));
		border-radius: 24px;
		margin: 0 auto 24px;
		color: var(--data-green, #10b981);
		animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
	}

	@keyframes bounce-in {
		0% {
			transform: scale(0);
		}
		50% {
			transform: scale(1.1);
		}
		100% {
			transform: scale(1);
		}
	}

	.modal-title {
		font-size: 24px;
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		margin: 0 0 12px;
		letter-spacing: -0.02em;
	}

	.modal-description {
		font-size: 15px;
		color: var(--gray-600, #475569);
		line-height: 1.6;
		margin: 0 0 24px;
	}

	.tip-box {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		background: var(--gray-50, #f8fafc);
		border-radius: 12px;
		text-align: left;
		margin-bottom: 24px;
	}

	.tip-icon {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(245, 158, 11, 0.15);
		border-radius: 8px;
		color: var(--data-amber, #f59e0b);
		flex-shrink: 0;
	}

	.tip-content {
		flex: 1;
		min-width: 0;
	}

	.tip-label {
		display: block;
		font-size: 14px;
		font-weight: 600;
		color: var(--gray-900, #0f172a);
		margin-bottom: 4px;
	}

	.tip-text {
		font-size: 13px;
		color: var(--gray-600, #475569);
		line-height: 1.5;
		margin: 0;
	}

	.start-btn {
		width: 100%;
		padding: 16px 24px;
		background: var(--blu-primary, #0066ff);
		color: white;
		border: none;
		border-radius: 14px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.start-btn:hover {
		background: #0052cc;
		transform: translateY(-1px);
		box-shadow: 0 8px 24px rgba(0, 102, 255, 0.3);
	}

	.start-btn:active {
		transform: scale(0.98);
	}

	@media (prefers-reduced-motion: reduce) {
		.confetti {
			animation: none;
			display: none;
		}

		.modal-icon {
			animation: none;
		}

		.start-btn:hover {
			transform: none;
		}

		.start-btn:active {
			transform: none;
		}
	}

	/* Mobile */
	@media (max-width: 480px) {
		.modal-content {
			padding: 24px;
			margin: 16px;
		}

		.modal-title {
			font-size: 20px;
		}
	}
</style>

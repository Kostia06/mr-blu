<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Compass from 'lucide-svelte/icons/compass';
	import X from 'lucide-svelte/icons/x';
	import { t } from '$lib/i18n';
	import { tutorialStore } from '../store.svelte';

	const { skipTutorial } = tutorialStore;

	let userName = $state('');

	function handleStartTutorial() {
		tutorialStore.startTutorial(userName || undefined);
	}
</script>

{#if tutorialStore.state.showStartModal}
	<!-- Backdrop -->
	<div class="modal-backdrop" transition:fade={{ duration: 200 }} role="presentation"></div>

	<!-- Modal -->
	<div
		class="modal-container"
		transition:fly={{ y: 20, duration: 300, easing: cubicOut }}
		role="dialog"
		aria-modal="true"
		aria-labelledby="tutorial-title"
	>
		<div class="modal-content">
			<!-- Close button -->
			<button class="close-btn" onclick={skipTutorial} aria-label={$t('common.close')}>
				<X size={20} />
			</button>

			<!-- Icon -->
			<div class="modal-icon">
				<Compass size={32} strokeWidth={1.5} />
			</div>

			<!-- Title -->
			<h2 id="tutorial-title" class="modal-title">
				{$t('tutorial.startModal.title')}
			</h2>

			<!-- Description -->
			<p class="modal-description">
				{$t('tutorial.startModal.description')}
			</p>

			<!-- Time estimate -->
			<p class="modal-time">
				{$t('tutorial.startModal.timeEstimate')}
			</p>

			<!-- Name input -->
			<div class="name-input-container">
				<label for="tutorial-name" class="name-label">
					{$t('tutorial.startModal.nameQuestion') || "What's your first name?"}
				</label>
				<input
					type="text"
					id="tutorial-name"
					class="name-input"
					bind:value={userName}
					placeholder={$t('tutorial.startModal.namePlaceholder') || 'Your name'}
					autocomplete="given-name"
				/>
				<p class="name-hint">
					{$t('tutorial.startModal.nameHint') || 'Optional, but helps personalize your experience'}
				</p>
			</div>

			<!-- Actions -->
			<div class="modal-actions">
				<button class="start-btn" onclick={handleStartTutorial}>
					{$t('tutorial.startModal.startTour')}
				</button>

				<button class="skip-btn" onclick={skipTutorial}>
					{$t('tutorial.startModal.skip')}
				</button>
			</div>
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
	}

	.close-btn {
		position: absolute;
		top: 16px;
		right: 16px;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.05);
		border: none;
		border-radius: 10px;
		color: var(--gray-500, #64748b);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.close-btn:hover {
		background: rgba(0, 0, 0, 0.1);
		color: var(--gray-700, #334155);
	}

	.modal-icon {
		width: 72px;
		height: 72px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, rgba(0, 102, 255, 0.1), rgba(0, 102, 255, 0.2));
		border-radius: 20px;
		margin: 0 auto 24px;
		color: var(--blu-primary, #0066ff);
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
		margin: 0 0 8px;
	}

	.modal-time {
		font-size: 13px;
		color: var(--gray-400, #94a3b8);
		margin: 0 0 20px;
	}

	.name-input-container {
		margin-bottom: 24px;
		text-align: left;
	}

	.name-label {
		display: block;
		font-size: 14px;
		font-weight: 500;
		color: var(--gray-700, #334155);
		margin-bottom: 8px;
	}

	.name-input {
		width: 100%;
		padding: 14px 16px;
		border: 1px solid var(--gray-200, #e2e8f0);
		border-radius: 12px;
		font-size: 15px;
		color: var(--gray-900, #0f172a);
		background: var(--gray-50, #f8fafc);
		transition: all 0.2s ease;
		outline: none;
		box-sizing: border-box;
	}

	.name-input::placeholder {
		color: var(--gray-400, #94a3b8);
	}

	.name-input:focus {
		border-color: var(--blu-primary, #0066ff);
		background: white;
		box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
	}

	.name-hint {
		font-size: 12px;
		color: var(--gray-400, #94a3b8);
		margin: 8px 0 0;
		text-align: center;
	}

	.modal-actions {
		display: flex;
		flex-direction: column;
		gap: 12px;
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

	.skip-btn {
		background: none;
		border: none;
		color: var(--gray-500, #64748b);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		padding: 8px;
		transition: color 0.15s ease;
	}

	.skip-btn:hover {
		color: var(--gray-700, #334155);
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

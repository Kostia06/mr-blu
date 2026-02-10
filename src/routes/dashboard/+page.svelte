<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { PENDING_REVIEW_PREVIEW_LENGTH } from '$lib/constants';
	import { cubicOut } from 'svelte/easing';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import X from 'lucide-svelte/icons/x';
	import User from 'lucide-svelte/icons/user';
	import Keyboard from 'lucide-svelte/icons/keyboard';
	import FileText from 'lucide-svelte/icons/file-text';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import { t } from '$lib/i18n';
	import { toast } from '$lib/stores/toast';
	import RecordButton from '$lib/components/RecordButtonMobile.svelte';
	import { inputPreferences, type InputMode } from '$lib/stores/inputPreferences';
	import { isRecordingMode as isRecordingModeStore } from '$lib/stores/appState';
	import { createVoiceRecording } from '$lib/stores/voiceRecording.svelte';

	let { data } = $props();

	// Check for existing review session from server data (persistent across browser restarts)
	const pendingReview = $derived(data.pendingReview);
	let pendingReviewDismissed = $state(false);

	// Get user from session (use $derived for reactivity)
	const user = $derived(data.session?.user);
	const fullName = $derived(
		user?.user_metadata?.full_name || user?.user_metadata?.first_name || ''
	);
	const firstName = $derived(fullName.split(' ')[0] || '');
	const hasName = $derived(firstName.length > 0);

	// Voice recording composable
	const voice = createVoiceRecording();

	// Input mode from preferences store
	let inputMode = $state<InputMode>('voice');
	let prefsUnsubscribe: (() => void) | null = null;

	// svelte-ignore non_reactive_update
	let transcriptTextarea: HTMLTextAreaElement | null = null;

	// Name banner dismissal state
	let nameBannerDismissed = $state(false);

	// Subscribe to translations
	let translate = $state((key: string) => key);
	$effect(() => {
		const unsub = t.subscribe((v) => (translate = v));
		return unsub;
	});

	// Derived state from voice composable (template-friendly aliases)
	const currentState = $derived(voice.currentState);
	const transcript = $derived(voice.transcript);
	const interimTranscript = $derived(voice.interimTranscript);
	const displayTranscript = $derived(voice.displayTranscript);
	const audioLevel = $derived(voice.audioLevel);
	const error = $derived(voice.error);
	const isRecordingActive = $derived(voice.isRecordingActive);
	const isNoisyEnvironment = $derived(voice.isNoisyEnvironment);
	const showNoisySuggestion = $derived(voice.showNoisySuggestion);
	const isPaused = $derived(currentState === 'paused');
	const isProcessing = $derived(currentState === 'processing');
	const canGenerate = $derived(
		transcript.trim().length > 0 && currentState !== 'recording' && currentState !== 'processing'
	);
	const isTypingMode = $derived(inputMode === 'text');
	const isRecordingMode = $derived(currentState !== 'idle');

	// Sync recording mode to global store for BottomNav visibility
	$effect(() => {
		isRecordingModeStore.set(currentState !== 'idle');
	});

	// Auto-scroll transcript textarea when content changes during recording
	$effect(() => {
		const _ = displayTranscript;
		if (transcriptTextarea && isRecordingActive) {
			transcriptTextarea.scrollTop = transcriptTextarea.scrollHeight;
		}
	});

	function handleButtonAction() {
		if (currentState === 'idle') {
			voice.startRecording(translate);
		} else if (currentState === 'recording') {
			voice.pauseRecording();
		} else if (currentState === 'paused') {
			if (!voice.hasMediaRecorder) {
				voice.startRecording(translate);
			} else {
				voice.resumeRecording();
			}
		}
	}

	async function handleGenerate() {
		if (!transcript.trim()) return;

		const savedTranscript = transcript.trim();
		voice.stopMediaResources();
		voice.setCurrentState('processing');

		// Clear any existing pending review when starting a new one
		if (pendingReview?.id) {
			try {
				await fetch(`/api/reviews/${pendingReview.id}`, { method: 'DELETE' });
			} catch (e) {
				console.error('Failed to clear pending review:', e);
			}
		}
		pendingReviewDismissed = true;

		try {
			sessionStorage.setItem('review_transcript', savedTranscript);
			goto('/dashboard/review');
		} catch {
			voice.setError('Failed to generate document');
			voice.setCurrentState('idle');
		}
	}

	function handleTranscriptChange(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		voice.setTranscript(target.value);
	}

	function switchToTypingMode() {
		if (currentState === 'recording') {
			voice.stopMediaResources();
		}
		inputMode = 'text';
		voice.resetNoiseState();
		voice.setCurrentState('paused');
	}

	function switchToVoiceMode() {
		inputMode = 'voice';
		voice.setCurrentState('paused');
	}

	function startTypingMode() {
		inputMode = 'text';
		voice.setCurrentState('paused');
		voice.setTranscript('');
	}

	function dismissNameBanner() {
		nameBannerDismissed = true;
		localStorage.setItem('nameBannerDismissed', 'true');
	}

	async function dismissPendingReview() {
		const reviewId = pendingReview?.id;

		if (!reviewId) {
			pendingReviewDismissed = true;
			return;
		}

		try {
			const response = await fetch(`/api/reviews/${reviewId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				pendingReviewDismissed = true;
				await invalidateAll();
			} else {
				console.error('Failed to delete pending review:', response.status);
				toast.error('Failed to delete draft');
			}
		} catch (error) {
			console.error('Failed to delete pending review:', error);
			toast.error('Failed to delete draft');
		}
	}

	function resumePendingReview() {
		if (pendingReview?.id) {
			goto(`/dashboard/review?session=${pendingReview.id}`);
		}
	}

	function getPendingReviewSummary(): string {
		if (!pendingReview) return '';
		const clientName = pendingReview.parsed_data?.client?.name;
		if (clientName) return clientName;
		if (pendingReview.summary) return pendingReview.summary;
		if (pendingReview.original_transcript) {
			return pendingReview.original_transcript.slice(0, PENDING_REVIEW_PREVIEW_LENGTH) + '...';
		}
		return translate('dashboard.unfinishedDoc');
	}

	onMount(async () => {
		inputPreferences.initialize();
		prefsUnsubscribe = inputPreferences.subscribe((prefs) => {
			inputMode = prefs.mode;
		});

		nameBannerDismissed = localStorage.getItem('nameBannerDismissed') === 'true';

		await voice.fetchDeepgramKey();
	});

	onDestroy(() => {
		voice.stopRecording();
		prefsUnsubscribe?.();
	});
</script>

<main class="dashboard-page">
	{#if isProcessing}
		<!-- Processing State -->
		<div class="processing-ui" in:fade={{ duration: 300 }}>
			<div class="processing-visual">
				<div class="processing-ring"></div>
				<div class="processing-ring inner"></div>
				<div class="processing-icon">
					<Sparkles size={32} strokeWidth={1.5} />
				</div>
			</div>
			<h2 class="processing-title">{translate('dashboard.processing')}</h2>
			<p class="processing-desc">{translate('dashboard.aiUnderstanding')}</p>
			<div class="processing-steps">
				<div class="step active">
					<div class="step-dot"></div>
					<span>{translate('dashboard.parsingRequest')}</span>
				</div>
				<div class="step">
					<div class="step-dot"></div>
					<span>{translate('dashboard.identifyingType')}</span>
				</div>
				<div class="step">
					<div class="step-dot"></div>
					<span>{translate('dashboard.extractingDetails')}</span>
				</div>
			</div>
		</div>
	{:else}
		<!-- Main UI (always visible) -->
		<div class="idle-ui">
			<!-- Header -->
			<header class="idle-header" in:fly={{ y: -20, duration: 400, easing: cubicOut }}>
				<div></div>
				<button
					class="settings-btn"
					onclick={() => goto('/dashboard/settings')}
					aria-label={translate('nav.settings')}
				>
					{#if user?.user_metadata?.avatar_url}
						<img
							src={user.user_metadata.avatar_url}
							alt="Profile"
							class="avatar-img"
							loading="lazy"
							decoding="async"
						/>
					{:else}
						<span class="avatar-letter"
							>{firstName[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}</span
						>
					{/if}
				</button>
			</header>

			<!-- Name Suggestion Banner -->
			{#if !hasName && !nameBannerDismissed}
				<div class="name-banner" in:fly={{ y: -10, duration: 300 }}>
					<User size={18} />
					<div class="name-banner-content">
						<strong>{translate('dashboard.addNameTitle')}</strong>
						<span>{translate('dashboard.addNameMessage')}</span>
					</div>
					<a href="/dashboard/settings/profile" class="name-banner-btn">
						{translate('dashboard.addNameAction')}
					</a>
					<button class="name-banner-close" onclick={dismissNameBanner}>
						<X size={16} />
					</button>
				</div>
			{/if}

			<!-- Main Content -->
			<div class="idle-content" in:fly={{ y: 20, duration: 500, delay: 100, easing: cubicOut }}>
				<!-- Record Button Section -->
				<section class="record-section">
					<div class="record-wrapper" data-tutorial="voice-button">
						<RecordButton
							isRecording={isRecordingActive || isPaused}
							{isPaused}
							{audioLevel}
							onclick={handleButtonAction}
						/>
					</div>


					<!-- Status text -->
					{#if isRecordingActive}
						<p class="record-hint" in:fade={{ duration: 200 }}>
							{translate('recording.listening')}
						</p>
					{:else if isPaused}
						<p class="record-hint" in:fade={{ duration: 200 }}>
							{translate('dashboard.tapToResume')}
						</p>
					{:else}
						<p class="record-hint">{translate('recording.tapToStart')}</p>
					{/if}

					{#if !isRecordingActive}
						<button class="type-option" onclick={startTypingMode}>
							<Keyboard size={16} strokeWidth={2} />
							<span>{translate('dashboard.orTypeInstead')}</span>
						</button>
					{/if}
				</section>
			</div>
		</div>

		<!-- Floating Transcript Popup -->
		{#if isRecordingMode}
			<div
				class="transcript-popup"
				class:has-content={displayTranscript.length > 0}
				in:fly={{ y: 100, duration: 400, easing: cubicOut }}
				out:fly={{ y: 100, duration: 300, easing: cubicOut }}
			>
				<!-- Header with timer and controls -->
				<div class="popup-header">
					<div class="popup-status">
						{#if isRecordingActive}
							<span class="popup-dot recording"></span>
							<span class="popup-label">{translate('recording.listening')}</span>
						{:else}
							<span class="popup-label">{translate('recording.transcript')}</span>
						{/if}
					</div>
					<div class="popup-actions">
						<button
							class="popup-close-btn"
							onclick={voice.stopRecording}
							aria-label={translate('common.cancel')}
						>
							<X size={16} strokeWidth={2} />
						</button>
					</div>
				</div>

				<!-- Transcript content -->
				<div class="popup-content">
					<textarea
						bind:this={transcriptTextarea}
						class="popup-textarea"
						value={displayTranscript}
						oninput={handleTranscriptChange}
						placeholder={inputMode === 'text'
							? translate('placeholder.typeRequest')
							: translate('dashboard.wordsAppearHere')}
						spellcheck="false"
						autocomplete="off"
						data-gramm="false"
						data-gramm_editor="false"
						data-enable-grammarly="false"
					></textarea>
					{#if interimTranscript && inputMode === 'voice'}
						<span class="popup-listening">
							<span class="dot"></span>
							<span class="dot"></span>
							<span class="dot"></span>
						</span>
					{/if}
				</div>

				<!-- Generate button -->
				<button
					class="popup-generate"
					class:ready={canGenerate}
					onclick={handleGenerate}
					disabled={!canGenerate}
				>
					<Sparkles size={18} strokeWidth={2} />
					<span>{translate('dashboard.generate')}</span>
				</button>
			</div>
		{/if}
	{/if}

	<!-- Pending Review Toast - Fixed above navbar -->
	{#if pendingReview && !pendingReviewDismissed}
		<div
			class="pending-review-card"
			role="button"
			tabindex="0"
			onclick={resumePendingReview}
			onkeydown={(e) => e.key === 'Enter' && resumePendingReview()}
			in:fly={{ y: 20, duration: 300 }}
		>
			<div class="pending-review-icon">
				<FileText size={18} />
			</div>
			<div class="pending-review-content">
				<strong>{translate('dashboard.continueDraft')}</strong>
				<span>{getPendingReviewSummary()}</span>
			</div>
			<button
				class="pending-review-close"
				onclick={async (e) => {
					e.stopPropagation();
					e.preventDefault();
					await dismissPendingReview();
				}}
				aria-label="Dismiss"
			>
				<X size={14} />
			</button>
		</div>
	{/if}
</main>

<style>
	.dashboard-page {
		position: relative;
		width: 100%;
		height: calc(100dvh - 80px - var(--safe-area-bottom, 0px));
		background: transparent;
		overflow: hidden;
	}

	/* ========== IDLE STATE ========== */
	.idle-ui {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.idle-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px var(--page-padding-x, 20px);
		padding-top: calc(16px + var(--safe-area-top, 0px));
	}

	.settings-btn {
		width: var(--avatar-lg);
		height: var(--avatar-lg);
		background: var(--avatar-gradient-1);
		border: none;
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--white);
		cursor: pointer;
		transition: all var(--duration-fast) ease;
		overflow: hidden;
	}

	.settings-btn:hover {
		transform: scale(1.05);
	}

	.settings-btn:active {
		transform: scale(0.95);
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-letter {
		font-size: var(--text-lg);
		font-weight: var(--font-bold);
	}

	/* Name Suggestion Banner */
	.name-banner {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin: 0 var(--page-padding-x, 20px) var(--space-4);
		padding: var(--space-3) var(--space-4);
		background: rgba(245, 158, 11, 0.1);
		border: 1px solid rgba(245, 158, 11, 0.3);
		border-radius: var(--radius-lg);
		color: #d97706;
	}

	.name-banner :global(svg) {
		flex-shrink: 0;
	}

	.name-banner-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.name-banner-content strong {
		font-size: var(--text-sm);
		font-weight: var(--font-semibold);
		color: #b45309;
	}

	.name-banner-content span {
		font-size: var(--text-xs);
		color: #d97706;
		opacity: 0.9;
	}

	.name-banner-btn {
		flex-shrink: 0;
		padding: var(--space-2) var(--space-3);
		background: rgba(245, 158, 11, 0.2);
		border: none;
		border-radius: var(--radius-md);
		font-size: var(--text-xs);
		font-weight: var(--font-semibold);
		color: #b45309;
		text-decoration: none;
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.name-banner-btn:hover {
		background: rgba(245, 158, 11, 0.3);
	}

	.name-banner-close {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		color: #d97706;
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.name-banner-close:hover {
		background: rgba(245, 158, 11, 0.2);
	}

	/* Pending Review Card - Top left under name, glassy white */
	.pending-review-card {
		position: fixed;
		top: calc(var(--safe-area-top, 0px) + 110px);
		left: 12px;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 36px 10px 12px;
		background: rgba(255, 255, 255, 0.45);
		backdrop-filter: blur(24px) saturate(180%);
		-webkit-backdrop-filter: blur(24px) saturate(180%);
		border: 1px solid rgba(255, 255, 255, 0.6);
		border-radius: var(--radius-lg, 16px);
		cursor: pointer;
		transition: all var(--duration-fast) ease;
		text-align: left;
		max-width: calc(100% - 24px);
		width: auto;
		z-index: calc(var(--z-fixed, 100) + 10);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5);
	}

	.pending-review-card:hover {
		background: rgba(255, 255, 255, 0.55);
		transform: translateY(-2px);
		box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6);
	}

	.pending-review-icon {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 102, 255, 0.1);
		border-radius: 50%;
		color: var(--blu-primary, #0066ff);
	}

	.pending-review-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}

	.pending-review-content strong {
		font-size: 13px;
		font-weight: 600;
		color: var(--gray-900, #0f172a);
	}

	.pending-review-content span {
		font-size: 11px;
		color: var(--gray-500, #64748b);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 180px;
	}

	.pending-review-close {
		position: absolute;
		top: 50%;
		right: 10px;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		background: transparent;
		border: none;
		border-radius: 50%;
		color: var(--gray-400, #9ca3af);
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.pending-review-close:hover {
		background: rgba(0, 0, 0, 0.05);
		color: var(--gray-600, #475569);
	}

	.idle-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 0 var(--page-padding-x, 20px);
		overflow: hidden;
	}

	/* Record Section */
	.record-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex: 1;
	}

	.record-wrapper {
		margin-bottom: 16px;
	}

	.record-hint {
		font-size: var(--text-base);
		color: var(--gray-400);
		margin: 0 0 var(--space-4) 0;
	}

	.type-option {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-5);
		background: var(--glass-blu-light-90);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid var(--gray-200);
		border-radius: var(--radius-full);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--gray-600);
		cursor: pointer;
		transition: all var(--duration-fast) ease;
		box-shadow: 0 4px 20px var(--glass-black-10);
	}

	.type-option:hover {
		background: var(--glass-blu-light-95);
		border-color: var(--gray-200);
		color: var(--gray-700);
		box-shadow: 0 8px 32px var(--glass-black-10);
		transform: translateY(-1px);
	}

	.type-option:active {
		transform: scale(0.98);
	}
	/* ========== FLOATING TRANSCRIPT POPUP ========== */
	.transcript-popup {
		position: fixed;
		bottom: calc(16px + var(--safe-area-bottom, 0px));
		left: var(--page-padding-x);
		right: var(--page-padding-x);
		max-width: 500px;
		max-height: 70dvh;
		overflow-y: auto;
		margin: 0 auto;
		background: var(--glass-blu-light-95);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		border: none;
		border-radius: var(--radius-2xl);
		box-shadow:
			0 8px 40px var(--glass-black-10),
			0 2px 8px var(--glass-black-5);
		z-index: var(--z-fixed);
		overflow: hidden;
		transition: all 0.35s cubic-bezier(0.32, 0.72, 0, 1);
	}

	.transcript-popup.has-content {
		box-shadow:
			0 8px 40px var(--glass-primary-15),
			0 2px 8px var(--glass-black-5);
	}

	/* Popup Header */
	.popup-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3) var(--space-4);
	}

	.popup-status {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.popup-dot {
		width: 8px;
		height: 8px;
		border-radius: var(--radius-full);
	}

	.popup-dot.recording {
		background: var(--blu-primary, #0066ff);
		animation: dot-breathe 2s ease-in-out infinite;
	}

	@keyframes dot-breathe {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
	}

	.popup-label {
		font-size: var(--text-xs);
		font-weight: var(--font-semibold);
		color: var(--gray-500);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wide);
	}

	.popup-actions {
		display: flex;
		align-items: center;
		gap: var(--space-1-5);
	}

	.popup-close-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--gray-100);
		border: none;
		border-radius: var(--radius-md);
		color: var(--gray-500);
		cursor: pointer;
		transition: all var(--duration-fast) ease;
	}

	.popup-close-btn:hover {
		background: var(--glass-red-10);
		color: var(--data-red);
	}

	.popup-close-btn:active {
		transform: scale(0.92);
	}

	/* Popup Content */
	.popup-content {
		position: relative;
		padding: var(--space-3) var(--space-4);
	}

	.popup-textarea {
		width: 100%;
		height: 180px;
		padding: 0;
		background: transparent;
		border: none;
		color: var(--gray-900);
		font-size: var(--text-lg);
		font-weight: var(--font-normal);
		line-height: var(--leading-relaxed);
		resize: none;
		font-family: inherit;
		transition: height var(--duration-normal) cubic-bezier(0.32, 0.72, 0, 1);
		overflow-y: auto;
		overscroll-behavior: contain;
		/* iOS improvements */
		-webkit-appearance: none;
		-webkit-overflow-scrolling: touch;
		/* Disable spellcheck underlines */
		-webkit-text-decoration: none;
		text-decoration: none;
	}

	.popup-textarea::spelling-error,
	.popup-textarea::grammar-error {
		text-decoration: none;
		background: none;
	}

	.popup-textarea::placeholder {
		color: var(--gray-400);
	}

	.popup-textarea:focus {
		outline: none;
	}

	/* Listening indicator */
	.popup-listening {
		position: absolute;
		bottom: var(--space-3);
		left: var(--space-4);
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	.popup-listening .dot {
		width: 5px;
		height: 5px;
		background: var(--blu-primary);
		border-radius: var(--radius-full);
		animation: listening-bounce 1.4s ease-in-out infinite;
	}

	.popup-listening .dot:nth-child(1) {
		animation-delay: 0s;
	}
	.popup-listening .dot:nth-child(2) {
		animation-delay: 0.2s;
	}
	.popup-listening .dot:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes listening-bounce {
		0%,
		80%,
		100% {
			transform: scale(1);
			opacity: 0.4;
		}
		40% {
			transform: scale(1.3);
			opacity: 1;
		}
	}

	/* Generate Button */
	.popup-generate {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		width: calc(100% - var(--space-8));
		margin: 0 var(--space-4) var(--space-4);
		padding: var(--space-3-5) var(--space-6);
		background: var(--gray-200);
		border: none;
		border-radius: var(--radius-lg);
		color: var(--gray-400);
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		cursor: not-allowed;
		transition: all var(--duration-normal) ease;
	}

	.popup-generate.ready {
		background: var(--avatar-gradient-1);
		color: var(--white);
		cursor: pointer;
		box-shadow: 0 4px 12px var(--glass-primary-25);
	}

	.popup-generate.ready:hover {
		transform: translateY(-1px);
		box-shadow: 0 6px 20px var(--glass-primary-35);
	}

	.popup-generate.ready:active {
		transform: scale(0.98);
	}

	/* ========== PROCESSING STATE ========== */
	.processing-ui {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		min-height: 100dvh;
		padding: var(--page-padding-x);
	}

	.processing-visual {
		position: relative;
		width: 120px;
		height: 120px;
		margin-bottom: var(--space-8);
	}

	.processing-ring {
		position: absolute;
		inset: 0;
		border: 2px solid transparent;
		border-top-color: var(--blu-primary);
		border-radius: var(--radius-full);
		animation: processing-spin 1.2s linear infinite;
	}

	.processing-ring.inner {
		inset: 15px;
		border-top-color: var(--glass-primary-40);
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
		color: var(--blu-primary);
	}

	.processing-title {
		font-family: var(--font-display);
		font-size: var(--text-xl);
		font-weight: var(--font-bold);
		color: var(--gray-900);
		margin: 0 0 var(--space-2) 0;
		letter-spacing: var(--tracking-tight);
	}

	.processing-desc {
		font-size: var(--text-base);
		color: var(--gray-500);
		margin: 0 0 var(--space-8) 0;
	}

	.processing-steps {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.step {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		font-size: var(--text-sm);
		color: var(--gray-400);
		transition: all var(--duration-normal) ease;
	}

	.step.active {
		color: var(--blu-primary);
	}

	.step-dot {
		width: 8px;
		height: 8px;
		background: var(--gray-300);
		border-radius: var(--radius-full);
		transition: all var(--duration-normal) ease;
	}

	.step.active .step-dot {
		background: var(--blu-primary);
		animation: dot-pulse 1s ease-in-out infinite;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.settings-btn,
		.type-option,
		.step,
		.step-dot,
		.transcript-popup,
		.popup-textarea,
		.popup-close-btn,
		.popup-generate {
			transition: none;
		}

		.popup-dot.recording,
		.step.active .step-dot,
		.processing-ring,
		.popup-listening .dot {
			animation: none;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		/* Name banner mobile */
		.name-banner {
			margin: 0 12px var(--space-3);
			padding: var(--space-2-5) var(--space-3);
			gap: var(--space-2);
		}

		.name-banner-content span {
			display: none;
		}

		.name-banner-btn {
			padding: var(--space-1-5) var(--space-2-5);
		}

		/* Popup mobile optimizations */
		.transcript-popup {
			left: 12px;
			right: 12px;
			bottom: calc(12px + var(--safe-area-bottom, 0px));
			border-radius: 20px;
			max-height: 60dvh;
		}

		.popup-header {
			padding: 12px 16px;
		}

		.popup-close-btn {
			width: 40px;
			height: 40px;
			border-radius: 12px;
		}

		.popup-content {
			padding: 12px 16px;
		}

		.popup-textarea {
			font-size: 17px;
			height: 150px;
		}

		.popup-generate {
			margin: 0 14px 14px;
			padding: 16px 24px;
			font-size: 16px;
			border-radius: 14px;
		}

	}

	/* Very small screens */
	@media (max-width: 360px) {
		.transcript-popup {
			left: 8px;
			right: 8px;
			bottom: calc(8px + var(--safe-area-bottom, 0px));
		}

		.popup-textarea {
			font-size: 16px;
			height: 130px;
		}

		.popup-generate {
			padding: 14px 20px;
			font-size: 15px;
		}
	}

	/* Handle keyboard visibility on mobile */
	@media (max-height: 500px) {
		.transcript-popup {
			bottom: 8px;
			max-height: 50dvh;
		}

		.popup-textarea {
			height: 100px;
		}

		.idle-ui {
			padding-bottom: 60px;
		}
	}

	/* Ensure touch targets are at least 44px */
	@media (pointer: coarse) {
		.popup-close-btn {
			min-width: 44px;
			min-height: 44px;
		}

		.type-option {
			min-height: 44px;
			padding: 12px 20px;
		}
	}
</style>

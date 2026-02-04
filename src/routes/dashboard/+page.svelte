<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import X from 'lucide-svelte/icons/x';
	import User from 'lucide-svelte/icons/user';
	import Keyboard from 'lucide-svelte/icons/keyboard';
	import FileText from 'lucide-svelte/icons/file-text';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import { t } from '$lib/i18n';
	import RecordButton from '$lib/components/RecordButtonMobile.svelte';
	import { inputPreferences, type InputMode } from '$lib/stores/inputPreferences';
	import { isRecordingMode as isRecordingModeStore } from '$lib/stores/appState';

	let { data } = $props();

	// Check for existing review session from server data (persistent across browser restarts)
	const pendingReview = $derived(data.pendingReview);
	let pendingReviewDismissed = $state(false);

	type State = 'idle' | 'recording' | 'paused' | 'processing';

	// Get user from session (use $derived for reactivity)
	const user = $derived(data.session?.user);
	const fullName = $derived(
		user?.user_metadata?.full_name || user?.user_metadata?.first_name || ''
	);
	const firstName = $derived(fullName.split(' ')[0] || '');
	const hasName = $derived(firstName.length > 0);

	// Recording state
	let currentState = $state<State>('idle');
	let error: string | null = $state(null);
	let transcript = $state('');
	let interimTranscript = $state('');
	let recordingTime = $state(0);
	let timerInterval: ReturnType<typeof setInterval> | null = null;
	let mediaRecorder: MediaRecorder | null = null;
	let mediaStream: MediaStream | null = null;

	// Deepgram WebSocket
	let socket: WebSocket | null = null;
	let deepgramApiKey: string | null = null;
	let reconnectAttempts = 0;
	let maxReconnectAttempts = 3;
	let keepaliveInterval: ReturnType<typeof setInterval> | null = null;
	let audioBuffer: Blob[] = [];
	let isSocketReady = false;

	// Audio visualization
	let audioContext: AudioContext | null = null;
	let analyser: AnalyserNode | null = null;
	let animationFrame: number | null = null;
	let audioLevel = $state(0);

	// Input mode from preferences store
	let inputMode = $state<InputMode>('voice');
	let prefsUnsubscribe: (() => void) | null = null;

	// Noise detection
	let isNoisyEnvironment = $state(false);
	let showNoisySuggestion = $state(false);

	// Transcript expansion state
	// svelte-ignore non_reactive_update
	let transcriptTextarea: HTMLTextAreaElement | null = null;
	let noiseCheckCount = $state(0);
	let highNoiseCount = $state(0);
	const NOISE_THRESHOLD = 0.35;
	const NOISE_SUGGESTION_THRESHOLD = 5;

	// Name banner dismissal state
	let nameBannerDismissed = $state(false);

	// Subscribe to translations
	let translate = $state((key: string) => key);
	$effect(() => {
		const unsub = t.subscribe((v) => (translate = v));
		return unsub;
	});

	// Get time-based greeting
	const getGreeting = () => {
		const hour = new Date().getHours();
		if (hour < 12) return translate('dashboard.goodMorning');
		if (hour < 18) return translate('dashboard.goodAfternoon');
		return translate('dashboard.goodEvening');
	};

	const timerDisplay = $derived(
		`${Math.floor(recordingTime / 60)
			.toString()
			.padStart(2, '0')}:${(recordingTime % 60).toString().padStart(2, '0')}`
	);

	const isRecordingActive = $derived(currentState === 'recording');
	const isPaused = $derived(currentState === 'paused');
	const isProcessing = $derived(currentState === 'processing');
	const displayTranscript = $derived(
		transcript + (interimTranscript ? ' ' + interimTranscript : '')
	);
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
		// Track displayTranscript changes
		const _ = displayTranscript;
		if (transcriptTextarea && isRecordingActive) {
			// Scroll to bottom to show latest transcription
			transcriptTextarea.scrollTop = transcriptTextarea.scrollHeight;
		}
	});

	// Use automatic multi-language detection for better UX
	// Deepgram's nova-2 model handles Spanish, English, and other languages automatically
	function getDeepgramLanguage(): string {
		return 'multi';
	}

	async function fetchDeepgramKey(retries = 2): Promise<boolean> {
		for (let i = 0; i <= retries; i++) {
			try {
				const response = await fetch('/api/deepgram/token');
				if (response.ok) {
					const data = await response.json();
					if (data.apiKey) {
						deepgramApiKey = data.apiKey;
						return true;
					}
				}
				if (i < retries) await new Promise((r) => setTimeout(r, 500 * (i + 1)));
			} catch (err) {
				if (i < retries) await new Promise((r) => setTimeout(r, 500 * (i + 1)));
			}
		}
		return false;
	}

	function animateAudioLevel() {
		if (!analyser || !isRecordingActive) {
			audioLevel = 0;
			return;
		}

		const dataArray = new Uint8Array(analyser.frequencyBinCount);
		analyser.getByteFrequencyData(dataArray);

		let sum = 0;
		for (let i = 0; i < dataArray.length; i++) {
			sum += dataArray[i];
		}
		const avg = sum / dataArray.length;
		const targetLevel = Math.min(avg / 128, 1);
		audioLevel = audioLevel * 0.7 + targetLevel * 0.3;

		// Noise detection
		noiseCheckCount++;
		if (noiseCheckCount >= 10) {
			noiseCheckCount = 0;
			if (audioLevel > NOISE_THRESHOLD && !transcript.trim()) {
				highNoiseCount++;
				if (highNoiseCount >= NOISE_SUGGESTION_THRESHOLD && !showNoisySuggestion) {
					isNoisyEnvironment = true;
					showNoisySuggestion = true;
				}
			} else if (audioLevel < NOISE_THRESHOLD * 0.5) {
				highNoiseCount = Math.max(0, highNoiseCount - 1);
			}
		}

		animationFrame = requestAnimationFrame(animateAudioLevel);
	}

	function handleSpeechToTextError() {
		// Stop recording resources but keep transcript
		stopMediaResources();

		// Switch to text mode and show error
		inputMode = 'text';
		currentState = 'paused';
		error = translate('errors.speechToTextUnavailable');
	}

	function connectDeepgram() {
		if (!deepgramApiKey || !mediaRecorder) return;

		const lang = getDeepgramLanguage();
		const wsUrl = `wss://api.deepgram.com/v1/listen?model=nova-2&language=${lang}&smart_format=true&punctuate=true&interim_results=true&endpointing=200&vad_events=true`;

		try {
			socket = new WebSocket(wsUrl, ['token', deepgramApiKey]);
			isSocketReady = false;

			socket.onopen = () => {
				isSocketReady = true;
				reconnectAttempts = 0;

				while (audioBuffer.length > 0) {
					const bufferedData = audioBuffer.shift();
					if (bufferedData && socket?.readyState === WebSocket.OPEN) {
						socket.send(bufferedData);
					}
				}

				if (keepaliveInterval) clearInterval(keepaliveInterval);
				keepaliveInterval = setInterval(() => {
					if (socket?.readyState === WebSocket.OPEN) {
						socket.send(JSON.stringify({ type: 'KeepAlive' }));
					}
				}, 8000);
			};

			socket.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					const result = data.channel?.alternatives?.[0]?.transcript;
					if (result) {
						if (data.is_final) {
							transcript = transcript ? transcript + ' ' + result : result;
							interimTranscript = '';
						} else {
							interimTranscript = result;
						}
					}
				} catch (err) {
					console.error('Error parsing Deepgram response:', err);
				}
			};

			socket.onerror = () => {
				isSocketReady = false;
			};
			socket.onclose = (event) => {
				isSocketReady = false;
				if (keepaliveInterval) {
					clearInterval(keepaliveInterval);
					keepaliveInterval = null;
				}
				if (currentState === 'recording' && reconnectAttempts < maxReconnectAttempts) {
					reconnectAttempts++;
					setTimeout(connectDeepgram, 500 * reconnectAttempts);
				} else if (reconnectAttempts >= maxReconnectAttempts && currentState === 'recording') {
					handleSpeechToTextError();
				}
			};
		} catch (err) {
			handleSpeechToTextError();
		}
	}

	async function startRecording() {
		try {
			currentState = 'recording';
			recordingTime = 0;
			transcript = '';
			interimTranscript = '';
			reconnectAttempts = 0;
			audioBuffer = [];
			isSocketReady = false;
			error = '';

			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				throw new Error('MediaDevices API not available.');
			}

			mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

			try {
				audioContext = new AudioContext();
				if (audioContext.state === 'suspended') await audioContext.resume();
				const source = audioContext.createMediaStreamSource(mediaStream);
				analyser = audioContext.createAnalyser();
				analyser.fftSize = 256;
				analyser.smoothingTimeConstant = 0.8;
				source.connect(analyser);
			} catch (audioErr) {
				// Continue without visualization
			}

			// Try to create MediaRecorder with best available MIME type
			const mimeTypes = [
				'audio/webm;codecs=opus',
				'audio/webm',
				'audio/mp4',
				'audio/ogg;codecs=opus',
				'' // Empty string = browser default
			];

			let recorderCreated = false;
			for (const mimeType of mimeTypes) {
				if (recorderCreated) break;
				try {
					if (
						mimeType &&
						typeof MediaRecorder.isTypeSupported === 'function' &&
						!MediaRecorder.isTypeSupported(mimeType)
					) {
						continue;
					}
					const options = mimeType ? { mimeType } : undefined;
					mediaRecorder = new MediaRecorder(mediaStream, options);
					recorderCreated = true;
				} catch {
					// Try next MIME type
				}
			}

			// MediaRecorder is optional - continue without it if creation fails
			// Deepgram will still work via direct streaming
			if (mediaRecorder) {
				mediaRecorder.ondataavailable = (e) => {
					if (e.data.size > 0) {
						if (socket?.readyState === WebSocket.OPEN && isSocketReady) {
							socket.send(e.data);
						} else if (deepgramApiKey) {
							audioBuffer.push(e.data);
							if (audioBuffer.length > 50) audioBuffer.shift();
						}
					}
				};
				mediaRecorder.start(100);
			}

			if (deepgramApiKey) {
				connectDeepgram();
			} else {
				handleSpeechToTextError();
			}

			timerInterval = setInterval(() => {
				recordingTime++;
			}, 1000);
			animateAudioLevel();
		} catch (err) {
			if (err instanceof Error) {
				error = `Microphone error: ${err.message}`;
			} else {
				error = 'Microphone error';
			}
			if (mediaStream) {
				mediaStream.getTracks().forEach((track) => track.stop());
				mediaStream = null;
			}
			currentState = 'idle';
		}
	}

	function pauseRecording() {
		if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.pause();
		if (keepaliveInterval) {
			clearInterval(keepaliveInterval);
			keepaliveInterval = null;
		}
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
			animationFrame = null;
		}
		audioLevel = 0;

		// Save any interim transcript before clearing (text that Deepgram hadn't finalized yet)
		if (interimTranscript.trim()) {
			transcript = transcript
				? transcript + ' ' + interimTranscript.trim()
				: interimTranscript.trim();
		}
		interimTranscript = '';
		currentState = 'paused';
	}

	function resumeRecording() {
		if (mediaRecorder && mediaRecorder.state === 'paused') mediaRecorder.resume();
		if (socket?.readyState === WebSocket.OPEN && !keepaliveInterval) {
			keepaliveInterval = setInterval(() => {
				if (socket?.readyState === WebSocket.OPEN)
					socket.send(JSON.stringify({ type: 'KeepAlive' }));
			}, 8000);
		}
		timerInterval = setInterval(() => {
			recordingTime++;
		}, 1000);
		currentState = 'recording';
		animateAudioLevel();
	}

	// Helper to stop media resources without clearing transcript/state
	function stopMediaResources() {
		if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
		mediaRecorder = null;

		if (keepaliveInterval) {
			clearInterval(keepaliveInterval);
			keepaliveInterval = null;
		}
		if (socket) {
			if (socket.readyState === WebSocket.OPEN) {
				try {
					socket.send(JSON.stringify({ type: 'CloseStream' }));
				} catch (e) {}
			}
			socket.close();
			socket = null;
		}

		if (mediaStream) {
			mediaStream.getTracks().forEach((track) => track.stop());
			mediaStream = null;
		}
		if (audioContext) {
			audioContext.close();
			audioContext = null;
		}
		analyser = null;
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
			animationFrame = null;
		}

		audioLevel = 0;

		// Save any interim transcript before clearing
		if (interimTranscript.trim()) {
			transcript = transcript
				? transcript + ' ' + interimTranscript.trim()
				: interimTranscript.trim();
		}
		interimTranscript = '';
		isSocketReady = false;
		audioBuffer = [];
		reconnectAttempts = 0;
	}

	function stopRecording() {
		stopMediaResources();
		currentState = 'idle';
		recordingTime = 0;
		transcript = '';
		isNoisyEnvironment = false;
		showNoisySuggestion = false;
		noiseCheckCount = 0;
		highNoiseCount = 0;
	}

	function handleButtonAction() {
		if (currentState === 'idle') {
			startRecording();
		} else if (currentState === 'recording') {
			pauseRecording();
		} else if (currentState === 'paused') {
			if (!mediaRecorder) {
				startRecording();
			} else {
				resumeRecording();
			}
		}
	}

	async function handleGenerate() {
		if (!transcript.trim()) return;

		const savedTranscript = transcript.trim();
		stopMediaResources();
		currentState = 'processing';

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
		} catch (err) {
			error = 'Failed to generate document';
			currentState = 'idle';
		}
	}

	function handleTranscriptChange(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		transcript = target.value;
	}

	function dismissNoisySuggestion() {
		showNoisySuggestion = false;
	}

	function switchToTypingMode() {
		if (currentState === 'recording') {
			stopMediaResources();
		}
		inputMode = 'text';
		showNoisySuggestion = false;
		isNoisyEnvironment = false;
		highNoiseCount = 0;
		noiseCheckCount = 0;
		currentState = 'paused';
	}

	function switchToVoiceMode() {
		inputMode = 'voice';
		currentState = 'paused';
	}

	function startTypingMode() {
		inputMode = 'text';
		currentState = 'paused';
		transcript = '';
		recordingTime = 0;
	}

	function dismissNameBanner() {
		nameBannerDismissed = true;
		localStorage.setItem('nameBannerDismissed', 'true');
	}

	async function dismissPendingReview() {
		pendingReviewDismissed = true;
		// Also delete the pending review from the database
		if (pendingReview?.id) {
			try {
				await fetch(`/api/reviews/${pendingReview.id}`, {
					method: 'DELETE'
				});
			} catch (error) {
				console.error('Failed to delete pending review:', error);
			}
		}
	}

	function resumePendingReview() {
		if (pendingReview?.id) {
			goto(`/dashboard/review?session=${pendingReview.id}`);
		}
	}

	// Get a summary for the pending review card
	function getPendingReviewSummary(): string {
		if (!pendingReview) return '';
		// Try to get client name from parsed data
		const clientName = pendingReview.parsed_data?.client?.name;
		if (clientName) return clientName;
		// Fall back to summary or transcript preview
		if (pendingReview.summary) return pendingReview.summary;
		if (pendingReview.original_transcript) {
			return pendingReview.original_transcript.slice(0, 50) + '...';
		}
		return translate('dashboard.unfinishedDoc');
	}

	onMount(async () => {
		inputPreferences.initialize();
		prefsUnsubscribe = inputPreferences.subscribe((prefs) => {
			inputMode = prefs.mode;
		});

		// Load name banner dismissal state
		nameBannerDismissed = localStorage.getItem('nameBannerDismissed') === 'true';

		await fetchDeepgramKey();
	});

	onDestroy(() => {
		stopRecording();
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
				{#if hasName}
					<div class="greeting-section">
						<span class="greeting-text">{getGreeting()},</span>
						<h1 class="user-name">{firstName}</h1>
					</div>
				{/if}
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
					{#if isRecordingActive}
						<div class="recording-status" in:fade={{ duration: 200 }}>
							<span class="status-dot"></span>
							<span class="status-text">{timerDisplay}</span>
						</div>
					{:else if isPaused}
						<p class="record-hint" in:fade={{ duration: 200 }}>
							{translate('dashboard.tapToResume')}
						</p>
					{:else}
						<p class="record-hint">{translate('recording.tapToStart')}</p>
					{/if}
					<button class="type-option" onclick={startTypingMode}>
						<Keyboard size={16} strokeWidth={2} />
						<span>{translate('dashboard.orTypeInstead')}</span>
					</button>
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
							<span class="popup-timer">{timerDisplay}</span>
						{:else if isPaused}
							<span class="popup-dot paused"></span>
							<span class="popup-timer">{timerDisplay}</span>
						{:else}
							<span class="popup-label">{translate('recording.transcript')}</span>
						{/if}
					</div>
					<div class="popup-actions">
						<button
							class="popup-close-btn"
							onclick={stopRecording}
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
						autocorrect="off"
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
				onclick={(e) => {
					e.stopPropagation();
					dismissPendingReview();
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

	.greeting-section {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.greeting-text {
		font-size: var(--text-sm);
		color: var(--gray-500);
	}

	.user-name {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-weight: var(--font-bold);
		color: var(--gray-900);
		margin: 0;
		letter-spacing: var(--tracking-tight);
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

	/* Pending Review Card - Fixed above navbar, glassy white */
	.pending-review-card {
		position: fixed;
		bottom: calc(var(--safe-area-bottom, 0px) + 90px);
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 40px 10px 12px;
		background: var(--glass-white-70, rgba(255, 255, 255, 0.85));
		backdrop-filter: blur(20px) saturate(150%);
		-webkit-backdrop-filter: blur(20px) saturate(150%);
		border: 1px solid rgba(255, 255, 255, 0.5);
		border-radius: var(--radius-full, 50px);
		cursor: pointer;
		transition: all var(--duration-fast) ease;
		text-align: left;
		max-width: 300px;
		width: auto;
		z-index: calc(var(--z-fixed, 100) + 10);
		box-shadow: var(--blu-shadow-md, 0 4px 16px rgba(0, 0, 0, 0.1));
	}

	.pending-review-card:hover {
		background: rgba(255, 255, 255, 0.95);
		transform: translateX(-50%) translateY(-2px);
		box-shadow: var(--blu-shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.15));
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

	/* Recording status indicator */
	.recording-status {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.status-dot {
		width: 10px;
		height: 10px;
		background: var(--data-red);
		border-radius: var(--radius-full);
		animation: status-pulse 1.2s ease-in-out infinite;
	}

	@keyframes status-pulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.2);
			opacity: 0.7;
		}
	}

	.status-text {
		font-family: var(--font-mono);
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		color: var(--data-red);
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
		background: var(--data-red);
		animation: status-pulse 1.2s ease-in-out infinite;
	}

	.popup-dot.paused {
		background: var(--data-yellow);
	}

	.popup-timer {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-weight: var(--font-semibold);
		color: var(--gray-700);
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

		.status-dot,
		.popup-dot.recording,
		.step.active .step-dot,
		.processing-ring,
		.popup-listening .dot {
			animation: none;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.user-name {
			font-size: 22px;
		}

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

		/* Recording status */
		.recording-status {
			gap: 6px;
		}

		.status-text {
			font-size: 15px;
		}
	}

	/* Very small screens */
	@media (max-width: 360px) {
		.transcript-popup {
			left: 8px;
			right: 8px;
			bottom: calc(8px + var(--safe-area-bottom, 0px));
		}

		.popup-timer {
			font-size: 13px;
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

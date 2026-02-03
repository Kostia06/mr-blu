<script lang="ts">
	import Mic from 'lucide-svelte/icons/mic';
	import Square from 'lucide-svelte/icons/square';
	import Loader2 from 'lucide-svelte/icons/loader-2';

	interface Props {
		onTranscript: (text: string, data: unknown) => void;
		onError?: (error: string) => void;
	}

	let { onTranscript, onError }: Props = $props();

	let isRecording = $state(false);
	let isProcessing = $state(false);
	let mediaRecorder = $state<MediaRecorder | null>(null);
	let audioChunks = $state<Blob[]>([]);

	async function startRecording() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

			// Check for audio/webm support, fallback to audio/mp4 or default
			let mimeType = 'audio/webm';
			if (!MediaRecorder.isTypeSupported(mimeType)) {
				mimeType = 'audio/mp4';
				if (!MediaRecorder.isTypeSupported(mimeType)) {
					mimeType = '';
				}
			}

			const options = mimeType ? { mimeType } : undefined;
			const recorder = new MediaRecorder(stream, options);

			audioChunks = [];

			recorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunks.push(event.data);
				}
			};

			recorder.onstop = () => {
				// Stop all tracks to release microphone
				stream.getTracks().forEach((track) => track.stop());
				processAudio();
			};

			recorder.onerror = () => {
				isRecording = false;
				stream.getTracks().forEach((track) => track.stop());
				onError?.('Recording failed');
			};

			mediaRecorder = recorder;
			recorder.start();
			isRecording = true;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to access microphone';
			onError?.(errorMessage);
		}
	}

	function stopRecording() {
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
			isRecording = false;
		}
	}

	async function processAudio() {
		if (audioChunks.length === 0) {
			onError?.('No audio recorded');
			return;
		}

		isProcessing = true;

		try {
			const mimeType = mediaRecorder?.mimeType || 'audio/webm';
			const audioBlob = new Blob(audioChunks, { type: mimeType });

			const formData = new FormData();
			formData.append('audio', audioBlob, 'recording.webm');

			const response = await fetch('/api/voice/transcribe', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || 'Transcription failed');
			}

			const data = await response.json();
			onTranscript(data.text || data.transcript || '', data);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to process audio';
			onError?.(errorMessage);
		} finally {
			isProcessing = false;
			audioChunks = [];
		}
	}

	function handleClick() {
		if (isRecording) {
			stopRecording();
		} else {
			startRecording();
		}
	}
</script>

<button
	type="button"
	class="voice-recorder-btn"
	class:recording={isRecording}
	class:processing={isProcessing}
	onclick={handleClick}
	disabled={isProcessing}
	aria-label={isProcessing ? 'Processing' : isRecording ? 'Stop recording' : 'Start recording'}
>
	{#if isProcessing}
		<Loader2 size={20} class="spinner" />
		<span>Processing...</span>
	{:else if isRecording}
		<Square size={20} />
		<span>Stop</span>
	{:else}
		<Mic size={20} />
		<span>Record</span>
	{/if}
</button>

<style>
	.voice-recorder-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 12px 20px;
		border: none;
		border-radius: 12px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		min-height: 48px;
		background: var(--blu-primary, #0066ff);
		color: white;
	}

	.voice-recorder-btn:hover:not(:disabled) {
		background: #0052cc;
		transform: translateY(-1px);
	}

	.voice-recorder-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.voice-recorder-btn.recording {
		background: #dc2626;
	}

	.voice-recorder-btn.recording:hover:not(:disabled) {
		background: #b91c1c;
	}

	.voice-recorder-btn.processing {
		background: var(--gray-400, #9ca3af);
		cursor: not-allowed;
	}

	.voice-recorder-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	:global(.spinner) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.spinner) {
			animation: none;
		}

		.voice-recorder-btn {
			transition: none;
		}
	}
</style>

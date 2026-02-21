export type RecordingState = 'idle' | 'recording' | 'paused' | 'processing';

const KEEPALIVE_INTERVAL_MS = 8000;
const MAX_RECONNECT_ATTEMPTS = 3;
const MAX_AUDIO_BUFFER_SIZE = 50;
const NOISE_THRESHOLD = 0.35;
const NOISE_SUGGESTION_THRESHOLD = 5;

const MIME_TYPES = [
	'audio/webm;codecs=opus',
	'audio/webm',
	'audio/mp4',
	'audio/ogg;codecs=opus',
	''
];

export function createVoiceRecording() {
	let currentState = $state<RecordingState>('idle');
	let transcript = $state('');
	let interimTranscript = $state('');
	let audioLevel = $state(0);
	let error = $state<string | null>(null);
	let isNoisyEnvironment = $state(false);
	let showNoisySuggestion = $state(false);

	// Internal state
	let mediaRecorder: MediaRecorder | null = null;
	let mediaStream: MediaStream | null = null;
	let socket: WebSocket | null = null;
	let deepgramApiKey: string | null = null;
	let reconnectAttempts = 0;
	let keepaliveInterval: ReturnType<typeof setInterval> | null = null;
	let audioBuffer: Blob[] = [];
	let isSocketReady = false;
	let audioContext: AudioContext | null = null;
	let analyser: AnalyserNode | null = null;
	let animationFrame: number | null = null;
	let noiseCheckCount = 0;
	let highNoiseCount = 0;

	const displayTranscript = $derived(
		transcript + (interimTranscript ? ' ' + interimTranscript : '')
	);
	const isRecordingActive = $derived(currentState === 'recording');

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
			} catch {
				if (i < retries) await new Promise((r) => setTimeout(r, 500 * (i + 1)));
			}
		}
		return false;
	}

	function animateAudioLevelLoop() {
		if (!analyser || currentState !== 'recording') {
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

		animationFrame = requestAnimationFrame(animateAudioLevelLoop);
	}

	function handleSpeechToTextError(translateFn: (key: string) => string) {
		stopMediaResources();
		currentState = 'paused';
		error = translateFn('errors.speechToTextUnavailable');
	}

	function connectDeepgram(translateFn: (key: string) => string) {
		if (!deepgramApiKey || !mediaRecorder) return;

		const wsUrl = `wss://api.deepgram.com/v1/listen?model=nova-2&language=multi&smart_format=true&punctuate=true&interim_results=true&endpointing=200&vad_events=true`;

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
				}, KEEPALIVE_INTERVAL_MS);
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

			socket.onclose = () => {
				isSocketReady = false;
				if (keepaliveInterval) {
					clearInterval(keepaliveInterval);
					keepaliveInterval = null;
				}
				if (currentState === 'recording' && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
					reconnectAttempts++;
					setTimeout(() => connectDeepgram(translateFn), 500 * reconnectAttempts);
				} else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS && currentState === 'recording') {
					handleSpeechToTextError(translateFn);
				}
			};
		} catch {
			handleSpeechToTextError(translateFn);
		}
	}

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
				} catch { /* ignore close errors */ }
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
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
			animationFrame = null;
		}

		audioLevel = 0;

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

	async function startRecording(translateFn: (key: string) => string) {
		try {
			currentState = 'recording';
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
			} catch {
				// Continue without visualization
			}

			let recorderCreated = false;
			for (const mimeType of MIME_TYPES) {
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

			if (mediaRecorder) {
				mediaRecorder.ondataavailable = (e) => {
					if (e.data.size > 0) {
						if (socket?.readyState === WebSocket.OPEN && isSocketReady) {
							socket.send(e.data);
						} else if (deepgramApiKey) {
							audioBuffer.push(e.data);
							if (audioBuffer.length > MAX_AUDIO_BUFFER_SIZE) audioBuffer.shift();
						}
					}
				};
				mediaRecorder.start(100);
			}

			if (!deepgramApiKey) {
				await fetchDeepgramKey();
			}

			if (deepgramApiKey) {
				connectDeepgram(translateFn);
			} else {
				handleSpeechToTextError(translateFn);
			}

			animateAudioLevelLoop();
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
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
			animationFrame = null;
		}
		audioLevel = 0;

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
			}, KEEPALIVE_INTERVAL_MS);
		}
		currentState = 'recording';
		animateAudioLevelLoop();
	}

	function stopRecording() {
		stopMediaResources();
		currentState = 'idle';
		transcript = '';
		isNoisyEnvironment = false;
		showNoisySuggestion = false;
		noiseCheckCount = 0;
		highNoiseCount = 0;
	}

	function setTranscript(value: string) {
		transcript = value;
	}

	function setCurrentState(state: RecordingState) {
		currentState = state;
	}

	function setError(value: string | null) {
		error = value;
	}

	function dismissNoisySuggestion() {
		showNoisySuggestion = false;
	}

	function resetNoiseState() {
		isNoisyEnvironment = false;
		showNoisySuggestion = false;
		highNoiseCount = 0;
		noiseCheckCount = 0;
	}

	return {
		get currentState() { return currentState; },
		get transcript() { return transcript; },
		get interimTranscript() { return interimTranscript; },
		get displayTranscript() { return displayTranscript; },
		get audioLevel() { return audioLevel; },
		get error() { return error; },
		get isRecordingActive() { return isRecordingActive; },
		get isNoisyEnvironment() { return isNoisyEnvironment; },
		get showNoisySuggestion() { return showNoisySuggestion; },
		get hasMediaRecorder() { return mediaRecorder !== null; },

		fetchDeepgramKey,
		startRecording,
		pauseRecording,
		resumeRecording,
		stopRecording,
		stopMediaResources,
		setTranscript,
		setCurrentState,
		setError,
		dismissNoisySuggestion,
		resetNoiseState,
	};
}

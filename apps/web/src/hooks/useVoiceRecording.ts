import { useState, useRef, useMemo, useCallback, useEffect } from 'preact/hooks';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'processing';

const KEEPALIVE_INTERVAL_MS = 8000;
const MAX_RECONNECT_ATTEMPTS = 3;
const MAX_AUDIO_BUFFER_SIZE = 50;
const NOISE_THRESHOLD = 0.35;
const NOISE_SUGGESTION_THRESHOLD = 5;

const IS_IOS = /iPad|iPhone|iPod/.test(navigator?.userAgent ?? '');

const MIME_TYPES = IS_IOS
  ? ['audio/mp4', 'audio/aac', '']
  : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', ''];

export function useVoiceRecording() {
  const [currentState, setCurrentState] = useState<RecordingState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isNoisyEnvironment, setIsNoisyEnvironment] = useState(false);
  const [showNoisySuggestion, setShowNoisySuggestion] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const deepgramApiKeyRef = useRef<string | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const keepaliveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioBufferRef = useRef<Blob[]>([]);
  const isSocketReadyRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const noiseCheckCountRef = useRef(0);
  const highNoiseCountRef = useRef(0);

  // Refs for latest state values (accessible inside rAF/WebSocket callbacks)
  const currentStateRef = useRef(currentState);
  currentStateRef.current = currentState;
  const transcriptRef = useRef(transcript);
  transcriptRef.current = transcript;
  const interimTranscriptRef = useRef(interimTranscript);
  interimTranscriptRef.current = interimTranscript;
  const audioLevelRef = useRef(audioLevel);
  audioLevelRef.current = audioLevel;
  const showNoisySuggestionRef = useRef(showNoisySuggestion);
  showNoisySuggestionRef.current = showNoisySuggestion;

  const displayTranscript = useMemo(
    () => transcript + (interimTranscript ? ' ' + interimTranscript : ''),
    [transcript, interimTranscript],
  );

  const isRecordingActive = useMemo(() => currentState === 'recording', [currentState]);

  const hasMediaRecorder = useMemo(
    () => mediaRecorderRef.current !== null,
    // Re-derive when state changes (mediaRecorder is set during recording)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentState],
  );

  const clearKeepalive = useCallback(() => {
    if (keepaliveIntervalRef.current) {
      clearInterval(keepaliveIntervalRef.current);
      keepaliveIntervalRef.current = null;
    }
  }, []);

  const cancelAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const flushInterimTranscript = useCallback(() => {
    const interim = interimTranscriptRef.current.trim();
    if (interim) {
      const current = transcriptRef.current;
      setTranscript(current ? current + ' ' + interim : interim);
    }
    setInterimTranscript('');
  }, []);

  const stopMediaResources = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    clearKeepalive();

    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        try {
          socketRef.current.send(JSON.stringify({ type: 'CloseStream' }));
        } catch {
          /* ignore close errors */
        }
      }
      socketRef.current.close();
      socketRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    cancelAnimation();

    setAudioLevel(0);
    flushInterimTranscript();
    isSocketReadyRef.current = false;
    audioBufferRef.current = [];
    reconnectAttemptsRef.current = 0;
  }, [clearKeepalive, cancelAnimation, flushInterimTranscript]);

  const animateAudioLevelLoop = useCallback(() => {
    if (!analyserRef.current || currentStateRef.current !== 'recording') {
      setAudioLevel(0);
      return;
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    const targetLevel = Math.min(avg / 128, 1);
    const smoothed = audioLevelRef.current * 0.7 + targetLevel * 0.3;
    setAudioLevel(smoothed);
    audioLevelRef.current = smoothed;

    noiseCheckCountRef.current++;
    if (noiseCheckCountRef.current >= 10) {
      noiseCheckCountRef.current = 0;
      if (smoothed > NOISE_THRESHOLD && !transcriptRef.current.trim()) {
        highNoiseCountRef.current++;
        if (
          highNoiseCountRef.current >= NOISE_SUGGESTION_THRESHOLD &&
          !showNoisySuggestionRef.current
        ) {
          setIsNoisyEnvironment(true);
          setShowNoisySuggestion(true);
        }
      } else if (smoothed < NOISE_THRESHOLD * 0.5) {
        highNoiseCountRef.current = Math.max(0, highNoiseCountRef.current - 1);
      }
    }

    animationFrameRef.current = requestAnimationFrame(animateAudioLevelLoop);
  }, []);

  const handleSpeechToTextError = useCallback(
    (translateFn: (key: string) => string) => {
      stopMediaResources();
      setCurrentState('paused');
      setError(translateFn('errors.speechToTextUnavailable'));
    },
    [stopMediaResources],
  );

  const connectDeepgram = useCallback(
    (translateFn: (key: string) => string) => {
      if (!deepgramApiKeyRef.current || !mediaRecorderRef.current) return;

      const wsUrl =
        'wss://api.deepgram.com/v1/listen?model=nova-2&language=multi&smart_format=true&punctuate=true&interim_results=true&endpointing=200&vad_events=true';

      try {
        const ws = new WebSocket(wsUrl, ['token', deepgramApiKeyRef.current]);
        socketRef.current = ws;
        isSocketReadyRef.current = false;

        ws.onopen = () => {
          isSocketReadyRef.current = true;
          reconnectAttemptsRef.current = 0;

          while (audioBufferRef.current.length > 0) {
            const bufferedData = audioBufferRef.current.shift();
            if (bufferedData && ws.readyState === WebSocket.OPEN) {
              ws.send(bufferedData);
            }
          }

          clearKeepalive();
          keepaliveIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'KeepAlive' }));
            }
          }, KEEPALIVE_INTERVAL_MS);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const result = data.channel?.alternatives?.[0]?.transcript;
            if (result) {
              if (data.is_final) {
                setTranscript((prev) => (prev ? prev + ' ' + result : result));
                setInterimTranscript('');
              } else {
                setInterimTranscript(result);
              }
            }
          } catch (err) {
            console.error('Error parsing Deepgram response:', err);
          }
        };

        ws.onerror = () => {
          isSocketReadyRef.current = false;
        };

        ws.onclose = () => {
          isSocketReadyRef.current = false;
          clearKeepalive();
          if (
            currentStateRef.current === 'recording' &&
            reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
          ) {
            reconnectAttemptsRef.current++;
            setTimeout(
              () => connectDeepgram(translateFn),
              500 * reconnectAttemptsRef.current,
            );
          } else if (
            reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS &&
            currentStateRef.current === 'recording'
          ) {
            handleSpeechToTextError(translateFn);
          }
        };
      } catch {
        handleSpeechToTextError(translateFn);
      }
    },
    [clearKeepalive, handleSpeechToTextError],
  );

  const fetchDeepgramKey = useCallback(async (retries = 2): Promise<boolean> => {
    const { getDeepgramToken } = await import('@/lib/api/external');
    for (let i = 0; i <= retries; i++) {
      try {
        const apiKey = await getDeepgramToken();
        if (apiKey) {
          deepgramApiKeyRef.current = apiKey;
          return true;
        }
        if (i < retries) await new Promise((r) => setTimeout(r, 500 * (i + 1)));
      } catch {
        if (i < retries) await new Promise((r) => setTimeout(r, 500 * (i + 1)));
      }
    }
    return false;
  }, []);

  const startRecording = useCallback(
    async (translateFn: (key: string) => string) => {
      try {
        setCurrentState('recording');
        setTranscript('');
        setInterimTranscript('');
        setError('');
        reconnectAttemptsRef.current = 0;
        audioBufferRef.current = [];
        isSocketReadyRef.current = false;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('MediaDevices API not available.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            ...(IS_IOS && { sampleRate: 44100, channelCount: 1 }),
          },
        });
        mediaStreamRef.current = stream;

        try {
          const ctx = new AudioContext();
          audioContextRef.current = ctx;
          if (ctx.state === 'suspended') await ctx.resume();
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.8;
          source.connect(analyser);
          analyserRef.current = analyser;
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
            mediaRecorderRef.current = new MediaRecorder(stream, options);
            recorderCreated = true;
          } catch {
            // Try next MIME type
          }
        }

        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.ondataavailable = (e) => {
            if (e.data.size > 0) {
              if (
                socketRef.current?.readyState === WebSocket.OPEN &&
                isSocketReadyRef.current
              ) {
                socketRef.current.send(e.data);
              } else if (deepgramApiKeyRef.current) {
                audioBufferRef.current.push(e.data);
                if (audioBufferRef.current.length > MAX_AUDIO_BUFFER_SIZE) {
                  audioBufferRef.current.shift();
                }
              }
            }
          };
          mediaRecorderRef.current.start(100);
        }

        if (deepgramApiKeyRef.current) {
          connectDeepgram(translateFn);
        } else {
          handleSpeechToTextError(translateFn);
        }

        animateAudioLevelLoop();
      } catch (err) {
        if (err instanceof Error) {
          setError(`Microphone error: ${err.message}`);
        } else {
          setError('Microphone error');
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
        setCurrentState('idle');
      }
    },
    [connectDeepgram, handleSpeechToTextError, animateAudioLevelLoop],
  );

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
    clearKeepalive();
    cancelAnimation();
    setAudioLevel(0);
    flushInterimTranscript();
    setCurrentState('paused');
  }, [clearKeepalive, cancelAnimation, flushInterimTranscript]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
    if (socketRef.current?.readyState === WebSocket.OPEN && !keepaliveIntervalRef.current) {
      keepaliveIntervalRef.current = setInterval(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'KeepAlive' }));
        }
      }, KEEPALIVE_INTERVAL_MS);
    }
    setCurrentState('recording');
    animateAudioLevelLoop();
  }, [animateAudioLevelLoop]);

  const stopRecording = useCallback(() => {
    stopMediaResources();
    setCurrentState('idle');
    setTranscript('');
    setIsNoisyEnvironment(false);
    setShowNoisySuggestion(false);
    noiseCheckCountRef.current = 0;
    highNoiseCountRef.current = 0;
  }, [stopMediaResources]);

  const dismissNoisySuggestion = useCallback(() => {
    setShowNoisySuggestion(false);
  }, []);

  const resetNoiseState = useCallback(() => {
    setIsNoisyEnvironment(false);
    setShowNoisySuggestion(false);
    highNoiseCountRef.current = 0;
    noiseCheckCountRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
      if (keepaliveIntervalRef.current) clearInterval(keepaliveIntervalRef.current);
      if (socketRef.current) {
        if (socketRef.current.readyState === WebSocket.OPEN) {
          try {
            socketRef.current.send(JSON.stringify({ type: 'CloseStream' }));
          } catch {
            /* ignore */
          }
        }
        socketRef.current.close();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) audioContextRef.current.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return {
    currentState,
    transcript,
    interimTranscript,
    displayTranscript,
    audioLevel,
    error,
    isRecordingActive,
    isNoisyEnvironment,
    showNoisySuggestion,
    hasMediaRecorder,

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

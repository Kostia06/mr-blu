import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { getDeepgramToken } from '@/lib/api/external';

type RecordingState = 'idle' | 'recording' | 'paused' | 'processing';

interface VoiceRecordingResult {
  state: RecordingState;
  transcript: string;
  interimTranscript: string;
  duration: number;
  audioLevel: number;
  error: string | null;
  startRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  stopRecording: () => Promise<string>;
  resetRecording: () => void;
}

export function useVoiceRecording(): VoiceRecordingResult {
  const [state, setState] = useState<RecordingState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deepgramKeyRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (durationRef.current) clearInterval(durationRef.current);
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const transcribeAudio = useCallback(async (fileUri: string): Promise<string> => {
    if (!deepgramKeyRef.current) {
      deepgramKeyRef.current = await getDeepgramToken();
    }

    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) throw new Error('Recording file not found');

    const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: 'base64',
    });
    const binaryString = atob(fileBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const response = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-2&language=en&punctuate=true&smart_format=true',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${deepgramKeyRef.current}`,
          'Content-Type': 'audio/wav',
        },
        body: bytes.buffer,
      }
    );

    if (!response.ok) {
      deepgramKeyRef.current = null;
      throw new Error('Transcription failed');
    }

    const data = await response.json();
    return data.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    setDuration(0);
    setAudioLevel(0);

    try {
      // Pre-fetch Deepgram key while user is about to record
      if (!deepgramKeyRef.current) {
        getDeepgramToken()
          .then((key) => { deepgramKeyRef.current = key; })
          .catch(() => {});
      }

      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setError('Microphone permission denied');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          extension: '.wav',
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
        },
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          extension: '.wav',
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        isMeteringEnabled: true,
      });

      recording.setOnRecordingStatusUpdate((status) => {
        if (status.metering !== undefined) {
          const normalizedLevel = Math.max(0, Math.min(1, (status.metering + 60) / 60));
          setAudioLevel(normalizedLevel);
        }
      });
      recording.setProgressUpdateInterval(100);

      await recording.startAsync();
      recordingRef.current = recording;
      setState('recording');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      durationRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Start recording error:', err);
      setError('Failed to start recording');
      cleanup();
    }
  }, [cleanup, transcribeAudio]);

  const pauseRecording = useCallback(async () => {
    if (!recordingRef.current) return;

    try {
      await recordingRef.current.pauseAsync();
      setState('paused');
      if (durationRef.current) clearInterval(durationRef.current);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      console.error('Pause recording error:', err);
    }
  }, []);

  const resumeRecording = useCallback(async () => {
    if (!recordingRef.current) return;

    try {
      await recordingRef.current.startAsync();
      setState('recording');
      durationRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      console.error('Resume recording error:', err);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string> => {
    setState('processing');
    setInterimTranscript('Transcribing...');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (durationRef.current) clearInterval(durationRef.current);

    let fileUri = '';
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        fileUri = recordingRef.current.getURI() || '';
        recordingRef.current = null;
      }
    } catch (err) {
      console.error('Stop recording error:', err);
    }

    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    if (!fileUri) {
      setError('No recording file found');
      setInterimTranscript('');
      setState('idle');
      return '';
    }

    try {
      const result = await transcribeAudio(fileUri);
      setTranscript(result);
      setInterimTranscript('');
      setState('idle');
      return result;
    } catch (err) {
      console.error('Transcription error:', err);
      setError('Transcription failed. Please try again.');
      setInterimTranscript('');
      setState('idle');
      return '';
    } finally {
      FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
    }
  }, [transcribeAudio]);

  const resetRecording = useCallback(() => {
    cleanup();
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    setState('idle');
    setTranscript('');
    setInterimTranscript('');
    setDuration(0);
    setAudioLevel(0);
    setError(null);
  }, [cleanup]);

  return {
    state,
    transcript,
    interimTranscript,
    duration,
    audioLevel,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  };
}

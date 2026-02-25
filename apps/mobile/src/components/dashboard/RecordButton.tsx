import { Pressable, View, Text, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { Mic, Square, Pause, Play } from 'lucide-react-native';

type RecordingState = 'idle' | 'recording' | 'paused' | 'processing';

interface RecordButtonProps {
  state: RecordingState;
  audioLevel: number;
  onPress: () => void;
  onLongPress?: () => void;
}

export function RecordButton({ state, audioLevel, onPress, onLongPress }: RecordButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (state === 'recording') {
      pulseAnim.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ringOpacity, { toValue: 0.5, duration: 1500, useNativeDriver: true }),
            Animated.timing(pulseScale, { toValue: 1.15, duration: 1500, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(ringOpacity, { toValue: 0, duration: 1500, useNativeDriver: true }),
            Animated.timing(pulseScale, { toValue: 1, duration: 1500, useNativeDriver: true }),
          ]),
        ])
      );
      pulseAnim.current.start();
    } else {
      pulseAnim.current?.stop();
      Animated.parallel([
        Animated.timing(ringOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [state]);

  useEffect(() => {
    if (state === 'recording') {
      Animated.spring(scale, {
        toValue: 1 + audioLevel * 0.15,
        damping: 15,
        useNativeDriver: true,
      }).start();
    }
  }, [audioLevel, state]);

  const isRecording = state === 'recording';
  const isPaused = state === 'paused';
  const isProcessing = state === 'processing';

  const Icon = isRecording ? Pause : isPaused ? Play : isProcessing ? Square : Mic;
  const bgColor = isRecording ? 'bg-red-500' : isPaused ? 'bg-amber-500' : 'bg-blu-primary';

  return (
    <View className="items-center justify-center">
      {isRecording && (
        <Animated.View
          className="absolute w-24 h-24 rounded-full border-2 border-red-400"
          style={{ transform: [{ scale: pulseScale }], opacity: ringOpacity }}
        />
      )}
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          className={`w-20 h-20 rounded-full ${bgColor} items-center justify-center shadow-lg active:opacity-90`}
          disabled={isProcessing}
        >
          <Icon size={32} color="#fff" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

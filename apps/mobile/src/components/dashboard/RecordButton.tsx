import { Pressable, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Mic, Square, Pause, Play } from 'lucide-react-native';

type RecordingState = 'idle' | 'recording' | 'paused' | 'processing';

interface RecordButtonProps {
  state: RecordingState;
  audioLevel: number;
  onPress: () => void;
  onLongPress?: () => void;
}

export function RecordButton({ state, audioLevel, onPress, onLongPress }: RecordButtonProps) {
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    if (state === 'recording') {
      ringOpacity.value = withRepeat(
        withTiming(0.5, { duration: 1500 }),
        -1,
        true
      );
      pulseScale.value = withRepeat(
        withTiming(1.15, { duration: 1500 }),
        -1,
        true
      );
    } else {
      ringOpacity.value = withTiming(0);
      pulseScale.value = withTiming(1);
    }
  }, [state]);

  useEffect(() => {
    if (state === 'recording') {
      scale.value = withSpring(1 + audioLevel * 0.15, { damping: 15 });
    }
  }, [audioLevel, state]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: ringOpacity.value,
  }));

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
          style={ringStyle}
        />
      )}
      <Animated.View style={buttonStyle}>
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

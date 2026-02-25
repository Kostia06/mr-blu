import { useRef } from 'react';
import { View, Text, Animated, Pressable } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Trash2, Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onSend?: () => void;
}

function RightActions(
  progress: Animated.AnimatedInterpolation<number>,
  onDelete?: () => void,
) {
  if (!onDelete) return null;

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [80, 0],
  });

  return (
    <Animated.View
      style={{
        transform: [{ translateX }],
        width: 80,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Pressable
        onPress={onDelete}
        className="w-full h-full items-center justify-center rounded-r-card"
        style={{ backgroundColor: '#EF4444' }}
      >
        <Trash2 size={20} color="#fff" />
        <Text className="text-xs text-white font-medium mt-1">Delete</Text>
      </Pressable>
    </Animated.View>
  );
}

function LeftActions(
  progress: Animated.AnimatedInterpolation<number>,
  onSend?: () => void,
) {
  if (!onSend) return null;

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 0],
  });

  return (
    <Animated.View
      style={{
        transform: [{ translateX }],
        width: 80,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Pressable
        onPress={onSend}
        className="w-full h-full items-center justify-center rounded-l-card"
        style={{ backgroundColor: '#0066FF' }}
      >
        <Send size={20} color="#fff" />
        <Text className="text-xs text-white font-medium mt-1">Send</Text>
      </Pressable>
    </Animated.View>
  );
}

export function SwipeableRow({ children, onDelete, onSend }: SwipeableRowProps) {
  const swipeableRef = useRef<Swipeable>(null);

  function handleSwipeOpen(direction: 'left' | 'right') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (direction === 'right' && onDelete) {
      onDelete();
    } else if (direction === 'left' && onSend) {
      onSend();
    }
    swipeableRef.current?.close();
  }

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      renderRightActions={(progress) => RightActions(progress, onDelete)}
      renderLeftActions={(progress) => LeftActions(progress, onSend)}
      onSwipeableOpen={handleSwipeOpen}
    >
      {children}
    </Swipeable>
  );
}

import { useEffect, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { Sparkles } from 'lucide-react-native';

const STEPS = [
  { label: 'Parsing voice input...', duration: 1500 },
  { label: 'Identifying intent...', duration: 2000 },
  { label: 'Extracting details...', duration: 2500 },
];

export function ReviewLoadingState() {
  const [currentStep, setCurrentStep] = useState(0);
  const [spinValue] = useState(new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [spinValue]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;

    for (let i = 1; i < STEPS.length; i++) {
      elapsed += STEPS[i - 1].duration;
      timers.push(setTimeout(() => setCurrentStep(i), elapsed));
    }

    return () => timers.forEach(clearTimeout);
  }, []);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View className="flex-1 items-center justify-center px-6">
      <Animated.View style={{ transform: [{ rotate }], marginBottom: 24 }}>
        <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center">
          <Sparkles size={28} color="#2563EB" />
        </View>
      </Animated.View>

      <View className="items-center gap-3">
        {STEPS.map((step, index) => (
          <View key={step.label} className="flex-row items-center gap-2">
            <View
              className={`w-2 h-2 rounded-full ${
                index <= currentStep ? 'bg-blu-primary' : 'bg-gray-300'
              }`}
            />
            <Text
              className={`text-sm ${
                index <= currentStep ? 'text-gray-900 font-medium' : 'text-gray-400'
              }`}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

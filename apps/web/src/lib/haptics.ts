type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10],
  warning: [20, 50, 20],
  error: [30, 50, 30, 50, 30],
};

export function haptic(style: HapticStyle = 'light'): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(PATTERNS[style]);
  }
}

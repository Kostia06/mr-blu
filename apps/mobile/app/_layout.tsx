import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Providers } from '@/components/providers/Providers';
import { ToastContainer } from '@/components/ui/Toast';
import { useThemeStore } from '@/stores/themeStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useThemeStore((s) => s.colorScheme);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Providers>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="review"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="reviews" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <ToastContainer />
      </Providers>
    </GestureHandlerRootView>
  );
}

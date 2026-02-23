import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{
    access_token?: string;
    refresh_token?: string;
  }>();

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    try {
      // Try search params first (expo-router parsed)
      if (params.access_token && params.refresh_token) {
        await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        router.replace('/(tabs)');
        return;
      }

      // Also try parsing tokens from the full URL (hash fragment)
      const url = await Linking.getInitialURL();
      if (url) {
        const hashParams = extractHashParams(url);
        if (hashParams.access_token && hashParams.refresh_token) {
          await supabase.auth.setSession({
            access_token: hashParams.access_token,
            refresh_token: hashParams.refresh_token,
          });
          router.replace('/(tabs)');
          return;
        }
      }

      // If no tokens found, check if already authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      router.replace('/(auth)/login');
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-blu-bg">
      <ActivityIndicator size="large" color="#0066FF" />
      <Text className="text-gray-600 mt-4">Signing you in...</Text>
    </View>
  );
}

function extractHashParams(url: string): Record<string, string> {
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return {};

  const hash = url.substring(hashIndex + 1);
  const params: Record<string, string> = {};
  for (const pair of hash.split('&')) {
    const [key, value] = pair.split('=');
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  }
  return params;
}

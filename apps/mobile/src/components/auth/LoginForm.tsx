import { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail } from 'lucide-react-native';
import { loginWithOtp, AuthError } from '@/lib/api/auth';
import { useI18nStore } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { GlassBackground } from '@/components/layout/GlassBackground';

export function LoginForm() {
  const { t } = useI18nStore();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!email.trim() || !email.includes('@')) {
      setError(t('auth.enterValidEmail'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await loginWithOtp(email.trim());
      setSent(true);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError(t('errors.generic'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View
          className="flex-1 justify-center px-8"
          style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
          <View className="items-center mb-12">
            <View className="w-16 h-16 bg-blu-primary rounded-2xl items-center justify-center mb-4">
              <Text className="text-white text-2xl font-bold">B</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900">Mr. Blu</Text>
            <Text className="text-gray-500 mt-2">{t('auth.signIn')}</Text>
          </View>

          {sent ? (
            <View className="bg-white rounded-card p-6 items-center">
              <Mail size={48} color="#0066FF" />
              <Text className="text-xl font-semibold text-gray-900 mt-4">
                {t('auth.checkEmail')}
              </Text>
              <Text className="text-gray-500 text-center mt-2">
                {t('auth.magicLinkSent')}
              </Text>
              <Button
                onPress={() => setSent(false)}
                variant="ghost"
                size="sm"
              >
                {t('auth.tryAgain')}
              </Button>
            </View>
          ) : (
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">
                {t('auth.email')}
              </Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-input px-4 py-3.5 text-base text-gray-900 mb-4"
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoFocus
              />

              {error ? (
                <Text className="text-red-500 text-sm mb-3">{error}</Text>
              ) : null}

              <Button
                onPress={handleSubmit}
                loading={loading}
                fullWidth
                size="lg"
              >
                {t('auth.sendMagicLink')}
              </Button>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </GlassBackground>
  );
}

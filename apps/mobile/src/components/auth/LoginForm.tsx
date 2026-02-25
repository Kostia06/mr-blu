import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Send, RefreshCw, Zap, Lock } from 'lucide-react-native';
import { loginWithOtp, devLogin, AuthError } from '@/lib/api/auth';
import { useI18nStore } from '@/lib/i18n';
import { router } from 'expo-router';
import { GlassBackground } from '@/components/layout/GlassBackground';

const RESEND_DELAY = 60;
const IS_DEV = __DEV__;

export function LoginForm() {
  const { t } = useI18nStore();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startResendTimer = useCallback(() => {
    setResendCountdown(RESEND_DELAY);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          countdownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const handleSubmit = useCallback(
    async (submittedEmail?: string) => {
      const targetEmail = submittedEmail || email;
      if (!targetEmail.trim() || !targetEmail.includes('@')) {
        setError(t('auth.invalidEmail'));
        return;
      }

      setLoading(true);
      setError('');

      try {
        await loginWithOtp(targetEmail.trim());
        setSent(true);
        setSentEmail(targetEmail.trim());
        startResendTimer();
      } catch (err) {
        if (err instanceof AuthError) {
          setError(err.message);
        } else {
          setError(t('auth.genericError'));
        }
      } finally {
        setLoading(false);
      }
    },
    [email, t, startResendTimer],
  );

  const handleDevLogin = useCallback(async () => {
    if (!email || !password) {
      setError('Email and password required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await devLogin(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError(t('auth.genericError'));
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, t]);

  return (
    <GlassBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View
          className="flex-1 justify-center px-6"
          style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
          {/* Header */}
          <View className="items-center mb-8">
            <Text
              className="text-[32px] font-bold"
              style={{ color: '#0066FF', letterSpacing: -0.64 }}
            >
              mrblu
            </Text>
            <Text className="text-base text-gray-500 mt-2">
              {t('auth.signIn')}
            </Text>
          </View>

          {/* Glass Card */}
          <BlurView
            intensity={40}
            tint="light"
            className="overflow-hidden rounded-3xl"
            style={{
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.8)',
            }}
          >
            <View
              className="p-8"
              style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}
            >
              {sent ? (
                <View className="items-center py-4">
                  <View
                    className="w-[72px] h-[72px] rounded-full items-center justify-center mb-5"
                    style={{ backgroundColor: 'rgba(16,185,129,0.08)' }}
                  >
                    <Send size={32} color="#10b981" strokeWidth={1.5} />
                  </View>
                  <Text className="text-xl font-bold text-gray-900 mb-2">
                    {t('auth.checkEmail')}
                  </Text>
                  <Text className="text-[15px] text-gray-500 text-center leading-relaxed">
                    {t('auth.magicLinkSent')}
                  </Text>

                  <View className="mt-6 pt-5 border-t border-gray-200 w-full items-center">
                    {resendCountdown > 0 ? (
                      <Text className="text-sm text-gray-500">
                        {t('auth.resendIn')}{' '}
                        <Text
                          className="font-semibold"
                          style={{ color: '#0066FF' }}
                        >
                          {resendCountdown}s
                        </Text>
                      </Text>
                    ) : (
                      <Pressable
                        onPress={() => handleSubmit(sentEmail)}
                        disabled={loading}
                        className="flex-row items-center gap-2 px-5 py-3 rounded-xl active:opacity-80"
                        style={{
                          borderWidth: 1,
                          borderColor: '#0066FF',
                        }}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#0066FF" />
                        ) : (
                          <RefreshCw size={16} color="#0066FF" />
                        )}
                        <Text
                          className="text-sm font-semibold"
                          style={{ color: '#0066FF' }}
                        >
                          {t('auth.resendEmail')}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              ) : (
                <View>
                  {/* Email Field */}
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    {t('auth.email')}
                  </Text>
                  <TextInput
                    className="border rounded-[14px] px-4 py-3.5 text-base text-gray-900 mb-5"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      borderColor: '#e2e8f0',
                    }}
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
                  />

                  {/* Magic Link Button */}
                  <Pressable
                    onPress={() => handleSubmit()}
                    disabled={loading}
                    className="flex-row items-center justify-center gap-2.5 py-4 px-6 rounded-[14px] active:scale-[0.98]"
                    style={{
                      backgroundColor: '#0066FF',
                      shadowColor: '#0066FF',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 16,
                      elevation: 8,
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Mail size={20} color="#fff" strokeWidth={2} />
                    )}
                    <Text className="text-base font-semibold text-white">
                      {t('auth.sendMagicLink')}
                    </Text>
                  </Pressable>

                  {/* Terms */}
                  <Text className="text-xs text-center mt-4 leading-relaxed" style={{ color: '#94a3b8' }}>
                    {t('auth.termsNotice')}{' '}
                    <Text className="underline" style={{ color: '#64748b' }}>
                      {t('auth.termsOfService')}
                    </Text>{' '}
                    {t('auth.and')}{' '}
                    <Text className="underline" style={{ color: '#64748b' }}>
                      {t('auth.privacyPolicy')}
                    </Text>
                    .
                  </Text>

                  {/* Dev Login */}
                  {IS_DEV && (
                    <View className="mt-6">
                      <View className="flex-row items-center gap-3 mb-4">
                        <View className="flex-1 h-px" style={{ backgroundColor: '#F59E0B' }} />
                        <Text className="text-[11px] font-bold tracking-widest" style={{ color: '#92400e' }}>
                          DEV LOGIN
                        </Text>
                        <View className="flex-1 h-px" style={{ backgroundColor: '#F59E0B' }} />
                      </View>

                      <Text className="text-sm font-semibold text-gray-700 mb-2">
                        Password
                      </Text>
                      <TextInput
                        className="border rounded-[14px] px-4 py-3.5 text-base text-gray-900 mb-4"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.8)',
                          borderColor: '#e2e8f0',
                        }}
                        placeholder="Dev password"
                        placeholderTextColor="#94A3B8"
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          setError('');
                        }}
                        secureTextEntry
                        autoComplete="current-password"
                      />

                      <Pressable
                        onPress={handleDevLogin}
                        disabled={loading}
                        className="flex-row items-center justify-center gap-2 py-3 px-5 rounded-[14px] active:scale-[0.98]"
                        style={{
                          backgroundColor: '#F59E0B',
                          opacity: loading ? 0.6 : 1,
                        }}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Zap size={16} color="#fff" strokeWidth={2} />
                        )}
                        <Text className="text-sm font-bold text-white uppercase tracking-wide">
                          Dev Login
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Error */}
                  {error ? (
                    <View
                      className="mt-5 py-3.5 px-4 rounded-xl"
                      style={{
                        backgroundColor: 'rgba(239,68,68,0.1)',
                        borderWidth: 1,
                        borderColor: 'rgba(239,68,68,0.2)',
                      }}
                    >
                      <Text className="text-sm text-center" style={{ color: '#ef4444' }}>
                        {error}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </GlassBackground>
  );
}

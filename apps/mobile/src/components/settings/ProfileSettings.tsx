import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Mail } from 'lucide-react-native';
import { useI18nStore } from '@/lib/i18n';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { updateProfile, updateEmail } from '@/lib/api/user';
import { FormInput } from '@/components/forms/FormInput';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { GlassBackground } from '@/components/layout/GlassBackground';
import { Button } from '@/components/ui/Button';

export function ProfileSettings() {
  const { t } = useI18nStore();
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore();
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [emailChanging, setEmailChanging] = useState(false);

  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata;
    setFirstName(meta?.first_name || meta?.full_name?.split(' ')[0] || '');
    setLastName(meta?.last_name || meta?.full_name?.split(' ').slice(1).join(' ') || '');
    setEmail(user.email || '');
    setPhone(meta?.phone || '');
  }, [user]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        phone,
      });
      setSaved(true);
      toast.success(t('profile.saved'));
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error(t('profile.failed'));
    } finally {
      setSaving(false);
    }
  }, [firstName, lastName, phone, t, toast]);

  const handleEmailChange = useCallback(async () => {
    if (!newEmail || newEmail === email) return;
    setEmailChanging(true);
    try {
      const result = await updateEmail(newEmail);
      toast.success(result.message);
      setShowEmailChange(false);
      setNewEmail('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update email');
    } finally {
      setEmailChanging(false);
    }
  }, [newEmail, email, toast]);

  const saveButton = (
    <Pressable
      onPress={handleSave}
      disabled={saving}
      className={`px-4 py-2 rounded-xl ${saved ? 'bg-emerald-500' : 'bg-blu-primary'} ${saving ? 'opacity-70' : ''}`}
    >
      {saving ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : saved ? (
        <Check size={16} color="#fff" strokeWidth={2.5} />
      ) : (
        <Text className="text-sm font-semibold text-white">{t('common.save')}</Text>
      )}
    </Pressable>
  );

  return (
    <GlassBackground>
      <ScreenHeader title={t('profile.title')} showBack rightAction={saveButton} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-white rounded-card p-4 shadow-sm mb-6">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {t('profile.personalInfo')}
            </Text>
            <FormInput
              label={t('profile.firstName')}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t('placeholder.firstName')}
            />
            <FormInput
              label={t('profile.lastName')}
              value={lastName}
              onChangeText={setLastName}
              placeholder={t('placeholder.lastName')}
            />
            <FormInput
              label={t('profile.phoneNumber')}
              value={phone}
              onChangeText={setPhone}
              placeholder={t('placeholder.phone')}
              keyboardType="phone-pad"
              hint={t('profile.phoneHint')}
            />
          </View>

          <View className="bg-white rounded-card p-4 shadow-sm mb-6">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {t('profile.emailAddress')}
            </Text>

            <View className="flex-row items-center py-3">
              <View className="w-11 h-11 rounded-xl bg-blue-50 items-center justify-center mr-3">
                <Mail size={20} color="#0066FF" />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-medium text-gray-900" numberOfLines={1}>
                  {email}
                </Text>
                <Text className="text-xs text-gray-500">{t('profile.primaryEmail')}</Text>
              </View>
              <Pressable
                onPress={() => setShowEmailChange(!showEmailChange)}
                className="px-3 py-2 bg-gray-100 rounded-xl"
              >
                <Text className="text-[13px] font-medium text-gray-600">
                  {showEmailChange ? t('common.cancel') : t('profile.change')}
                </Text>
              </Pressable>
            </View>

            {showEmailChange && (
              <View className="mt-3 pt-3 border-t border-gray-100">
                <FormInput
                  label={t('profile.newEmail')}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder={t('placeholder.email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Button
                  onPress={handleEmailChange}
                  disabled={emailChanging || !newEmail}
                  loading={emailChanging}
                  fullWidth
                  icon={!emailChanging ? <Mail size={16} color="#fff" /> : undefined}
                >
                  {emailChanging ? t('docDetail.sending') : t('profile.sendConfirmation')}
                </Button>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GlassBackground>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useI18nStore } from '@/lib/i18n';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { updateBusiness } from '@/lib/api/user';
import { FormInput } from '@/components/forms/FormInput';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { GlassBackground } from '@/components/layout/GlassBackground';
import { GlassCard } from '@/components/ui/GlassCard';

export function BusinessSettings() {
  const { t } = useI18nStore();
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ returnUrl?: string }>();

  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [taxId, setTaxId] = useState('');
  const [website, setWebsite] = useState('');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    const business = user.user_metadata?.business || {};
    setCompanyName(business.name || '');
    setAddress(business.address || '');
    setCity(business.city || '');
    setStateCode(business.state || '');
    setZipCode(business.zip || '');
    setTaxId(business.tax_id || '');
    setWebsite(business.website || '');
  }, [user]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateBusiness({
        name: companyName,
        address,
        city,
        state: stateCode,
        zip: zipCode,
        tax_id: taxId,
        website,
      });
      setSaved(true);
      toast.success(t('settings.businessUpdated'));
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error(t('settings.businessFailed'));
    } finally {
      setSaving(false);
    }
  }, [companyName, address, city, stateCode, zipCode, taxId, website, t, toast]);

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
      <ScreenHeader title={t('settings.businessTitle')} showBack rightAction={saveButton} />
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
          <GlassCard className="mb-6">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {t('settings.companyInfo')}
            </Text>
            <FormInput
              label={t('settings.companyNameLabel')}
              value={companyName}
              onChangeText={setCompanyName}
              placeholder={t('placeholder.companyName')}
            />
            <FormInput
              label={t('settings.websiteLabel')}
              value={website}
              onChangeText={setWebsite}
              placeholder="https://yourcompany.com"
              keyboardType="url"
              autoCapitalize="none"
            />
            <FormInput
              label={t('settings.taxIdLabel')}
              value={taxId}
              onChangeText={setTaxId}
              placeholder={t('placeholder.ein')}
              hint={t('settings.taxIdHint')}
            />
          </GlassCard>

          <GlassCard className="mb-6">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {t('settings.businessAddressTitle')}
            </Text>
            <Text className="text-xs text-gray-400 mb-3">
              {t('settings.businessAddressDesc')}
            </Text>
            <FormInput
              label={t('settings.streetAddress')}
              value={address}
              onChangeText={setAddress}
              placeholder="123 Main Street"
            />
            <FormInput
              label={t('settings.cityLabel')}
              value={city}
              onChangeText={setCity}
              placeholder={t('placeholder.city')}
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <FormInput
                  label={t('settings.stateLabel')}
                  value={stateCode}
                  onChangeText={setStateCode}
                  placeholder={t('placeholder.state')}
                />
              </View>
              <View className="flex-1">
                <FormInput
                  label={t('settings.zipLabel')}
                  value={zipCode}
                  onChangeText={setZipCode}
                  placeholder="78701"
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </GlassBackground>
  );
}

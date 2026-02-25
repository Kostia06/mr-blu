import { useState, useEffect } from 'preact/hooks';
import type { User } from '@supabase/supabase-js';
import { Check, Loader2, Building2, Globe, MapPin, Hash } from 'lucide-react';
import { FormInput } from '@/components/forms/FormInput';
import { FormSection } from '@/components/forms/FormSection';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { useI18nStore } from '@/lib/i18n';
import { updateBusiness } from '@/lib/api/user';
import { cn } from '@/lib/utils';

interface BusinessSettingsProps {
  user: User | null;
}

export function BusinessSettings({ user }: BusinessSettingsProps) {
  const { t } = useI18nStore();

  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [taxId, setTaxId] = useState('');
  const [website, setWebsite] = useState('');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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

  const [backUrl, setBackUrl] = useState('/dashboard/settings');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('from') !== 'review') return;
    const sessionId = params.get('session');
    setBackUrl(sessionId ? `/dashboard/review?session=${sessionId}` : '/dashboard/review');
  }, []);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccessMessage('');

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
      setSuccessMessage(t('settings.businessUpdated'));
      setTimeout(() => {
        setSaved(false);
        setSuccessMessage('');
      }, 3000);
    } catch {
      setError(t('settings.businessFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main class="min-h-screen bg-transparent">
      <SettingsPageHeader
        title={t('settings.businessTitle')}
        backHref={backUrl}
        backLabel={t('common.backToSettings')}
        right={
          <button
            class={cn(
              'min-w-[72px] h-9 px-4 flex items-center justify-center gap-1.5 bg-[var(--blu-primary,#0066ff)] border-none rounded-[var(--radius-input,12px)] text-white text-sm font-semibold cursor-pointer',
              saved && 'bg-[var(--data-green,#10b981)]',
              saving && 'opacity-70 cursor-not-allowed'
            )}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 size={16} class="animate-spin" />
            ) : saved ? (
              <Check size={16} strokeWidth={2.5} />
            ) : (
              t('common.save')
            )}
          </button>
        }
      />

      <div class="px-[var(--page-padding-x,20px)] max-w-[var(--page-max-width,600px)] mx-auto flex flex-col gap-[var(--section-gap,24px)] pb-[100px]">
        <FormSection title={t('settings.companyInfo')} variant="card">
          <FormInput
            label={t('settings.companyNameLabel')}
            name="companyName"
            value={companyName}
            placeholder={t('placeholder.companyName')}
            icon={<Building2 size={18} />}
            onValueChange={setCompanyName}
          />
          <FormInput
            label={t('settings.websiteLabel')}
            name="website"
            type="url"
            value={website}
            placeholder="https://yourcompany.com"
            icon={<Globe size={18} />}
            onValueChange={setWebsite}
          />
          <FormInput
            label={t('settings.taxIdLabel')}
            name="taxId"
            value={taxId}
            placeholder={t('placeholder.ein')}
            hint={t('settings.taxIdHint')}
            icon={<Hash size={18} />}
            onValueChange={setTaxId}
          />
        </FormSection>

        <FormSection
          title={t('settings.businessAddressTitle')}
          description={t('settings.businessAddressDesc')}
          variant="card"
        >
          <FormInput
            label={t('settings.streetAddress')}
            name="address"
            value={address}
            placeholder="123 Main Street"
            icon={<MapPin size={18} />}
            onValueChange={setAddress}
          />
          <div class="flex flex-col gap-4">
            <FormInput
              label={t('settings.cityLabel')}
              name="city"
              value={city}
              placeholder={t('placeholder.city')}
              onValueChange={setCity}
            />
            <div class="grid grid-cols-2 gap-3">
              <FormInput
                label={t('settings.stateLabel')}
                name="state"
                value={stateCode}
                placeholder={t('placeholder.state')}
                onValueChange={setStateCode}
              />
              <FormInput
                label={t('settings.zipLabel')}
                name="zipCode"
                value={zipCode}
                placeholder="78701"
                onValueChange={setZipCode}
              />
            </div>
          </div>
        </FormSection>

        {successMessage && (
          <div class="flex items-center gap-2.5 py-3.5 px-4 rounded-[var(--radius-button,14px)] text-sm font-medium bg-[var(--status-paid-bg,rgba(16,185,129,0.1))] text-[var(--data-green,#10b981)]">
            <Check size={18} strokeWidth={2.5} />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div class="flex items-center gap-2.5 py-3.5 px-4 rounded-[var(--radius-button,14px)] text-sm font-medium bg-[var(--status-overdue-bg,rgba(239,68,68,0.1))] text-[var(--data-red,#ef4444)]">
            <span>{error}</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}

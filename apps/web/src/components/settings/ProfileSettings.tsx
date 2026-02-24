import { useState, useEffect } from 'preact/hooks';
import type { User } from '@supabase/supabase-js';
import { Check, Loader2, Mail, User as UserIcon } from 'lucide-react';
import { FormInput } from '@/components/forms/FormInput';
import { FormSection } from '@/components/forms/FormSection';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { useI18nStore } from '@/lib/i18n';
import { updateProfile, updateEmail } from '@/lib/api/user';
import { cn } from '@/lib/utils';

interface ProfileSettingsProps {
  user: User | null;
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const { t } = useI18nStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [showEmailChange, setShowEmailChange] = useState(false);
  const [emailChanging, setEmailChanging] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata;
    setFirstName(meta?.first_name || meta?.full_name?.split(' ')[0] || '');
    setLastName(meta?.last_name || meta?.full_name?.split(' ').slice(1).join(' ') || '');
    setEmail(user.email || '');
    setPhone(meta?.phone || '');
  }, [user]);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        phone,
      });

      setSaved(true);
      setSuccessMessage(t('profile.saved'));
      setTimeout(() => {
        setSaved(false);
        setSuccessMessage('');
      }, 3000);
    } catch {
      setError(t('profile.failed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleEmailChange() {
    if (!newEmail || newEmail === email) return;

    setEmailChanging(true);
    setEmailError('');
    setSuccessMessage('');

    try {
      const result = await updateEmail(newEmail);

      setSuccessMessage(result.message);
      setShowEmailChange(false);
      setNewEmail('');
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Failed to update email');
    } finally {
      setEmailChanging(false);
    }
  }

  return (
    <main className="min-h-screen bg-transparent">
      <SettingsPageHeader
        title={t('profile.title')}
        backLabel={t('common.backToSettings')}
        right={
          <button
            className={cn(
              'min-w-[72px] h-9 px-4 flex items-center justify-center gap-1.5 bg-[var(--blu-primary,#0066ff)] border-none rounded-[var(--radius-input,12px)] text-white text-sm font-semibold cursor-pointer',
              saved && 'bg-[var(--data-green,#10b981)]',
              saving && 'opacity-70 cursor-not-allowed'
            )}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : saved ? (
              <Check size={16} strokeWidth={2.5} />
            ) : (
              t('common.save')
            )}
          </button>
        }
      />

      <div className="px-[var(--page-padding-x,20px)] max-w-[var(--page-max-width,600px)] mx-auto flex flex-col gap-[var(--section-gap,24px)] pb-[100px]">
        <FormSection title={t('profile.personalInfo')} variant="card">
          <FormInput
            label={t('profile.firstName')}
            name="firstName"
            value={firstName}
            placeholder={t('placeholder.firstName')}
            icon={<UserIcon size={18} />}
            onValueChange={setFirstName}
          />
          <FormInput
            label={t('profile.lastName')}
            name="lastName"
            value={lastName}
            placeholder={t('placeholder.lastName')}
            onValueChange={setLastName}
          />
          <FormInput
            label={t('profile.phoneNumber')}
            name="phone"
            type="tel"
            value={phone}
            placeholder={t('placeholder.phone')}
            hint={t('profile.phoneHint')}
            onValueChange={setPhone}
          />
        </FormSection>

        <FormSection
          title={t('profile.emailAddress')}
          description={t('profile.emailDesc')}
          variant="card"
        >
          <div className="flex items-center gap-3.5 px-4 py-3.5 bg-transparent rounded-[var(--radius-input,12px)]">
            <div className="flex items-center justify-center w-11 h-11 bg-[var(--white,#dbe8f4)] rounded-[var(--radius-input,12px)] text-[var(--blu-primary,#0066ff)] shrink-0">
              <Mail size={20} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <span className="text-[15px] font-medium text-[var(--gray-900,#0f172a)] whitespace-nowrap overflow-hidden text-ellipsis">
                {email}
              </span>
              <span className="text-xs text-[var(--gray-500,#64748b)]">
                {t('profile.primaryEmail')}
              </span>
            </div>
            <button
              type="button"
              className="px-3.5 py-2 bg-white/50 border-none rounded-[var(--radius-input,12px)] text-[var(--gray-600,#475569)] text-[13px] font-medium cursor-pointer shrink-0"
              onClick={() => setShowEmailChange(!showEmailChange)}
            >
              {showEmailChange ? t('common.cancel') : t('profile.change')}
            </button>
          </div>

          {showEmailChange && (
            <div className="flex flex-col gap-4 p-4 bg-transparent rounded-[var(--radius-input,12px)] mt-3">
              <FormInput
                label={t('profile.newEmail')}
                name="newEmail"
                type="email"
                value={newEmail}
                placeholder={t('placeholder.email')}
                error={emailError}
                onValueChange={setNewEmail}
              />
              <button
                type="button"
                className={cn(
                  'flex items-center justify-center gap-2 px-5 py-3.5 bg-[var(--blu-primary,#0066ff)] border-none rounded-[var(--radius-button,14px)] text-white text-sm font-semibold cursor-pointer',
                  (emailChanging || !newEmail) && 'opacity-60 cursor-not-allowed'
                )}
                onClick={handleEmailChange}
                disabled={emailChanging || !newEmail}
              >
                {emailChanging ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{t('docDetail.sending')}</span>
                  </>
                ) : (
                  <>
                    <Mail size={16} />
                    <span>{t('profile.sendConfirmation')}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </FormSection>

        {successMessage && (
          <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-[var(--radius-button,14px)] text-sm font-medium bg-[var(--status-paid-bg,rgba(16,185,129,0.1))] text-[var(--data-green,#10b981)]">
            <Check size={18} strokeWidth={2.5} />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-[var(--radius-button,14px)] text-sm font-medium bg-[var(--status-overdue-bg,rgba(239,68,68,0.1))] text-[var(--data-red,#ef4444)]">
            <span>{error}</span>
          </div>
        )}
      </div>
    </main>
  );
}

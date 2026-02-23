import { useState, useEffect } from 'preact/hooks';
import type { User } from '@supabase/supabase-js';
import { Check, Loader2, Mail, User as UserIcon } from 'lucide-react';
import { FormInput } from '@/components/forms/FormInput';
import { FormSection } from '@/components/forms/FormSection';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { useI18nStore } from '@/lib/i18n';
import { updateProfile, updateEmail } from '@/lib/api/user';

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

  const saveBtnStyle: Record<string, string | number> = {
    ...styles.saveBtn,
    ...(saved ? styles.saveBtnSaved : {}),
    ...(saving ? { opacity: 0.7, cursor: 'not-allowed' } : {}),
  };

  return (
    <main style={styles.page}>
      <SettingsPageHeader
        title={t('profile.title')}
        backLabel={t('common.backToSettings')}
        right={
          <button style={saveBtnStyle} onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : saved ? (
              <Check size={16} strokeWidth={2.5} />
            ) : (
              t('common.save')
            )}
          </button>
        }
      />

      <div style={styles.pageContent}>
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
          <div style={styles.emailDisplay}>
            <div style={styles.emailIcon}>
              <Mail size={20} strokeWidth={1.5} />
            </div>
            <div style={styles.emailInfo}>
              <span style={styles.emailValue}>{email}</span>
              <span style={styles.emailLabel}>{t('profile.primaryEmail')}</span>
            </div>
            <button
              type="button"
              style={styles.changeBtn}
              onClick={() => setShowEmailChange(!showEmailChange)}
            >
              {showEmailChange ? t('common.cancel') : t('profile.change')}
            </button>
          </div>

          {showEmailChange && (
            <div style={styles.emailChangePanel}>
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
                style={{
                  ...styles.confirmBtn,
                  ...(emailChanging || !newEmail ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
                }}
                onClick={handleEmailChange}
                disabled={emailChanging || !newEmail}
              >
                {emailChanging ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
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
          <div style={styles.messageSuccess}>
            <Check size={18} strokeWidth={2.5} />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div style={styles.messageError}>
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

const styles: Record<string, Record<string, string | number>> = {
  page: {
    minHeight: '100vh',
    background: 'transparent',
  },
  saveBtn: {
    minWidth: 72,
    height: 36,
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    background: 'var(--blu-primary, #0066ff)',
    border: 'none',
    borderRadius: 'var(--radius-input, 12px)',
    color: 'white',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  saveBtnSaved: {
    background: 'var(--data-green, #10b981)',
  },
  pageContent: {
    padding: 'var(--page-padding-x, 20px)',
    maxWidth: 'var(--page-max-width, 600px)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--section-gap, 24px)',
    paddingBottom: 100,
  },
  emailDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 16px',
    background: 'transparent',
    borderRadius: 'var(--radius-input, 12px)',
  },
  emailIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    background: 'var(--white, #dbe8f4)',
    borderRadius: 'var(--radius-input, 12px)',
    color: 'var(--blu-primary, #0066ff)',
    flexShrink: 0,
  },
  emailInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  emailValue: {
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--gray-900, #0f172a)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  emailLabel: {
    fontSize: 12,
    color: 'var(--gray-500, #64748b)',
  },
  changeBtn: {
    padding: '8px 14px',
    background: 'rgba(255,255,255,0.5)',
    border: 'none',
    borderRadius: 'var(--radius-input, 12px)',
    color: 'var(--gray-600, #475569)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    flexShrink: 0,
  },
  emailChangePanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 16,
    background: 'transparent',
    borderRadius: 'var(--radius-input, 12px)',
    marginTop: 12,
  },
  confirmBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '14px 20px',
    background: 'var(--blu-primary, #0066ff)',
    border: 'none',
    borderRadius: 'var(--radius-button, 14px)',
    color: 'white',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  messageSuccess: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 16px',
    borderRadius: 'var(--radius-button, 14px)',
    fontSize: 14,
    fontWeight: 500,
    background: 'var(--status-paid-bg, rgba(16,185,129,0.1))',
    color: 'var(--data-green, #10b981)',
  },
  messageError: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 16px',
    borderRadius: 'var(--radius-button, 14px)',
    fontSize: 14,
    fontWeight: 500,
    background: 'var(--status-overdue-bg, rgba(239,68,68,0.1))',
    color: 'var(--data-red, #ef4444)',
  },
};

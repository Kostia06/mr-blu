import { supabase } from '@/lib/supabase/client';

interface ProfileData {
  full_name: string;
  business_name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
}

interface UpdateProfileData {
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
}

interface BusinessData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  tax_id: string;
  website: string;
}

export interface NotificationPreferences {
  emailOnInvoiceSent: boolean;
  emailOnEstimateSent: boolean;
  emailConfirmation: boolean;
}

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emailOnInvoiceSent: true,
  emailOnEstimateSent: true,
  emailConfirmation: true,
};

async function getAuthenticatedUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Not authenticated');
  }
  return user;
}

export async function fetchProfile(): Promise<{ profile: ProfileData }> {
  const user = await getAuthenticatedUser();
  const meta = user.user_metadata;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, business_name, email, phone, address, website')
    .eq('id', user.id)
    .single();

  return {
    profile: {
      full_name: profile?.full_name || meta?.full_name || '',
      business_name: profile?.business_name || meta?.business?.name || '',
      email: profile?.email || user.email || '',
      phone: profile?.phone || meta?.phone || '',
      address: profile?.address || '',
      website: profile?.website || meta?.business?.website || '',
    },
  };
}

export async function updateProfile(data: Partial<UpdateProfileData>): Promise<void> {
  const user = await getAuthenticatedUser();

  const { error: authError } = await supabase.auth.updateUser({
    data: {
      first_name: data.first_name,
      last_name: data.last_name,
      full_name: data.full_name,
      phone: data.phone,
    },
  });

  if (authError) {
    throw new Error(authError.message);
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        full_name: data.full_name,
        phone: data.phone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (profileError) {
    throw new Error(profileError.message);
  }
}

export async function updateEmail(newEmail: string): Promise<{ message: string }> {
  if (!newEmail || !newEmail.includes('@')) {
    throw new Error('Invalid email address');
  }

  const { error } = await supabase.auth.updateUser({ email: newEmail });

  if (error) {
    throw new Error(error.message);
  }

  return { message: 'Confirmation email sent. Check your inbox.' };
}

export async function updateBusiness(business: BusinessData): Promise<void> {
  const user = await getAuthenticatedUser();

  const { error: authError } = await supabase.auth.updateUser({
    data: {
      business: {
        name: business.name,
        address: business.address,
        city: business.city,
        state: business.state,
        zip: business.zip,
        tax_id: business.tax_id,
        website: business.website,
      },
    },
  });

  if (authError) {
    throw new Error(authError.message);
  }

  const fullAddress = [business.address, business.city, business.state, business.zip]
    .filter(Boolean)
    .join(', ');

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        business_name: business.name,
        business_address: business.address,
        address: fullAddress,
        website: business.website,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (profileError) {
    throw new Error(profileError.message);
  }
}

export async function deleteAccount(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch('/api/user/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || 'Failed to delete account');
  }

  await supabase.auth.signOut();
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const user = await getAuthenticatedUser();
  const stored = user.user_metadata?.notification_preferences;

  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...stored,
  };
}

export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  const user = await getAuthenticatedUser();
  const current = user.user_metadata?.notification_preferences || DEFAULT_NOTIFICATION_PREFERENCES;

  const merged = { ...current, ...preferences };

  const { error } = await supabase.auth.updateUser({
    data: { notification_preferences: merged },
  });

  if (error) {
    throw new Error(error.message);
  }
}

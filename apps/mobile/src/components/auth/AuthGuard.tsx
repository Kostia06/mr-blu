import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { Spinner } from '@/components/ui/Spinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const session = useAuthStore((s) => s.session);

  useEffect(() => {
    if (session === null && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, session]);

  if (!isAuthenticated) {
    return <Spinner fullScreen />;
  }

  return <>{children}</>;
}

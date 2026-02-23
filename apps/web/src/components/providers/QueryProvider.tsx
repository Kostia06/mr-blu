import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentChildren } from 'preact';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

interface Props {
  children: ComponentChildren;
}

export function QueryProvider({ children }: Props) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

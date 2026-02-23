import type { ComponentChildren } from 'preact';
import { QueryProvider } from './QueryProvider';

interface Props {
  children: ComponentChildren;
}

export function Providers({ children }: Props) {
  return <QueryProvider>{children}</QueryProvider>;
}

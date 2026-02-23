import { BottomNav } from './BottomNav'
import { Toaster } from '@/components/ui/Toaster'

interface DashboardLayoutProps {
  children: preact.ComponentChildren
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div style={{ position: 'relative', height: '100dvh', overflow: 'hidden' }}>
      {/* Background decoration */}
      <div
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
      >
        <div class="bg-blob bg-blob-1" />
        <div class="bg-blob bg-blob-2" />
        <div class="bg-blob bg-blob-3" />
        <div class="bg-blob bg-blob-4" />
      </div>

      <main style={{ position: 'relative', zIndex: 1, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {children}
      </main>

      <BottomNav />
      <Toaster />
    </div>
  )
}

import { BottomNav } from './BottomNav'
import { Toaster } from '@/components/ui/Toaster'

interface DashboardLayoutProps {
  children: preact.ComponentChildren
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div class="relative h-dvh overflow-hidden">
      {/* Background decoration */}
      <div
        aria-hidden="true"
        class="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      >
        <div class="bg-blob bg-blob-1" />
        <div class="bg-blob bg-blob-2" />
        <div class="bg-blob bg-blob-3" />
        <div class="bg-blob bg-blob-4" />
      </div>

      <main class="relative z-[1] h-full overflow-y-auto [-webkit-overflow-scrolling:touch]">
        {children}
      </main>

      <BottomNav />
      <Toaster />
    </div>
  )
}

import { BottomNav } from './BottomNav'
import { Toaster } from '@/components/ui/Toaster'
import { BackgroundBlobs } from '@/components/landing/BackgroundBlobs'

interface DashboardLayoutProps {
  children: preact.ComponentChildren
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div class="relative h-dvh overflow-clip overscroll-none">
      <BackgroundBlobs variant="full" intensity="subtle" />

      <main class="relative z-[1] h-full overflow-y-auto [-webkit-overflow-scrolling:touch]">
        {children}
      </main>

      <BottomNav />
      <Toaster />
    </div>
  )
}

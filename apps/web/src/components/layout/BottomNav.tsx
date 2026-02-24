import { useRef } from 'preact/hooks'
import { useLocation, Link } from 'wouter'
import { FileText, Mic, Settings } from 'lucide-react'
import { useAppStateStore } from '@/stores/appStateStore'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard/documents', Icon: FileText, tutorial: 'nav-documents' },
  { href: '/dashboard', Icon: Mic, tutorial: undefined },
  { href: '/dashboard/settings', Icon: Settings, tutorial: 'nav-settings' },
] as const

function getActiveIndex(pathname: string): number {
  if (pathname.startsWith('/dashboard/documents')) return 0
  if (pathname.startsWith('/dashboard/settings')) return 2
  return 1
}

export function BottomNav() {
  const { isRecordingMode, isModalOpen, isSelectMode } = useAppStateStore()
  const [location] = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const activeIndex = getActiveIndex(location)

  if (isRecordingMode || isModalOpen || isSelectMode || location.startsWith('/dashboard/review')) return null

  const factor = 2 * activeIndex + 1
  const indicatorLeft = `calc(6px + ${factor} * (100% - 12px) / 6 - 24px)`

  return (
    <nav
      ref={navRef}
      class="fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[240px] flex items-center bg-white/65 backdrop-blur-[20px] backdrop-saturate-150 rounded-full shadow-[0_4px_24px_rgba(0,40,100,0.12),0_1px_4px_rgba(0,0,0,0.06)] p-1.5 z-[var(--z-fixed)] mb-[env(safe-area-inset-bottom,0px)]"
    >
      <div
        class="absolute w-12 h-12 rounded-full bg-[rgba(0,102,255,0.12)] transition-[left] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
        style={{ left: indicatorLeft }}
      />

      {NAV_ITEMS.map(({ href, Icon, tutorial }, i) => {
        const isActive = i === activeIndex
        return (
          <Link
            key={href}
            href={href}
            data-tutorial={tutorial}
            aria-current={isActive ? 'page' : undefined}
            class={cn(
              'flex items-center justify-center flex-1 h-12 no-underline transition-colors duration-200 relative z-[1]',
              isActive ? 'text-[var(--blu-primary)]' : 'text-[var(--gray-400,#94a3b8)]',
            )}
          >
            <Icon size={24} strokeWidth={isActive ? 2 : 1.5} />
          </Link>
        )
      })}
    </nav>
  )
}

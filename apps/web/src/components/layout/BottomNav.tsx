import { useRef } from 'preact/hooks'
import { useLocation, Link } from 'wouter'
import { FileText, Mic, Settings } from 'lucide-react'
import { useAppStateStore } from '@/stores/appStateStore'

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
      style={{
        position: 'fixed',
        bottom: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: '240px',
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        borderRadius: 'var(--radius-full)',
        boxShadow: '0 4px 24px rgba(0, 40, 100, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06)',
        padding: '6px',
        zIndex: 'var(--z-fixed)',
        marginBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(0, 102, 255, 0.12)',
          left: indicatorLeft,
          transition: 'left 250ms cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: 'none',
        }}
      />

      {NAV_ITEMS.map(({ href, Icon, tutorial }, i) => {
        const active = i === activeIndex
        return (
          <Link
            key={href}
            href={href}
            data-tutorial={tutorial}
            aria-current={active ? 'page' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              height: '48px',
              color: active ? 'var(--blu-primary)' : 'var(--gray-400, #94a3b8)',
              textDecoration: 'none',
              transition: 'color 200ms ease',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Icon size={24} strokeWidth={active ? 2 : 1.5} />
          </Link>
        )
      })}
    </nav>
  )
}

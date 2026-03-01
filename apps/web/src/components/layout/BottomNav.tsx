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
  const { isRecordingMode, modalCount, isSelectMode } = useAppStateStore()
  const [location] = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const activeIndex = getActiveIndex(location)

  if (isRecordingMode || modalCount > 0 || isSelectMode || location.startsWith('/dashboard/review')) return null

  const pct = ((2 * activeIndex + 1) / 6) * 100

  return (
    <>
      <style>{navStyles}</style>
      <nav ref={navRef} class="bn-pill">
        <div class="bn-indicator-track">
          <div class="bn-indicator" style={{ left: `${pct}%` }} />
        </div>

        {NAV_ITEMS.map(({ href, Icon, tutorial }, i) => {
          const isActive = i === activeIndex
          return (
            <Link
              key={href}
              href={href}
              data-tutorial={tutorial}
              aria-current={isActive ? 'page' : undefined}
              class={`bn-item ${isActive ? 'bn-active' : ''}`}
            >
              <Icon size={24} strokeWidth={isActive ? 2 : 1.5} />
            </Link>
          )
        })}
      </nav>
    </>
  )
}

const navStyles = `
  .bn-pill {
    position: fixed;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 32px);
    max-width: 240px;
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 9999px;
    padding: 6px;
    box-shadow: 0 4px 24px rgba(0, 40, 100, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06);
    z-index: var(--z-fixed, 300);
    margin-bottom: env(safe-area-inset-bottom, 0px);
  }

  .bn-indicator-track {
    position: absolute;
    inset: 6px;
    pointer-events: none;
  }

  .bn-indicator {
    position: absolute;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(0, 102, 255, 0.12);
    top: 0;
    transform: translateX(-50%);
    transition: left 250ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .bn-item {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1 1 0%;
    height: 48px;
    text-decoration: none;
    color: var(--gray-400, #94a3b8);
    position: relative;
    z-index: 1;
    transition: color 200ms ease;
  }

  .bn-item.bn-active {
    color: var(--blu-primary, #0066ff);
  }
`

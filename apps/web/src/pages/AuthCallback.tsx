import { useState, useEffect } from 'preact/hooks'
import { supabase } from '@/lib/supabase/client'
import { navigateTo } from '@/lib/navigation'
import { Spinner } from '@/components/ui/Spinner'
import { ExternalLink, Copy, Check } from 'lucide-react'

function isInAppBrowser(): boolean {
  const ua = navigator.userAgent || ''
  return /FBAN|FBAV|Instagram|Line|Twitter|Snapchat|GSA|CriOS.*wv|wv\)/.test(ua)
    || /\bwv\b/.test(ua)
    || (ua.includes('Safari') && !ua.includes('CriOS') && !ua.includes('Chrome') && (window as any).webkit?.messageHandlers != null)
}

function getOpenInBrowserUrl(): string | null {
  const url = window.location.href
  const ua = navigator.userAgent || ''

  if (/android/i.test(ua)) {
    return `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;end`
  }

  return null
}

export function AuthCallbackPage() {
  const [showBrowserPrompt, setShowBrowserPrompt] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const next = params.get('next') || '/dashboard'

    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        navigateTo(next)
      } else if (event === 'SIGNED_OUT') {
        navigateTo('/login')
      }
    })

    const timeout = setTimeout(() => {
      if (isInAppBrowser()) {
        setShowBrowserPrompt(true)
      } else {
        navigateTo(next)
      }
    }, 3000)

    return () => clearTimeout(timeout)
  }, [])

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text
      const input = document.createElement('input')
      input.value = window.location.href
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (showBrowserPrompt) {
    const intentUrl = getOpenInBrowserUrl()

    return (
      <div class="flex flex-col items-center justify-center min-h-screen min-h-dvh p-6 bg-[var(--white,#fff)]">
        <div class="w-full max-w-[360px] text-center">
          <div class="w-16 h-16 flex items-center justify-center bg-[rgba(0,102,255,0.08)] rounded-full text-[var(--blu-primary,#0066ff)] mx-auto mb-5">
            <ExternalLink size={28} strokeWidth={1.5} />
          </div>
          <h1 class="text-xl font-bold text-[var(--gray-900,#0f172a)] m-0 mb-2">
            Open in your browser
          </h1>
          <p class="text-sm text-[var(--gray-500,#64748b)] m-0 mb-6 leading-relaxed">
            This link opened in your email app. Copy it and paste in Chrome or Safari to sign in.
          </p>

          <div class="flex flex-col gap-3">
            {intentUrl && (
              <a
                href={intentUrl}
                class="flex items-center justify-center gap-2 w-full py-3.5 px-5 bg-gradient-to-br from-[var(--blu-primary,#0066ff)] to-[#0ea5e9] text-white border-none rounded-xl text-sm font-semibold no-underline shadow-[0_4px_12px_rgba(0,102,255,0.25)]"
              >
                <ExternalLink size={18} />
                Open in Chrome
              </a>
            )}
            <button
              onClick={handleCopyLink}
              class="flex items-center justify-center gap-2 w-full py-3.5 px-5 bg-[var(--gray-100,#f5f5f5)] text-[var(--gray-700,#334155)] border border-[var(--gray-200,#e2e8f0)] rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div class="flex items-center justify-center min-h-screen min-h-dvh">
      <Spinner />
    </div>
  )
}

import { useState, useEffect } from 'preact/hooks'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { ReviewPage as ReviewPageComponent } from '@/components/review/ReviewPage'
import { Spinner } from '@/components/ui/Spinner'
import { navigateTo } from '@/lib/navigation'

type EntryMode = 'new' | 'resume' | 'legacy_resume' | 'sessionStorage'

export function ReviewPage() {
  const userId = useAuthStore((s) => s.user?.id)
  const params = new URLSearchParams(window.location.search)
  const transcript = params.get('transcript')
  const sessionId = params.get('session')
  const resumeId = params.get('resume')

  const [entryMode, setEntryMode] = useState<EntryMode>('sessionStorage')
  const [ready, setReady] = useState(false)

  const { data: reviewSession } = useQuery({
    queryKey: ['review-session', sessionId],
    enabled: !!sessionId && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_sessions')
        .select('*')
        .eq('id', sessionId!)
        .eq('user_id', userId!)
        .eq('status', 'in_progress')
        .single()

      if (error || !data) {
        navigateTo('/dashboard')
        return null
      }
      return data
    },
  })

  useEffect(() => {
    if (transcript) {
      setEntryMode('new')
      setReady(true)
    } else if (sessionId) {
      if (reviewSession) {
        setEntryMode('resume')
        setReady(true)
      }
    } else if (resumeId) {
      setEntryMode('legacy_resume')
      setReady(true)
    } else {
      setReady(true)
    }
  }, [transcript, sessionId, resumeId, reviewSession])

  if (!ready) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
        <Spinner />
      </div>
    )
  }

  return (
    <ReviewPageComponent
      entryMode={entryMode}
      transcript={transcript || undefined}
      reviewSession={reviewSession || undefined}
    />
  )
}

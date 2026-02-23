import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { ReviewsList } from '@/components/reviews/ReviewsList'
import { Spinner } from '@/components/ui/Spinner'

export function ReviewsPage() {
  const userId = useAuthStore((s) => s.user?.id)

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_sessions')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
  })

  if (isLoading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
        <Spinner />
      </div>
    )
  }

  return <ReviewsList reviews={data} />
}

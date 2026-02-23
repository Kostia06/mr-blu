import { DashboardHome } from '@/components/dashboard/DashboardHome'
import { useDashboardData } from '@/hooks/useDashboardData'
import { Spinner } from '@/components/ui/Spinner'

export function DashboardPage() {
  const { data, isLoading } = useDashboardData()

  if (isLoading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
        <Spinner />
      </div>
    )
  }

  return (
    <DashboardHome
      firstName={data.firstName}
      pendingReview={data.pendingReview}
    />
  )
}

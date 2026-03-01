import { Route, Switch, Redirect } from 'wouter'
import { lazy, Suspense } from 'preact/compat'
import { useEffect, useRef } from 'preact/hooks'
import { isNative } from '@/lib/native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NavigationProgress } from '@/components/ui/NavigationProgress'

// Pages
import { LoginPage } from '@/pages/Login'
import { DashboardPage } from '@/pages/Dashboard'
import { DocumentsPage } from '@/pages/Documents'
import { DocumentDetailPage } from '@/pages/DocumentDetail'
import { ReviewPage } from '@/pages/Review'
import { ReviewsPage } from '@/pages/Reviews'
import { SettingsPage } from '@/pages/Settings'
import { ProfilePage } from '@/pages/settings/Profile'
import { BusinessPage } from '@/pages/settings/Business'
import { LanguagePage } from '@/pages/settings/Language'
import { PriceBookPage } from '@/pages/settings/PriceBook'
import { NotificationsPage } from '@/pages/settings/Notifications'
import { SecurityPage } from '@/pages/settings/Security'
import { FeedbackPage } from '@/pages/settings/Feedback'
import { ClientsPage } from '@/pages/settings/Clients'
import { ClientDetailPage } from '@/pages/settings/ClientDetail'
import { AccountantSharesPage } from '@/pages/settings/AccountantShares'
import { BetaManagementPage } from '@/pages/settings/BetaManagement'
import { AdminFeedbackPage } from '@/pages/settings/AdminFeedback'
import { AdminErrorsPage } from '@/pages/settings/AdminErrors'
import { AuthCallbackPage } from '@/pages/AuthCallback'
import { ForgotPasswordPage } from '@/pages/ForgotPassword'
import { ResetPasswordPage } from '@/pages/ResetPassword'
import { LandingPage } from '@/pages/Landing'
import { PrivacyPage } from '@/pages/Privacy'
import { TermsPage } from '@/pages/Terms'
import { OfflinePage } from '@/components/OfflinePage'
import { NotFoundPage } from '@/pages/NotFound'
import { SharedAccountantViewPage } from '@/pages/SharedAccountantView'

const LazyDocumentViewPage = lazy(() =>
  import('@/pages/DocumentView').then((m) => ({ default: m.DocumentViewPage }))
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
})

function DashboardRoutes() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <Switch>
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/dashboard/documents" component={DocumentsPage} />
          <Route path="/dashboard/documents/:id" component={DocumentDetailPage} />
          <Route path="/dashboard/review" component={ReviewPage} />
          <Route path="/dashboard/reviews" component={ReviewsPage} />
          <Route path="/dashboard/settings" component={SettingsPage} />
          <Route path="/dashboard/settings/profile" component={ProfilePage} />
          <Route path="/dashboard/settings/business" component={BusinessPage} />
          <Route path="/dashboard/settings/language" component={LanguagePage} />
          <Route path="/dashboard/settings/price-book" component={PriceBookPage} />
          <Route path="/dashboard/settings/notifications" component={NotificationsPage} />
          <Route path="/dashboard/settings/accountant-shares" component={AccountantSharesPage} />
          <Route path="/dashboard/settings/security" component={SecurityPage} />
          <Route path="/dashboard/settings/beta" component={BetaManagementPage} />
          <Route path="/dashboard/settings/admin-feedback" component={AdminFeedbackPage} />
          <Route path="/dashboard/settings/admin-errors" component={AdminErrorsPage} />
          <Route path="/dashboard/settings/feedback" component={FeedbackPage} />
          <Route path="/dashboard/settings/clients/:id" component={ClientDetailPage} />
          <Route path="/dashboard/settings/clients" component={ClientsPage} />
          <Route component={NotFoundPage} />
        </Switch>
      </DashboardLayout>
    </AuthGuard>
  )
}

function useViewportHeight() {
  useEffect(() => {
    function setVh() {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
    }
    setVh()
    window.addEventListener('resize', setVh)
    window.addEventListener('orientationchange', setVh)
    return () => {
      window.removeEventListener('resize', setVh)
      window.removeEventListener('orientationchange', setVh)
    }
  }, [])
}

function useLifecycle() {
  const lastVisibleRef = useRef(Date.now())

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastVisibleRef.current
        lastVisibleRef.current = Date.now()

        if (elapsed > 10_000) {
          supabase.auth.startAutoRefresh()
          supabase.auth.getSession()
          queryClient.invalidateQueries()
        }
      } else {
        lastVisibleRef.current = Date.now()
        supabase.auth.stopAutoRefresh()
      }
    }

    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) {
        supabase.auth.startAutoRefresh()
        supabase.auth.getSession()
        queryClient.invalidateQueries()
      }
    }

    function handleOnline() {
      supabase.auth.startAutoRefresh()
      supabase.auth.refreshSession()
      queryClient.invalidateQueries()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('online', handleOnline)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('online', handleOnline)
    }
  }, [])
}

export function App() {
  useViewportHeight()
  useLifecycle()

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationProgress />
      <Switch>
        <Route path="/">{isNative ? <Redirect to="/dashboard" /> : <LandingPage />}</Route>
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/offline" component={OfflinePage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/auth/callback" component={AuthCallbackPage} />
        <Route path="/shared/accountant/:token" component={SharedAccountantViewPage} />
        <Route path="/view/:type/:id">
          <Suspense fallback={null}>
            <LazyDocumentViewPage />
          </Suspense>
        </Route>
        <Route path="/dashboard/*" component={DashboardRoutes} />
        <Route path="/dashboard" component={DashboardRoutes} />
        <Route component={NotFoundPage} />
      </Switch>
    </QueryClientProvider>
  )
}

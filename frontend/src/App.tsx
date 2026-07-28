import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './providers/ThemeProvider'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RequireSuperAdmin } from './components/guards/RequireSuperAdmin'
import { ErrorBoundary } from './components/feedback/ErrorBoundary'
import { LoginPage } from './pages/Login'
import { DashboardPage } from './pages/Dashboard'
import { OrganizationsPage } from './pages/Organizations'
import { OrganizationLayout } from './pages/OrganizationLayout'
import { OrgDashboardPage } from './pages/OrgDashboard'
import { MembersPage } from './pages/Members'
import { PermissionsPage } from './pages/Permissions'
import { ResourcesPage } from './pages/Resources'
import { AuditLogsPage } from './pages/AuditLogs'
import { AdminPage } from './pages/Admin'
import { AdminAuditPage } from './pages/AdminAuditPage'
import { ProfilePage } from './pages/ProfilePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ForbiddenPage } from './pages/ForbiddenPage'
import { STALE_TIMES } from './lib/constants'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIMES.MEMBERS,
      retry: (failureCount, error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response?.status
        if (status && status >= 400 && status < 500) return false
        return failureCount < 1
      },
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
    },
  },
})

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    path="/dashboard"
                    element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
                  />
                  <Route
                    path="/organizations"
                    element={<ProtectedRoute><OrganizationsPage /></ProtectedRoute>}
                  />
                  <Route
                    path="/organizations/:orgId"
                    element={<ProtectedRoute><OrganizationLayout /></ProtectedRoute>}
                  >
                    <Route index element={<OrgDashboardPage />} />
                    <Route path="resources" element={<ResourcesPage />} />
                    <Route path="members" element={<MembersPage />} />
                    <Route path="permissions" element={<PermissionsPage />} />
                    <Route path="audit-logs" element={<AuditLogsPage />} />
                  </Route>
                  <Route
                    path="/admin"
                    element={<ProtectedRoute><RequireSuperAdmin><AdminPage /></RequireSuperAdmin></ProtectedRoute>}
                  />
                  <Route
                    path="/admin/audit-logs"
                    element={<ProtectedRoute><RequireSuperAdmin><AdminAuditPage /></RequireSuperAdmin></ProtectedRoute>}
                  />
                  <Route
                    path="/profile"
                    element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
                  />
                  <Route path="/forbidden" element={<ForbiddenPage />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AppLayout } from './AppLayout'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--gray-500)' }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />

  return <AppLayout>{children}</AppLayout>
}

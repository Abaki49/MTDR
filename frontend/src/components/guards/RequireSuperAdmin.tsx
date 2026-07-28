import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Spinner } from '../ui/Spinner'

interface RequireSuperAdminProps {
  children: React.ReactNode
}

export function RequireSuperAdmin({ children }: RequireSuperAdminProps) {
  const { user, loading } = useAuth()

  if (loading) return <Spinner size="lg" />
  if (!user?.is_super_admin) return <Navigate to="/forbidden" replace />
  return <>{children}</>
}

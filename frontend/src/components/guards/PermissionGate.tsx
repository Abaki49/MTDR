import { useCan } from '../../contexts/OrgPermissionsContext'

interface PermissionGateProps {
  permission: string
  orgId?: number
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const can = useCan()
  if (!can(permission)) return <>{fallback}</>
  return <>{children}</>
}

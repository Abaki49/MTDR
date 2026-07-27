import { useParams, useOutletContext } from 'react-router-dom'
import { useOrgPermissions } from '../contexts/OrgPermissionsContext'
import type { MembershipInfo } from '../types/auth'

interface OrgDashboardContext {
  orgId: number
  orgInfo?: MembershipInfo
}

export function OrgDashboardPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const { orgInfo } = useOutletContext<OrgDashboardContext>()
  const { permissions, isLoading } = useOrgPermissions()

  if (!orgId) return <div>Invalid organization</div>

  return (
    <div>
      <h1>{orgInfo?.organization_name ?? `Organization #${orgId}`}</h1>
      <p>
        Role: <strong>{orgInfo?.role_name ?? 'N/A'}</strong> &middot; Status: {orgInfo?.status ?? 'N/A'}
      </p>

      <h2 style={{ marginTop: 32 }}>Your Permissions</h2>
      {isLoading ? (
        <p>Loading permissions...</p>
      ) : (
        <ul>
          {permissions.length === 0 && <li>No permissions</li>}
          {permissions.map((p) => (
            <li key={p}>{p === '*' ? 'Super Admin (all permissions)' : p}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

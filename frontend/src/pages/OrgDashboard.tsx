import { useParams, useOutletContext, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useOrgPermissions } from '../contexts/OrgPermissionsContext'
import { useAuth } from '../contexts/AuthContext'
import { getMembers } from '../api/memberships'
import { getResources } from '../api/resources'
import { StatGridSkeleton } from '../components/Skeleton'
import type { MembershipInfo } from '../types/auth'

interface OrgDashboardContext {
  orgId: number
  orgInfo?: MembershipInfo
}

export function OrgDashboardPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const { orgInfo } = useOutletContext<OrgDashboardContext>()
  const { permissions, isLoading, can } = useOrgPermissions()
  const { user } = useAuth()

  const orgIdNum = parseInt(orgId ?? '0', 10)

  const { data: membersData } = useQuery({
    queryKey: ['members', orgIdNum],
    queryFn: () => getMembers(orgIdNum),
    enabled: !!orgId && can('membership.read'),
  })

  const { data: resourcesData } = useQuery({
    queryKey: ['resources', orgIdNum],
    queryFn: () => getResources(orgIdNum),
    enabled: !!orgId && can('resource.read'),
  })

  const members = membersData?.items ?? []
  const resources = resourcesData?.items ?? []

  if (!orgId) return <div className="state-message"><h3>Invalid organization</h3></div>

  if (isLoading) {
    return (
      <div>
        <StatGridSkeleton count={5} />
        <div className="card">
          <div className="card-header"><h2>Your Permissions</h2></div>
          <div className="card-body"><p style={{ color: 'var(--gray-500)' }}>Loading...</p></div>
        </div>
      </div>
    )
  }

  const isSuperAdmin = user?.is_super_admin ?? false
  const roleName = orgInfo?.role_name ?? (isSuperAdmin ? 'Super Admin' : 'N/A')
  const statusValue = orgInfo?.status ?? (isSuperAdmin ? 'ACTIVE' : 'N/A')
  const statusBadge = statusValue === 'ACTIVE' ? 'success' : 'danger'

  return (
    <div>
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="label">Your Role</div>
          <div className="value primary">{roleName}</div>
        </div>
        {can('resource.read') && (
          <div className="stat-card">
            <div className="label">Resources</div>
            <div className="value">{resources.length}</div>
          </div>
        )}
        <div className="stat-card">
          <div className="label">Members</div>
          <div className="value success">{can('membership.read') ? members.length : '\u2014'}</div>
        </div>
        <div className="stat-card">
          <div className="label">Permissions</div>
          <div className="value warning">{permissions.includes('*') ? 'All' : permissions.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Status</div>
          <div className="value" style={{ color: statusValue === 'ACTIVE' ? 'var(--success)' : 'var(--danger)' }}>
            {statusValue}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Your Permissions</h2>
        </div>
        <div className="card-body">
          {permissions.length === 0 ? (
            <p style={{ color: 'var(--gray-500)' }}>No permissions</p>
          ) : (
            <div className="permissions-grid">
              {permissions.map((p) => (
                <span key={p} className="permission-tag">
                  {p === '*' ? 'Super Admin (all)' : p}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

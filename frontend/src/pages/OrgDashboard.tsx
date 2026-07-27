import { useParams, useOutletContext } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useOrgPermissions } from '../contexts/OrgPermissionsContext'
import { getMembers } from '../api/memberships'
import { getResources } from '../api/resources'
import type { MembershipInfo } from '../types/auth'

interface OrgDashboardContext {
  orgId: number
  orgInfo?: MembershipInfo
}

export function OrgDashboardPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const { orgInfo } = useOutletContext<OrgDashboardContext>()
  const { permissions, isLoading, can } = useOrgPermissions()

  const orgIdNum = parseInt(orgId ?? '0', 10)

  const { data: members = [] } = useQuery({
    queryKey: ['members', orgIdNum],
    queryFn: () => getMembers(orgIdNum),
    enabled: !!orgId && can('membership.read'),
  })

  const { data: resources = [] } = useQuery({
    queryKey: ['resources', orgIdNum],
    queryFn: () => getResources(orgIdNum),
    enabled: !!orgId && can('resource.read'),
  })

  if (!orgId) return <div className="state-message"><h3>Invalid organization</h3></div>

  return (
    <div>
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="label">Your Role</div>
          <div className="value primary">{orgInfo?.role_name ?? 'N/A'}</div>
        </div>
        {can('resource.read') && (
          <div className="stat-card">
            <div className="label">Resources</div>
            <div className="value">{resources.length}</div>
          </div>
        )}
        <div className="stat-card">
          <div className="label">{can('membership.read') ? 'Members' : 'Your Role'}</div>
          <div className="value success">{can('membership.read') ? members.length : (orgInfo?.role_name ?? 'N/A')}</div>
        </div>
        <div className="stat-card">
          <div className="label">Permissions</div>
          <div className="value warning">{permissions.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Status</div>
          <div className="value" style={{ color: orgInfo?.status === 'ACTIVE' ? 'var(--success)' : 'var(--danger)' }}>
            {orgInfo?.status ?? 'N/A'}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Your Permissions</h2>
        </div>
        <div className="card-body">
          {isLoading ? (
            <p style={{ color: 'var(--gray-500)' }}>Loading...</p>
          ) : permissions.length === 0 ? (
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

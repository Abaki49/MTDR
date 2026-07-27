import { Outlet, useParams, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { OrgPermissionsProvider, useCan, useOrgPermissions } from '../contexts/OrgPermissionsContext'

function OrgSidebar() {
  const { orgId } = useParams<{ orgId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const can = useCan()

  const base = `/organizations/${orgId}`

  const isActive = (path: string) => location.pathname === path

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div className="sidebar-section-label" style={{ paddingTop: 0 }}>Organization</div>

      <Link
        to={base}
        className={`sidebar-link${isActive(base) ? ' active' : ''}`}
      >
        <span className="icon">&#9632;</span>
        Overview
      </Link>

      {can('resource.read') && (
        <Link
          to={`${base}/resources`}
          className={`sidebar-link${isActive(`${base}/resources`) ? ' active' : ''}`}
        >
          <span className="icon">&#9632;</span>
          Resources
        </Link>
      )}

      {can('membership.read') && (
        <Link
          to={`${base}/members`}
          className={`sidebar-link${isActive(`${base}/members`) ? ' active' : ''}`}
        >
          <span className="icon">&#9632;</span>
          Members
        </Link>
      )}

      {can('permission.manage') && (
        <Link
          to={`${base}/permissions`}
          className={`sidebar-link${isActive(`${base}/permissions`) ? ' active' : ''}`}
        >
          <span className="icon">&#9632;</span>
          Permissions
        </Link>
      )}

      <div style={{ marginTop: 12 }}>
        <button className="logout-btn" onClick={() => navigate('/organizations')}>
          &larr; Back to Organizations
        </button>
      </div>
    </div>
  )
}

function OrgContent() {
  const { orgId } = useParams<{ orgId: string }>()
  const { user } = useAuth()
  const { isError: permError } = useOrgPermissions()

  if (!orgId || !user) return null

  if (permError) {
    return (
      <div className="state-message">
        <h3>Access Denied</h3>
        <p>You don't have access to this organization or it doesn't exist.</p>
        <Link to="/organizations" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
          Back to Organizations
        </Link>
      </div>
    )
  }

  const orgInfo = user.memberships.find(
    (m) => m.organization_id === parseInt(orgId, 10),
  )

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)', margin: -32 }}>
      <div style={{ width: 220, background: '#fff', borderRight: '1px solid var(--gray-200)', padding: 24, flexShrink: 0 }}>
        <OrgSidebar />
      </div>
      <div style={{ flex: 1, padding: 32, overflow: 'auto' }}>
        <div style={{ marginBottom: 24 }}>
          {orgInfo ? (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 700 }}>{orgInfo.organization_name}</h1>
              <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>
                {orgInfo.role_name} &middot;{' '}
                <span className={`badge badge-${orgInfo.status === 'ACTIVE' ? 'success' : 'danger'}`}>
                  {orgInfo.status}
                </span>
              </p>
            </>
          ) : user.is_super_admin ? (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 700 }}>Organization #{orgId}</h1>
              <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>
                Super Admin &middot; <span className="badge badge-info">Full Access</span>
              </p>
            </>
          ) : null}
        </div>
        <Outlet context={{ orgId: parseInt(orgId, 10), orgInfo }} />
      </div>
    </div>
  )
}

export function OrganizationLayout() {
  const { orgId } = useParams<{ orgId: string }>()

  if (!orgId) return <div className="state-message"><h3>Invalid organization</h3></div>

  return (
    <OrgPermissionsProvider orgId={parseInt(orgId, 10)}>
      <OrgContent />
    </OrgPermissionsProvider>
  )
}

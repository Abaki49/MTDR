import { Outlet, useParams, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { OrgPermissionsProvider, useCan } from '../contexts/OrgPermissionsContext'

function OrgNav() {
  const { orgId } = useParams<{ orgId: string }>()
  const location = useLocation()
  const can = useCan()

  const linkStyle = (path: string): React.CSSProperties => ({
    display: 'block',
    padding: '8px 16px',
    textDecoration: 'none',
    color: location.pathname === path ? '#1976d2' : '#333',
    fontWeight: location.pathname === path ? 600 : 400,
    background: location.pathname === path ? '#e3f2fd' : 'transparent',
    borderRadius: 4,
  })

  return (
    <nav style={{ width: 200, borderRight: '1px solid #ddd', padding: 16 }}>
      <Link to={`/organizations/${orgId}`} style={linkStyle(`/organizations/${orgId}`)}>
        Dashboard
      </Link>
      {can('membership.read') && (
        <Link to={`/organizations/${orgId}/members`} style={linkStyle(`/organizations/${orgId}/members`)}>
          Members
        </Link>
      )}
    </nav>
  )
}

function OrgContent() {
  const { orgId } = useParams<{ orgId: string }>()
  const { user } = useAuth()

  if (!orgId || !user) return null

  const orgInfo = user.memberships.find(
    (m) => m.organization_id === parseInt(orgId, 10),
  )

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
      <OrgNav />
      <div style={{ flex: 1, padding: 24 }}>
        <Outlet context={{ orgId: parseInt(orgId, 10), orgInfo }} />
      </div>
    </div>
  )
}

export function OrganizationLayout() {
  const { orgId } = useParams<{ orgId: string }>()

  if (!orgId) return <div>Invalid organization</div>

  return (
    <OrgPermissionsProvider orgId={parseInt(orgId, 10)}>
      <OrgContent />
    </OrgPermissionsProvider>
  )
}

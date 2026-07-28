import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardBody } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { StatusBadge } from '../components/data-display/StatusBadge'
import { StatCard } from '../components/data-display/StatCard'
import { Spinner } from '../components/ui/Spinner'

export function ProfilePage() {
  const { user, loading } = useAuth()

  if (loading) return <Spinner size="lg" />
  if (!user) return null

  const activeMemberships = user.memberships.filter((m) => m.status === 'ACTIVE')

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <h2 className="page-title">Profile</h2>
      <Card>
        <CardBody>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div className="avatar avatar-lg">{user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}</div>
            <div>
              <h3>{user.name}</h3>
              <p style={{ color: 'var(--gray-500)' }}>{user.email}</p>
            </div>
            {user.is_super_admin && <Badge variant="info">Super Admin</Badge>}
          </div>
          <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 24 }}>
            <StatCard label="Memberships" value={user.memberships.length} />
            <StatCard label="Status" value={user.is_active ? 'Active' : 'Inactive'} />
          </div>
        </CardBody>
      </Card>

      <h3 style={{ marginTop: 32, marginBottom: 16 }}>Memberships</h3>
      {activeMemberships.length === 0 ? (
        <Card><CardBody><p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: 24 }}>No active memberships.</p></CardBody></Card>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeMemberships.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <Link to={`/organizations/${m.organization_id}`} style={{ color: 'var(--primary)', fontWeight: 500 }}>
                        {m.organization_name}
                      </Link>
                    </td>
                    <td>{m.role_name}</td>
                    <td><StatusBadge status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

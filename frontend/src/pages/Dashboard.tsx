import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const orgCount = user.memberships.length
  const activeCount = user.memberships.filter((m) => m.status === 'ACTIVE').length

  return (
    <div>
      <div className="toolbar">
        <h1>Dashboard</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Organizations</div>
          <div className="value primary">{orgCount}</div>
        </div>
        <div className="stat-card">
          <div className="label">Active Memberships</div>
          <div className="value success">{activeCount}</div>
        </div>
        <div className="stat-card">
          <div className="label">Account Status</div>
          <div className="value" style={{ color: user.is_active ? 'var(--success)' : 'var(--danger)' }}>
            {user.is_active ? 'Active' : 'Disabled'}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Role</div>
          <div className="value warning">{user.is_super_admin ? 'Super Admin' : 'User'}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Your Organizations</h2>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/organizations')}>
            View All
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {user.memberships.length === 0 ? (
            <div className="state-message">
              <p>You are not a member of any organization yet.</p>
            </div>
          ) : (
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
                  {user.memberships.slice(0, 5).map((m) => (
                    <tr
                      key={m.organization_id}
                      onClick={() => navigate(`/organizations/${m.organization_id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 500 }}>{m.organization_name}</td>
                      <td>{m.role_name}</td>
                      <td>
                        <span className={`badge badge-${m.status === 'ACTIVE' ? 'success' : m.status === 'SUSPENDED' ? 'danger' : 'neutral'}`}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

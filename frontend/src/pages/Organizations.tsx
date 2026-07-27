import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function OrganizationsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  return (
    <div>
      <div className="toolbar">
        <h1>Organizations</h1>
        <span style={{ fontSize: 14, color: 'var(--gray-500)' }}>
          {user.memberships.length} total
        </span>
      </div>

      {user.memberships.length === 0 ? (
        <div className="state-message">
          <h3>No organizations</h3>
          <p>You are not a member of any organization yet.</p>
        </div>
      ) : (
        <div className="org-grid">
          {user.memberships.map((m) => (
            <div
              key={m.organization_id}
              className="org-card"
              onClick={() => navigate(`/organizations/${m.organization_id}`)}
            >
              <h3>{m.organization_name}</h3>
              <div className="meta">
                <span className={`badge badge-${m.status === 'ACTIVE' ? 'success' : m.status === 'SUSPENDED' ? 'danger' : 'neutral'}`}>
                  {m.status}
                </span>
                <span className="badge badge-info">{m.role_name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

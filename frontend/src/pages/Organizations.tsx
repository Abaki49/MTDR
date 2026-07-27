import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function OrganizationsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  if (user.memberships.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 16px' }}>
        <h1>Organizations</h1>
        <p>You are not a member of any organization.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 16px' }}>
      <h1>Your Organizations</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        {user.memberships.map((m) => (
          <div
            key={m.organization_id}
            onClick={() => navigate(`/organizations/${m.organization_id}`)}
            style={{
              padding: 16,
              border: '1px solid #ccc',
              borderRadius: 8,
              cursor: 'pointer',
              background: '#f9f9f9',
            }}
          >
            <strong>{m.organization_name}</strong>
            <span style={{ marginLeft: 12, color: '#666' }}>({m.role_name})</span>
            <span style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>{m.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

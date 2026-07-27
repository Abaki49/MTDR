import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function DashboardPage() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <div style={{ maxWidth: 600, margin: '100px auto', padding: '0 16px' }}>
      <h1>Welcome, {user.name}</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.is_super_admin ? 'Super Admin' : 'User'}</p>
      <p>Memberships: {user.memberships.length}</p>

      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <Link
          to="/organizations"
          style={{
            display: 'inline-block',
            padding: '8px 24px',
            background: '#1976d2',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: 4,
          }}
        >
          View Organizations
        </Link>
        <button onClick={logout} style={{ padding: '8px 24px' }}>
          Logout
        </button>
      </div>
    </div>
  )
}

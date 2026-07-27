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
      {user.memberships.length > 0 && (
        <ul>
          {user.memberships.map((m) => (
            <li key={m.organization_id}>
              {m.organization_name} — {m.role_name} ({m.status})
            </li>
          ))}
        </ul>
      )}
      <button onClick={logout} style={{ marginTop: 24, padding: '8px 24px' }}>
        Logout
      </button>
    </div>
  )
}

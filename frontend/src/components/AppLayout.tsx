import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../providers/ThemeProvider'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const { toggleTheme, resolved } = useTheme()
  const location = useLocation()

  if (!user) return <>{children}</>

  const currentPath = location.pathname

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>MTDR</h1>
          <p>Document Repository</p>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main</div>

          <Link
            to="/dashboard"
            className={`sidebar-link${currentPath === '/dashboard' ? ' active' : ''}`}
          >
            <span className="icon">&#9632;</span>
            Dashboard
          </Link>

          <Link
            to="/organizations"
            className={`sidebar-link${currentPath.startsWith('/organizations') ? ' active' : ''}`}
          >
            <span className="icon">&#9632;</span>
            Organizations
          </Link>

          {user.is_super_admin && (
            <>
              <div className="sidebar-section-label">Administration</div>
              <Link
                to="/admin"
                className={`sidebar-link${currentPath.startsWith('/admin') ? ' active' : ''}`}
              >
                <span className="icon">&#9632;</span>
                Admin Panel
              </Link>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-email">{user.email}</div>
          </div>
          <button className="btn-icon" onClick={logout} title="Logout">
            &#10140;
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-breadcrumb">
              MTDR <strong>/ {getPageTitle(currentPath)}</strong>
            </span>
          </div>
          <div className="topbar-right">
            <Link to="/profile" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
              Profile
            </Link>
            <button type="button" className="btn btn-ghost btn-sm" onClick={toggleTheme} title="Toggle theme">
              {resolved === 'dark' ? '\u2600' : '\u263E'}
            </button>
            <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              {user.is_super_admin ? 'Super Admin' : 'User'}
            </span>
          </div>
        </header>
        <main className="content-area">{children}</main>
      </div>
    </div>
  )
}

function getPageTitle(path: string): string {
  if (path === '/dashboard') return 'Dashboard'
  if (path === '/admin') return 'Admin Panel'
  if (path === '/admin/audit-logs') return 'Admin / Audit Logs'
  if (path === '/organizations') return 'Organizations'
  if (path === '/profile') return 'Profile'
  if (path.startsWith('/organizations/')) {
    const rest = path.split('/organizations/')[1] || ''
    if (rest.includes('/members')) return 'Organization / Members'
    if (rest.includes('/resources')) return 'Organization / Resources'
    if (rest.includes('/permissions')) return 'Organization / Permissions'
    if (rest.includes('/audit-logs')) return 'Organization / Audit Logs'
    if (rest.includes('/')) return 'Organization'
    return 'Organization'
  }
  return 'Dashboard'
}

import { Link } from 'react-router-dom'

export function ForbiddenPage() {
  return (
    <div className="page-center">
      <div className="card" style={{ textAlign: 'center', padding: 48, maxWidth: 420 }}>
        <h1 style={{ fontSize: 64, fontWeight: 700, color: 'var(--gray-300)', lineHeight: 1 }}>403</h1>
        <h2 style={{ marginTop: 8 }}>Access denied</h2>
        <p style={{ marginTop: 8, color: 'var(--gray-500)' }}>You don't have permission to access this page.</p>
        <Link to="/dashboard" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 24, textDecoration: 'none' }}>
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}

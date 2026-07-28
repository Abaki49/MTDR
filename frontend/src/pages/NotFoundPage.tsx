import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="page-center">
      <div className="card" style={{ textAlign: 'center', padding: 48, maxWidth: 420 }}>
        <h1 style={{ fontSize: 64, fontWeight: 700, color: 'var(--gray-300)', lineHeight: 1 }}>404</h1>
        <h2 style={{ marginTop: 8 }}>Page not found</h2>
        <p style={{ marginTop: 8, color: 'var(--gray-500)' }}>The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/dashboard" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 24, textDecoration: 'none' }}>
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}

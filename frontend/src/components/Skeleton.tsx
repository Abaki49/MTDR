export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="card">
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i}>
                  <div className="skeleton-line" style={{ width: `${60 + (i * 10) % 40}px` }}>&nbsp;</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c}>
                    <div
                      className="skeleton-line"
                      style={{ width: `${50 + ((r + c) * 15) % 50}px` }}
                    >
                      &nbsp;
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="stats-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-card">
          <div className="skeleton-line" style={{ width: '60%', height: 14, marginBottom: 8 }}>&nbsp;</div>
          <div className="skeleton-line" style={{ width: '40%', height: 28 }}>&nbsp;</div>
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="card">
      <div className="card-body" style={{ padding: 48, textAlign: 'center' }}>
        <div className="skeleton-line" style={{ width: '50%', height: 16, margin: '0 auto' }}>&nbsp;</div>
      </div>
    </div>
  )
}

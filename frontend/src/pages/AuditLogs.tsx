import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useCan } from '../contexts/OrgPermissionsContext'
import { TableSkeleton } from '../components/Skeleton'
import { getAuditLogs } from '../api/audit'

export function AuditLogsPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const can = useCan()

  const orgIdNum = parseInt(orgId ?? '0', 10)

  const {
    data: logs = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['auditLogs', orgIdNum],
    queryFn: () => getAuditLogs(orgIdNum),
    enabled: !!orgId,
  })

  if (!orgId) return <div>Invalid organization</div>

  if (isLoading) {
    return (
      <div>
        <div className="toolbar"><h1 style={{ fontSize: 20, margin: 0 }}>Audit Logs</h1></div>
        <TableSkeleton rows={5} cols={6} />
      </div>
    )
  }

  if (isError) {
    const statusCode = (error as any)?.response?.status
    if (statusCode === 404) {
      return (
        <div className="state-message">
          <h3>Access Denied</h3>
          <p>You don't have access to this organization's audit logs.</p>
          <Link to={`/organizations/${orgId}`} className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
            Back to Organization
          </Link>
        </div>
      )
    }
    return <div className="state-message"><h3>Error</h3><p>Could not load audit logs.</p></div>
  }

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1 style={{ fontSize: 20, margin: 0 }}>Audit Logs</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>
            {logs.length} log entry{logs.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Actor</th>
                <th>Changes</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>
                    No audit log entries found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontWeight: 500, color: 'var(--gray-500)' }}>{log.id}</td>
                    <td>
                      <span className={`badge badge-${log.action === 'create' ? 'success' : log.action === 'delete' ? 'danger' : 'info'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: 13 }}>{log.entity_type}</code>
                      {log.entity_id != null && (
                        <span style={{ color: 'var(--gray-400)', marginLeft: 4 }}>#{log.entity_id}</span>
                      )}
                    </td>
                    <td>{log.actor_name}</td>
                    <td style={{ fontSize: 13, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.before || log.after ? (
                        <span title={JSON.stringify({ before: log.before, after: log.after }, null, 2)}>
                          {log.action === 'create' ? 'Created' : log.action === 'delete' ? 'Deleted' : 'Modified'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--gray-400)' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

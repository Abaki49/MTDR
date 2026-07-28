import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { DataTable, type ColumnDef } from '../components/data-display/DataTable'
import { Pagination } from '../components/data-display/Pagination'
import { Badge } from '../components/ui/Badge'
import client from '../api/client'
import type { AuditLog } from '../types/audit'
import { PAGE_SIZE, STALE_TIMES } from '../lib/constants'
import { formatDateTime } from '../lib/utils'

export function AdminAuditPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-audit-logs', page],
    queryFn: () =>
      client
        .get<AuditLog[]>('/audit-logs', { params: { limit: PAGE_SIZE, offset: page * PAGE_SIZE } })
        .then((r) => r.data),
    staleTime: STALE_TIMES.AUDIT,
  })

  const ACTION_VARIANTS: Record<string, 'success' | 'danger' | 'info'> = {
    create: 'success',
    delete: 'danger',
    update: 'info',
  }

  const columns: ColumnDef<AuditLog>[] = [
    { id: 'id', header: 'ID', cell: (r) => r.id, width: '60px' },
    {
      id: 'action',
      header: 'Action',
      cell: (r) => (
        <Badge variant={ACTION_VARIANTS[r.action] || 'default'} size="sm">
          {r.action}
        </Badge>
      ),
      width: '100px',
    },
    { id: 'entity', header: 'Entity', cell: (r) => `${r.entity_type}#${r.entity_id ?? '-'}` },
    { id: 'actor', header: 'Actor', cell: (r) => r.actor_name },
    { id: 'changes', header: 'Changes', cell: (r) => {
      if (r.before && r.after) return `${Object.keys(r.after).length} field(s) changed`
      if (r.action === 'create') return 'Created'
      if (r.action === 'delete') return 'Deleted'
      return '-'
    }},
    { id: 'date', header: 'Date', cell: (r) => formatDateTime(r.created_at) },
  ]

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Audit Logs</h2>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin')}>
          &larr; Back to Admin
        </button>
      </div>
      <DataTable
        columns={columns}
        data={data || []}
        isLoading={isLoading}
        isError={isError}
        error={error as Error | null}
        onRetry={() => refetch()}
        emptyTitle="No audit logs"
        emptyMessage="No actions have been logged yet."
        rowKey={(r) => r.id}
      />
      <Pagination page={page} totalPages={1} onPageChange={setPage} />
    </div>
  )
}

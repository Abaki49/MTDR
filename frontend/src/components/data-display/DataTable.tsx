import { TableSkeleton } from '../Skeleton'
import { Alert } from '../feedback/Alert'
import { EmptyState } from './EmptyState'

export interface ColumnDef<T> {
  id: string
  header: string
  cell: (row: T) => React.ReactNode
  width?: string
  sortable?: boolean
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
  onRetry?: () => void
  emptyTitle?: string
  emptyMessage?: string
  stickyHeader?: boolean
  rowKey: (row: T) => string | number
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  isError,
  error,
  onRetry,
  emptyTitle = 'No data',
  emptyMessage = 'Nothing to display yet.',
  stickyHeader,
  rowKey,
}: DataTableProps<T>) {
  if (isLoading && !data.length) {
    return <TableSkeleton rows={5} cols={columns.length} />
  }

  if (isError) {
    return (
      <Alert
        variant="error"
        title="Failed to load data"
        message={error?.message || 'An unexpected error occurred.'}
        onRetry={onRetry}
      />
    )
  }

  if (!data.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />
  }

  return (
    <div className="table-container">
      <table className="data-table" style={stickyHeader ? { position: 'relative' } : undefined}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.id} style={col.width ? { width: col.width } : undefined}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((col) => (
                <td key={col.id}>{col.cell(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

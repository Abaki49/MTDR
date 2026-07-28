import { Drawer } from '../../../components/overlay/Drawer'
import type { AuditLog } from '../../../types/audit'
import { formatDateTime } from '../../../lib/utils'

interface AuditDetailDrawerProps {
  log: AuditLog | null
  onClose: () => void
}

function JsonBlock({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return <p style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>None</p>
  return (
    <pre style={{
      background: 'var(--gray-100)',
      padding: 12,
      borderRadius: 'var(--radius)',
      fontSize: 13,
      overflow: 'auto',
      maxHeight: 240,
      fontFamily: 'var(--font-mono)',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

export function AuditDetailDrawer({ log, onClose }: AuditDetailDrawerProps) {
  return (
    <Drawer open={!!log} onClose={onClose} title="Audit Log Detail">
      {log && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <strong>Action:</strong> {log.action}
          </div>
          <div>
            <strong>Entity:</strong> {log.entity_type}#{log.entity_id ?? '-'}
          </div>
          <div>
            <strong>Actor:</strong> {log.actor_name}
          </div>
          <div>
            <strong>Timestamp:</strong> {formatDateTime(log.created_at)}
          </div>
          <div>
            <strong>Before:</strong>
            <JsonBlock data={log.before} />
          </div>
          <div>
            <strong>After:</strong>
            <JsonBlock data={log.after} />
          </div>
        </div>
      )}
    </Drawer>
  )
}

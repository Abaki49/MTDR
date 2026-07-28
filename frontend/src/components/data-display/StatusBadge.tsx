import { Badge } from '../ui/Badge'

interface StatusBadgeProps {
  status: string
}

const STATUS_MAP: Record<string, { variant: 'success' | 'warning' | 'info' | 'neutral' | 'danger'; label: string }> = {
  ACTIVE: { variant: 'success', label: 'Active' },
  SUSPENDED: { variant: 'warning', label: 'Suspended' },
  INVITED: { variant: 'info', label: 'Invited' },
  PUBLIC: { variant: 'success', label: 'Public' },
  PRIVATE: { variant: 'neutral', label: 'Private' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const mapped = STATUS_MAP[status.toUpperCase()]
  if (mapped) {
    return <Badge variant={mapped.variant}>{mapped.label}</Badge>
  }
  return <Badge variant="neutral">{status}</Badge>
}

import { cn } from '../../lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  className?: string
}

export function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <div className={cn('stat-card', className)}>
      {icon && <div className="stat-card-icon">{icon}</div>}
      <div className="stat-card-body">
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  )
}

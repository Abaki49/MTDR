import { cn } from '../../lib/utils'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  size?: 'sm' | 'md'
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = 'default', size = 'md', className, children }: BadgeProps) {
  return (
    <span className={cn('badge', `badge-${variant}`, `badge-${size}`, className)}>
      {children}
    </span>
  )
}

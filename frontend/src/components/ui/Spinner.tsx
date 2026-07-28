import { cn } from '../../lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      className={cn('spinner', `spinner-${size}`, className)}
      role="status"
      aria-label="Loading"
    />
  )
}

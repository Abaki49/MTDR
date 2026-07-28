import { cn } from '../../lib/utils'

interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function Tooltip({ content, children, position = 'top', className }: TooltipProps) {
  return (
    <span className={cn('tooltip-wrapper', className)} tabIndex={0}>
      {children}
      <span
        className={cn('tooltip-content', `tooltip-${position}`)}
        role="tooltip"
      >
        {content}
      </span>
    </span>
  )
}

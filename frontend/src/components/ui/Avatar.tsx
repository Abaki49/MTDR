import { cn, getInitials } from '../../lib/utils'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      className={cn('avatar', `avatar-${size}`, className)}
      title={name}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  )
}

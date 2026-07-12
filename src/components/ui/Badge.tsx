import { cn } from '@/lib/utils/cn'

interface BadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'default'
  children: React.ReactNode
}

const variantStyles = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-primary/10 text-primary',
  default: 'bg-border/50 text-text-sub',
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant]
      )}
    >
      {children}
    </span>
  )
}

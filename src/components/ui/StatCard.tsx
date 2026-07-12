import { cn } from '@/lib/utils/cn'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: 'primary' | 'success' | 'warning' | 'danger'
}

const colorMap = {
  primary: {
    bg: 'bg-primary/10',
    text: 'text-primary',
  },
  success: {
    bg: 'bg-success/10',
    text: 'text-success',
  },
  warning: {
    bg: 'bg-warning/10',
    text: 'text-warning',
  },
  danger: {
    bg: 'bg-danger/10',
    text: 'text-danger',
  },
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: StatCardProps) {
  const colors = colorMap[color]

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-sub">{title}</p>
          <p className="mt-2 text-3xl font-bold text-text-main">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-text-sub">{subtitle}</p>
          )}
        </div>
        <div className={cn('rounded-lg p-3', colors.bg)}>
          <div className={colors.text}>{icon}</div>
        </div>
      </div>
    </div>
  )
}

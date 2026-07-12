import { auth } from '@/lib/auth'
import { Badge } from '@/components/ui/Badge'

interface TopbarProps {
  title: string
}

function getBadgeVariant(role: string) {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'danger' as const
    case 'PROPERTY_MANAGER':
      return 'warning' as const
    case 'STAFF':
      return 'info' as const
    default:
      return 'default' as const
  }
}

export default async function Topbar({ title }: TopbarProps) {
  const session = await auth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-lg font-semibold text-text-main">{title}</h1>
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-sub">{session?.user?.name}</span>
        <Badge variant={getBadgeVariant(session?.user?.role ?? 'STAFF')}>
          {session?.user?.role?.replace('_', ' ')}
        </Badge>
      </div>
    </header>
  )
}

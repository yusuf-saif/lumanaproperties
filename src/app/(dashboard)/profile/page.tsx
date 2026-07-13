import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/layout/Topbar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import ChangePasswordForm from '@/components/forms/ChangePasswordForm'
import { formatDate } from '@/lib/utils/format'
import { UserCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

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

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      role: true,
      phone: true,
      createdAt: true,
    },
  })

  if (!user) {
    redirect('/login')
  }

  return (
    <div>
      <Topbar title="Profile" />
      <div className="mx-auto max-w-2xl p-6 space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <UserCircle className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-main">{user.name}</h2>
              <p className="text-sm text-text-sub">{user.email}</p>
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-text-sub">Role</span>
              <Badge variant={getBadgeVariant(user.role)}>
                {user.role.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-sub">Phone</span>
              <span className="text-text-main">{user.phone || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-sub">Member since</span>
              <span className="text-text-main">{formatDate(user.createdAt)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-text-main">Change Password</h3>
          <ChangePasswordForm />
        </Card>
      </div>
    </div>
  )
}

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import { UserManager } from '@/components/UserManager'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    redirect('/')
  }

  const users = await prisma.user.findMany({
    include: {
      propertyUsers: {
        include: {
          property: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const properties = await prisma.property.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const formatted = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt.toISOString(),
    properties: u.propertyUsers.map((pu) => ({
      id: pu.property.id,
      name: pu.property.name,
    })),
  }))

  return (
    <div>
      <Topbar title="User Management" />
      <div className="p-6">
        <UserManager initialUsers={formatted} properties={properties} />
      </div>
    </div>
  )
}

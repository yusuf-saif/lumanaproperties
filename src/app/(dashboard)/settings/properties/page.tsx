import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import { PropertyManager } from '@/components/PropertyManager'
import { SiteSettingsManager } from '@/components/SiteSettingsManager'

export const dynamic = 'force-dynamic'

export default async function PropertiesPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    redirect('/')
  }

  const properties = await prisma.property.findMany({
    include: {
      areas: {
        include: {
          rooms: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  const formatted = properties.map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    active: p.active,
    areas: p.areas.map((a) => ({
      id: a.id,
      name: a.name,
      rooms: a.rooms.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        dailyRate: r.dailyRate,
        status: r.status,
        active: r.active,
      })),
    })),
  }))

  return (
    <div>
      <Topbar title="Property Management" />
      <div className="p-6 space-y-6">
        <SiteSettingsManager />
        <PropertyManager initialProperties={formatted} />
      </div>
    </div>
  )
}

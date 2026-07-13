import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/layout/Topbar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Building, MapPin, BedDouble, LayoutGrid, Eye } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/format'

export const dynamic = 'force-dynamic'

export default async function PropertiesListPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

  const propertyFilter = isSuperAdmin
    ? {}
    : { id: { in: session.user.propertyIds } }

  const properties = await prisma.property.findMany({
    where: propertyFilter,
    include: {
      areas: {
        include: { rooms: { where: { active: true } } },
      },
    },
    orderBy: { name: 'asc' },
  })

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const propertyIds = properties.map((p) => p.id)

  const todayReports = await prisma.dailyReport.findMany({
    where: {
      propertyId: { in: propertyIds },
      reportDate: { gte: todayStart },
    },
    select: { propertyId: true, roomId: true, occupancyStatus: true },
  })

  const summary = properties.map((p) => {
    const totalRooms = p.areas.reduce((sum, a) => sum + a.rooms.length, 0)
    const totalAreas = p.areas.length
    const reports = todayReports.filter((r) => r.propertyId === p.id)
    const occupiedRooms = reports.filter(
      (r) => r.occupancyStatus === 'OCCUPIED'
    ).length
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

    return {
      id: p.id,
      name: p.name,
      address: p.address,
      active: p.active,
      totalAreas,
      totalRooms,
      occupancyRate,
      occupiedRooms,
    }
  })

  return (
    <div>
      <Topbar title="Properties" />
      <div className="p-6">
        {summary.length === 0 ? (
          <Card className="p-12 text-center">
            <Building className="mx-auto h-12 w-12 text-text-sub/30" />
            <p className="mt-4 text-sm text-text-sub">
              No properties found.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {summary.map((property) => (
              <Card key={property.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-main">
                        {property.name}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-text-sub">
                        <MapPin className="h-3 w-3" />
                        {property.address}
                      </p>
                    </div>
                  </div>
                  <Badge variant={property.active ? 'success' : 'default'}>
                    {property.active ? 'Active' : 'Archived'}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-surface p-2">
                    <p className="text-lg font-bold text-text-main">
                      {property.totalRooms}
                    </p>
                    <p className="text-[10px] text-text-sub">Rooms</p>
                  </div>
                  <div className="rounded-lg bg-surface p-2">
                    <p className="text-lg font-bold text-text-main">
                      {property.totalAreas}
                    </p>
                    <p className="text-[10px] text-text-sub">Areas</p>
                  </div>
                  <div className="rounded-lg bg-surface p-2">
                    <p className="text-lg font-bold text-success">
                      {property.occupancyRate}%
                    </p>
                    <p className="text-[10px] text-text-sub">Occupancy</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-text-sub">
                    {property.occupiedRooms} of {property.totalRooms} rooms occupied today
                  </p>
                </div>

                <div className="mt-4">
                  <Link
                    href={`/properties/${property.id}?date=${new Date().toISOString().split('T')[0]}`}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-main transition-colors hover:bg-primary/5 hover:text-primary"
                  >
                    <Eye className="h-4 w-4" />
                    View Availability
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

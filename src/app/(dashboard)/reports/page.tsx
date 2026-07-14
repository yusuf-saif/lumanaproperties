import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import { ReportFilterBar } from '@/components/ReportFilterBar'
import { ReportGenerator } from '@/components/ReportGenerator'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const propertyFilter =
    session.user.role === 'SUPER_ADMIN'
      ? {}
      : { propertyId: { in: session.user.propertyIds } }

  const reports = await prisma.dailyReport.findMany({
    where: propertyFilter,
    include: {
      property: { select: { id: true, name: true } },
      room: { select: { id: true, name: true } },
      submittedBy: { select: { id: true, name: true } },
    },
    orderBy: { reportDate: 'desc' },
  })

  const properties = await prisma.property.findMany({
    where:
      session.user.role === 'SUPER_ADMIN'
        ? {}
        : { id: { in: session.user.propertyIds } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentReports = await prisma.dailyReport.findMany({
    where: {
      ...propertyFilter,
      reportDate: { gte: sevenDaysAgo },
    },
    select: { reportDate: true, roomId: true },
  })

  const missingReports: Array<{ date: string; propertyName: string; propertyId: string }> = []

  for (const property of properties) {
    const propertyRooms = await prisma.room.findMany({
      where: {
        area: { propertyId: property.id },
        active: true,
      },
      select: { id: true },
    })

    const propertyReportRoomDates = recentReports
      .filter((r) => propertyRooms.some((room) => room.id === r.roomId))
      .map((r) => r.reportDate.toISOString().split('T')[0])

    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]

      if (!propertyReportRoomDates.includes(dateStr)) {
        missingReports.push({ date: dateStr, propertyName: property.name, propertyId: property.id })
      }
    }
  }

  missingReports.sort((a, b) => b.date.localeCompare(a.date))

  const formatted = reports.map((r) => ({
    id: r.id,
    reportDate: r.reportDate.toISOString().split('T')[0],
    createdAt: r.createdAt.toISOString(),
    notes: r.notes,
    occupancyStatus: r.occupancyStatus,
    guestName: r.guestName,
    guestCount: r.guestCount,
    room: r.room,
    property: r.property,
    submittedBy: r.submittedBy,
  }))

  return (
    <div>
      <Topbar title="Reports" />
      <div className="p-6 space-y-6">
        <ReportFilterBar
          reports={formatted}
          properties={properties}
          missingReports={missingReports}
        />
        <ReportGenerator properties={properties} />
      </div>
    </div>
  )
}

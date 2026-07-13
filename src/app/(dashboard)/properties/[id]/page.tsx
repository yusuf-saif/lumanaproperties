import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/layout/Topbar'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import RoomAvailabilityGrid from '@/components/RoomAvailabilityGrid'

export const dynamic = 'force-dynamic'

function formatDateParam(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatDateDisplay(d: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export default async function PropertyAvailabilityPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { date?: string }
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  if (
    session.user.role !== 'SUPER_ADMIN' &&
    session.user.role !== 'PROPERTY_MANAGER' &&
    session.user.role !== 'STAFF'
  ) {
    redirect('/')
  }

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: {
      areas: {
        where: { active: true },
        include: {
          rooms: {
            where: { active: true },
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
  })

  if (!property) {
    notFound()
  }

  if (
    session.user.role !== 'SUPER_ADMIN' &&
    !session.user.propertyIds.includes(property.id)
  ) {
    notFound()
  }

  const selectedDateStr = searchParams.date || formatDateParam(new Date())
  const selectedDate = new Date(selectedDateStr)
  selectedDate.setHours(0, 0, 0, 0)

  const dayStart = new Date(selectedDate)
  const dayEnd = new Date(selectedDate)
  dayEnd.setHours(23, 59, 59, 999)

  const prevDay = new Date(selectedDate)
  prevDay.setDate(prevDay.getDate() - 1)
  const nextDay = new Date(selectedDate)
  nextDay.setDate(nextDay.getDate() + 1)

  const roomIds = property.areas.flatMap((a) => a.rooms.map((r) => r.id))

  const reports = await prisma.dailyReport.findMany({
    where: {
      roomId: { in: roomIds },
      reportDate: { gte: dayStart, lte: dayEnd },
    },
    select: {
      roomId: true,
      occupancyStatus: true,
      guestName: true,
      guestCount: true,
    },
  })

  const reportMap = new Map(
    reports.map((r) => [
      r.roomId,
      {
        occupancyStatus: r.occupancyStatus,
        guestName: r.guestName,
        guestCount: r.guestCount,
      },
    ])
  )

  const totalRooms = roomIds.length
  const reportedCount = reports.length
  const notReported = totalRooms - reportedCount

  const occupied = reports.filter(
    (r) => r.occupancyStatus === 'OCCUPIED'
  ).length
  const vacant = reports.filter(
    (r) => r.occupancyStatus === 'VACANT'
  ).length
  const checkout = reports.filter(
    (r) => r.occupancyStatus === 'CHECKOUT'
  ).length
  const noShow = reports.filter(
    (r) => r.occupancyStatus === 'NO_SHOW'
  ).length

  const areas = property.areas.map((a) => ({
    id: a.id,
    name: a.name,
    rooms: a.rooms.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      dailyRate: r.dailyRate,
      status: r.status,
      report: reportMap.get(r.id) ?? null,
    })),
  }))

  return (
    <div>
      <Topbar title="Room Availability" />
      <div className="p-6">
        <Link
          href="/properties"
          className="mb-4 inline-flex items-center gap-1 text-sm text-text-sub hover:text-text-main"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to properties
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-main">{property.name}</h1>
          <p className="text-sm text-text-sub">{property.address}</p>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <Link
            href={`/properties/${property.id}?date=${formatDateParam(prevDay)}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-text-sub transition-colors hover:bg-surface hover:text-text-main"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>

          <div className="flex-1 text-center">
            <p className="text-lg font-semibold text-text-main">
              {formatDateDisplay(selectedDate)}
            </p>
          </div>

          <Link
            href={`/properties/${property.id}?date=${formatDateParam(nextDay)}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-text-sub transition-colors hover:bg-surface hover:text-text-main"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-text-main">{totalRooms}</p>
            <p className="text-[10px] text-text-sub">Total Rooms</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-primary">{occupied}</p>
            <p className="text-[10px] text-text-sub">Occupied</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-success">{vacant}</p>
            <p className="text-[10px] text-text-sub">Vacant</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-info">{checkout}</p>
            <p className="text-[10px] text-text-sub">Checkout</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-danger">{noShow}</p>
            <p className="text-[10px] text-text-sub">No Show</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-text-sub">{notReported}</p>
            <p className="text-[10px] text-text-sub">Not Reported</p>
          </div>
        </div>

        <RoomAvailabilityGrid
          areas={areas}
          selectedDate={selectedDateStr}
          propertyId={property.id}
          userRole={session.user.role}
        />
      </div>
    </div>
  )
}

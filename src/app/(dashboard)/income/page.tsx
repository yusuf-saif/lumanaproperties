import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import { IncomeFilterBar } from '@/components/IncomeFilterBar'

export const dynamic = 'force-dynamic'

export default async function IncomePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const propertyFilter =
    session.user.role === 'SUPER_ADMIN'
      ? {}
      : { propertyId: { in: session.user.propertyIds } }

  const records = await prisma.incomeRecord.findMany({
    where: {
      room: {
        area: {
          ...propertyFilter,
        },
      },
    },
    include: {
      room: {
        include: {
          area: {
            include: {
              property: { select: { name: true } },
            },
          },
        },
      },
      recordedBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const properties = await prisma.property.findMany({
    where:
      session.user.role === 'SUPER_ADMIN'
        ? {}
        : { id: { in: session.user.propertyIds } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const formatted = records.map((r) => ({
    id: r.id,
    amount: r.amount,
    paymentMethod: r.paymentMethod,
    bookingSource: r.bookingSource,
    guestName: r.guestName,
    checkInDate: r.checkInDate.toISOString().split('T')[0],
    checkOutDate: r.checkOutDate.toISOString().split('T')[0],
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    property: r.room.area.property.name,
    room: r.room.name,
    recordedBy: r.recordedBy.name,
  }))

  return (
    <div>
      <Topbar title="Income" />
      <div className="p-6">
        <IncomeFilterBar records={formatted} properties={properties} />
      </div>
    </div>
  )
}

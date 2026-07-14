import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import { IncomeFilterBar } from '@/components/IncomeFilterBar'
import IncomeImportModal from '@/components/IncomeImportModal'

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
    where: propertyFilter,
    include: {
      room: { select: { name: true } },
      property: { select: { name: true } },
      recordedBy: { select: { name: true } },
    },
    orderBy: { recordDate: 'desc' },
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
    source: r.source,
    guestName: r.guestName,
    recordDate: r.recordDate.toISOString().split('T')[0],
    reference: r.reference,
    verified: r.verified,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    property: r.property.name,
    room: r.room.name,
    recordedBy: r.recordedBy.name,
  }))

  const canImport = session.user.role === 'SUPER_ADMIN' || session.user.role === 'PROPERTY_MANAGER'

  return (
    <div>
      <Topbar title="Income" />
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-main">Income Records</h2>
          <div className="flex items-center gap-3">
            {canImport && <IncomeImportModal />}
            <Link
              href="/submit/income"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Plus size={16} />
              Log Income
            </Link>
          </div>
        </div>
        <IncomeFilterBar records={formatted} properties={properties} currentUserRole={session.user.role} />
      </div>
    </div>
  )
}

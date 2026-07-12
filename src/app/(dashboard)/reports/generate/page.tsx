import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import { ReportGenerator } from '@/components/ReportGenerator'

export const dynamic = 'force-dynamic'

export default async function GenerateReportPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  if (session.user.role === 'STAFF') {
    redirect('/reports')
  }

  const properties = await prisma.property.findMany({
    where:
      session.user.role === 'SUPER_ADMIN'
        ? {}
        : { id: { in: session.user.propertyIds } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <Topbar title="Generate Report" />
      <div className="p-6">
        <ReportGenerator properties={properties} />
      </div>
    </div>
  )
}

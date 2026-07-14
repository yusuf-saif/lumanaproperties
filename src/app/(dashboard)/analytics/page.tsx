import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
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
      <Topbar title="Analytics" />
      <div className="p-6">
        <AnalyticsDashboard properties={properties} />
      </div>
    </div>
  )
}

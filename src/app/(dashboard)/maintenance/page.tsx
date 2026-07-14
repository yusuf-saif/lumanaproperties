import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import MaintenanceFilterBar from '@/components/MaintenanceFilterBar'

export const dynamic = 'force-dynamic'

export default async function MaintenancePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  let issues: {
    id: string
    title: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    status: 'REPORTED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
    createdAt: Date
    room: { name: string; area: { name: string } }
    property: { name: string }
    raisedBy: { name: string }
  }[] = []

  try {
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

    issues = await prisma.maintenanceIssue.findMany({
      where: isSuperAdmin
        ? {}
        : {
            propertyId: { in: session.user.propertyIds },
          },
      include: {
        room: { include: { area: true } },
        property: { select: { name: true } },
        raisedBy: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    })
  } catch {
    // DB not connected — render empty state
  }

  const serialized = issues.map((issue) => ({
    ...issue,
    createdAt: issue.createdAt.toISOString(),
  }))

  return (
    <div>
      <Topbar title="Maintenance" />
      <div className="p-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-main">
              Maintenance Issues
            </h2>
            <Link
              href="/submit/maintenance"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Plus size={16} />
              Log Issue
            </Link>
          </div>
          <div className="mt-6">
            {serialized.length === 0 ? (
              <p className="text-sm text-text-sub">
                No maintenance issues found.
              </p>
            ) : (
              <MaintenanceFilterBar issues={serialized} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

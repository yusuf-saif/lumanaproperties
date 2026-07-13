import { auth } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/layout/Topbar'
import { Badge } from '@/components/ui/Badge'
import MaintenanceActionPanel from '@/components/MaintenanceActionPanel'
import { formatDate, formatDateTime } from '@/lib/utils/format'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const priorityVariant: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  CRITICAL: 'danger',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'default',
}

const statusVariant: Record<string, 'danger' | 'warning' | 'success' | 'default'> = {
  REPORTED: 'default',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'default',
}

const categoryLabel: Record<string, string> = {
  ELECTRICAL: 'Electrical',
  PLUMBING: 'Plumbing',
  HVAC: 'HVAC',
  FURNITURE: 'Furniture',
  APPLIANCE: 'Appliance',
  OTHER: 'Other',
}

export default async function MaintenanceDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const issue = await prisma.maintenanceIssue.findUnique({
    where: { id: params.id },
    include: {
      room: { include: { area: true } },
      property: { select: { id: true, name: true } },
      raisedBy: { select: { name: true, email: true } },
      assignedTo: { select: { id: true, name: true } },
      resolvedBy: { select: { name: true } },
    },
  })

  if (!issue) {
    notFound()
  }

  if (
    session.user.role !== 'SUPER_ADMIN' &&
    !session.user.propertyIds.includes(issue.propertyId)
  ) {
    notFound()
  }

  const availableUsers = await prisma.user.findMany({
    where:
      session.user.role === 'SUPER_ADMIN'
        ? { active: true }
        : {
            active: true,
            propertyUsers: {
              some: { propertyId: issue.propertyId },
            },
          },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <Topbar title="Maintenance Issue" />
      <div className="p-6">
        <Link
          href="/maintenance"
          className="mb-4 inline-flex items-center gap-1 text-sm text-text-sub hover:text-text-main"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to maintenance
        </Link>

        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-text-main">
              {issue.title}
            </h1>
            <Badge variant={priorityVariant[issue.priority]}>
              {issue.priority}
            </Badge>
            <Badge variant={statusVariant[issue.status]}>
              {issue.status.replace('_', ' ')}
            </Badge>
            <Badge variant="info">
              {categoryLabel[issue.category] ?? issue.category}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase text-text-sub">
                Description
              </h2>
              <p className="whitespace-pre-wrap text-sm text-text-main">
                {issue.description}
              </p>
            </div>

            {issue.photos.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-3 text-sm font-semibold uppercase text-text-sub">
                  Photos
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {issue.photos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="max-h-48 w-full rounded-lg object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            {(issue.status === 'RESOLVED' || issue.status === 'CLOSED') &&
              issue.resolutionNotes && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="mb-3 text-sm font-semibold uppercase text-text-sub">
                    Resolution Notes
                  </h2>
                  <p className="whitespace-pre-wrap text-sm text-text-main">
                    {issue.resolutionNotes}
                  </p>
                </div>
              )}

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase text-text-sub">
                Timeline
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-sub">Created</span>
                  <span className="text-text-main">
                    {formatDateTime(issue.createdAt)}
                  </span>
                </div>
                {issue.assignedTo && (
                  <div className="flex justify-between">
                    <span className="text-text-sub">Assigned</span>
                    <span className="text-text-main">
                      {issue.assignedTo.name}
                    </span>
                  </div>
                )}
                {issue.resolvedAt && (
                  <div className="flex justify-between">
                    <span className="text-text-sub">Resolved</span>
                    <span className="text-text-main">
                      {formatDateTime(issue.resolvedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase text-text-sub">
                Details
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-sub">Property</span>
                  <span className="text-text-main">
                    {issue.property.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-sub">Room</span>
                  <span className="text-text-main">
                    {issue.room.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-sub">Area</span>
                  <span className="text-text-main">
                    {issue.room.area.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase text-text-sub">
                Reported By
              </h2>
              <div className="space-y-2 text-sm">
                <p className="text-text-main">{issue.raisedBy.name}</p>
                <p className="text-text-sub">{issue.raisedBy.email}</p>
                <p className="text-text-sub">
                  {formatDate(issue.createdAt)}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase text-text-sub">
                Assigned To
              </h2>
              <p className="text-sm text-text-main">
                {issue.assignedTo?.name ?? 'Unassigned'}
              </p>
            </div>

            <MaintenanceActionPanel
              issue={{
                id: issue.id,
                status: issue.status,
                priority: issue.priority,
                assignedToId: issue.assignedToId,
              }}
              availableUsers={availableUsers}
              currentUserRole={session.user.role}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

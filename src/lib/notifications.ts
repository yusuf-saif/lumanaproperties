import { prisma } from '@/lib/prisma'
import type { NotificationType } from '@prisma/client'

async function createNotifications(
  data: { userId: string; title: string; message: string; type: NotificationType; link?: string }[]
) {
  try {
    if (data.length === 0) return
    await prisma.notification.createMany({ data })
  } catch (err) {
    console.error('Failed to create notifications:', err)
  }
}

export async function notifyMaintenanceCritical(
  issue: { id: string; title: string; propertyId: string },
  managersAndAdmins: { id: string }[]
) {
  const notifications = managersAndAdmins.map((user) => ({
    userId: user.id,
    title: 'Critical Issue Reported',
    message: `A critical maintenance issue was reported: "${issue.title}"`,
    type: 'MAINTENANCE_CRITICAL' as NotificationType,
    link: `/maintenance/${issue.id}`,
  }))
  await createNotifications(notifications)
}

export async function notifyMaintenanceResolved(
  issue: { id: string; title: string; raisedById: string }
) {
  await createNotifications([
    {
      userId: issue.raisedById,
      title: 'Issue Resolved',
      message: `Your maintenance issue "${issue.title}" has been resolved.`,
      type: 'MAINTENANCE_RESOLVED' as NotificationType,
      link: `/maintenance/${issue.id}`,
    },
  ])
}

export async function notifyReportMissing(
  property: { id: string; name: string },
  managers: { id: string }[]
) {
  const notifications = managers.map((user) => ({
    userId: user.id,
    title: 'Missing Daily Report',
    message: `No daily report submitted for ${property.name} today.`,
    type: 'REPORT_MISSING' as NotificationType,
    link: '/reports',
  }))
  await createNotifications(notifications)
}

export async function notifyIncomeUnverified(
  record: { id: string; amount: number; roomId: string; propertyId: string },
  managersAndAdmins: { id: string }[]
) {
  const notifications = managersAndAdmins.map((user) => ({
    userId: user.id,
    title: 'New Income Record — Verification Pending',
    message: `A new income record of ₦${record.amount.toLocaleString()} needs verification.`,
    type: 'INCOME_UNVERIFIED' as NotificationType,
    link: '/income',
  }))
  await createNotifications(notifications)
}

export async function notifyMaintenanceOverdue(
  issue: { id: string; title: string; propertyId: string },
  propertyName: string,
  managers: { id: string }[]
) {
  const notifications = managers.map((user) => ({
    userId: user.id,
    title: 'Critical Issue Overdue',
    message: `Critical issue "${issue.title}" at ${propertyName} has been unresolved for over 24 hours.`,
    type: 'MAINTENANCE_OVERDUE' as NotificationType,
    link: `/maintenance/${issue.id}`,
  }))
  await createNotifications(notifications)
}

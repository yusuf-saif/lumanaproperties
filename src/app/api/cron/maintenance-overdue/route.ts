import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyMaintenanceOverdue } from '@/lib/notifications'
import { sendMaintenanceAlertEmail } from '@/lib/email'

export async function GET(request: Request) {
  const secret = request.headers.get('x-cron-secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const overdueIssues = await prisma.maintenanceIssue.findMany({
    where: {
      status: { in: ['REPORTED', 'IN_PROGRESS'] },
      priority: 'CRITICAL',
      createdAt: { lt: cutoff },
    },
    include: {
      property: { select: { id: true, name: true } },
    },
  })

  let processed = 0
  let notified = 0

  for (const issue of overdueIssues) {
    const recentNotification = await prisma.notification.findFirst({
      where: {
        type: 'MAINTENANCE_OVERDUE',
        link: `/maintenance/${issue.id}`,
        createdAt: { gt: cutoff },
      },
    })

    if (recentNotification) {
      continue
    }

    processed++

    const managers = await prisma.user.findMany({
      where: {
        active: true,
        role: { in: ['SUPER_ADMIN', 'PROPERTY_MANAGER'] },
        propertyUsers: { some: { propertyId: issue.propertyId } },
      },
      select: { id: true, email: true },
    })

    if (managers.length === 0) {
      const superAdmins = await prisma.user.findMany({
        where: { role: 'SUPER_ADMIN', active: true },
        select: { id: true, email: true },
      })
      managers.push(...superAdmins)
    }

    await notifyMaintenanceOverdue(
      { id: issue.id, title: issue.title, propertyId: issue.propertyId },
      issue.property.name,
      managers
    )

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    for (const manager of managers) {
      await sendMaintenanceAlertEmail({
        to: manager.email,
        issueTitle: issue.title,
        propertyName: issue.property.name,
        priority: 'CRITICAL',
        issueUrl: `${baseUrl}/maintenance/${issue.id}`,
      })
    }

    notified++
  }

  return NextResponse.json({ processed, notified })
}

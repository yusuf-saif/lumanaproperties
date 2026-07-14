import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const analyticsSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  propertyId: z.string().optional(),
})

export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''
  const propertyId = searchParams.get('propertyId') ?? undefined

  const parsed = analyticsSchema.safeParse({ from, to, propertyId })

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const fromDate = new Date(from)
  const toDate = new Date(to)
  toDate.setHours(23, 59, 59, 999)

  let propertyFilter: Record<string, unknown> = {}
  if (propertyId) {
    propertyFilter = { propertyId }
  } else if (session.user.role !== 'SUPER_ADMIN') {
    propertyFilter = { propertyId: { in: session.user.propertyIds } }
  }

  let roomWhere: Record<string, unknown> = { active: true }
  if (propertyId) {
    roomWhere = { ...roomWhere, area: { propertyId } }
  } else if (session.user.role !== 'SUPER_ADMIN') {
    roomWhere = { ...roomWhere, area: { property: { id: { in: session.user.propertyIds } } } }
  }

  try {
    const [rooms, reports, maintenanceIssues] = await Promise.all([
      prisma.room.findMany({
        where: roomWhere,
        select: { id: true, type: true, area: { select: { propertyId: true } } },
      }),
      prisma.dailyReport.findMany({
        where: {
          ...propertyFilter,
          reportDate: { gte: fromDate, lte: toDate },
        },
        select: {
          reportDate: true,
          occupancyStatus: true,
          roomId: true,
          createdAt: true,
        },
      }),
      prisma.maintenanceIssue.findMany({
        where: {
          ...propertyFilter,
          createdAt: { gte: fromDate, lte: toDate },
        },
        select: {
          priority: true,
          status: true,
          category: true,
          createdAt: true,
          resolvedAt: true,
        },
      }),
    ])

    const totalRooms = rooms.length
    const days = Math.max(
      1,
      Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    )

    const occupancyTrend: Array<{
      date: string
      occupied: number
      vacant: number
      checkout: number
      noShow: number
      total: number
      rate: number
    }> = []

    const dateMap = new Map<string, { occupied: number; vacant: number; checkout: number; noShow: number }>()

    for (const report of reports) {
      const dateStr = report.reportDate.toISOString().split('T')[0]
      const entry = dateMap.get(dateStr) ?? { occupied: 0, vacant: 0, checkout: 0, noShow: 0 }

      switch (report.occupancyStatus) {
        case 'OCCUPIED': entry.occupied++; break
        case 'VACANT': entry.vacant++; break
        case 'CHECKOUT': entry.checkout++; break
        case 'NO_SHOW': entry.noShow++; break
      }

      dateMap.set(dateStr, entry)
    }

    for (let i = 0; i < days; i++) {
      const d = new Date(fromDate)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const entry = dateMap.get(dateStr) ?? { occupied: 0, vacant: 0, checkout: 0, noShow: 0 }
      const total = entry.occupied + entry.vacant + entry.checkout + entry.noShow
      const rate = totalRooms > 0 ? Math.round((entry.occupied / totalRooms) * 100) : 0

      occupancyTrend.push({
        date: dateStr,
        ...entry,
        total,
        rate,
      })
    }

    const occupancyDistribution = {
      OCCUPIED: reports.filter((r) => r.occupancyStatus === 'OCCUPIED').length,
      VACANT: reports.filter((r) => r.occupancyStatus === 'VACANT').length,
      CHECKOUT: reports.filter((r) => r.occupancyStatus === 'CHECKOUT').length,
      NO_SHOW: reports.filter((r) => r.occupancyStatus === 'NO_SHOW').length,
    }

    const roomTypeMap = new Map<string, { occupied: number; vacant: number }>()
    for (const room of rooms) {
      if (!roomTypeMap.has(room.type)) {
        roomTypeMap.set(room.type, { occupied: 0, vacant: 0 })
      }
    }

    for (const report of reports) {
      const room = rooms.find((r) => r.id === report.roomId)
      if (room) {
        const entry = roomTypeMap.get(room.type) ?? { occupied: 0, vacant: 0 }
        if (report.occupancyStatus === 'OCCUPIED') {
          entry.occupied++
        } else {
          entry.vacant++
        }
        roomTypeMap.set(room.type, entry)
      }
    }

    const roomTypePerformance = Array.from(roomTypeMap.entries()).map(([type, data]) => ({
      type,
      occupied: data.occupied,
      vacant: data.vacant,
      rate: data.occupied + data.vacant > 0
        ? Math.round((data.occupied / (data.occupied + data.vacant)) * 100)
        : 0,
    }))

    const maintenanceByStatus = {
      REPORTED: maintenanceIssues.filter((i) => i.status === 'REPORTED').length,
      IN_PROGRESS: maintenanceIssues.filter((i) => i.status === 'IN_PROGRESS').length,
      RESOLVED: maintenanceIssues.filter((i) => i.status === 'RESOLVED').length,
      CLOSED: maintenanceIssues.filter((i) => i.status === 'CLOSED').length,
    }

    const maintenanceByPriority = {
      CRITICAL: maintenanceIssues.filter((i) => i.priority === 'CRITICAL').length,
      HIGH: maintenanceIssues.filter((i) => i.priority === 'HIGH').length,
      MEDIUM: maintenanceIssues.filter((i) => i.priority === 'MEDIUM').length,
      LOW: maintenanceIssues.filter((i) => i.priority === 'LOW').length,
    }

    const categoryMap = new Map<string, number>()
    for (const issue of maintenanceIssues) {
      categoryMap.set(issue.category, (categoryMap.get(issue.category) ?? 0) + 1)
    }
    const maintenanceByCategory = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)

    const resolvedIssues = maintenanceIssues.filter((i) => i.resolvedAt)
    const avgResolutionHours =
      resolvedIssues.length > 0
        ? Math.round(
            resolvedIssues.reduce((sum, i) => {
              const hours = (i.resolvedAt!.getTime() - i.createdAt.getTime()) / (1000 * 60 * 60)
              return sum + hours
            }, 0) / resolvedIssues.length
          )
        : 0

    const complianceMap = new Map<string, { expected: number; submitted: number }>()
    for (let i = 0; i < days; i++) {
      const d = new Date(fromDate)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      complianceMap.set(dateStr, { expected: totalRooms, submitted: 0 })
    }

    for (const report of reports) {
      const dateStr = report.reportDate.toISOString().split('T')[0]
      const entry = complianceMap.get(dateStr)
      if (entry) {
        entry.submitted++
      }
    }

    const complianceTrend = Array.from(complianceMap.entries())
      .map(([date, data]) => ({
        date,
        expected: data.expected,
        submitted: data.submitted,
        rate: data.expected > 0 ? Math.round((data.submitted / data.expected) * 100) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      occupancyTrend,
      occupancyDistribution,
      roomTypePerformance,
      maintenanceByStatus,
      maintenanceByPriority,
      maintenanceByCategory,
      avgResolutionHours,
      complianceTrend,
    })
  } catch (error) {
    console.error('Analytics query failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

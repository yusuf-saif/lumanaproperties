import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils/format'

const generateSchema = z.object({
  type: z.enum(['occupancy', 'maintenance', 'income', 'guest', 'daily-ops', 'staff-performance', 'consolidated-summary']),
  propertyIds: z.array(z.string()),
  from: z.string().min(1),
  to: z.string().min(1),
})

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 400 })
  }

  if (session.user.role === 'STAFF') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = generateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { type, propertyIds, from, to } = parsed.data
  const fromDate = new Date(from)
  const toDate = new Date(to)
  toDate.setHours(23, 59, 59, 999)

  const propertyFilter =
    propertyIds.length > 0 ? { propertyId: { in: propertyIds } } : {}

  try {
    let data: unknown[] = []

    switch (type) {
      case 'occupancy': {
        const reports = await prisma.dailyReport.findMany({
          where: {
            ...propertyFilter,
            reportDate: { gte: fromDate, lte: toDate },
          },
          include: {
            property: { select: { name: true } },
            room: { select: { name: true } },
          },
          orderBy: { reportDate: 'asc' },
        })

        data = reports.map((r) => ({
          date: r.reportDate,
          property: r.property.name,
          room: r.room.name,
          occupancyStatus: r.occupancyStatus,
          guestName: r.guestName,
          guestCount: r.guestCount,
        }))
        break
      }

      case 'maintenance': {
        const issues = await prisma.maintenanceIssue.findMany({
          where: {
            ...propertyFilter,
            createdAt: { gte: fromDate, lte: toDate },
          },
          include: {
            property: { select: { name: true } },
            room: { select: { name: true } },
            raisedBy: { select: { name: true } },
            assignedTo: { select: { name: true } },
            resolvedBy: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        })

        data = issues.map((i) => ({
          id: i.id,
          title: i.title,
          priority: i.priority,
          status: i.status,
          category: i.category,
          property: i.property.name,
          room: i.room.name,
          raisedBy: i.raisedBy.name,
          assignedTo: i.assignedTo?.name ?? null,
          resolvedBy: i.resolvedBy?.name ?? null,
          createdAt: i.createdAt,
          resolvedAt: i.resolvedAt,
          resolutionTime:
            i.resolvedAt
              ? Math.round((i.resolvedAt.getTime() - i.createdAt.getTime()) / (1000 * 60 * 60))
              : null,
        }))
        break
      }

      case 'income': {
        const records = await prisma.incomeRecord.findMany({
          where: {
            ...propertyFilter,
            recordDate: { gte: fromDate, lte: toDate },
          },
          include: {
            room: { select: { name: true } },
            property: { select: { name: true } },
            recordedBy: { select: { name: true } },
          },
          orderBy: { recordDate: 'desc' },
        })

        data = records.map((r) => ({
          id: r.id,
          property: r.property.name,
          room: r.room.name,
          amount: r.amount,
          paymentMethod: r.paymentMethod,
          source: r.source,
          guestName: r.guestName,
          recordDate: r.recordDate,
          reference: r.reference,
          verified: r.verified,
          recordedBy: r.recordedBy.name,
          createdAt: r.createdAt,
        }))
        break
      }

      case 'guest': {
        const records = await prisma.incomeRecord.findMany({
          where: {
            ...propertyFilter,
            recordDate: { gte: fromDate, lte: toDate },
            guestName: { not: null },
          },
          include: {
            room: { select: { name: true } },
            property: { select: { name: true } },
          },
          orderBy: { recordDate: 'desc' },
        })

        data = records.map((r) => ({
          guestName: r.guestName,
          property: r.property.name,
          room: r.room.name,
          recordDate: r.recordDate,
          amount: r.amount,
          source: r.source,
        }))
        break
      }

      case 'daily-ops': {
        const reports = await prisma.dailyReport.findMany({
          where: {
            ...propertyFilter,
            reportDate: { gte: fromDate, lte: toDate },
          },
          include: {
            property: { select: { name: true } },
            room: { select: { name: true } },
            submittedBy: { select: { name: true } },
          },
          orderBy: { reportDate: 'desc' },
        })

        data = reports.map((r) => ({
          id: r.id,
          date: r.reportDate,
          property: r.property.name,
          room: r.room.name,
          occupancyStatus: r.occupancyStatus,
          guestName: r.guestName,
          guestCount: r.guestCount,
          submittedBy: r.submittedBy.name,
          createdAt: r.createdAt,
          notes: r.notes,
        }))
        break
      }

      case 'staff-performance': {
        const staffWhere: Record<string, unknown> = {
          role: { in: ['STAFF', 'PROPERTY_MANAGER'] },
          active: true,
        }

        if (propertyIds.length > 0) {
          staffWhere.propertyUsers = {
            some: { propertyId: { in: propertyIds } },
          }
        }

        const staffUsers = await prisma.user.findMany({
          where: staffWhere,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        })

        const staffIds = staffUsers.map((u) => u.id)

        const [allSubmissions, allMaintenanceRaised, allMaintenanceResolved] =
          await Promise.all([
            prisma.dailyReport.findMany({
              where: {
                submittedById: { in: staffIds },
                reportDate: { gte: fromDate, lte: toDate },
              },
              select: {
                submittedById: true,
                reportDate: true,
                createdAt: true,
              },
            }),
            prisma.maintenanceIssue.findMany({
              where: {
                raisedById: { in: staffIds },
                createdAt: { gte: fromDate, lte: toDate },
              },
              select: { raisedById: true },
            }),
            prisma.maintenanceIssue.findMany({
              where: {
                resolvedById: { in: staffIds },
                resolvedAt: { gte: fromDate, lte: toDate },
              },
              select: { resolvedById: true },
            }),
          ])

        const sixPm = 18 * 60

        data = staffUsers.map((user) => {
          const subs = allSubmissions.filter(
            (s) => s.submittedById === user.id
          )
          let onTime = 0
          let late = 0
          let lastSubmission: Date | null = null

          for (const sub of subs) {
            const reportDate = new Date(sub.reportDate)
            const threshold = new Date(reportDate)
            threshold.setHours(18, 0, 0, 0)

            if (sub.createdAt <= threshold) {
              onTime++
            } else {
              late++
            }

            if (!lastSubmission || sub.createdAt > lastSubmission) {
              lastSubmission = sub.createdAt
            }
          }

          const reportedCount = allMaintenanceRaised.filter(
            (m) => m.raisedById === user.id
          ).length
          const resolvedCount = allMaintenanceResolved.filter(
            (m) => m.resolvedById === user.id
          ).length

          return {
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            submissionCount: subs.length,
            onTimeCount: onTime,
            lateCount: late,
            maintenanceReported: reportedCount,
            maintenanceResolved: resolvedCount,
            lastSubmission,
          }
        })
        break
      }

      case 'consolidated-summary': {
        const allRoomFilter =
          propertyIds.length > 0
            ? { propertyId: { in: propertyIds } }
            : {}

        const [
          totalRooms,
          occupancyReports,
          maintenanceIssues,
          incomeRecords,
          submissionCounts,
        ] = await Promise.all([
          prisma.room.count({
            where: { ...allRoomFilter, active: true },
          }),
          prisma.dailyReport.findMany({
            where: {
              ...allRoomFilter,
              reportDate: { gte: fromDate, lte: toDate },
            },
            select: {
              propertyId: true,
              occupancyStatus: true,
              roomId: true,
            },
          }),
          prisma.maintenanceIssue.findMany({
            where: {
              ...allRoomFilter,
              createdAt: { gte: fromDate, lte: toDate },
            },
            select: {
              propertyId: true,
              priority: true,
              status: true,
              createdAt: true,
              resolvedAt: true,
            },
          }),
          prisma.incomeRecord.findMany({
            where: {
              ...allRoomFilter,
              recordDate: { gte: fromDate, lte: toDate },
            },
            select: {
              propertyId: true,
              roomId: true,
              amount: true,
              source: true,
            },
          }),
          prisma.dailyReport.count({
            where: {
              ...allRoomFilter,
              reportDate: { gte: fromDate, lte: toDate },
            },
          }),
        ])

        const days = Math.max(
          1,
          Math.ceil(
            (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
          ) + 1
        )
        const expectedSubmissions = totalRooms * days
        const submissionRate =
          expectedSubmissions > 0
            ? Math.round((submissionCounts / expectedSubmissions) * 100)
            : 0

        const occupiedNights = occupancyReports.filter(
          (r) => r.occupancyStatus === 'OCCUPIED'
        ).length
        const totalNights = totalRooms * days
        const occupancyRate =
          totalNights > 0
            ? Math.round((occupiedNights / totalNights) * 100)
            : 0

        const openIssues = maintenanceIssues.filter(
          (i) => i.status === 'REPORTED' || i.status === 'IN_PROGRESS'
        ).length
        const resolvedIssues = maintenanceIssues.filter(
          (i) => i.status === 'RESOLVED' || i.status === 'CLOSED'
        ).length
        const criticalOpen = maintenanceIssues.filter(
          (i) =>
            i.priority === 'CRITICAL' &&
            (i.status === 'REPORTED' || i.status === 'IN_PROGRESS')
        ).length

        const resolvedWithTime = maintenanceIssues.filter(
          (i) => i.resolvedAt
        )
        const avgResolutionHours =
          resolvedWithTime.length > 0
            ? Math.round(
                resolvedWithTime.reduce((sum, i) => {
                  const hours =
                    (i.resolvedAt!.getTime() - i.createdAt.getTime()) /
                    (1000 * 60 * 60)
                  return sum + hours
                }, 0) / resolvedWithTime.length
              )
            : 0

        const totalIncome = incomeRecords.reduce(
          (sum, r) => sum + r.amount,
          0
        )

        const byPropertyMap = new Map<
          string,
          { nights: number; income: number; issues: number }
        >()
        for (const r of occupancyReports) {
          const entry = byPropertyMap.get(r.propertyId) ?? {
            nights: 0,
            income: 0,
            issues: 0,
          }
          entry.nights++
          byPropertyMap.set(r.propertyId, entry)
        }
        for (const r of incomeRecords) {
          const entry = byPropertyMap.get(r.propertyId) ?? {
            nights: 0,
            income: 0,
            issues: 0,
          }
          entry.income += r.amount
          byPropertyMap.set(r.propertyId, entry)
        }
        for (const i of maintenanceIssues) {
          const entry = byPropertyMap.get(i.propertyId) ?? {
            nights: 0,
            income: 0,
            issues: 0,
          }
          entry.issues++
          byPropertyMap.set(i.propertyId, entry)
        }

        const propertyNames = await prisma.property.findMany({
          where:
            propertyIds.length > 0
              ? { id: { in: propertyIds } }
              : {},
          select: { id: true, name: true },
        })
        const nameMap = new Map(propertyNames.map((p) => [p.id, p.name]))

        const occupancyByProperty = Array.from(byPropertyMap.entries()).map(
          ([id, v]) => ({
            property: nameMap.get(id) ?? id,
            nights: v.nights,
            income: v.income,
            issues: v.issues,
          })
        )

        const bySourceMap = new Map<string, number>()
        for (const r of incomeRecords) {
          bySourceMap.set(
            r.source,
            (bySourceMap.get(r.source) ?? 0) + r.amount
          )
        }
        const bySource = Array.from(bySourceMap.entries())
          .map(([source, amount]) => ({ source, amount }))
          .sort((a, b) => b.amount - a.amount)

        const roomIncomeMap = new Map<string, number>()
        for (const r of incomeRecords) {
          roomIncomeMap.set(
            r.roomId,
            (roomIncomeMap.get(r.roomId) ?? 0) + r.amount
          )
        }
        let topRoomId = ''
        let topRoomAmount = 0
        for (const [rid, amt] of Array.from(roomIncomeMap.entries())) {
          if (amt > topRoomAmount) {
            topRoomId = rid
            topRoomAmount = amt
          }
        }
        let topRoom = null
        if (topRoomId) {
          const room = await prisma.room.findUnique({
            where: { id: topRoomId },
            select: { name: true },
          })
          topRoom = room
            ? { name: room.name, amount: topRoomAmount }
            : null
        }

        const highlights: string[] = []
        const lowlights: string[] = []

        if (occupancyByProperty.length > 0) {
          const best = occupancyByProperty.reduce((a, b) =>
            a.nights > b.nights ? a : b
          )
          if (best.nights > 0) {
            highlights.push(
              `${best.property} had the highest occupancy with ${best.nights} occupied nights`
            )
          }
        }

        if (bySource.length > 0) {
          highlights.push(
            `Top income source: ${bySource[0].source} (${formatCurrency(bySource[0].amount)})`
          )
        }

        if (avgResolutionHours > 0) {
          highlights.push(
            `Average maintenance resolution time: ${avgResolutionHours} hours`
          )
        }

        if (occupancyByProperty.length > 0) {
          const worst = occupancyByProperty.reduce((a, b) =>
            a.income < b.income ? a : b
          )
          if (worst.income < totalIncome / occupancyByProperty.length) {
            lowlights.push(
              `${worst.property} had below-average income (${formatCurrency(worst.income)})`
            )
          }
        }

        if (submissionRate < 80) {
          lowlights.push(
            `Overall submission rate is ${submissionRate}% — target is 95%`
          )
        }

        if (criticalOpen > 0) {
          lowlights.push(
            `${criticalOpen} critical maintenance issue(s) still unresolved`
          )
        }

        const oldestCritical = maintenanceIssues
          .filter(
            (i) =>
              i.priority === 'CRITICAL' &&
              (i.status === 'REPORTED' || i.status === 'IN_PROGRESS')
          )
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

        if (oldestCritical.length > 0) {
          const age = Math.round(
            (Date.now() - oldestCritical[0].createdAt.getTime()) /
              (1000 * 60 * 60)
          )
          lowlights.push(
            `Oldest unresolved critical issue is ${age} hours old`
          )
        }

        data = [
          {
            period: { from, to },
            occupancy: {
              rate: occupancyRate,
              totalNights,
              occupiedNights,
            },
            maintenance: {
              total: maintenanceIssues.length,
              open: openIssues,
              resolved: resolvedIssues,
              avgResolutionHours,
              criticalOpen,
            },
            income: {
              total: totalIncome,
              byProperty: occupancyByProperty,
              bySource,
              topRoom,
            },
            submissions: {
              expected: expectedSubmissions,
              submitted: submissionCounts,
              rate: submissionRate,
            },
            highlights,
            lowlights,
          },
        ]
        break
      }
    }

    return NextResponse.json({
      type,
      data,
      generatedAt: new Date().toISOString(),
      filters: { propertyIds, from, to },
    })
  } catch (error) {
    console.error('Report generation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

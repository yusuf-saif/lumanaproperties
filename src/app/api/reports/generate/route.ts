import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const generateSchema = z.object({
  type: z.enum(['occupancy', 'maintenance', 'income', 'guest', 'daily-ops']),
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

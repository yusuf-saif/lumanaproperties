import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const reportSchema = z.object({
  propertyId: z.string().min(1),
  roomId: z.string().min(1),
  reportDate: z.string().min(1),
  occupancyStatus: z.enum(['OCCUPIED', 'VACANT', 'CHECKOUT', 'NO_SHOW']),
  guestName: z.string().optional(),
  guestCount: z.number().int().min(1).default(1),
  notes: z.string().max(1000).optional(),
})

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role === 'VIEWER') {
    return NextResponse.json({ error: 'Viewers cannot submit data' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = reportSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { propertyId, roomId, reportDate, occupancyStatus, guestName, guestCount, notes } = parsed.data

  const hasAccess =
    session.user.role === 'SUPER_ADMIN' ||
    session.user.propertyIds.includes(propertyId)

  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const reportDateObj = new Date(reportDate)
  reportDateObj.setHours(0, 0, 0, 0)

  try {
    const existing = await prisma.dailyReport.findUnique({
      where: { roomId_reportDate: { roomId, reportDate: reportDateObj } },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A report already exists for this room on this date' },
        { status: 409 }
      )
    }

    const report = await prisma.dailyReport.create({
      data: {
        propertyId,
        roomId,
        reportDate: reportDateObj,
        submittedById: session.user.id,
        occupancyStatus,
        guestName: guestName || null,
        guestCount,
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, reportId: report.id })
  } catch (error) {
    console.error('Failed to create report:', error)
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    )
  }
}

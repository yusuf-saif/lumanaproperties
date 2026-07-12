import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const supplySchema = z.object({
  item: z.string().min(1),
  quantity: z.number().min(0),
  unit: z.string().min(1),
})

const occupancyEntrySchema = z.object({
  roomId: z.string().min(1),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'BLOCKED']),
  guestName: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
})

const reportSchema = z.object({
  propertyId: z.string().min(1),
  reportDate: z.string().min(1),
  occupancy: z.array(occupancyEntrySchema),
  supplies: z.array(supplySchema),
  notes: z.string().max(1000).optional(),
})

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = reportSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { propertyId, reportDate, occupancy, supplies, notes } = parsed.data

  const reportDateObj = new Date(reportDate)
  reportDateObj.setHours(0, 0, 0, 0)

  try {
    const existing = await prisma.dailyReport.findUnique({
      where: { propertyId_reportDate: { propertyId, reportDate: reportDateObj } },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A report already exists for this property on this date' },
        { status: 409 }
      )
    }

    const report = await prisma.dailyReport.create({
      data: {
        propertyId,
        reportDate: reportDateObj,
        submittedById: session.user.id,
        occupancy,
        supplies,
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

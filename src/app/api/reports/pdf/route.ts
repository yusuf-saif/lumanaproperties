import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const pdfSchema = z.object({
  propertyIds: z.array(z.string()).optional(),
  from: z.string().min(1),
  to: z.string().min(1),
})

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = pdfSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { propertyIds, from, to } = parsed.data
  const fromDate = new Date(from)
  const toDate = new Date(to)
  toDate.setHours(23, 59, 59, 999)

  const propertyFilter =
    propertyIds && propertyIds.length > 0 ? { propertyId: { in: propertyIds } } : {}

  try {
    const siteSettings = await prisma.siteSettings.findUnique({
      where: { id: 'default' },
    })

    const orgName = siteSettings?.orgName ?? 'Lumana Hotel Apartments'
    const orgTagline = siteSettings?.orgTagline ?? null
    const reportFooter = siteSettings?.reportFooter ?? null

    const properties = await prisma.property.findMany({
      where:
        session.user.role === 'SUPER_ADMIN'
          ? propertyIds && propertyIds.length > 0
            ? { id: { in: propertyIds } }
            : {}
          : { id: { in: session.user.propertyIds } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })

    const propertyData = []

    for (const property of properties) {
      const [rooms, reports, maintenanceIssues] = await Promise.all([
        prisma.room.findMany({
          where: {
            area: { propertyId: property.id },
            active: true,
          },
          select: { id: true, name: true, type: true },
          orderBy: { name: 'asc' },
        }),
        prisma.dailyReport.findMany({
          where: {
            propertyId: property.id,
            reportDate: { gte: fromDate, lte: toDate },
          },
          include: {
            room: { select: { name: true } },
          },
        }),
        prisma.maintenanceIssue.findMany({
          where: {
            propertyId: property.id,
            createdAt: { gte: fromDate, lte: toDate },
          },
          include: {
            room: { select: { name: true } },
          },
        }),
      ])

      const reportMap = new Map(
        reports.map((r) => [r.roomId, r])
      )

      const roomData = rooms.map((room) => {
        const report = reportMap.get(room.id)
        return {
          name: room.name,
          type: room.type.replace('_', ' '),
          status: report?.occupancyStatus ?? 'VACANT',
          guestName: report?.guestName ?? null,
          guestCount: report?.guestCount ?? 0,
          notes: report?.notes ?? null,
        }
      })

      const maintenanceData = maintenanceIssues.map((issue) => ({
        title: issue.title,
        priority: issue.priority,
        status: issue.status,
        category: issue.category,
        room: issue.room.name,
      }))

      propertyData.push({
        propertyName: property.name,
        rooms: roomData,
        maintenance: maintenanceData,
      })
    }

    return NextResponse.json({
      siteSettings: { orgName, orgTagline, reportFooter },
      properties: propertyData,
      reportDate: from,
    })
  } catch (error) {
    console.error('PDF generation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF data' },
      { status: 500 }
    )
  }
}

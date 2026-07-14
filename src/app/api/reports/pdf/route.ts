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

  let siteSettings = null
  try {
    siteSettings = await prisma.siteSettings.findUnique({
      where: { id: 'default' },
    })
  } catch (e) {
    console.error('[PDF] SiteSettings fetch failed:', e)
  }

  const orgName = siteSettings?.orgName ?? 'Lumana Hotel Apartments'
  const orgTagline = siteSettings?.orgTagline ?? null
  const reportFooter = siteSettings?.reportFooter ??
    'This report is confidential and intended for authorised personnel only.'

  let properties: Array<{ id: string; name: string }> = []
  try {
    properties = await prisma.property.findMany({
      where:
        session.user.role === 'SUPER_ADMIN'
          ? propertyIds && propertyIds.length > 0
            ? { id: { in: propertyIds } }
            : {}
          : { id: { in: session.user.propertyIds } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
  } catch (e) {
    console.error('[PDF] Properties query failed:', e)
  }

  const propertyData: Array<{
    propertyName: string
    rooms: Array<{
      name: string
      type: string
      status: string
      guestName: string | null
      guestCount: number
      notes: string | null
    }>
    maintenance: Array<{
      title: string
      priority: string
      status: string
      category: string
      room: string
    }>
  }> = []

  for (const property of properties) {
    let rooms: Array<{ id: string; name: string; type: string }> = []
    let reports: Array<{ roomId: string; occupancyStatus: string; guestName: string | null; guestCount: number; notes: string | null }> = []
    let maintenanceIssues: Array<{ title: string; priority: string; status: string; category: string; room: { name: string } }> = []

    try {
      const [r, rep, mi] = await Promise.all([
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

      rooms = r
      reports = rep.map((rpt) => ({
        roomId: rpt.roomId,
        occupancyStatus: rpt.occupancyStatus,
        guestName: rpt.guestName,
        guestCount: rpt.guestCount,
        notes: rpt.notes,
      }))
      maintenanceIssues = mi
    } catch (e) {
      console.error(`[PDF] Data query failed for property ${property.id}:`, e)
    }

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

    const maintenanceData = (maintenanceIssues ?? []).map((issue) => ({
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
}

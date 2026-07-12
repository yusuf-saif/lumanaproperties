import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const maintenanceSchema = z.object({
  propertyId: z.string().min(1),
  roomId: z.string().min(1),
  title: z.string().min(1).max(100),
  priority: z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']),
  description: z.string().min(1).max(2000),
  notes: z.string().optional(),
})

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = maintenanceSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { propertyId, roomId, title, priority, description, notes } = parsed.data

  try {
    const issue = await prisma.maintenanceIssue.create({
      data: {
        title,
        description,
        priority,
        propertyId,
        roomId,
        raisedById: session.user.id,
      },
    })

    return NextResponse.json({ success: true, issueId: issue.id })
  } catch (error) {
    console.error('Failed to create maintenance issue:', error)
    return NextResponse.json(
      { error: 'Failed to create maintenance issue' },
      { status: 500 }
    )
  }
}

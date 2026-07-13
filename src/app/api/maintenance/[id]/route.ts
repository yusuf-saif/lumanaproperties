import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const patchSchema = z.object({
  status: z.enum(['REPORTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  resolutionNotes: z.string().optional(),
  assignedToId: z.string().nullable().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { status, resolutionNotes, assignedToId } = parsed.data

  const existing = await prisma.maintenanceIssue.findUnique({
    where: { id: params.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
  }

  if (session.user.role === 'STAFF') {
    return NextResponse.json(
      { error: 'Staff members cannot update issues' },
      { status: 403 }
    )
  }

  const updateData: Record<string, unknown> = {}

  if (assignedToId !== undefined) {
    updateData.assignedToId = assignedToId
  }

  if (status) {
    updateData.status = status
    if (status === 'RESOLVED' || status === 'CLOSED') {
      updateData.resolvedById = session.user.id
      updateData.resolvedAt = new Date()
      if (resolutionNotes) {
        updateData.resolutionNotes = resolutionNotes
      }
    }
  }

  try {
    const updated = await prisma.maintenanceIssue.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ success: true, issue: updated })
  } catch (error) {
    console.error('Failed to update maintenance issue:', error)
    return NextResponse.json(
      { error: 'Failed to update maintenance issue' },
      { status: 500 }
    )
  }
}

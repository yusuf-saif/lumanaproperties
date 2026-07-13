import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const patchSchema = z.object({
  status: z.enum(['REPORTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  resolutionNotes: z.string().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role === 'STAFF') {
    return NextResponse.json(
      { error: 'Staff members cannot update issue status' },
      { status: 403 }
    )
  }

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { status, resolutionNotes } = parsed.data

  try {
    const existing = await prisma.maintenanceIssue.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    const updateData: {
      status: 'REPORTED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
      resolvedById?: string
      resolvedAt?: Date
      resolutionNotes?: string
    } = { status }

    if (status === 'RESOLVED' || status === 'CLOSED') {
      updateData.resolvedById = session.user.id
      updateData.resolvedAt = new Date()
      updateData.resolutionNotes = resolutionNotes || undefined
    }

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

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const patchRoomSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(['STUDIO', 'ONE_BEDROOM', 'TWO_BEDROOM', 'THREE_BEDROOM', 'PENTHOUSE']).optional(),
  baseRate: z.number().min(0).optional(),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'BLOCKED']).optional(),
  active: z.boolean().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = patchRoomSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const existing = await prisma.room.findUnique({ where: { id: params.id } })

    if (!existing) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.status && parsed.data.status !== existing.status) {
      updateData.statusUpdatedAt = new Date()
    }

    const room = await prisma.room.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ success: true, room })
  } catch (error) {
    console.error('Failed to update room:', error)
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    )
  }
}

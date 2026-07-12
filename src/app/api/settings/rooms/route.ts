import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const createRoomSchema = z.object({
  areaId: z.string().min(1),
  name: z.string().min(1).max(100),
  type: z.enum(['STUDIO', 'ONE_BEDROOM', 'TWO_BEDROOM', 'THREE_BEDROOM', 'PENTHOUSE']),
  baseRate: z.number().min(0),
})

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createRoomSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const room = await prisma.room.create({
      data: {
        areaId: parsed.data.areaId,
        name: parsed.data.name,
        type: parsed.data.type,
        baseRate: parsed.data.baseRate,
      },
    })

    return NextResponse.json({ success: true, room })
  } catch (error) {
    console.error('Failed to create room:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
}

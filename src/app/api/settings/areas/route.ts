import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const createAreaSchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(1).max(100),
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
  const parsed = createAreaSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const area = await prisma.area.create({
      data: {
        propertyId: parsed.data.propertyId,
        name: parsed.data.name,
      },
    })

    return NextResponse.json({ success: true, area })
  } catch (error) {
    console.error('Failed to create area:', error)
    return NextResponse.json(
      { error: 'Failed to create area' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const createPropertySchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().min(1).max(200),
})

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const properties = await prisma.property.findMany({
      include: {
        areas: {
          include: {
            rooms: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ properties })
  } catch (error) {
    console.error('Failed to fetch properties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createPropertySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const property = await prisma.property.create({
      data: {
        name: parsed.data.name,
        address: parsed.data.address,
      },
    })

    return NextResponse.json({ success: true, property })
  } catch (error) {
    console.error('Failed to create property:', error)
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    )
  }
}

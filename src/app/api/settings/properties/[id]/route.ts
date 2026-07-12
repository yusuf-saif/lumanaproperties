import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const patchPropertySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.string().min(1).max(200).optional(),
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
  const parsed = patchPropertySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const existing = await prisma.property.findUnique({ where: { id: params.id } })

    if (!existing) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    const property = await prisma.property.update({
      where: { id: params.id },
      data: parsed.data,
    })

    return NextResponse.json({ success: true, property })
  } catch (error) {
    console.error('Failed to update property:', error)
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    )
  }
}

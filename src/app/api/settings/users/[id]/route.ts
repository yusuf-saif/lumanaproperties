import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const patchUserSchema = z.object({
  role: z.enum(['SUPER_ADMIN', 'PROPERTY_MANAGER', 'STAFF', 'VIEWER']).optional(),
  active: z.boolean().optional(),
  propertyIds: z.array(z.string()).optional(),
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
  const parsed = patchUserSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { role, active, propertyIds } = parsed.data

  try {
    const existing = await prisma.user.findUnique({ where: { id: params.id } })

    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updateData: { role?: 'SUPER_ADMIN' | 'PROPERTY_MANAGER' | 'STAFF' | 'VIEWER'; active?: boolean } = {}
    if (role !== undefined) updateData.role = role
    if (active !== undefined) updateData.active = active

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: params.id },
        data: updateData,
      })
    }

    if (propertyIds !== undefined) {
      await prisma.propertyUser.deleteMany({ where: { userId: params.id } })
      if (propertyIds.length > 0) {
        await prisma.propertyUser.createMany({
          data: propertyIds.map((propertyId) => ({
            userId: params.id,
            propertyId,
          })),
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

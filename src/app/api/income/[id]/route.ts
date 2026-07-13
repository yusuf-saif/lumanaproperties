import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const patchSchema = z.object({
  verified: z.boolean(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (
    session.user.role !== 'SUPER_ADMIN' &&
    session.user.role !== 'PROPERTY_MANAGER'
  ) {
    return NextResponse.json(
      { error: 'Only managers can verify income records' },
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

  try {
    const existing = await prisma.incomeRecord.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    if (
      session.user.role !== 'SUPER_ADMIN' &&
      !session.user.propertyIds.includes(existing.propertyId)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await prisma.incomeRecord.update({
      where: { id: params.id },
      data: { verified: parsed.data.verified },
      select: { id: true, verified: true },
    })

    return NextResponse.json({ success: true, record: updated })
  } catch (error) {
    console.error('Failed to update income record:', error)
    return NextResponse.json(
      { error: 'Failed to update income record' },
      { status: 500 }
    )
  }
}

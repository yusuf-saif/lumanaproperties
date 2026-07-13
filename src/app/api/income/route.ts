import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const incomeSchema = z.object({
  roomId: z.string().min(1),
  propertyId: z.string().min(1),
  amount: z.number().min(0),
  source: z.enum(['ACCOMMODATION', 'MINIBAR', 'LAUNDRY', 'SERVICE_CHARGE', 'OTHER']),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'POS', 'ONLINE']),
  recordDate: z.string().min(1),
  guestName: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = incomeSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { roomId, propertyId, amount, source, paymentMethod, recordDate, guestName, reference, notes } = parsed.data

  try {
    const record = await prisma.incomeRecord.create({
      data: {
        roomId,
        propertyId,
        recordedById: session.user.id,
        amount,
        source,
        paymentMethod,
        recordDate: new Date(recordDate),
        guestName: guestName || null,
        reference: reference || null,
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, recordId: record.id })
  } catch (error) {
    console.error('Failed to create income record:', error)
    return NextResponse.json(
      { error: 'Failed to create income record' },
      { status: 500 }
    )
  }
}

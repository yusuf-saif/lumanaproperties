import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const incomeSchema = z.object({
  roomId: z.string().min(1),
  amount: z.number().min(0),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'ONLINE']),
  bookingSource: z.enum(['DIRECT', 'AIRBNB', 'BOOKING_COM', 'OTHER']),
  checkInDate: z.string().min(1),
  checkOutDate: z.string().min(1),
  guestName: z.string().optional(),
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

  const { roomId, amount, paymentMethod, bookingSource, checkInDate, checkOutDate, guestName, notes } = parsed.data

  const checkIn = new Date(checkInDate)
  const checkOut = new Date(checkOutDate)

  if (checkOut <= checkIn) {
    return NextResponse.json(
      { error: 'Check-out date must be after check-in date' },
      { status: 400 }
    )
  }

  try {
    const record = await prisma.incomeRecord.create({
      data: {
        roomId,
        recordedById: session.user.id,
        amount,
        paymentMethod,
        bookingSource,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guestName: guestName || null,
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

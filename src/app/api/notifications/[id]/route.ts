import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.notification.findUnique({
    where: { id: params.id },
    select: { userId: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
  }

  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.notification.update({
    where: { id: params.id },
    data: { read: true },
  })

  return NextResponse.json({ success: true })
}

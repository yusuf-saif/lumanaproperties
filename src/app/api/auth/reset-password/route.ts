import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const resetSchema = z
  .object({
    token: z.string(),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = resetSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { token, password } = parsed.data

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  })

  if (!resetToken || resetToken.used) {
    return NextResponse.json(
      { error: 'Invalid or expired reset token' },
      { status: 400 }
    )
  }

  if (new Date() > resetToken.expiresAt) {
    return NextResponse.json(
      { error: 'Reset token has expired' },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { email: resetToken.email },
  })

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 400 }
    )
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    }),
  ])

  return NextResponse.json({ success: true })
}

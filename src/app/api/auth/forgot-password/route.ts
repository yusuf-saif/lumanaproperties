import { NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

const forgotSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = forgotSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const { email } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return NextResponse.json({ success: true })
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expiresAt,
    },
  })

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: 'Lumana Dashboard <onboarding@resend.dev>',
        to: email,
        subject: 'Reset your Lumana Dashboard password',
        html: `
          <p>Hello,</p>
          <p>You requested a password reset for your Lumana Dashboard account.</p>
          <p>Click the link below to set a new password. This link expires in 1 hour.</p>
          <p><a href="${resetUrl}">Reset your password</a></p>
          <p>If you did not request this, you can safely ignore this email.</p>
          <p>— Lumana Team</p>
        `,
      })
    } catch (err) {
      console.error('Failed to send reset email:', err)
    }
  } else {
    console.log('Password reset URL (no RESEND_API_KEY):', resetUrl)
  }

  return NextResponse.json({ success: true })
}

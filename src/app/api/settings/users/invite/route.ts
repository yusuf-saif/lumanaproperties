import { NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['SUPER_ADMIN', 'PROPERTY_MANAGER', 'STAFF', 'VIEWER']),
  propertyIds: z.array(z.string()),
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
  const parsed = inviteSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { email, role, propertyIds } = parsed.data

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const token = await prisma.inviteToken.create({
      data: {
        email,
        role,
        token: crypto.randomBytes(32).toString('hex'),
        expiresAt,
      },
    })

    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'LUMANA <noreply@lumana.app>',
          to: email,
          subject: 'You\'ve been invited to LUMANA Operations',
          html: `<p>You've been invited to join LUMANA Operations as a <strong>${role.replace('_', ' ')}</strong>.</p>
                 <p>Click the link below to set up your account:</p>
                 <p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invite/${token.token}">Accept Invitation</a></p>
                 <p>This link expires in 7 days.</p>`,
        })
      } catch (emailError) {
        console.error('Failed to send invite email:', emailError)
      }
    } else {
      console.log(`[Invite] ${email} — role: ${role}, token: ${token.token}`)
    }

    return NextResponse.json({ success: true, tokenId: token.id })
  } catch (error) {
    console.error('Failed to create invite:', error)
    return NextResponse.json(
      { error: 'Failed to create invite' },
      { status: 500 }
    )
  }
}

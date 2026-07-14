import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'default' },
  })

  if (!settings) {
    const created = await prisma.siteSettings.create({
      data: { id: 'default' },
    })
    return NextResponse.json(created)
  }

  return NextResponse.json(settings)
}

export async function PATCH(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()

  const settings = await prisma.siteSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      orgName: body.orgName ?? 'Lumana Hotel Apartments',
      orgTagline: body.orgTagline ?? null,
      reportFooter: body.reportFooter ?? null,
    },
    update: {
      ...(body.orgName !== undefined && { orgName: body.orgName }),
      ...(body.orgTagline !== undefined && { orgTagline: body.orgTagline }),
      ...(body.reportFooter !== undefined && { reportFooter: body.reportFooter }),
    },
  })

  return NextResponse.json(settings)
}

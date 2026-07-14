import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/layout/Topbar'
import SubmissionTabs from '@/components/ui/SubmissionTabs'
import DailyReportForm from '@/components/forms/DailyReportForm'

export const dynamic = 'force-dynamic'

export default async function SubmitReportPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  let properties: {
    id: string
    name: string
    rooms: { id: string; name: string; type: string; status: string }[]
  }[] = []

  try {
    if (session.user.role === 'SUPER_ADMIN') {
      const allProperties = await prisma.property.findMany({
        where: { active: true },
        include: {
          areas: {
            include: {
              rooms: {
                where: { active: true },
                select: { id: true, name: true, type: true, status: true },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      })

      properties = allProperties.map((p) => ({
        id: p.id,
        name: p.name,
        rooms: p.areas.flatMap((a) => a.rooms),
      }))
    } else {
      const propertyUsers = await prisma.propertyUser.findMany({
        where: { userId: session.user.id },
        include: {
          property: {
            include: {
              areas: {
                include: {
                  rooms: {
                    where: { active: true },
                    select: { id: true, name: true, type: true, status: true },
                  },
                },
              },
            },
          },
        },
      })

      properties = propertyUsers.map((pu) => ({
        id: pu.property.id,
        name: pu.property.name,
        rooms: pu.property.areas.flatMap((a) => a.rooms),
      }))
    }
  } catch {
    // DB not connected — return empty properties
  }

  return (
    <div>
      <Topbar title="Submit Daily Report" />
      <div className="p-6">
        <SubmissionTabs />
        <div className="rounded-xl border border-border bg-card p-6">
          {properties.length === 0 ? (
            <p className="text-sm text-text-sub">
              No properties assigned to your account. Contact an administrator.
            </p>
          ) : (
            <DailyReportForm properties={properties} />
          )}
        </div>
      </div>
    </div>
  )
}

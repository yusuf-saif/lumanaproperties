import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/layout/Topbar'
import MaintenanceForm from '@/components/forms/MaintenanceForm'

export const dynamic = 'force-dynamic'

export default async function SubmitMaintenancePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  let properties: {
    id: string
    name: string
    rooms: { id: string; name: string }[]
  }[] = []

  try {
    const propertyUsers = await prisma.propertyUser.findMany({
      where: { userId: session.user.id },
      include: {
        property: {
          include: {
            areas: {
              include: {
                rooms: {
                  where: { active: true },
                  select: { id: true, name: true },
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
  } catch {
    // DB not connected
  }

  return (
    <div>
      <Topbar title="Report Maintenance Issue" />
      <div className="p-6">
        <div className="rounded-xl border border-border bg-card p-6">
          {properties.length === 0 ? (
            <p className="text-sm text-text-sub">
              No properties assigned to your account. Contact an administrator.
            </p>
          ) : (
            <MaintenanceForm properties={properties} />
          )}
        </div>
      </div>
    </div>
  )
}

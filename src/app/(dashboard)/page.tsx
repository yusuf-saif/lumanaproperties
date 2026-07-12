import { prisma } from '@/lib/prisma'
import Topbar from '@/components/layout/Topbar'
import StatCard from '@/components/ui/StatCard'
import { LayoutDashboard, Wrench, DollarSign, FileWarning } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  if (!process.env.DATABASE_URL) {
    return {
      totalRooms: 0,
      availableRooms: 0,
      openMaintenance: 0,
      urgentMaintenance: 0,
      todayIncome: 0,
      missingReports: 0,
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalRooms,
    availableRooms,
    openMaintenance,
    urgentMaintenance,
    todayIncomeAgg,
    totalProperties,
    reportedToday,
  ] = await Promise.all([
    prisma.room.count({ where: { active: true } }),
    prisma.room.count({ where: { active: true, status: 'AVAILABLE' } }),
    prisma.maintenanceIssue.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.maintenanceIssue.count({ where: { status: 'OPEN', priority: 'URGENT' } }),
    prisma.incomeRecord.aggregate({
      _sum: { amount: true },
      where: { createdAt: { gte: today } },
    }),
    prisma.property.count({ where: { active: true } }),
    prisma.dailyReport.count({
      where: { reportDate: { gte: today } },
    }),
  ])

  return {
    totalRooms,
    availableRooms,
    openMaintenance,
    urgentMaintenance,
    todayIncome: todayIncomeAgg._sum.amount ?? 0,
    missingReports: totalProperties - reportedToday,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div>
      <Topbar title="Dashboard" />
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Available Rooms"
            value={data.availableRooms}
            subtitle={`${data.totalRooms} total`}
            icon={<LayoutDashboard size={24} />}
            color="success"
          />
          <StatCard
            title="Open Maintenance"
            value={data.openMaintenance}
            subtitle={`${data.urgentMaintenance} urgent`}
            icon={<Wrench size={24} />}
            color="warning"
          />
          <StatCard
            title="Today's Income"
            value={formatCurrency(data.todayIncome)}
            icon={<DollarSign size={24} />}
            color="primary"
          />
          <StatCard
            title="Missing Reports"
            value={data.missingReports}
            subtitle="properties without today's report"
            icon={<FileWarning size={24} />}
            color="danger"
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-text-main">
              Maintenance Summary
            </h2>
            <p className="mt-4 text-sm text-text-sub">
              Maintenance breakdown by priority will appear here.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-text-main">
              Recent Reports
            </h2>
            <p className="mt-4 text-sm text-text-sub">
              Recent daily reports will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

import { prisma } from '@/lib/prisma'
import Topbar from '@/components/layout/Topbar'
import StatCard from '@/components/ui/StatCard'
import { Card } from '@/components/ui/Card'
import { LayoutDashboard, Wrench, DollarSign, FileWarning } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import OccupancyChart from '@/components/charts/OccupancyChart'
import IncomeChart from '@/components/charts/IncomeChart'
import MaintenanceStatusChart from '@/components/charts/MaintenanceStatusChart'

export const dynamic = 'force-dynamic'

function getDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

async function getDashboardData() {
  if (!process.env.DATABASE_URL) {
    return {
      totalRooms: 0,
      availableRooms: 0,
      openMaintenance: 0,
      criticalMaintenance: 0,
      todayIncome: 0,
      missingReports: 0,
      occupancyData: [],
      incomeData: [],
      maintenanceByStatus: [],
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalRooms,
    availableRooms,
    openMaintenance,
    criticalMaintenance,
    todayIncomeAgg,
    totalProperties,
    reportedToday,
  ] = await Promise.all([
    prisma.room.count({ where: { active: true } }),
    prisma.room.count({ where: { active: true, status: 'AVAILABLE' } }),
    prisma.maintenanceIssue.count({ where: { status: { in: ['REPORTED', 'IN_PROGRESS'] } } }),
    prisma.maintenanceIssue.count({ where: { status: 'REPORTED', priority: 'CRITICAL' } }),
    prisma.incomeRecord.aggregate({
      _sum: { amount: true },
      where: { recordDate: { gte: today } },
    }),
    prisma.property.count({ where: { active: true } }),
    prisma.dailyReport.count({
      where: { reportDate: { gte: today } },
    }),
  ])

  const occupancyData = await getOccupancyData(today, totalRooms)
  const incomeData = await getIncomeData(today)
  const maintenanceByStatus = await getMaintenanceByStatus()

  return {
    totalRooms,
    availableRooms,
    openMaintenance,
    criticalMaintenance,
    todayIncome: todayIncomeAgg._sum.amount ?? 0,
    missingReports: totalProperties - reportedToday,
    occupancyData,
    incomeData,
    maintenanceByStatus,
  }
}

async function getOccupancyData(today: Date, totalRooms: number) {
  try {
    const days: { date: Date; label: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      days.push({ date: d, label: getDayLabel(d) })
    }

    const results = await Promise.all(
      days.map(async ({ date, label }) => {
        const dayStart = new Date(date)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(date)
        dayEnd.setHours(23, 59, 59, 999)

        const occupiedCount = await prisma.dailyReport.count({
          where: {
            reportDate: { gte: dayStart, lte: dayEnd },
            occupancyStatus: 'OCCUPIED',
          },
        })

        const rate = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0
        return { date: label, rate }
      })
    )

    return results
  } catch {
    return []
  }
}

async function getIncomeData(today: Date) {
  try {
    const days: { date: Date; label: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      days.push({ date: d, label: getDayLabel(d) })
    }

    const results = await Promise.all(
      days.map(async ({ date, label }) => {
        const dayStart = new Date(date)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(date)
        dayEnd.setHours(23, 59, 59, 999)

        const agg = await prisma.incomeRecord.aggregate({
          _sum: { amount: true },
          where: {
            recordDate: { gte: dayStart, lte: dayEnd },
          },
        })

        return { date: label, amount: agg._sum.amount ?? 0 }
      })
    )

    return results
  } catch {
    return []
  }
}

async function getMaintenanceByStatus() {
  try {
    const statuses = ['REPORTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const
    const results = await Promise.all(
      statuses.map(async (status) => {
        const count = await prisma.maintenanceIssue.count({ where: { status } })
        return { status, count }
      })
    )
    return results
  } catch {
    return []
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
            subtitle={`${data.criticalMaintenance} critical`}
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
          <Card>
            <OccupancyChart data={data.occupancyData} />
          </Card>
          <Card>
            <IncomeChart data={data.incomeData} />
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <MaintenanceStatusChart data={data.maintenanceByStatus} />
          </Card>
        </div>
      </div>
    </div>
  )
}

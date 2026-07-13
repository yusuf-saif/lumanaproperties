'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

interface MaintenanceStatusChartProps {
  data: { status: string; count: number }[]
}

const STATUS_COLORS: Record<string, string> = {
  REPORTED: '#64748B',
  IN_PROGRESS: '#D97706',
  RESOLVED: '#16A34A',
  CLOSED: '#9CA3AF',
}

const STATUS_LABELS: Record<string, string> = {
  REPORTED: 'Reported',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
}

export default function MaintenanceStatusChart({ data }: MaintenanceStatusChartProps) {
  const chartData = data.filter((d) => d.count > 0)

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-text-main">Maintenance by Status</h3>
      {chartData.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-sub">No maintenance issues</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={50}
              paddingAngle={2}
              labelLine={false}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              label={(props: any) =>
                `${STATUS_LABELS[String(props.status)] ?? String(props.status)}: ${String(props.count)}`
              }
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={STATUS_COLORS[entry.status] ?? '#9CA3AF'}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [Number(value), STATUS_LABELS[String(name)] ?? String(name)]}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '12px',
              }}
            />
            <Legend
              formatter={(value) => STATUS_LABELS[value] ?? value}
              iconType="circle"
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

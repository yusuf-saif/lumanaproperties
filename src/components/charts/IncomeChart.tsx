'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

interface IncomeChartProps {
  data: { date: string; amount: number }[]
}

function formatNGN(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toString()
}

function formatNGNFull(value: number): string {
  return `₦${value.toLocaleString()}`
}

export default function IncomeChart({ data }: IncomeChartProps) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-text-main">Revenue Trend (7 Days)</h3>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-sub">No data available</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatNGN}
            />
            <Tooltip
              formatter={(value) => [formatNGNFull(Number(value)), 'Revenue']}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="amount" fill="#2563EB" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

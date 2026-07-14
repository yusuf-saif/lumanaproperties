'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
  AreaChart, Area,
  ReferenceLine,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { TrendingUp, Home, Wrench, ClipboardCheck, Loader2, Download } from 'lucide-react'
import { formatRoomType } from '@/lib/utils/format'
import { format, subDays } from 'date-fns'

interface AnalyticsDashboardProps {
  properties: Array<{ id: string; name: string }>
}

interface AnalyticsData {
  occupancyTrend: Array<{
    date: string
    occupied: number
    vacant: number
    checkout: number
    noShow: number
    total: number
    rate: number
  }>
  occupancyDistribution: {
    OCCUPIED: number
    VACANT: number
    CHECKOUT: number
    NO_SHOW: number
  }
  roomTypePerformance: Array<{
    type: string
    occupied: number
    vacant: number
    rate: number
  }>
  maintenanceByStatus: {
    REPORTED: number
    IN_PROGRESS: number
    RESOLVED: number
    CLOSED: number
  }
  maintenanceByPriority: {
    CRITICAL: number
    HIGH: number
    MEDIUM: number
    LOW: number
  }
  maintenanceByCategory: Array<{
    category: string
    count: number
  }>
  avgResolutionHours: number
  complianceTrend: Array<{
    date: string
    expected: number
    submitted: number
    rate: number
  }>
}

const COLORS = {
  primary: '#2563EB',
  success: '#16A34A',
  purple: '#8B5CF6',
  danger: '#DC2626',
  warning: '#D97706',
  textSub: '#64748B',
  border: '#E2E8F0',
}

const OCCUPANCY_COLORS = [COLORS.primary, COLORS.success, COLORS.purple, COLORS.danger]
const PRIORITY_COLORS = [COLORS.danger, COLORS.warning, COLORS.primary, COLORS.textSub]

function last7Days(): string {
  return format(subDays(new Date(), 7), 'yyyy-MM-dd')
}

function today(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function AnalyticsDashboard({ properties }: AnalyticsDashboardProps) {
  const [from, setFrom] = useState(last7Days)
  const [to, setTo] = useState(today)
  const [selectedProperty, setSelectedProperty] = useState('')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [from, to, selectedProperty])

  async function fetchData() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ from, to })
      if (selectedProperty) params.set('propertyId', selectedProperty)

      const res = await fetch(`/api/analytics?${params}`)
      const json = await res.json()
      setData(json)
    } catch {
      // error state
    } finally {
      setLoading(false)
    }
  }

  async function downloadPDF() {
    setPdfLoading(true)
    try {
      const res = await fetch('/api/reports/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyIds: selectedProperty ? [selectedProperty] : undefined,
          from,
          to,
        }),
      })

      const pdfData = await res.json()

      if (!res.ok) return

      const { pdf } = await import('@react-pdf/renderer')
      const { DailyOpsPDF } = await import('@/components/reports/DailyOpsPDF')

      const blob = await pdf(
        <DailyOpsPDF
          siteSettings={pdfData.siteSettings}
          properties={pdfData.properties}
          reportDate={pdfData.reportDate}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-report-${from}-to-${to}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silently fail
    } finally {
      setPdfLoading(false)
    }
  }

  const occRate = data
    ? data.occupancyTrend.length > 0
      ? Math.round(data.occupancyTrend.reduce((sum, d) => sum + d.rate, 0) / data.occupancyTrend.length)
      : 0
    : 0

  const totalIssues = data
    ? data.maintenanceByStatus.REPORTED + data.maintenanceByStatus.IN_PROGRESS +
      data.maintenanceByStatus.RESOLVED + data.maintenanceByStatus.CLOSED
    : 0

  const openIssues = data
    ? data.maintenanceByStatus.REPORTED + data.maintenanceByStatus.IN_PROGRESS
    : 0

  const complianceRate = data
    ? data.complianceTrend.length > 0
      ? Math.round(data.complianceTrend.reduce((sum, d) => sum + d.rate, 0) / data.complianceTrend.length)
      : 0
    : 0

  const pieData = data
    ? [
        { name: 'Occupied', value: data.occupancyDistribution.OCCUPIED },
        { name: 'Vacant', value: data.occupancyDistribution.VACANT },
        { name: 'Checkout', value: data.occupancyDistribution.CHECKOUT },
        { name: 'No Show', value: data.occupancyDistribution.NO_SHOW },
      ].filter((d) => d.value > 0)
    : []

  const priorityData = data
    ? [
        { name: 'Critical', value: data.maintenanceByPriority.CRITICAL },
        { name: 'High', value: data.maintenanceByPriority.HIGH },
        { name: 'Medium', value: data.maintenanceByPriority.MEDIUM },
        { name: 'Low', value: data.maintenanceByPriority.LOW },
      ].filter((d) => d.value > 0)
    : []

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-sub">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-sub">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-sub">Property</label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:ml-auto">
            <Button onClick={downloadPDF} disabled={pdfLoading} variant="ghost">
              {pdfLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download PDF
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="space-y-3">
                  <div className="h-4 w-24 bg-border rounded" />
                  <div className="h-8 w-16 bg-border rounded" />
                </div>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 w-32 bg-border rounded mb-4" />
                <div className="h-64 bg-border rounded" />
              </Card>
            ))}
          </div>
        </div>
      ) : !data ? (
        <Card className="p-12 text-center">
          <p className="text-text-sub">No data available for the selected period.</p>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Avg Occupancy"
              value={`${occRate}%`}
              subtitle="During period"
              icon={<TrendingUp className="h-5 w-5" />}
              color="primary"
            />
            <StatCard
              title="Total Rooms"
              value={properties.length > 0 ? properties.length : '—'}
              subtitle="Active properties"
              icon={<Home className="h-5 w-5" />}
              color="success"
            />
            <StatCard
              title="Open Issues"
              value={openIssues}
              subtitle={`${totalIssues} total`}
              icon={<Wrench className="h-5 w-5" />}
              color={openIssues > 0 ? 'warning' : 'success'}
            />
            <StatCard
              title="Submission Rate"
              value={`${complianceRate}%`}
              subtitle="Report compliance"
              icon={<ClipboardCheck className="h-5 w-5" />}
              color={complianceRate >= 80 ? 'success' : 'danger'}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 1. Occupancy Trend - Line Chart */}
            <Card className="p-6">
              <h3 className="font-medium text-text-main mb-4">Occupancy Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.occupancyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: COLORS.textSub }}
                    tickFormatter={(val) => format(new Date(val), 'MMM d')}
                  />
                  <YAxis tick={{ fontSize: 12, fill: COLORS.textSub }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: `1px solid ${COLORS.border}` }}
                    labelFormatter={(val) => format(new Date(val), 'MMM d, yyyy')}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="occupied" stroke={COLORS.primary} strokeWidth={2} name="Occupied" dot={false} />
                  <Line type="monotone" dataKey="vacant" stroke={COLORS.success} strokeWidth={2} name="Vacant" dot={false} />
                  <Line type="monotone" dataKey="checkout" stroke={COLORS.purple} strokeWidth={2} name="Checkout" dot={false} />
                  <Line type="monotone" dataKey="noShow" stroke={COLORS.danger} strokeWidth={2} name="No Show" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* 2. Occupancy Distribution - Pie Chart */}
            <Card className="p-6">
              <h3 className="font-medium text-text-main mb-4">Occupancy Distribution</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={OCCUPANCY_COLORS[index % OCCUPANCY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-text-sub text-sm">
                  No occupancy data
                </div>
              )}
            </Card>

            {/* 3. Room Type Performance - Horizontal Bar Chart */}
            <Card className="p-6">
              <h3 className="font-medium text-text-main mb-4">Room Type Performance</h3>
              {data.roomTypePerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.roomTypePerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: COLORS.textSub }} />
                    <YAxis
                      type="category"
                      dataKey="type"
                      tick={{ fontSize: 12, fill: COLORS.textSub }}
                      width={100}
                      tickFormatter={formatRoomType}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: `1px solid ${COLORS.border}` }}
                    />
                    <Legend />
                    <Bar dataKey="occupied" fill={COLORS.primary} name="Occupied" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="vacant" fill={COLORS.success} name="Vacant" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-text-sub text-sm">
                  No room data
                </div>
              )}
            </Card>

            {/* 4. Maintenance by Status - Bar Chart */}
            <Card className="p-6">
              <h3 className="font-medium text-text-main mb-4">Maintenance by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Reported', value: data.maintenanceByStatus.REPORTED, fill: COLORS.primary },
                  { name: 'In Progress', value: data.maintenanceByStatus.IN_PROGRESS, fill: COLORS.warning },
                  { name: 'Resolved', value: data.maintenanceByStatus.RESOLVED, fill: COLORS.success },
                  { name: 'Closed', value: data.maintenanceByStatus.CLOSED, fill: COLORS.textSub },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: COLORS.textSub }} />
                  <YAxis tick={{ fontSize: 12, fill: COLORS.textSub }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${COLORS.border}` }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {[COLORS.primary, COLORS.warning, COLORS.success, COLORS.textSub].map((color, index) => (
                      <Cell key={index} fill={color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* 5. Issues by Priority - Pie Chart */}
            <Card className="p-6">
              <h3 className="font-medium text-text-main mb-4">Issues by Priority</h3>
              {priorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {priorityData.map((_, index) => (
                        <Cell key={index} fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-text-sub text-sm">
                  No issues data
                </div>
              )}
            </Card>

            {/* 6. Issues by Category - Horizontal Bar Chart */}
            <Card className="p-6">
              <h3 className="font-medium text-text-main mb-4">Issues by Category</h3>
              {data.maintenanceByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.maintenanceByCategory} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: COLORS.textSub }} />
                    <YAxis
                      type="category"
                      dataKey="category"
                      tick={{ fontSize: 12, fill: COLORS.textSub }}
                      width={100}
                    />
                    <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${COLORS.border}` }} />
                    <Bar dataKey="count" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-text-sub text-sm">
                  No category data
                </div>
              )}
            </Card>
          </div>

          {/* 7. Submission Compliance - Full Width Area Chart */}
          <Card className="p-6">
            <h3 className="font-medium text-text-main mb-4">Submission Compliance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.complianceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: COLORS.textSub }}
                  tickFormatter={(val) => format(new Date(val), 'MMM d')}
                />
                <YAxis tick={{ fontSize: 12, fill: COLORS.textSub }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: `1px solid ${COLORS.border}` }}
                  labelFormatter={(val) => format(new Date(val), 'MMM d, yyyy')}
                />
                <ReferenceLine y={100} stroke={COLORS.success} strokeDasharray="3 3" label={{ value: '100%', fill: COLORS.success, fontSize: 12 }} />
                <Area type="monotone" dataKey="expected" stroke={COLORS.textSub} fill="transparent" strokeWidth={1} strokeDasharray="5 5" name="Expected" />
                <Area type="monotone" dataKey="submitted" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.1} strokeWidth={2} name="Submitted" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatEnum } from '@/lib/utils/format'
import { FileText, Download, Loader2, AlertCircle, CheckCircle, TrendingUp, Wrench, Users } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { DailyOpsPDF } from '@/components/reports/DailyOpsPDF'

interface ReportGeneratorProps {
  properties: Array<{ id: string; name: string }>
}

type ReportType = 'occupancy' | 'maintenance' | 'income' | 'guest' | 'daily-ops' | 'staff-performance' | 'consolidated-summary'

const REPORT_TYPES = [
  { value: 'occupancy' as ReportType, label: 'Occupancy Report', description: 'Room status breakdown by property' },
  { value: 'maintenance' as ReportType, label: 'Maintenance Issues', description: 'Issue tracking and resolution times' },
  { value: 'income' as ReportType, label: 'Income Report', description: 'Revenue by property, payment method, source' },
  { value: 'guest' as ReportType, label: 'Guest Report', description: 'Guest stays and booking sources' },
  { value: 'daily-ops' as ReportType, label: 'Daily Operations', description: 'Full daily report detail' },
  { value: 'staff-performance' as ReportType, label: 'Staff Performance', description: 'Submissions, timeliness, maintenance activity' },
  { value: 'consolidated-summary' as ReportType, label: 'Consolidated Summary', description: 'Executive overview with highlights' },
]

function last7Days(): string {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().split('T')[0]
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

type ResultData = Array<Record<string, unknown>> | Record<string, unknown> | null

interface SummaryData {
  period: { from: string; to: string }
  occupancy: { rate: number; totalNights: number; occupiedNights: number }
  maintenance: { total: number; open: number; resolved: number; avgResolutionHours: number; criticalOpen: number }
  income: { total: number; byProperty: Array<{ property: string; nights: number; income: number; issues: number }>; bySource: Array<{ source: string; amount: number }>; topRoom: { name: string; amount: number } | null }
  submissions: { expected: number; submitted: number; rate: number }
  highlights: string[]
  lowlights: string[]
}

export function ReportGenerator({ properties }: ReportGeneratorProps) {
  const [type, setType] = useState<ReportType>('occupancy')
  const [selectedProperties, setSelectedProperties] = useState<string[]>([])
  const [from, setFrom] = useState(last7Days())
  const [to, setTo] = useState(today())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ResultData>(null)
  const [resultType, setResultType] = useState<ReportType | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  function toggleProperty(id: string) {
    setSelectedProperties((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  async function generate() {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, propertyIds: selectedProperties, from, to }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to generate report')
        return
      }

      setResult(data.data)
      setResultType(type)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  function exportCSV() {
    if (!result || !resultType) return

    let headers: string[] = []
    let rows: string[][] = []

    if (resultType === 'consolidated-summary' && !Array.isArray(result)) {
      const s = result as unknown as SummaryData
      headers = ['Section', 'Metric', 'Value']
      rows = [
        ['Occupancy', 'Rate', `${s.occupancy.rate}%`],
        ['Occupancy', 'Total Nights', String(s.occupancy.totalNights)],
        ['Occupancy', 'Occupied Nights', String(s.occupancy.occupiedNights)],
        ['Maintenance', 'Total Issues', String(s.maintenance.total)],
        ['Maintenance', 'Open', String(s.maintenance.open)],
        ['Maintenance', 'Resolved', String(s.maintenance.resolved)],
        ['Maintenance', 'Avg Resolution (hrs)', String(s.maintenance.avgResolutionHours)],
        ['Maintenance', 'Critical Open', String(s.maintenance.criticalOpen)],
        ['Income', 'Total', formatCurrency(s.income.total)],
        ...s.income.byProperty.map((p) => ['Income by Property', p.property, formatCurrency(p.income)]),
        ...s.income.bySource.map((src) => ['Income by Source', src.source, formatCurrency(src.amount)]),
        ['Submissions', 'Expected', String(s.submissions.expected)],
        ['Submissions', 'Submitted', String(s.submissions.submitted)],
        ['Submissions', 'Rate', `${s.submissions.rate}%`],
        ...s.highlights.map((h) => ['Highlight', h, '']),
        ...s.lowlights.map((l) => ['Lowlight', l, '']),
      ]
    } else if (Array.isArray(result)) {
      switch (resultType) {
        case 'occupancy':
          headers = ['Date', 'Property', 'Room', 'Status', 'Guest', 'Guest Count']
          rows = result.map((r) => [
            String(r.date ?? '').split('T')[0],
            String(r.property ?? ''),
            String(r.room ?? ''),
            String(r.occupancyStatus ?? ''),
            String(r.guestName ?? ''),
            String(r.guestCount ?? 0),
          ])
          break
        case 'maintenance':
          headers = ['Title', 'Priority', 'Status', 'Category', 'Property', 'Room', 'Raised By', 'Assigned To', 'Resolved By', 'Created', 'Resolved', 'Hours']
          rows = result.map((r) => [
            String(r.title ?? ''),
            String(r.priority ?? ''),
            String(r.status ?? ''),
            String(r.category ?? ''),
            String(r.property ?? ''),
            String(r.room ?? ''),
            String(r.raisedBy ?? ''),
            String(r.assignedTo ?? ''),
            String(r.resolvedBy ?? ''),
            String(r.createdAt ?? ''),
            String(r.resolvedAt ?? ''),
            String(r.resolutionTime ?? ''),
          ])
          break
        case 'income':
          headers = ['Property', 'Room', 'Amount', 'Payment', 'Source', 'Guest', 'Date', 'Reference', 'Verified', 'Recorded By']
          rows = result.map((r) => [
            String(r.property ?? ''),
            String(r.room ?? ''),
            String(r.amount ?? 0),
            String(r.paymentMethod ?? ''),
            String(r.source ?? ''),
            String(r.guestName ?? ''),
            String(r.recordDate ?? ''),
            String(r.reference ?? ''),
            String(r.verified ?? false),
            String(r.recordedBy ?? ''),
          ])
          break
        case 'guest':
          headers = ['Guest', 'Property', 'Room', 'Date', 'Amount', 'Source']
          rows = result.map((r) => [
            String(r.guestName ?? ''),
            String(r.property ?? ''),
            String(r.room ?? ''),
            String(r.recordDate ?? ''),
            String(r.amount ?? 0),
            String(r.source ?? ''),
          ])
          break
        case 'daily-ops':
          headers = ['Date', 'Property', 'Room', 'Status', 'Guest', 'Guest Count', 'Submitted By', 'Notes']
          rows = result.map((r) => [
            String(r.date ?? '').split('T')[0],
            String(r.property ?? ''),
            String(r.room ?? ''),
            String(r.occupancyStatus ?? ''),
            String(r.guestName ?? ''),
            String(r.guestCount ?? 0),
            String(r.submittedBy ?? ''),
            String(r.notes ?? ''),
          ])
          break
        case 'staff-performance':
          headers = ['Staff Name', 'Email', 'Role', 'Submissions', 'On Time', 'Late', 'Maintenance Reported', 'Maintenance Resolved', 'Last Submission']
          rows = result.map((r) => [
            String(r.name ?? ''),
            String(r.email ?? ''),
            String(r.role ?? ''),
            String(r.submissionCount ?? 0),
            String(r.onTimeCount ?? 0),
            String(r.lateCount ?? 0),
            String(r.maintenanceReported ?? 0),
            String(r.maintenanceResolved ?? 0),
            r.lastSubmission ? String(r.lastSubmission).split('T')[0] : '—',
          ])
          break
      }
    }

    if (headers.length === 0) return

    const csv = [headers.join(','), ...rows.map((row) => row.map((c) => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${resultType}-report-${from}-to-${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadPDF() {
    setPdfLoading(true)
    try {
      const res = await fetch('/api/reports/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyIds: selectedProperties.length > 0 ? selectedProperties : undefined,
          from,
          to,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to generate PDF')
        return
      }

      const blob = await pdf(
        <DailyOpsPDF
          siteSettings={data.siteSettings}
          properties={data.properties}
          reportDate={data.reportDate}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `daily-ops-report-${from}-to-${to}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Failed to generate PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const isConsolidated = resultType === 'consolidated-summary' && result && !Array.isArray(result)
  const summary = isConsolidated ? (result as unknown as SummaryData) : null
  const isArrayResult = Array.isArray(result)

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-medium text-text-main mb-4">Report Configuration</h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-sub mb-2 block">Report Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {REPORT_TYPES.map((rt) => (
                <button
                  key={rt.value}
                  onClick={() => { setType(rt.value); setResult(null); setResultType(null) }}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    type === rt.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className="text-sm font-medium">{rt.label}</p>
                  <p className="text-xs text-text-sub">{rt.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-sub mb-2 block">Properties</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedProperties([])}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  selectedProperties.length === 0
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                All
              </button>
              {properties.map((p) => (
                <button
                  key={p.id}
                  onClick={() => toggleProperty(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    selectedProperties.includes(p.id)
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
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
          </div>

          <div className="flex gap-2">
            <Button onClick={generate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
            <Button onClick={downloadPDF} disabled={pdfLoading} variant="ghost">
              {pdfLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
            {result && (
              <Button variant="ghost" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </div>
      </Card>

      {error && (
        <Card className="border border-danger/20 p-4">
          <div className="flex items-center gap-2 text-danger">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      {summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2"><TrendingUp className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-2xl font-bold text-text-main">{summary.occupancy.rate}%</p>
                  <p className="text-xs text-text-sub">Occupancy Rate</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-success/10 p-2"><FileText className="h-5 w-5 text-success" /></div>
                <div>
                  <p className="text-2xl font-bold text-text-main">{formatCurrency(summary.income.total)}</p>
                  <p className="text-xs text-text-sub">Total Income</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning/10 p-2"><Wrench className="h-5 w-5 text-warning" /></div>
                <div>
                  <p className="text-2xl font-bold text-text-main">{summary.maintenance.open}</p>
                  <p className="text-xs text-text-sub">Open Issues</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-danger/10 p-2"><Users className="h-5 w-5 text-danger" /></div>
                <div>
                  <p className="text-2xl font-bold text-text-main">{summary.submissions.rate}%</p>
                  <p className="text-xs text-text-sub">Submission Rate</p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="p-4 border-b border-border">
              <h3 className="font-medium text-text-main">Occupancy by Property</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Property</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-sub">Occupied Nights</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-sub">Income</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-sub">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.income.byProperty.map((p, i) => (
                    <tr key={i} className="border-b border-border hover:bg-surface transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{p.property}</td>
                      <td className="px-4 py-3 text-sm text-right">{p.nights}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(p.income)}</td>
                      <td className="px-4 py-3 text-sm text-right">{p.issues}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <div className="p-4 border-b border-border">
                <h3 className="font-medium text-text-main">Maintenance Summary</h3>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-text-sub">Total Issues</span><span className="text-text-main">{summary.maintenance.total}</span></div>
                <div className="flex justify-between"><span className="text-text-sub">Open</span><span className="text-text-main">{summary.maintenance.open}</span></div>
                <div className="flex justify-between"><span className="text-text-sub">Resolved</span><span className="text-text-main">{summary.maintenance.resolved}</span></div>
                <div className="flex justify-between"><span className="text-text-sub">Avg Resolution</span><span className="text-text-main">{summary.maintenance.avgResolutionHours} hrs</span></div>
                <div className="flex justify-between"><span className="text-text-sub">Critical Open</span><span className="text-danger">{summary.maintenance.criticalOpen}</span></div>
              </div>
            </Card>

            <Card>
              <div className="p-4 border-b border-border">
                <h3 className="font-medium text-text-main">Income by Source</h3>
              </div>
              <div className="p-4 space-y-3 text-sm">
                {summary.income.bySource.map((src, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-text-sub">{formatEnum(src.source)}</span>
                    <span className="text-text-main font-medium">{formatCurrency(src.amount)}</span>
                  </div>
                ))}
                {summary.income.topRoom && (
                  <div className="border-t border-border pt-3 mt-3">
                    <p className="text-xs text-text-sub">Top Earning Room</p>
                    <p className="font-medium text-text-main">{summary.income.topRoom.name} — {formatCurrency(summary.income.topRoom.amount)}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {summary.highlights.length > 0 && (
            <Card>
              <div className="p-4 border-b border-border">
                <h3 className="font-medium text-success flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Highlights
                </h3>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  {summary.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-main">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-success" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {summary.lowlights.length > 0 && (
            <Card>
              <div className="p-4 border-b border-border">
                <h3 className="font-medium text-warning flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Lowlights
                </h3>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  {summary.lowlights.map((l, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-main">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-warning" />
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
        </div>
      )}

      {isArrayResult && resultType && result && !isConsolidated && (
        <Card>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-medium text-text-main capitalize">{resultType.replace('-', ' ')} Report</h3>
            <Badge variant="info">{(result as unknown[]).length} records</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface">
                  {resultType === 'occupancy' && (
                    <>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Property</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Room</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Guest</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-sub">Count</th>
                    </>
                  )}
                  {resultType === 'income' && (
                    <>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Property</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Room</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-sub">Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Payment</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Source</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Guest</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Date</th>
                    </>
                  )}
                  {resultType === 'maintenance' && (
                    <>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Title</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Priority</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Category</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Property</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Room</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Raised By</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-sub">Hours</th>
                    </>
                  )}
                  {resultType === 'guest' && (
                    <>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Guest</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Property</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Room</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Date</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-sub">Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Source</th>
                    </>
                  )}
                  {resultType === 'daily-ops' && (
                    <>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Property</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Room</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Guest</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Submitted By</th>
                    </>
                  )}
                  {resultType === 'staff-performance' && (
                    <>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Staff Name</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Email</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-sub">Submissions</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-sub">On Time</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-sub">Late</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-sub">Issues Raised</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-sub">Issues Resolved</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Last Submission</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {(result as Array<Record<string, unknown>>).slice(0, 50).map((row, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-surface transition-colors">
                    {resultType === 'occupancy' && (
                      <>
                        <td className="px-4 py-3 text-sm">{String(row.date ?? '').split('T')[0]}</td>
                        <td className="px-4 py-3 text-sm font-medium">{String(row.property ?? '')}</td>
                        <td className="px-4 py-3 text-sm">{String(row.room ?? '')}</td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant={String(row.occupancyStatus) === 'OCCUPIED' ? 'info' : String(row.occupancyStatus) === 'VACANT' ? 'success' : 'warning'}>
                            {formatEnum(String(row.occupancyStatus ?? ''))}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">{String(row.guestName ?? '—')}</td>
                        <td className="px-4 py-3 text-sm text-right">{String(row.guestCount ?? 0)}</td>
                      </>
                    )}
                    {resultType === 'income' && (
                      <>
                        <td className="px-4 py-3 text-sm font-medium">{String(row.property ?? '')}</td>
                        <td className="px-4 py-3 text-sm">{String(row.room ?? '')}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatCurrency(Number(row.amount ?? 0))}</td>
                        <td className="px-4 py-3 text-sm"><Badge variant="default">{formatEnum(String(row.paymentMethod ?? ''))}</Badge></td>
                        <td className="px-4 py-3 text-sm"><Badge variant="info">{formatEnum(String(row.source ?? ''))}</Badge></td>
                        <td className="px-4 py-3 text-sm">{String(row.guestName ?? '—')}</td>
                        <td className="px-4 py-3 text-sm">{String(row.recordDate ?? '').split('T')[0]}</td>
                      </>
                    )}
                    {resultType === 'maintenance' && (
                      <>
                        <td className="px-4 py-3 text-sm font-medium">{String(row.title ?? '')}</td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant={String(row.priority) === 'CRITICAL' ? 'danger' : String(row.priority) === 'HIGH' ? 'warning' : String(row.priority) === 'MEDIUM' ? 'info' : 'default'}>
                            {formatEnum(String(row.priority ?? ''))}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant={String(row.status) === 'RESOLVED' ? 'success' : String(row.status) === 'IN_PROGRESS' ? 'warning' : String(row.status) === 'CLOSED' ? 'default' : 'info'}>
                            {formatEnum(String(row.status ?? ''))}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">{formatEnum(String(row.category ?? ''))}</td>
                        <td className="px-4 py-3 text-sm">{String(row.property ?? '')}</td>
                        <td className="px-4 py-3 text-sm">{String(row.room ?? '')}</td>
                        <td className="px-4 py-3 text-sm">{String(row.raisedBy ?? '')}</td>
                        <td className="px-4 py-3 text-sm text-right">{row.resolutionTime != null ? String(row.resolutionTime) : '—'}</td>
                      </>
                    )}
                    {resultType === 'guest' && (
                      <>
                        <td className="px-4 py-3 text-sm font-medium">{String(row.guestName ?? '')}</td>
                        <td className="px-4 py-3 text-sm">{String(row.property ?? '')}</td>
                        <td className="px-4 py-3 text-sm">{String(row.room ?? '')}</td>
                        <td className="px-4 py-3 text-sm">{String(row.recordDate ?? '').split('T')[0]}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatCurrency(Number(row.amount ?? 0))}</td>
                        <td className="px-4 py-3 text-sm"><Badge variant="info">{formatEnum(String(row.source ?? ''))}</Badge></td>
                      </>
                    )}
                    {resultType === 'daily-ops' && (
                      <>
                        <td className="px-4 py-3 text-sm">{String(row.date ?? '').split('T')[0]}</td>
                        <td className="px-4 py-3 text-sm font-medium">{String(row.property ?? '')}</td>
                        <td className="px-4 py-3 text-sm">{String(row.room ?? '')}</td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant={String(row.occupancyStatus) === 'OCCUPIED' ? 'info' : 'success'}>
                            {formatEnum(String(row.occupancyStatus ?? ''))}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">{String(row.guestName ?? '—')}</td>
                        <td className="px-4 py-3 text-sm text-text-sub">{String(row.submittedBy ?? '')}</td>
                      </>
                    )}
                    {resultType === 'staff-performance' && (
                      <>
                        <td className="px-4 py-3 text-sm font-medium">{String(row.name ?? '')}</td>
                        <td className="px-4 py-3 text-sm text-text-sub">{String(row.email ?? '')}</td>
                        <td className="px-4 py-3 text-sm text-right">{String(row.submissionCount ?? 0)}</td>
                        <td className="px-4 py-3 text-sm text-right text-success">{String(row.onTimeCount ?? 0)}</td>
                        <td className="px-4 py-3 text-sm text-right text-warning">{String(row.lateCount ?? 0)}</td>
                        <td className="px-4 py-3 text-sm text-right">{String(row.maintenanceReported ?? 0)}</td>
                        <td className="px-4 py-3 text-sm text-right">{String(row.maintenanceResolved ?? 0)}</td>
                        <td className="px-4 py-3 text-sm">{row.lastSubmission ? String(row.lastSubmission).split('T')[0] : '—'}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {(result as unknown[]).length > 50 && (
              <div className="p-3 text-center text-sm text-text-sub">
                Showing first 50 of {(result as unknown[]).length} records. Export CSV for full data.
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

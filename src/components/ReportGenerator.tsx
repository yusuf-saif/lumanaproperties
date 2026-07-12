'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatEnum } from '@/lib/utils/format'
import { FileText, Download, Loader2, AlertCircle } from 'lucide-react'

interface ReportGeneratorProps {
  properties: Array<{ id: string; name: string }>
}

type ReportType = 'occupancy' | 'maintenance' | 'income' | 'guest' | 'daily-ops'

const REPORT_TYPES = [
  { value: 'occupancy' as ReportType, label: 'Occupancy Report', description: 'Room status breakdown by property' },
  { value: 'maintenance' as ReportType, label: 'Maintenance Issues', description: 'Issue tracking and resolution times' },
  { value: 'income' as ReportType, label: 'Income Report', description: 'Revenue by property, payment method, source' },
  { value: 'guest' as ReportType, label: 'Guest Report', description: 'Guest stays and booking sources' },
  { value: 'daily-ops' as ReportType, label: 'Daily Operations', description: 'Full daily report detail' },
]

function last7Days(): string {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().split('T')[0]
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

export function ReportGenerator({ properties }: ReportGeneratorProps) {
  const [type, setType] = useState<ReportType>('occupancy')
  const [selectedProperties, setSelectedProperties] = useState<string[]>([])
  const [from, setFrom] = useState(last7Days())
  const [to, setTo] = useState(today())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<unknown[] | null>(null)
  const [resultType, setResultType] = useState<ReportType | null>(null)

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

    switch (resultType) {
      case 'occupancy':
        headers = ['Date', 'Property', 'Total Rooms', 'Available', 'Occupied', 'Maintenance', 'Blocked']
        rows = (result as Array<Record<string, unknown>>).map((r) => [
          String(r.date ?? ''),
          String(r.property ?? ''),
          String(r.totalRooms ?? 0),
          String(r.AVAILABLE ?? 0),
          String(r.OCCUPIED ?? 0),
          String(r.MAINTENANCE ?? 0),
          String(r.BLOCKED ?? 0),
        ])
        break
      case 'maintenance':
        headers = ['Title', 'Priority', 'Status', 'Property', 'Room', 'Raised By', 'Resolved By', 'Created', 'Resolved', 'Hours']
        rows = (result as Array<Record<string, unknown>>).map((r) => [
          String(r.title ?? ''),
          String(r.priority ?? ''),
          String(r.status ?? ''),
          String(r.property ?? ''),
          String(r.room ?? ''),
          String(r.raisedBy ?? ''),
          String(r.resolvedBy ?? ''),
          String(r.createdAt ?? ''),
          String(r.resolvedAt ?? ''),
          String(r.resolutionTime ?? ''),
        ])
        break
      case 'income':
        headers = ['Property', 'Room', 'Amount', 'Payment', 'Source', 'Guest', 'Check-In', 'Check-Out', 'Recorded By', 'Date']
        rows = (result as Array<Record<string, unknown>>).map((r) => [
          String(r.property ?? ''),
          String(r.room ?? ''),
          String(r.amount ?? 0),
          String(r.paymentMethod ?? ''),
          String(r.bookingSource ?? ''),
          String(r.guestName ?? ''),
          String(r.checkInDate ?? ''),
          String(r.checkOutDate ?? ''),
          String(r.recordedBy ?? ''),
          String(r.createdAt ?? ''),
        ])
        break
      case 'guest':
        headers = ['Guest', 'Property', 'Room', 'Check-In', 'Check-Out', 'Amount', 'Source']
        rows = (result as Array<Record<string, unknown>>).map((r) => [
          String(r.guestName ?? ''),
          String(r.property ?? ''),
          String(r.room ?? ''),
          String(r.checkInDate ?? ''),
          String(r.checkOutDate ?? ''),
          String(r.amount ?? 0),
          String(r.bookingSource ?? ''),
        ])
        break
      case 'daily-ops':
        headers = ['Date', 'Property', 'Submitted By', 'Notes', 'Created']
        rows = (result as Array<Record<string, unknown>>).map((r) => [
          String(r.date ?? ''),
          String(r.property ?? ''),
          String(r.submittedBy ?? ''),
          String(r.notes ?? ''),
          String(r.createdAt ?? ''),
        ])
        break
    }

    const csv = [headers.join(','), ...rows.map((row) => row.map((c) => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${resultType}-report-${from}-to-${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

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

      {result && resultType && (
        <Card>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-medium text-text-main capitalize">{resultType} Report</h3>
            <Badge variant="info">{result.length} records</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface">
                  {resultType === 'occupancy' && (
                    <>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Property</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-sub">Total</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-sub">Available</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-sub">Occupied</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-sub">Maintenance</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-sub">Blocked</th>
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
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Check-In</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Check-Out</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-text-sub">Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Source</th>
                    </>
                  )}
                  {resultType === 'daily-ops' && (
                    <>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Property</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Submitted By</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Notes</th>
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
                        <td className="px-4 py-3 text-sm text-right">{String(row.totalRooms ?? 0)}</td>
                        <td className="px-4 py-3 text-sm text-right text-success">{String(row.AVAILABLE ?? 0)}</td>
                        <td className="px-4 py-3 text-sm text-right text-primary">{String(row.OCCUPIED ?? 0)}</td>
                        <td className="px-4 py-3 text-sm text-right text-warning">{String(row.MAINTENANCE ?? 0)}</td>
                        <td className="px-4 py-3 text-sm text-right text-danger">{String(row.BLOCKED ?? 0)}</td>
                      </>
                    )}
                    {resultType === 'income' && (
                      <>
                        <td className="px-4 py-3 text-sm font-medium">{String(row.property ?? '')}</td>
                        <td className="px-4 py-3 text-sm">{String(row.room ?? '')}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatCurrency(Number(row.amount ?? 0))}</td>
                        <td className="px-4 py-3 text-sm"><Badge variant="default">{formatEnum(String(row.paymentMethod ?? ''))}</Badge></td>
                        <td className="px-4 py-3 text-sm"><Badge variant="info">{formatEnum(String(row.bookingSource ?? ''))}</Badge></td>
                        <td className="px-4 py-3 text-sm">{String(row.guestName ?? '—')}</td>
                        <td className="px-4 py-3 text-sm">{String(row.createdAt ?? '').split('T')[0]}</td>
                      </>
                    )}
                    {resultType === 'maintenance' && (
                      <>
                        <td className="px-4 py-3 text-sm font-medium">{String(row.title ?? '')}</td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant={String(row.priority) === 'URGENT' ? 'danger' : String(row.priority) === 'HIGH' ? 'warning' : 'default'}>
                            {formatEnum(String(row.priority ?? ''))}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant={String(row.status) === 'RESOLVED' ? 'success' : String(row.status) === 'IN_PROGRESS' ? 'info' : 'warning'}>
                            {formatEnum(String(row.status ?? ''))}
                          </Badge>
                        </td>
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
                        <td className="px-4 py-3 text-sm">{String(row.checkInDate ?? '')}</td>
                        <td className="px-4 py-3 text-sm">{String(row.checkOutDate ?? '')}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatCurrency(Number(row.amount ?? 0))}</td>
                        <td className="px-4 py-3 text-sm"><Badge variant="info">{formatEnum(String(row.bookingSource ?? ''))}</Badge></td>
                      </>
                    )}
                    {resultType === 'daily-ops' && (
                      <>
                        <td className="px-4 py-3 text-sm">{String(row.date ?? '').split('T')[0]}</td>
                        <td className="px-4 py-3 text-sm font-medium">{String(row.property ?? '')}</td>
                        <td className="px-4 py-3 text-sm">{String(row.submittedBy ?? '')}</td>
                        <td className="px-4 py-3 text-sm text-text-sub truncate max-w-xs">{String(row.notes ?? '—')}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {result.length > 50 && (
              <div className="p-3 text-center text-sm text-text-sub">
                Showing first 50 of {result.length} records. Export CSV for full data.
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

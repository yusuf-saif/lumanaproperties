'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { formatDateTime, formatEnum } from '@/lib/utils/format'
import { FileText, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'

interface DailyReport {
  id: string
  reportDate: string
  createdAt: string
  notes: string | null
  occupancy: unknown
  supplies: unknown
  property: { id: string; name: string }
  submittedBy: { id: string; name: string }
}

interface ReportFilterBarProps {
  reports: DailyReport[]
  properties: Array<{ id: string; name: string }>
  missingReports: Array<{ date: string; propertyName: string; propertyId: string }>
}

export function ReportFilterBar({ reports, properties, missingReports }: ReportFilterBarProps) {
  const [propertyFilter, setPropertyFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (propertyFilter !== 'ALL' && r.property.id !== propertyFilter) return false
      if (statusFilter === 'MISSING') return false
      return true
    })
  }, [reports, propertyFilter, statusFilter])

  const completed = reports.length
  const missing = missingReports.length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Submitted" value={completed.toString()} subtitle="Reports received" icon={<FileText />} color="success" />
        <StatCard title="Missing" value={missing.toString()} subtitle="Last 7 days" icon={<AlertTriangle />} color="danger" />
        <StatCard title="Compliance" value={reports.length > 0 ? `${Math.round((completed / (completed + missing)) * 100)}%` : '—'} subtitle="Submission rate" icon={<CheckCircle />} color="primary" />
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-sub">Property</label>
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ALL">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-sub">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ALL">All Reports</option>
              <option value="SUBMITTED">Submitted Only</option>
            </select>
          </div>
        </div>
      </Card>

      {missingReports.length > 0 && (
        <Card className="border border-danger/20">
          <div className="p-4 border-b border-border bg-danger/5">
            <h3 className="font-medium text-danger flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Missing Reports — Last 7 Days
            </h3>
          </div>
          <div className="divide-y divide-border">
            {missingReports.map((m, idx) => (
              <div key={idx} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{m.propertyName}</p>
                  <p className="text-xs text-text-sub">{m.date}</p>
                </div>
                <Badge variant="danger">Missing</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="p-4 border-b border-border">
          <p className="text-sm text-text-sub">
            Showing {filtered.length} of {reports.length} reports
          </p>
        </div>
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-text-sub">
              No reports match your filters
            </div>
          ) : (
            filtered.map((report) => {
              const isExpanded = expandedId === report.id
              const occupancy = Array.isArray(report.occupancy)
                ? (report.occupancy as Array<{ roomId: string; status: string; guestName?: string }>)
                : []
              const supplies = Array.isArray(report.supplies)
                ? (report.supplies as Array<{ name: string; quantity: number }>)
                : []
              const occupied = occupancy.filter((o) => o.status === 'OCCUPIED').length

              return (
                <div key={report.id}>
                  <div
                    className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-surface transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm font-medium">{report.property.name}</p>
                        <p className="text-xs text-text-sub">{report.reportDate}</p>
                      </div>
                      <Badge variant="success">Submitted</Badge>
                      <span className="text-xs text-text-sub">
                        {occupied}/{occupancy.length} occupied
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-sub">{report.submittedBy.name}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-text-sub" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-text-sub" />
                      )}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 bg-surface">
                      <div>
                        <p className="text-xs font-medium text-text-sub mb-1">Occupancy</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'BLOCKED'].map((status) => {
                            const count = occupancy.filter((o) => o.status === status).length
                            return (
                              <div key={status} className="bg-white rounded-lg p-2 border border-border">
                                <p className="text-xs text-text-sub">{formatEnum(status)}</p>
                                <p className="text-lg font-semibold">{count}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      {supplies.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-text-sub mb-1">Supplies</p>
                          <div className="flex flex-wrap gap-2">
                            {supplies.map((s, i) => (
                              <Badge key={i} variant="default">{s.name}: {s.quantity}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {report.notes && (
                        <div>
                          <p className="text-xs font-medium text-text-sub mb-1">Notes</p>
                          <p className="text-sm text-text-main bg-white rounded-lg p-3 border border-border">
                            {report.notes}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-text-sub">
                        Submitted {formatDateTime(report.createdAt)}
                      </p>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}

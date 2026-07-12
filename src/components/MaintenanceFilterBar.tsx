'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/lib/utils/format'
import type {
  MaintenancePriority,
  MaintenanceStatus,
} from '@prisma/client'

interface Issue {
  id: string
  title: string
  priority: MaintenancePriority
  status: MaintenanceStatus
  createdAt: string
  room: { name: string; area: { name: string } }
  property: { name: string }
  raisedBy: { name: string }
}

interface MaintenanceFilterBarProps {
  issues: Issue[]
}

const priorityVariant: Record<MaintenancePriority, 'danger' | 'warning' | 'info' | 'default'> = {
  URGENT: 'danger',
  HIGH: 'warning',
  NORMAL: 'info',
  LOW: 'default',
}

const statusVariant: Record<MaintenanceStatus, 'danger' | 'warning' | 'success'> = {
  OPEN: 'danger',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
}

export default function MaintenanceFilterBar({ issues }: MaintenanceFilterBarProps) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
  const [propertyFilter, setPropertyFilter] = useState<string>('ALL')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<MaintenanceStatus>('OPEN')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [updateError, setUpdateError] = useState('')

  const properties = useMemo(
    () => Array.from(new Set(issues.map((i) => i.property.name))).sort(),
    [issues]
  )

  const filtered = useMemo(() => {
    return issues.filter((issue) => {
      if (statusFilter !== 'ALL' && issue.status !== statusFilter) return false
      if (priorityFilter !== 'ALL' && issue.priority !== priorityFilter) return false
      if (propertyFilter !== 'ALL' && issue.property.name !== propertyFilter) return false
      return true
    })
  }, [issues, statusFilter, priorityFilter, propertyFilter])

  const counts = useMemo(() => {
    const c = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 }
    issues.forEach((i) => c[i.status]++)
    return c
  }, [issues])

  const handleUpdateStatus = async (issueId: string) => {
    setUpdateError('')
    try {
      const res = await fetch(`/api/maintenance/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          resolutionNotes: newStatus === 'RESOLVED' ? resolutionNotes : undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setUpdateError(data.error || 'Failed to update')
        return
      }

      setUpdatingId(null)
      setResolutionNotes('')
      window.location.reload()
    } catch {
      setUpdateError('Network error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-danger">{counts.OPEN}</p>
          <p className="text-sm text-text-sub">Open</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-warning">{counts.IN_PROGRESS}</p>
          <p className="text-sm text-text-sub">In Progress</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-success">{counts.RESOLVED}</p>
          <p className="text-sm text-text-sub">Resolved</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="ALL">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="NORMAL">Normal</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="ALL">All Properties</option>
          {properties.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {updateError && (
        <div className="rounded-lg bg-danger/10 p-3">
          <p className="text-sm text-danger">{updateError}</p>
        </div>
      )}

      {/* Issues Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface">
            <tr>
              <th className="px-4 py-3 font-medium text-text-sub">Property</th>
              <th className="px-4 py-3 font-medium text-text-sub">Room</th>
              <th className="px-4 py-3 font-medium text-text-sub">Title</th>
              <th className="px-4 py-3 font-medium text-text-sub">Priority</th>
              <th className="px-4 py-3 font-medium text-text-sub">Status</th>
              <th className="px-4 py-3 font-medium text-text-sub">Raised By</th>
              <th className="px-4 py-3 font-medium text-text-sub">Date</th>
              <th className="px-4 py-3 font-medium text-text-sub">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-text-sub">
                  No issues found
                </td>
              </tr>
            ) : (
              filtered.map((issue) => (
                <tr key={issue.id}>
                  <td className="px-4 py-3 text-text-main">{issue.property.name}</td>
                  <td className="px-4 py-3 text-text-main">
                    {issue.room.area.name} — {issue.room.name}
                  </td>
                  <td className="px-4 py-3 text-text-main">{issue.title}</td>
                  <td className="px-4 py-3">
                    <Badge variant={priorityVariant[issue.priority]}>
                      {issue.priority}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[issue.status]}>
                      {issue.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-text-sub">{issue.raisedBy.name}</td>
                  <td className="px-4 py-3 text-text-sub">
                    {formatDateTime(issue.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {issue.status !== 'RESOLVED' && (
                      <>
                        {updatingId === issue.id ? (
                          <div className="space-y-2">
                            <select
                              value={newStatus}
                              onChange={(e) => setNewStatus(e.target.value as MaintenanceStatus)}
                              className="rounded border border-border px-2 py-1 text-xs text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="OPEN">Open</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="RESOLVED">Resolved</option>
                            </select>
                            {newStatus === 'RESOLVED' && (
                              <textarea
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                placeholder="Resolution notes..."
                                rows={2}
                                className="w-full rounded border border-border px-2 py-1 text-xs text-text-main placeholder:text-text-sub focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(issue.id)}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setUpdatingId(null)
                                  setResolutionNotes('')
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setUpdatingId(issue.id)
                              setNewStatus(issue.status === 'OPEN' ? 'IN_PROGRESS' : 'RESOLVED')
                            }}
                          >
                            Update Status
                          </Button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import type { MaintenanceStatus, MaintenancePriority } from '@prisma/client'

interface MaintenanceActionPanelProps {
  issue: {
    id: string
    status: MaintenanceStatus
    priority: MaintenancePriority
    assignedToId: string | null
  }
  availableUsers: { id: string; name: string }[]
  currentUserRole: string
}

const statusTransitions: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  REPORTED: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'CLOSED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
}

export default function MaintenanceActionPanel({
  issue,
  availableUsers,
  currentUserRole,
}: MaintenanceActionPanelProps) {
  const router = useRouter()
  const [assignedToId, setAssignedToId] = useState(issue.assignedToId ?? '')
  const [newStatus, setNewStatus] = useState<MaintenanceStatus>('REPORTED')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showStatusUpdate, setShowStatusUpdate] = useState(false)

  const canManage =
    currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'PROPERTY_MANAGER'

  const validTransitions = statusTransitions[issue.status]

  async function handleAssign(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    setAssignedToId(value)
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/maintenance/${issue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: value || null }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to update assignment')
        setAssignedToId(issue.assignedToId ?? '')
      }
    } catch {
      setError('Network error')
      setAssignedToId(issue.assignedToId ?? '')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusUpdate() {
    setSaving(true)
    setError('')
    try {
      const body: Record<string, string> = { status: newStatus }
      if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
        body.resolutionNotes = resolutionNotes
      }
      const res = await fetch(`/api/maintenance/${issue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to update status')
        return
      }
      setShowStatusUpdate(false)
      setResolutionNotes('')
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  if (!canManage) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase text-text-sub">
          Actions
        </h2>
        <p className="text-sm text-text-sub">
          Status updates are managed by property managers.
        </p>
        <div className="mt-3 rounded-lg bg-surface p-3">
          <p className="text-xs text-text-sub">
            Comment / note feature coming in V2.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-3 text-sm font-semibold uppercase text-text-sub">
        Actions
      </h2>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-sub">
            Assign To
          </label>
          <select
            value={assignedToId}
            onChange={handleAssign}
            disabled={saving}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Unassigned</option>
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {validTransitions.length > 0 && !showStatusUpdate && (
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={() => {
              setNewStatus(validTransitions[0])
              setShowStatusUpdate(true)
            }}
          >
            Update Status
          </Button>
        )}

        {showStatusUpdate && (
          <div className="space-y-3 rounded-lg border border-border p-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-sub">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) =>
                  setNewStatus(e.target.value as MaintenanceStatus)
                }
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {validTransitions.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {(newStatus === 'RESOLVED' || newStatus === 'CLOSED') && (
              <div>
                <label className="mb-1 block text-xs font-medium text-text-sub">
                  Resolution Notes *
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-main placeholder:text-text-sub focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Describe how this issue was resolved..."
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                loading={saving}
                onClick={handleStatusUpdate}
                disabled={
                  (newStatus === 'RESOLVED' || newStatus === 'CLOSED') &&
                  !resolutionNotes.trim()
                }
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowStatusUpdate(false)
                  setResolutionNotes('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-danger/10 p-3">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

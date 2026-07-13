'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import type { OccupancyStatus } from '@prisma/client'

interface Room {
  id: string
  name: string
}

interface Property {
  id: string
  name: string
  rooms: Room[]
}

interface DailyReportFormProps {
  properties: Property[]
}

const occupancyStatusOptions: { value: OccupancyStatus; label: string; color: string }[] = [
  { value: 'OCCUPIED', label: 'Occupied', color: 'bg-primary/10 text-primary border-primary/20' },
  { value: 'VACANT', label: 'Vacant', color: 'bg-success/10 text-success border-success/20' },
  { value: 'CHECKOUT', label: 'Checkout', color: 'bg-warning/10 text-warning border-warning/20' },
  { value: 'NO_SHOW', label: 'No Show', color: 'bg-danger/10 text-danger border-danger/20' },
]

interface RoomRow {
  roomId: string
  roomName: string
  occupancyStatus: OccupancyStatus
  guestName: string
  guestCount: string
  notes: string
}

const today = () => new Date().toISOString().split('T')[0]

export default function DailyReportForm({ properties }: DailyReportFormProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    properties.length === 1 ? properties[0].id : ''
  )
  const [reportDate, setReportDate] = useState(today())
  const [roomRows, setRoomRows] = useState<RoomRow[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [duplicateWarnings, setDuplicateWarnings] = useState<string[]>([])

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === selectedPropertyId),
    [properties, selectedPropertyId]
  )

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId)
    const prop = properties.find((p) => p.id === propertyId)
    if (prop) {
      setRoomRows(
        prop.rooms.map((r) => ({
          roomId: r.id,
          roomName: r.name,
          occupancyStatus: 'VACANT' as OccupancyStatus,
          guestName: '',
          guestCount: '1',
          notes: '',
        }))
      )
    }
    setDuplicateWarnings([])
  }

  if (selectedProperty && roomRows.length === 0 && properties.length <= 1) {
    handlePropertyChange(selectedPropertyId || properties[0].id)
  }

  const updateRow = (index: number, field: keyof RoomRow, value: string) => {
    setRoomRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccessMsg('')
    setErrorMsg('')
    setDuplicateWarnings([])

    try {
      const warnings: string[] = []
      let successCount = 0

      for (const row of roomRows) {
        const res = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyId: selectedPropertyId,
            roomId: row.roomId,
            reportDate,
            occupancyStatus: row.occupancyStatus,
            guestName: row.occupancyStatus === 'OCCUPIED' ? row.guestName || undefined : undefined,
            guestCount: parseInt(row.guestCount) || 1,
            notes: row.notes.trim() || undefined,
          }),
        })

        if (res.status === 409) {
          const data = await res.json()
          warnings.push(`${row.roomName}: ${data.error}`)
        } else if (!res.ok) {
          const data = await res.json()
          warnings.push(`${row.roomName}: ${data.error || 'Failed'}`)
        } else {
          successCount++
        }
      }

      if (warnings.length > 0) {
        setDuplicateWarnings(warnings)
      }
      if (successCount > 0) {
        setSuccessMsg(`${successCount} report(s) submitted successfully!`)
      }
      if (successCount === 0 && warnings.length === 0) {
        setErrorMsg('No reports to submit')
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {successMsg && (
        <div className="rounded-lg bg-success/10 p-4">
          <p className="text-sm font-medium text-success">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-lg bg-danger/10 p-4">
          <p className="text-sm font-medium text-danger">{errorMsg}</p>
        </div>
      )}

      {duplicateWarnings.length > 0 && (
        <div className="rounded-lg bg-warning/10 p-4">
          {duplicateWarnings.map((w, i) => (
            <p key={i} className="text-sm font-medium text-warning">{w}</p>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-text-main">Report Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="property" className="block text-sm font-medium text-text-main">
              Property
            </label>
            <select
              id="property"
              value={selectedPropertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
              disabled={properties.length === 1}
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
            >
              <option value="">Select a property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="reportDate" className="block text-sm font-medium text-text-main">
              Report Date
            </label>
            <input
              id="reportDate"
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {selectedProperty && roomRows.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-text-main">Room Status</h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface">
                <tr>
                  <th className="px-4 py-3 font-medium text-text-sub">Room</th>
                  <th className="px-4 py-3 font-medium text-text-sub">Status</th>
                  <th className="px-4 py-3 font-medium text-text-sub">Guest Name</th>
                  <th className="px-4 py-3 font-medium text-text-sub">Guest Count</th>
                  <th className="px-4 py-3 font-medium text-text-sub">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {roomRows.map((row, index) => (
                  <tr key={row.roomId}>
                    <td className="px-4 py-3 text-sm font-medium text-text-main">
                      {row.roomName}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={row.occupancyStatus}
                        onChange={(e) =>
                          updateRow(index, 'occupancyStatus', e.target.value)
                        }
                        className={`rounded-md border px-2 py-1 text-xs font-medium ${
                          occupancyStatusOptions.find((o) => o.value === row.occupancyStatus)?.color ?? ''
                        }`}
                      >
                        {occupancyStatusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {row.occupancyStatus === 'OCCUPIED' ? (
                        <input
                          type="text"
                          value={row.guestName}
                          onChange={(e) =>
                            updateRow(index, 'guestName', e.target.value)
                          }
                          placeholder="Guest name"
                          className="w-full rounded-md border border-border px-2 py-1 text-sm text-text-main placeholder:text-text-sub focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      ) : (
                        <span className="text-text-sub">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.occupancyStatus === 'OCCUPIED' ? (
                        <input
                          type="number"
                          value={row.guestCount}
                          onChange={(e) =>
                            updateRow(index, 'guestCount', e.target.value)
                          }
                          min={1}
                          className="w-20 rounded-md border border-border px-2 py-1 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      ) : (
                        <span className="text-text-sub">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={row.notes}
                        onChange={(e) =>
                          updateRow(index, 'notes', e.target.value)
                        }
                        placeholder="Optional"
                        className="w-full rounded-md border border-border px-2 py-1 text-sm text-text-main placeholder:text-text-sub focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting} size="lg">
          Submit Reports
        </Button>
      </div>
    </form>
  )
}

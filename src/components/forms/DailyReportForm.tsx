'use client'

import { useState, useMemo } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import type { RoomStatus } from '@prisma/client'

interface Room {
  id: string
  name: string
  status: RoomStatus
}

interface Property {
  id: string
  name: string
  rooms: Room[]
}

interface DailyReportFormProps {
  properties: Property[]
}

const statusColors: Record<RoomStatus, string> = {
  AVAILABLE: 'bg-success/10 text-success border-success/20',
  OCCUPIED: 'bg-primary/10 text-primary border-primary/20',
  MAINTENANCE: 'bg-warning/10 text-warning border-warning/20',
  BLOCKED: 'bg-border/50 text-text-sub border-border',
}

interface OccupancyRow {
  roomId: string
  roomName: string
  status: RoomStatus
  guestName: string
  checkIn: string
  checkOut: string
}

interface SupplyRow {
  item: string
  quantity: number
  unit: string
}

const today = () => new Date().toISOString().split('T')[0]

export default function DailyReportForm({ properties }: DailyReportFormProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    properties.length === 1 ? properties[0].id : ''
  )
  const [reportDate, setReportDate] = useState(today())
  const [notes, setNotes] = useState('')
  const [supplies, setSupplies] = useState<SupplyRow[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [duplicateWarning, setDuplicateWarning] = useState('')

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === selectedPropertyId),
    [properties, selectedPropertyId]
  )

  const [occupancy, setOccupancy] = useState<OccupancyRow[]>(() =>
    selectedProperty
      ? selectedProperty.rooms.map((r) => ({
          roomId: r.id,
          roomName: r.name,
          status: r.status,
          guestName: '',
          checkIn: '',
          checkOut: '',
        }))
      : []
  )

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId)
    const prop = properties.find((p) => p.id === propertyId)
    if (prop) {
      setOccupancy(
        prop.rooms.map((r) => ({
          roomId: r.id,
          roomName: r.name,
          status: r.status,
          guestName: '',
          checkIn: '',
          checkOut: '',
        }))
      )
    }
    setDuplicateWarning('')
  }

  const updateOccupancy = (
    index: number,
    field: keyof OccupancyRow,
    value: string
  ) => {
    setOccupancy((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    )
  }

  const addSupply = () => {
    setSupplies((prev) => [...prev, { item: '', quantity: 1, unit: 'units' }])
  }

  const updateSupply = (index: number, field: keyof SupplyRow, value: string | number) => {
    setSupplies((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    )
  }

  const removeSupply = (index: number) => {
    setSupplies((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccessMsg('')
    setErrorMsg('')
    setDuplicateWarning('')

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          reportDate,
          occupancy: occupancy.map((row) => ({
            roomId: row.roomId,
            status: row.status,
            guestName: row.status === 'OCCUPIED' ? row.guestName : undefined,
            checkIn: row.status === 'OCCUPIED' ? row.checkIn : undefined,
            checkOut: row.status === 'OCCUPIED' ? row.checkOut : undefined,
          })),
          supplies: supplies.filter((s) => s.item.trim() !== ''),
          notes: notes.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (res.status === 409) {
        setDuplicateWarning(data.error)
        return
      }

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit report')
        return
      }

      setSuccessMsg('Report submitted successfully!')
      setNotes('')
      setSupplies([])
      if (properties.length === 1) {
        setOccupancy(
          properties[0].rooms.map((r) => ({
            roomId: r.id,
            roomName: r.name,
            status: r.status,
            guestName: '',
            checkIn: '',
            checkOut: '',
          }))
        )
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

      {duplicateWarning && (
        <div className="rounded-lg bg-warning/10 p-4">
          <p className="text-sm font-medium text-warning">{duplicateWarning}</p>
        </div>
      )}

      {/* Section 1 — Report Details */}
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
              onChange={(e) => {
                setReportDate(e.target.value)
                setDuplicateWarning('')
              }}
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Section 2 — Room Occupancy */}
      {selectedProperty && occupancy.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-text-main">Room Occupancy</h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface">
                <tr>
                  <th className="px-4 py-3 font-medium text-text-sub">Room</th>
                  <th className="px-4 py-3 font-medium text-text-sub">Status</th>
                  <th className="px-4 py-3 font-medium text-text-sub">Guest Name</th>
                  <th className="px-4 py-3 font-medium text-text-sub">Check-in</th>
                  <th className="px-4 py-3 font-medium text-text-sub">Check-out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {occupancy.map((row, index) => (
                  <tr key={row.roomId}>
                    <td className="px-4 py-3 text-sm font-medium text-text-main">
                      {row.roomName}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={row.status}
                        onChange={(e) =>
                          updateOccupancy(index, 'status', e.target.value)
                        }
                        className={`rounded-md border px-2 py-1 text-xs font-medium ${statusColors[row.status]}`}
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="OCCUPIED">Occupied</option>
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="BLOCKED">Blocked</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {row.status === 'OCCUPIED' ? (
                        <input
                          type="text"
                          value={row.guestName}
                          onChange={(e) =>
                            updateOccupancy(index, 'guestName', e.target.value)
                          }
                          placeholder="Guest name"
                          className="w-full rounded-md border border-border px-2 py-1 text-sm text-text-main placeholder:text-text-sub focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      ) : (
                        <span className="text-text-sub">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.status === 'OCCUPIED' ? (
                        <input
                          type="date"
                          value={row.checkIn}
                          onChange={(e) =>
                            updateOccupancy(index, 'checkIn', e.target.value)
                          }
                          className="rounded-md border border-border px-2 py-1 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      ) : (
                        <span className="text-text-sub">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.status === 'OCCUPIED' ? (
                        <input
                          type="date"
                          value={row.checkOut}
                          onChange={(e) =>
                            updateOccupancy(index, 'checkOut', e.target.value)
                          }
                          className="rounded-md border border-border px-2 py-1 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      ) : (
                        <span className="text-text-sub">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 3 — Supplies Received */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-text-main">Supplies Received</h3>
          <Button type="button" variant="ghost" size="sm" onClick={addSupply}>
            + Add Item
          </Button>
        </div>
        {supplies.length === 0 && (
          <p className="text-sm text-text-sub">No supplies recorded yet.</p>
        )}
        <div className="space-y-3">
          {supplies.map((row, index) => (
            <div key={index} className="flex items-center gap-3">
              <input
                type="text"
                value={row.item}
                onChange={(e) => updateSupply(index, 'item', e.target.value)}
                placeholder="Item name"
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-text-main placeholder:text-text-sub focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="number"
                value={row.quantity}
                onChange={(e) =>
                  updateSupply(index, 'quantity', parseInt(e.target.value) || 0)
                }
                min={0}
                className="w-24 rounded-lg border border-border px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <select
                value={row.unit}
                onChange={(e) => updateSupply(index, 'unit', e.target.value)}
                className="rounded-lg border border-border px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="bags">Bags</option>
                <option value="boxes">Boxes</option>
                <option value="litres">Litres</option>
                <option value="units">Units</option>
                <option value="other">Other</option>
              </select>
              <button
                type="button"
                onClick={() => removeSupply(index)}
                className="rounded-lg p-2 text-text-sub hover:bg-danger/10 hover:text-danger"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4 — General Notes */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-text-main">General Notes</h3>
        <div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 1000))}
            rows={4}
            placeholder="Optional notes about today's report..."
            className="block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main placeholder:text-text-sub focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-right text-xs text-text-sub">
            {notes.length}/1000
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting} size="lg">
          Submit Report
        </Button>
      </div>
    </form>
  )
}

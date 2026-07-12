'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import type { MaintenancePriority } from '@prisma/client'

interface Room {
  id: string
  name: string
}

interface Property {
  id: string
  name: string
  rooms: Room[]
}

interface MaintenanceFormProps {
  properties: Property[]
}

const priorityColors: Record<MaintenancePriority, string> = {
  URGENT: 'bg-danger/10 text-danger border-danger/20',
  HIGH: 'bg-warning/10 text-warning border-warning/20',
  NORMAL: 'bg-primary/10 text-primary border-primary/20',
  LOW: 'bg-border/50 text-text-sub border-border',
}

export default function MaintenanceForm({ properties }: MaintenanceFormProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    properties.length === 1 ? properties[0].id : ''
  )
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<MaintenancePriority>('NORMAL')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const filteredRooms = useMemo(() => {
    const prop = properties.find((p) => p.id === selectedPropertyId)
    return prop?.rooms ?? []
  }, [properties, selectedPropertyId])

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId)
    setSelectedRoomId('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          roomId: selectedRoomId,
          title,
          priority,
          description,
          notes: notes.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit issue')
        return
      }

      setSuccessMsg('Maintenance issue reported successfully!')
      setTitle('')
      setDescription('')
      setNotes('')
      setPriority('NORMAL')
      setSelectedRoomId('')
    } catch {
      setErrorMsg('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          <label htmlFor="room" className="block text-sm font-medium text-text-main">
            Room
          </label>
          <select
            id="room"
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            disabled={!selectedPropertyId}
            className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
          >
            <option value="">Select a room</option>
            {filteredRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-text-main">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            required
            placeholder="Brief issue title"
            className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main placeholder:text-text-sub focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-text-main">
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as MaintenancePriority)}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm font-medium ${priorityColors[priority]}`}
          >
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-text-main">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          required
          rows={4}
          placeholder="Describe the issue in detail..."
          className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main placeholder:text-text-sub focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <p className="mt-1 text-right text-xs text-text-sub">
          {description.length}/2000
        </p>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-text-main">
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Optional additional notes..."
          className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main placeholder:text-text-sub focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting} size="lg">
          Report Issue
        </Button>
      </div>
    </form>
  )
}

'use client'

import { useState, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { ImagePlus, X } from 'lucide-react'
import type { MaintenancePriority, MaintenanceCategory } from '@prisma/client'

interface Room {
  id: string
  name: string
}

interface Property {
  id: string
  name: string
  rooms: Room[]
}

interface User {
  id: string
  name: string
}

interface MaintenanceFormProps {
  properties: Property[]
  users?: User[]
}

const priorityColors: Record<MaintenancePriority, string> = {
  CRITICAL: 'bg-danger/10 text-danger border-danger/20',
  HIGH: 'bg-warning/10 text-warning border-warning/20',
  MEDIUM: 'bg-primary/10 text-primary border-primary/20',
  LOW: 'bg-border/50 text-text-sub border-border',
}

const MAX_PHOTOS = 3

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img
      const maxWidth = 800
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

export default function MaintenanceForm({ properties, users = [] }: MaintenanceFormProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    properties.length === 1 ? properties[0].id : ''
  )
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<MaintenancePriority>('MEDIUM')
  const [category, setCategory] = useState<MaintenanceCategory>('OTHER')
  const [assignedToId, setAssignedToId] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [photoError, setPhotoError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredRooms = useMemo(() => {
    const prop = properties.find((p) => p.id === selectedPropertyId)
    return prop?.rooms ?? []
  }, [properties, selectedPropertyId])

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId)
    setSelectedRoomId('')
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setPhotoError('')

    const remaining = MAX_PHOTOS - photos.length
    if (remaining <= 0) {
      setPhotoError(`Maximum ${MAX_PHOTOS} photos allowed`)
      return
    }

    const filesToProcess = Array.from(files).slice(0, remaining)
    const newPhotos: string[] = []

    for (const file of filesToProcess) {
      if (file.size > 2 * 1024 * 1024) {
        setPhotoError(`${file.name} exceeds 2MB limit`)
        continue
      }
      if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
        setPhotoError(`${file.name}: only JPEG and PNG allowed`)
        continue
      }
      try {
        const compressed = await compressImage(file)
        newPhotos.push(compressed)
      } catch {
        setPhotoError(`Failed to process ${file.name}`)
      }
    }

    if (newPhotos.length > 0) {
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, MAX_PHOTOS))
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
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
          category,
          assignedToId: assignedToId || undefined,
          description,
          notes: notes.trim() || undefined,
          photos: photos.length > 0 ? photos : undefined,
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
      setPriority('MEDIUM')
      setCategory('OTHER')
      setSelectedRoomId('')
      setAssignedToId('')
      setPhotos([])
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
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-text-main">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as MaintenanceCategory)}
            className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ELECTRICAL">Electrical</option>
            <option value="PLUMBING">Plumbing</option>
            <option value="HVAC">HVAC</option>
            <option value="FURNITURE">Furniture</option>
            <option value="APPLIANCE">Appliance</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="assignedTo" className="block text-sm font-medium text-text-main">
            Assign To (optional)
          </label>
          <select
            id="assignedTo"
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
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
        <label className="block text-sm font-medium text-text-main">
          Photos ({photos.length} of {MAX_PHOTOS})
        </label>
        <div className="mt-2 flex flex-wrap gap-3">
          {photos.map((photo, i) => (
            <div key={i} className="relative">
              <img
                src={photo}
                alt={`Photo ${i + 1}`}
                className="h-20 w-20 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-text-sub hover:border-primary hover:text-primary"
            >
              <ImagePlus size={20} />
              <span className="mt-1 text-[10px]">Add</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          multiple
          onChange={handlePhotoSelect}
          className="hidden"
        />
        {photoError && (
          <p className="mt-1 text-xs text-danger">{photoError}</p>
        )}
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

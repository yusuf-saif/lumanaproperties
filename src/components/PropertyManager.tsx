'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Building, Plus, ChevronDown, ChevronUp, MapPin, BedDouble, Eye, FileUp, X } from 'lucide-react'

interface Room {
  id: string
  name: string
  type: string
  dailyRate: number
  status: string
  active: boolean
}

interface Area {
  id: string
  name: string
  rooms: Room[]
}

interface Property {
  id: string
  name: string
  address: string
  active: boolean
  areas: Area[]
}

interface PropertyManagerProps {
  initialProperties: Property[]
}

export function PropertyManager({ initialProperties }: PropertyManagerProps) {
  const [properties, setProperties] = useState(initialProperties)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newPropertyName, setNewPropertyName] = useState('')
  const [newPropertyAddress, setNewPropertyAddress] = useState('')
  const [creating, setCreating] = useState(false)

  const [newAreaPropertyId, setNewAreaPropertyId] = useState('')
  const [newAreaName, setNewAreaName] = useState('')
  const [creatingArea, setCreatingArea] = useState(false)

  const [newRoomAreaId, setNewRoomAreaId] = useState('')
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomType, setNewRoomType] = useState('ONE_BEDROOM')
  const [newRoomRate, setNewRoomRate] = useState('')
  const [creatingRoom, setCreatingRoom] = useState(false)

  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editAddress, setEditAddress] = useState('')

  const [importAreaId, setImportAreaId] = useState<string | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: { row: number; message: string }[] } | null>(null)

  async function createProperty() {
    if (!newPropertyName.trim() || !newPropertyAddress.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/settings/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPropertyName.trim(), address: newPropertyAddress.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setProperties((prev) => [...prev, { ...data.property, areas: [] }])
        setNewPropertyName('')
        setNewPropertyAddress('')
      }
    } finally {
      setCreating(false)
    }
  }

  async function archiveProperty(id: string, active: boolean) {
    const res = await fetch(`/api/settings/properties/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
    if (res.ok) {
      setProperties((prev) => prev.map((p) => p.id === id ? { ...p, active } : p))
    }
  }

  async function updateProperty(id: string) {
    const res = await fetch(`/api/settings/properties/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), address: editAddress.trim() }),
    })
    if (res.ok) {
      setProperties((prev) => prev.map((p) => p.id === id ? { ...p, name: editName.trim(), address: editAddress.trim() } : p))
      setEditingPropertyId(null)
    }
  }

  async function createArea() {
    if (!newAreaPropertyId || !newAreaName.trim()) return
    setCreatingArea(true)
    try {
      const res = await fetch('/api/settings/areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: newAreaPropertyId, name: newAreaName.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setProperties((prev) => prev.map((p) =>
          p.id === newAreaPropertyId ? { ...p, areas: [...p.areas, { ...data.area, rooms: [] }] } : p
        ))
        setNewAreaName('')
      }
    } finally {
      setCreatingArea(false)
    }
  }

  async function createRoom() {
    if (!newRoomAreaId || !newRoomName.trim() || !newRoomRate) return
    setCreatingRoom(true)
    try {
      const res = await fetch('/api/settings/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areaId: newRoomAreaId,
          name: newRoomName.trim(),
          type: newRoomType,
          dailyRate: parseFloat(newRoomRate),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setProperties((prev) => prev.map((p) => ({
          ...p,
          areas: p.areas.map((a) =>
            a.id === newRoomAreaId ? { ...a, rooms: [...a.rooms, { ...data.room, active: true }] } : a
          ),
        })))
        setNewRoomName('')
        setNewRoomRate('')
      }
    } finally {
      setCreatingRoom(false)
    }
  }

  async function importRooms() {
    if (!importFile || !importAreaId) return
    setImporting(true)
    setImportResult(null)
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      const res = await fetch('/api/settings/rooms/import', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        setImportResult(data)
        if (data.created > 0) {
          const propRes = await fetch('/api/settings/properties')
          if (propRes.ok) {
            const props = await propRes.json()
            setProperties(props.properties ?? props)
          }
        }
      }
    } finally {
      setImporting(false)
    }
  }

  function openImport(areaId: string) {
    setImportAreaId(areaId)
    setImportFile(null)
    setImportResult(null)
  }

  function closeImport() {
    setImportAreaId(null)
    setImportFile(null)
    setImportResult(null)
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-medium text-text-main mb-4">Add New Property</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Property name"
            value={newPropertyName}
            onChange={(e) => setNewPropertyName(e.target.value)}
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Address"
            value={newPropertyAddress}
            onChange={(e) => setNewPropertyAddress(e.target.value)}
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <Button onClick={createProperty} disabled={creating || !newPropertyName.trim() || !newPropertyAddress.trim()}>
            <Plus className="h-4 w-4 mr-1" />
            Add Property
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        {properties.map((property) => {
          const isExpanded = expandedId === property.id
          const totalRooms = property.areas.reduce((sum, a) => sum + a.rooms.length, 0)

          return (
            <Card key={property.id}>
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-surface transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : property.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    {editingPropertyId === property.id ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="border border-border rounded px-2 py-1 text-sm"
                        />
                        <input
                          type="text"
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          className="border border-border rounded px-2 py-1 text-sm"
                        />
                        <Button size="sm" onClick={() => updateProperty(property.id)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingPropertyId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium">{property.name}</p>
                        <p className="text-xs text-text-sub flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {property.address}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={property.active ? 'success' : 'default'}>
                    {property.active ? 'Active' : 'Archived'}
                  </Badge>
                  <span className="text-xs text-text-sub">{property.areas.length} areas, {totalRooms} rooms</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border p-4 space-y-4 bg-surface">
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setEditingPropertyId(property.id)
                      setEditName(property.name)
                      setEditAddress(property.address)
                    }}>Edit</Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => archiveProperty(property.id, !property.active)}
                    >
                      {property.active ? 'Archive' : 'Restore'}
                    </Button>
                    <a
                      href={`/properties/${property.id}?date=${new Date().toISOString().split('T')[0]}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-main transition-colors hover:bg-primary/5 hover:text-primary"
                    >
                      <Eye className="h-3 w-3" />
                      View Availability
                    </a>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-text-sub mb-2">Areas</p>
                    {property.areas.length === 0 ? (
                      <p className="text-sm text-text-sub">No areas defined yet</p>
                    ) : (
                      <div className="space-y-2">
                        {property.areas.map((area) => (
                          <div key={area.id} className="bg-white rounded-lg border border-border p-3">
                            <p className="text-sm font-medium">{area.name}</p>
                            {area.rooms.length > 0 ? (
                              <div className="mt-2 space-y-1">
                                {area.rooms.map((room) => (
                                  <div key={room.id} className="flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-1">
                                      <BedDouble className="h-3 w-3" />
                                      {room.name} ({room.type.replace('_', ' ')})
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span>₦{room.dailyRate.toLocaleString()}</span>
                                      <Badge variant={room.status === 'AVAILABLE' ? 'success' : room.status === 'OCCUPIED' ? 'info' : room.status === 'MAINTENANCE' ? 'warning' : 'default'}>
                                        {room.status.replace('_', ' ')}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-text-sub mt-1">No rooms</p>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); openImport(area.id) }}
                              className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                            >
                              <FileUp className="h-3 w-3" />
                              Import Rooms
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-medium text-text-main mb-4">Add Area</h3>
          <div className="space-y-3">
            <select
              value={newAreaPropertyId}
              onChange={(e) => setNewAreaPropertyId(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select property</option>
              {properties.filter((p) => p.active).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Area name (e.g. Block A, Floor 1)"
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <Button onClick={createArea} disabled={creatingArea || !newAreaPropertyId || !newAreaName.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Add Area
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-medium text-text-main mb-4">Add Room</h3>
          <div className="space-y-3">
            <select
              value={newRoomAreaId}
              onChange={(e) => setNewRoomAreaId(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select area</option>
              {properties.filter((p) => p.active).flatMap((p) =>
                p.areas.map((a) => (
                  <option key={a.id} value={a.id}>{p.name} / {a.name}</option>
                ))
              )}
            </select>
            <input
              type="text"
              placeholder="Room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <select
              value={newRoomType}
              onChange={(e) => setNewRoomType(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="STUDIO">Studio</option>
              <option value="ONE_BEDROOM">1 Bedroom</option>
              <option value="TWO_BEDROOM">2 Bedroom</option>
              <option value="THREE_BEDROOM">3 Bedroom</option>
              <option value="PENTHOUSE">Penthouse</option>
            </select>
            <input
              type="number"
              placeholder="Daily rate (₦)"
              value={newRoomRate}
              onChange={(e) => setNewRoomRate(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <Button onClick={createRoom} disabled={creatingRoom || !newRoomAreaId || !newRoomName.trim() || !newRoomRate}>
              <Plus className="h-4 w-4 mr-1" />
              Add Room
            </Button>
          </div>
        </Card>
      </div>

      {importAreaId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium text-text-main">Import Rooms via CSV</h3>
              <button onClick={closeImport} className="rounded p-1 text-text-sub hover:text-text-main">
                <X size={16} />
              </button>
            </div>

            <div className="mb-4 rounded-lg bg-surface p-3">
              <p className="mb-1 text-xs font-medium text-text-sub">Expected CSV format:</p>
              <code className="text-xs text-text-main">
                name,type,dailyRate,areaId{'\n'}
                Room 01,STUDIO,25000,{importAreaId}{'\n'}
                Room 02,ONE_BEDROOM,35000,{importAreaId}
              </code>
              <p className="mt-1 text-[11px] text-text-sub">
                Types: STUDIO, ONE_BEDROOM, TWO_BEDROOM, THREE_BEDROOM, PENTHOUSE
              </p>
            </div>

            {!importResult ? (
              <>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                  className="mb-4 w-full text-sm text-text-sub file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-primary/90"
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={closeImport}>Cancel</Button>
                  <Button size="sm" onClick={importRooms} disabled={!importFile || importing}>
                    {importing ? 'Importing...' : 'Import'}
                  </Button>
                </div>
              </>
            ) : (
              <div>
                <div className={`mb-3 rounded-lg p-3 ${importResult.errors.length > 0 ? 'bg-warning/10' : 'bg-success/10'}`}>
                  <p className="text-sm font-medium text-text-main">
                    {importResult.created} rooms created, {importResult.skipped} skipped
                  </p>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mb-3 max-h-40 overflow-y-auto rounded-lg border border-border bg-surface p-3">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-danger">
                        Row {err.row}: {err.message}
                      </p>
                    ))}
                  </div>
                )}
                <div className="flex justify-end">
                  <Button size="sm" onClick={closeImport}>Done</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

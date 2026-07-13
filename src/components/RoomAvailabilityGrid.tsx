'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatCurrency, formatEnum } from '@/lib/utils/format'
import { BedDouble, X } from 'lucide-react'

interface RoomReport {
  occupancyStatus: string
  guestName: string | null
  guestCount: number
}

interface Room {
  id: string
  name: string
  type: string
  dailyRate: number
  status: string
  report: RoomReport | null
}

interface Area {
  id: string
  name: string
  rooms: Room[]
}

interface RoomAvailabilityGridProps {
  areas: Area[]
  selectedDate: string
  propertyId: string
  userRole: string
}

const liveStatusColor: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  AVAILABLE: 'success',
  OCCUPIED: 'info',
  MAINTENANCE: 'warning',
  OUT_OF_SERVICE: 'danger',
}

const reportStatusColor: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
  OCCUPIED: 'info',
  VACANT: 'success',
  CHECKOUT: 'warning',
  NO_SHOW: 'danger',
}

export default function RoomAvailabilityGrid({
  areas,
  selectedDate,
  propertyId,
  userRole,
}: RoomAvailabilityGridProps) {
  const router = useRouter()
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [updating, setUpdating] = useState(false)

  const canUpdateStatus =
    userRole === 'SUPER_ADMIN' || userRole === 'PROPERTY_MANAGER'

  async function updateRoomStatus(roomId: string, newStatus: string) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/settings/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        router.refresh()
        setSelectedRoom(null)
      }
    } finally {
      setUpdating(false)
    }
  }

  return (
    <>
      {areas.map((area) => (
        <div key={area.id} className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-sub">
            {area.name}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {area.rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40 ${
                  room.report === null
                    ? 'border-dashed border-text-sub/30'
                    : 'border-border'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-main">
                    {room.name}
                  </span>
                  <Badge variant="default" className="text-[10px]">
                    {formatEnum(room.type)}
                  </Badge>
                </div>

                <p className="mb-3 text-xs text-text-sub">
                  {formatCurrency(room.dailyRate)}/night
                </p>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-text-sub">Room</span>
                    <Badge variant={liveStatusColor[room.status] ?? 'default'} className="text-[10px]">
                      {formatEnum(room.status)}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-text-sub">Report</span>
                    {room.report ? (
                      <Badge
                        variant={reportStatusColor[room.report.occupancyStatus] ?? 'default'}
                        className="text-[10px]"
                      >
                        {formatEnum(room.report.occupancyStatus)}
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-text-sub italic">
                        Not reported
                      </span>
                    )}
                  </div>
                </div>

                {room.report &&
                  room.report.occupancyStatus === 'OCCUPIED' && (
                    <div className="mt-2 border-t border-border pt-2">
                      <p className="text-[10px] text-text-sub">
                        {room.report.guestName ?? 'Guest'} ·{' '}
                        {room.report.guestCount} pax
                      </p>
                    </div>
                  )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="mx-4 w-full max-w-md p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-main">
                {selectedRoom.name}
              </h3>
              <button
                onClick={() => setSelectedRoom(null)}
                className="rounded-lg p-1 text-text-sub hover:bg-surface hover:text-text-main"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-sub">Type</span>
                <span className="text-text-main">
                  {formatEnum(selectedRoom.type)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-sub">Daily Rate</span>
                <span className="text-text-main">
                  {formatCurrency(selectedRoom.dailyRate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-sub">Live Status</span>
                <Badge
                  variant={liveStatusColor[selectedRoom.status] ?? 'default'}
                >
                  {formatEnum(selectedRoom.status)}
                </Badge>
              </div>

              <div className="border-t border-border pt-3">
                <p className="mb-2 font-medium text-text-main">
                  Report for {selectedDate}
                </p>
                {selectedRoom.report ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-text-sub">Status</span>
                      <Badge
                        variant={
                          reportStatusColor[
                            selectedRoom.report.occupancyStatus
                          ] ?? 'default'
                        }
                      >
                        {formatEnum(selectedRoom.report.occupancyStatus)}
                      </Badge>
                    </div>
                    {selectedRoom.report.occupancyStatus === 'OCCUPIED' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-text-sub">Guest</span>
                          <span className="text-text-main">
                            {selectedRoom.report.guestName ?? '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-sub">Guests</span>
                          <span className="text-text-main">
                            {selectedRoom.report.guestCount}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-text-sub italic">
                    No report submitted for this date
                  </p>
                )}
              </div>

              {canUpdateStatus && (
                <div className="border-t border-border pt-3">
                  <p className="mb-2 text-xs font-medium text-text-sub">
                    Quick Status Update
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'OUT_OF_SERVICE'] as const).map(
                      (s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant={
                            selectedRoom.status === s ? 'primary' : 'ghost'
                          }
                          disabled={updating || selectedRoom.status === s}
                          onClick={() => updateRoomStatus(selectedRoom.id, s)}
                        >
                          {formatEnum(s)}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  )
}

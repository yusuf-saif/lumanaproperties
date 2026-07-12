import type {
  Role,
  RoomType,
  RoomStatus,
  MaintenancePriority,
  MaintenanceStatus,
  PaymentMethod,
  BookingSource,
} from '@prisma/client'

export type {
  Role,
  RoomType,
  RoomStatus,
  MaintenancePriority,
  MaintenanceStatus,
  PaymentMethod,
  BookingSource,
}

export interface NavItem {
  label: string
  href: string
  icon: string
  roles?: Role[]
}

export interface OccupancyEntry {
  roomId: string
  status: RoomStatus
  guestName?: string
  checkIn?: string
  checkOut?: string
}

export interface SupplyEntry {
  item: string
  quantity: number
  unit: string
}

import type {
  Role,
  RoomType,
  RoomStatus,
  OccupancyStatus,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceCategory,
  PaymentMethod,
  IncomeSource,
} from '@prisma/client'

export type {
  Role,
  RoomType,
  RoomStatus,
  OccupancyStatus,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceCategory,
  PaymentMethod,
  IncomeSource,
}

export interface NavItem {
  label: string
  href: string
  icon: string
  roles?: Role[]
}

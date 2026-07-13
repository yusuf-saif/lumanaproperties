# LUMANA Dashboard — Ground Truth

## Stack
- Next.js 14 (App Router, TypeScript strict)
- Tailwind CSS
- Prisma ORM (PostgreSQL)
- NextAuth.js v5 (Auth.js) — email/password
- Lucide React — icons
- React Hook Form + Zod — forms
- Resend — email (guarded, only when API key set)

## Design Tokens
| Token     | Hex       | Usage                         |
|-----------|-----------|-------------------------------|
| sidebar   | #0F172A   | Dark navy — sidebar bg        |
| surface   | #F8FAFC   | Page background               |
| card      | #FFFFFF   | Card/panel background         |
| primary   | #2563EB   | Blue — primary actions        |
| danger    | #DC2626   | Red — urgent, delete          |
| warning   | #D97706   | Amber — warnings, pending     |
| success   | #16A34A   | Green — available, resolved   |
| border    | #E2E8F0   | Dividers                      |
| text-main | #0F172A   | Primary text                  |
| text-sub  | #64748B   | Secondary text                |

## Rules
1. Server components by default
2. `'use client'` only for hooks/events/browser APIs
3. No hardcoded hex — Tailwind tokens only
4. No `transition: all`
5. No `any` types
6. `export const dynamic = 'force-dynamic'` on all dashboard pages

## Component Map
| File                              | Client? | Purpose                                  |
|-----------------------------------|---------|------------------------------------------|
| components/layout/Sidebar.tsx     | Yes     | Fixed sidebar, nav, logout               |
| components/layout/Topbar.tsx      | No      | Page header with title + user info       |
| components/ui/StatCard.tsx        | No      | Dashboard stat card                      |
| components/ui/Badge.tsx           | No      | Colour-coded pill badge                  |
| components/ui/Button.tsx          | No      | Reusable button component                |
| components/ui/Card.tsx            | No      | Reusable card wrapper                    |
| components/forms/LoginForm.tsx    | Yes     | Login form with validation               |
| components/forms/DailyReportForm.tsx | Yes  | Per-room daily report submission         |
| components/forms/MaintenanceForm.tsx  | Yes  | Maintenance issue submission form        |
| components/forms/IncomeForm.tsx       | Yes  | Income record submission form            |
| components/Providers.tsx          | Yes     | SessionProvider wrapper                  |
| components/MaintenanceFilterBar.tsx | Yes   | Maintenance issue list + filter + status |
| components/IncomeFilterBar.tsx     | Yes    | Income records table + filter + CSV      |
| components/ReportFilterBar.tsx     | Yes    | Report history + missing reports + expand|
| components/ReportGenerator.tsx     | Yes    | Report type/config/generate/export       |
| components/PropertyManager.tsx     | Yes    | Property/area/room CRUD                  |
| components/UserManager.tsx         | Yes    | User invite + role/property management   |

## Lib Map
| File                  | Purpose                                    |
|-----------------------|--------------------------------------------|
| lib/prisma.ts         | Prisma client singleton                    |
| lib/auth.ts           | NextAuth v5 config, JWT callbacks, session |
| lib/utils/cn.ts       | clsx + tailwind-merge utility              |
| lib/utils/format.ts   | Currency, date, enum formatting            |

## Prisma Models
User, Property, PropertyUser, Area, Room, DailyReport, MaintenanceIssue, InviteToken, IncomeRecord

## Enums
- **Role:** SUPER_ADMIN | PROPERTY_MANAGER | STAFF | VIEWER
- **RoomType:** STUDIO | ONE_BEDROOM | TWO_BEDROOM | THREE_BEDROOM | PENTHOUSE
- **RoomStatus:** AVAILABLE | OCCUPIED | MAINTENANCE | OUT_OF_SERVICE
- **OccupancyStatus:** OCCUPIED | VACANT | CHECKOUT | NO_SHOW
- **MaintenancePriority:** LOW | MEDIUM | HIGH | CRITICAL
- **MaintenanceStatus:** REPORTED | IN_PROGRESS | RESOLVED | CLOSED
- **MaintenanceCategory:** ELECTRICAL | PLUMBING | HVAC | FURNITURE | APPLIANCE | OTHER
- **PaymentMethod:** CASH | CARD | TRANSFER | POS | ONLINE
- **IncomeSource:** ACCOMMODATION | MINIBAR | LAUNDRY | SERVICE_CHARGE | OTHER

## API Routes
| Method | Path                                  | Purpose                              |
|--------|---------------------------------------|--------------------------------------|
| POST   | /api/auth/[...nextauth]               | NextAuth v5                           |
| POST   | /api/reports                          | Submit daily report (per room, 409)  |
| POST   | /api/maintenance                      | Submit maintenance issue             |
| PATCH  | /api/maintenance/[id]                 | Update issue status                  |
| POST   | /api/income                           | Submit income record                 |
| POST   | /api/reports/generate                 | Generate report data by type         |
| GET    | /api/settings/properties              | List all properties (SUPER_ADMIN)    |
| POST   | /api/settings/properties              | Create property (SUPER_ADMIN)        |
| PATCH  | /api/settings/properties/[id]         | Update/archive property              |
| POST   | /api/settings/areas                   | Create area (SUPER_ADMIN)            |
| POST   | /api/settings/rooms                   | Create room (SUPER_ADMIN)            |
| PATCH  | /api/settings/rooms/[id]              | Update room status/details           |
| POST   | /api/settings/users/invite            | Send user invite email               |
| PATCH  | /api/settings/users/[id]              | Update user role/properties          |

## Session Shape
```ts
session.user = {
  id: string
  role: 'SUPER_ADMIN' | 'PROPERTY_MANAGER' | 'STAFF' | 'VIEWER'
  propertyIds: string[]  // from PropertyUser join
  name: string
  email: string
}
```

## Key Design Decisions
- DailyReport is **per room per day** — one row per room, with `occupancyStatus` enum (OCCUPIED/VACANT/CHECKOUT/NO_SHOW)
- IncomeRecord has direct `propertyId` for efficient filtering — no need for room→area→property chain
- MaintenanceStatus includes REPORTED (initial), IN_PROGRESS, RESOLVED, CLOSED
- MaintenanceCategory tracks issue type: ELECTRICAL, PLUMBING, HVAC, FURNITURE, APPLIANCE, OTHER
- IncomeSource tracks revenue category: ACCOMMODATION, MINIBAR, LAUNDRY, SERVICE_CHARGE, OTHER
- Room status uses OUT_OF_SERVICE instead of BLOCKED
- `(dashboard)/layout.tsx` handles auth guard — child pages get session for free
- Dashboard role filtering: SUPER_ADMIN sees all, others filtered by `propertyIds`
- Currency formatted in NGN (Nigerian Naira)

## Schema aligned to PRD v1.0

## Files updated in schema alignment
- prisma/schema.prisma — all models and enums aligned to PRD
- src/types/index.ts — rewrote to export new enums
- src/app/api/reports/route.ts — per-room submission
- src/app/api/reports/generate/route.ts — new query shapes
- src/app/api/income/route.ts — source, recordDate, propertyId
- src/app/api/maintenance/route.ts — category, updated priority/status
- src/app/api/maintenance/[id]/route.ts — REPORTED/IN_PROGRESS/RESOLVED/CLOSED
- src/app/api/settings/rooms/route.ts — dailyRate
- src/app/api/settings/rooms/[id]/route.ts — dailyRate, OUT_OF_SERVICE
- src/components/forms/DailyReportForm.tsx — full rewrite, per-room
- src/components/forms/IncomeForm.tsx — recordDate, source, reference
- src/components/forms/MaintenanceForm.tsx — category, assignedTo, new priority
- src/components/MaintenanceFilterBar.tsx — new badge colors
- src/components/IncomeFilterBar.tsx — recordDate, source
- src/components/ReportFilterBar.tsx — per-room report display
- src/components/ReportGenerator.tsx — updated for all new fields
- src/components/PropertyManager.tsx — dailyRate
- src/app/(dashboard)/page.tsx — CRITICAL, REPORTED
- src/app/(dashboard)/reports/page.tsx — per-room query
- src/app/(dashboard)/maintenance/page.tsx — new enum values
- src/app/(dashboard)/income/page.tsx — source, recordDate
- src/app/(dashboard)/settings/properties/page.tsx — dailyRate
- src/app/submit/page.tsx — OUT_OF_SERVICE
- prisma/seed.ts — dailyRate

## Build Status

### Phase 1 — Complete
- [x] Project scaffold (package.json, configs)
- [x] Tailwind config with design tokens
- [x] Prisma schema (full, aligned to PRD v1.0)
- [x] Prisma client singleton
- [x] NextAuth v5 config with credentials provider
- [x] Root layout with providers + Inter font
- [x] Dashboard layout (auth guard + sidebar)
- [x] Dashboard overview page with StatCards
- [x] Sidebar with role-based nav
- [x] Topbar server component
- [x] UI components (Button, Badge, Card, StatCard)
- [x] Login page with form validation
- [x] Submit report layout (auth guard)
- [x] Stub pages: maintenance, income, reports, settings, submit forms
- [x] .env.example

### Phase 2 — Complete
- [x] Dashboard data fetching (real queries behind guards)
- [x] Daily report submission form (per-room occupancy, guest name/count)
- [x] Maintenance issue submission form (category, assignedTo, new priority)
- [x] Income record submission form (source, recordDate, reference)
- [x] Maintenance issue list with filter + inline status update
- [x] API: POST /api/reports (per-room, duplicate detection → 409)
- [x] API: POST /api/maintenance (category, assignedTo)
- [x] API: PATCH /api/maintenance/[id] (REPORTED→IN_PROGRESS→RESOLVED→CLOSED)
- [x] API: POST /api/income (source, recordDate, propertyId, verified)
- [x] Currency changed to NGN

### Phase 3 — Complete
- [x] Income view page with live data (property filter, payment filter, source filter, date range)
- [x] Report history page with missing report detection (7-day lookback)
- [x] Report generation page with type selection + date range + CSV export
- [x] Property management (CRUD + area/room sub-management)
- [x] User management (invite via email + role/property assignment)
- [x] API: POST /api/reports/generate (5 report types: occupancy, maintenance, income, guest, daily-ops)
- [x] API: GET/POST /api/settings/properties
- [x] API: PATCH /api/settings/properties/[id]
- [x] API: POST /api/settings/areas
- [x] API: POST /api/settings/rooms (dailyRate)
- [x] API: PATCH /api/settings/rooms/[id] (dailyRate, OUT_OF_SERVICE)
- [x] API: POST /api/settings/users/invite (with Resend email)
- [x] API: PATCH /api/settings/users/[id]

### Remaining
- [ ] Dashboard charts/analytics
- [ ] File upload for maintenance photos
- [ ] Middleware for role-based route protection
- [ ] Email templates for invite flow
- [ ] CSV import for bulk data

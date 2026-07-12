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
| components/forms/DailyReportForm.tsx | Yes  | Daily report submission form             |
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

## API Routes
| Method | Path                                  | Purpose                              |
|--------|---------------------------------------|--------------------------------------|
| POST   | /api/auth/[...nextauth]               | NextAuth v5                           |
| POST   | /api/reports                          | Submit daily report (duplicate 409)  |
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
- IncomeRecord has no `propertyId` — joins through `room → area → property`
- `(dashboard)/layout.tsx` handles auth guard — child pages get session for free
- Dashboard role filtering: SUPER_ADMIN sees all, others filtered by `propertyIds`
- Currency formatted in NGN (Nigerian Naira)
- DailyReport stores occupancy as JSON array `{ roomId, status, guestName? }`
- DailyReport stores supplies as JSON array `{ name, quantity }`

## Build Status

### Phase 1 — Complete
- [x] Project scaffold (package.json, configs)
- [x] Tailwind config with design tokens
- [x] Prisma schema (full)
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
- [x] Daily report submission form (occupancy table, supplies, notes)
- [x] Maintenance issue submission form (with property/room selection)
- [x] Income record submission form (with property/room selection)
- [x] Maintenance issue list with filter + inline status update
- [x] API: POST /api/reports (duplicate detection → 409)
- [x] API: POST /api/maintenance
- [x] API: PATCH /api/maintenance/[id] (STAFF → 403)
- [x] API: POST /api/income
- [x] Currency changed to NGN

### Phase 3 — Complete
- [x] Income view page with live data (property filter, payment filter, booking filter, date range)
- [x] Report history page with missing report detection (7-day lookback)
- [x] Report generation page with type selection + date range + CSV export
- [x] Property management (CRUD + area/room sub-management)
- [x] User management (invite via email + role/property assignment)
- [x] API: POST /api/reports/generate (5 report types: occupancy, maintenance, income, guest, daily-ops)
- [x] API: GET/POST /api/settings/properties
- [x] API: PATCH /api/settings/properties/[id]
- [x] API: POST /api/settings/areas
- [x] API: POST /api/settings/rooms
- [x] API: PATCH /api/settings/rooms/[id]
- [x] API: POST /api/settings/users/invite (with Resend email)
- [x] API: PATCH /api/settings/users/[id]

### Remaining
- [ ] Dashboard charts/analytics
- [ ] File upload for maintenance photos
- [ ] Middleware for role-based route protection
- [ ] Email templates for invite flow
- [ ] CSV import for bulk data

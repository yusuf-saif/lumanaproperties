# LUMANA Dashboard — Ground Truth

## Stack
- Next.js 14 (App Router, TypeScript strict)
- Tailwind CSS
- Prisma ORM (PostgreSQL)
- NextAuth.js v5 (Auth.js) — email/password + middleware
- Lucide React — icons
- React Hook Form + Zod — forms
- Resend — email (guarded, only when API key set)
- Recharts — dashboard charts
- PapaParse — CSV import

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
3. No hardcoded hex — Tailwind tokens only (recharts config objects are exempt)
4. No `transition: all`
5. No `any` types
6. `export const dynamic = 'force-dynamic'` on all dashboard pages
7. `src/middleware.ts` handles auth (logged-in vs not) — role checks stay in page components

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
| components/forms/ForgotPasswordForm.tsx | Yes | Forgot password email form               |
| components/forms/ResetPasswordForm.tsx  | Yes | Reset password form with token           |
| components/MaintenanceActionPanel.tsx | Yes  | Maintenance assign + status actions       |
| components/Providers.tsx          | Yes     | SessionProvider wrapper                  |
| components/MaintenanceFilterBar.tsx | Yes   | Maintenance issue list + filter + status |
| components/IncomeFilterBar.tsx     | Yes    | Income records table + filter + CSV      |
| components/ReportFilterBar.tsx     | Yes    | Report history + missing reports + expand|
| components/ReportGenerator.tsx     | Yes    | Report type/config/generate/export       |
| components/PropertyManager.tsx     | Yes    | Property/area/room CRUD                  |
| components/RoomAvailabilityGrid.tsx | Yes   | Room availability grid with status cards |
| components/UserManager.tsx         | Yes    | User invite + role/property management   |
| components/layout/NotificationBell.tsx | Yes | Notification bell dropdown + mark read   |
| components/charts/OccupancyChart.tsx | Yes   | 7-day occupancy trend line chart         |
| components/charts/IncomeChart.tsx    | Yes    | 7-day revenue bar chart                  |
| components/charts/MaintenanceStatusChart.tsx | Yes | Maintenance by status pie chart  |
| components/layout/DashboardShell.tsx | Yes     | Client wrapper managing sidebar state     |
| components/forms/ChangePasswordForm.tsx | Yes | Change password form with validation      |
| components/IncomeImportModal.tsx       | Yes | CSV income import modal with result display|

## Lib Map
| File                  | Purpose                                    |
|-----------------------|--------------------------------------------|
| lib/prisma.ts         | Prisma client singleton                    |
| lib/auth.ts           | NextAuth v5 config, JWT callbacks, session |
| lib/utils/cn.ts       | clsx + tailwind-merge utility              |
| lib/utils/format.ts   | Currency, date, enum formatting            |
| lib/notifications.ts  | Server helpers: create notifications (try/catch) |
| lib/email.ts          | Centralized email sending with HTML templates |

## Prisma Models
User, Property, PropertyUser, Area, Room, DailyReport, MaintenanceIssue, InviteToken, PasswordResetToken, IncomeRecord, Notification

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
- **NotificationType:** REPORT_MISSING | MAINTENANCE_CRITICAL | MAINTENANCE_RESOLVED | MAINTENANCE_OVERDUE | INCOME_UNVERIFIED | USER_INVITED

## API Routes
| Method | Path                                  | Purpose                              |
|--------|---------------------------------------|--------------------------------------|
| POST   | /api/auth/[...nextauth]               | NextAuth v5                           |
| POST   | /api/reports                          | Submit daily report (per room, 409)  |
| POST   | /api/maintenance                      | Submit maintenance issue             |
| PATCH  | /api/maintenance/[id]                 | Update issue status                  |
| POST   | /api/income                           | Submit income record                 |
| POST   | /api/reports/generate                 | Generate report data by type (7 types) |
| GET    | /api/settings/properties              | List all properties (SUPER_ADMIN)    |
| POST   | /api/settings/properties              | Create property (SUPER_ADMIN)        |
| PATCH  | /api/settings/properties/[id]         | Update/archive property              |
| POST   | /api/settings/areas                   | Create area (SUPER_ADMIN)            |
| POST   | /api/settings/rooms                   | Create room (SUPER_ADMIN)            |
| PATCH  | /api/settings/rooms/[id]              | Update room status/details           |
| POST   | /api/settings/users/invite            | Send user invite email               |
| PATCH  | /api/settings/users/[id]              | Update user role/properties          |
| POST   | /api/auth/forgot-password             | Request password reset email         |
| POST   | /api/auth/reset-password              | Reset password with token            |
| PATCH  | /api/income/[id]                      | Verify/unverify income record        |
| GET    | /api/notifications                    | List user's notifications + unread count |
| PATCH  | /api/notifications/[id]               | Mark single notification as read     |
| POST   | /api/notifications/read-all           | Mark all user's notifications read   |
| POST   | /api/maintenance/upload               | Upload images, return base64 data URLs |
| POST   | /api/settings/rooms/import             | Bulk import rooms via CSV (SUPER_ADMIN) |
| PATCH  | /api/auth/password                      | Change password (auth required)          |
| GET    | /api/cron/maintenance-overdue           | Find critical issues > 24h, send alerts  |
| POST   | /api/income/import                      | Bulk import income records via CSV       |

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

### Phase 3.5 — Complete
- [x] Forgot password flow (request form, email via Resend, reset page)
- [x] PasswordResetToken model (1-hour expiry, single use, crypto.randomBytes token)
- [x] Reset password page with token validation
- [x] Login page: added forgot password link
- [x] Auth guard: whitelist /forgot-password and /reset-password for unauthenticated users
- [x] InviteToken token switched to crypto.randomBytes(32).toString('hex')
- [x] Maintenance detail page: full issue view with timeline, photos, resolution notes
- [x] MaintenanceActionPanel: assign to user, update status with resolution notes
- [x] Maintenance board rows now link to detail page
- [x] Income verification: verify/unverify per record (manager only)
- [x] API: PATCH /api/income/[id] for verification toggle
- [x] Pending verification StatCard on income dashboard

### Phase 4 — Complete
- [x] Properties list page with occupancy stats, room/area counts, "View Availability" button
- [x] Properties/[id] room availability grid by date with date navigation arrows
- [x] RoomAvailabilityGrid component: per-area sections, room cards with live status + report status, clickable for detail panel, quick status update (manager only)
- [x] Sidebar: Properties nav item (Building2 icon, SUPER_ADMIN + PROPERTY_MANAGER only)
- [x] Settings/properties page: "View Availability" link added per property
- [x] Staff performance report (staff-performance): per-staff summary with submitted/assigned/resolved counts
- [x] Consolidated summary report (consolidated-summary): overview cards + section tables + highlights/lowlights
- [x] ReportGenerator: all 7 report types supported, non-table renderer for consolidated-summary
- [x] API: POST /api/reports/generate — staff-performance and consolidated-summary cases added

### Phase 4.5 — Complete
- [x] Notification model: 6 types (REPORT_MISSING, MAINTENANCE_CRITICAL, MAINTENANCE_RESOLVED, MAINTENANCE_OVERDUE, INCOME_UNVERIFIED, USER_INVITED), per-user, read/unread state, indexed
- [x] notifications.ts: server helpers for critical/resolved/missing/income notifications (all try/catch)
- [x] Wired into maintenance POST (CRITICAL/HIGH → managers+admins), maintenance PATCH (RESOLVED → reporter), income POST (managers+admins)
- [x] NotificationBell: dropdown panel, unread count badge, mark all read, 60s auto-refresh
- [x] Topbar: server-side unread count fetch, passes to NotificationBell
- [x] API: GET /api/notifications (list + unread count), PATCH /api/notifications/[id] (mark read), POST /api/notifications/read-all
- [x] MaintenanceForm: photo upload with client-side canvas compression (800px, 0.7 quality), 3-photo max, preview thumbnails with remove
- [x] API: POST /api/maintenance/upload — validates JPEG/PNG, 2MB limit, returns base64 data URLs
- [x] Maintenance detail page: photo styling updated (max-h-48 object-cover)

### Phase 5 — Complete
- [x] src/middleware.ts: NextAuth v5 middleware, protects all routes except auth pages and static files
- [x] Simplified authorized callback in auth.ts — middleware handles redirects now
- [x] Dashboard charts: 7-day occupancy line chart, 7-day revenue bar chart, maintenance status pie chart (recharts)
- [x] OccupancyChart, IncomeChart, MaintenanceStatusChart client components
- [x] Bulk room CSV import: /api/settings/rooms/import (SUPER_ADMIN only, papaparse, validation, bulk create)
- [x] PropertyManager: Import Rooms button per area with modal, CSV upload, result display, tree refresh

### Phase 5.5 — Complete
- [x] Profile page: /profile with user info card (name, email, role, phone, member since)
- [x] ChangePasswordForm: current + new + confirm fields, show/hide toggle, client validation
- [x] API: PATCH /api/auth/password — bcrypt verify + hash, auth-gated
- [x] Sidebar: Profile link (UserCircle icon, all roles, bottom near logout)
- [x] VIEWER guards: POST /api/reports, POST /api/maintenance, PATCH /api/maintenance/[id] all block VIEWER role
- [x] Mobile sidebar: DashboardShell client component manages sidebar open/close state
- [x] Sidebar: mobile slide-in overlay with backdrop, hidden on lg+, desktop unchanged
- [x] Topbar: hamburger Menu button (lg:hidden), passes onMenuClick to DashboardShell
- [x] NotificationBell: initialUnreadCount optional (defaults 0), fetches on mount
- [x] Dashboard layout: simplified to SessionProvider + DashboardShell (server component preserved)

### Phase 6 — Complete
- [x] src/lib/email.ts: centralized email sending with HTML templates (invite, password reset, maintenance alert)
- [x] Invite route updated to use sendInviteEmail
- [x] Forgot-password route updated to use sendPasswordResetEmail
- [x] Maintenance POST wired to sendMaintenanceAlertEmail (one email per manager)
- [x] notifyMaintenanceOverdue helper added to notifications.ts
- [x] GET /api/cron/maintenance-overdue: finds critical issues > 24h unresolved, creates overdue notifications, sends alert emails
- [x] POST /api/income/import: CSV bulk import (papaparse, validation, createMany)
- [x] IncomeImportModal: client component with file picker, result display, router.refresh on success
- [x] Income page: Import button for SUPER_ADMIN + PROPERTY_MANAGER
- [x] .env.example: added CRON_SECRET, FROM_EMAIL

### Remaining
- [ ] Railway deploy verification + QA
- [ ] Email templates for invite flow (✅ done — HTML templates in email.ts)
- [ ] Escalation alert if Critical issue unresolved > 24 hours (✅ done — /api/cron/maintenance-overdue)
- [ ] Bulk income CSV import (✅ done — /api/income/import)
- [ ] Role-based middleware enforcement (currently auth-only, role checks in pages)

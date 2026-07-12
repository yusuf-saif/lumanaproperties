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
| File                          | Client? | Purpose                             |
|-------------------------------|---------|-------------------------------------|
| components/layout/Sidebar.tsx | Yes     | Fixed sidebar, nav, logout          |
| components/layout/Topbar.tsx  | No      | Page header with title + user info  |
| components/ui/StatCard.tsx    | No      | Dashboard stat card                 |
| components/ui/Badge.tsx       | No      | Colour-coded pill badge             |
| components/ui/Button.tsx      | No      | Reusable button component           |
| components/ui/Card.tsx        | No      | Reusable card wrapper               |
| components/forms/LoginForm.tsx| Yes     | Login form with validation          |
| components/Providers.tsx      | Yes     | SessionProvider wrapper              |

## Lib Map
| File                  | Purpose                                    |
|-----------------------|--------------------------------------------|
| lib/prisma.ts         | Prisma client singleton                    |
| lib/auth.ts           | NextAuth v5 config, JWT callbacks, session |
| lib/utils/cn.ts       | clsx + tailwind-merge utility              |
| lib/utils/format.ts   | Currency, date, enum formatting            |

## Prisma Models
User, Property, PropertyUser, Area, Room, DailyReport, MaintenanceIssue, InviteToken, IncomeRecord

## Build Status

### Phase 1 — In Progress
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

### Remaining
- [ ] Dashboard data fetching (real queries behind guards)
- [ ] Maintenance issue CRUD
- [ ] Income record CRUD
- [ ] Daily report submission form
- [ ] Property/area/room management
- [ ] User invite system
- [ ] Email integration (Resend)
- [ ] Middleware for role-based route protection
- [ ] File upload for maintenance photos
- [ ] Charts/analytics on dashboard

# Lumana Hotel Apartments — Operations Intelligence Dashboard
## Product Requirements Document

> Version 1.0 · June 2025 · DRAFT
> Prepared by: Mainheart.co (SternLabsng) · Product Owner: Yusuf Saifur-Rahman

---

## 1. Product Overview

Lumana Hotel Apartments operates serviced apartment properties across Lagos, Nigeria. Daily operations — room status, maintenance, income, and guest activity — are currently tracked in Word documents and WhatsApp messages. This creates data silos, delays reporting, and makes it impossible to get a real-time view of property performance.

> **PROBLEM:** Daily Word documents are unstructured, version-control is non-existent, and consolidated reporting requires manual compilation that takes hours each week. Property managers lack visibility into cross-property performance, maintenance issues are tracked informally, and income reconciliation is error-prone.

> **SOLUTION:** A structured submission system with role-based access, real-time dashboards, and automated report generation. Staff submit daily reports through a clean web interface. Managers see live dashboards with occupancy, maintenance, and income views. All data flows into exportable reports for ownership review.

---

## 2. Goals & Success Metrics

### 2.1 Primary Goals

1. **Centralise Operations Data** — replace Word docs and WhatsApp with a single source of truth for all property activity
2. **Enable Real-Time Visibility** — give property managers and ownership instant access to occupancy, maintenance, and income dashboards
3. **Standardise Daily Reporting** — enforce structured submissions so every property reports the same data points every day
4. **Accelerate Maintenance Resolution** — track issues from report to resolution with escalation and SLA visibility
5. **Automate Financial Tracking** — record daily income per room with category breakdowns and reconciliation support
6. **Generate Actionable Reports** — produce PDF and CSV reports on occupancy, maintenance, income, and staff performance with minimal manual effort

### 2.2 Success Metrics

| Metric | Target |
|--------|--------|
| Daily report submission rate | ≥ 95% of active rooms reported daily by Week 4 |
| Report generation time | From 2+ hours manual to < 30 seconds automated |
| Maintenance issue resolution time | Average < 48 hours from report to closed |
| Data completeness | ≥ 90% of required fields populated across all submissions |
| User adoption | 100% of staff using dashboard within 2 weeks of launch |
| Dashboard load time | < 2 seconds for all primary views |

---

## 3. Users & Roles

The system supports four distinct roles with progressive access levels. Each role inherits the permissions of roles below it.

| Role | Access Scope | Key Permissions | Typical User |
|------|-------------|-----------------|--------------|
| **Super Admin** | All properties, all data, all settings | Create/manage properties, manage all users, system configuration, export all reports, access audit logs | Yusuf (Owner), Operations Director |
| **Property Manager** | Assigned properties only | Submit/approve reports, manage staff, view dashboards for assigned properties, log and assign maintenance, view income for assigned properties | Senior operations staff per property |
| **Staff / Operator** | Assigned property, own submissions | Submit daily reports, log maintenance issues, record income entries, view own submission history | Front desk, housekeeping leads, on-site operators |
| **Viewer** | Read-only, assigned properties | View dashboards, view reports, export reports (no edits, no submissions) | Ownership, investors, external auditors |

---

## 4. Property Hierarchy & Data Model

### 4.1 Hierarchy

> **STRUCTURE:** Organisation → Property → Area → Room

| Level | Description & Examples |
|-------|----------------------|
| **Organisation** | Lumana Hotel Apartments (top-level entity) |
| **Property** | Individual hotel apartment buildings — e.g., "Lumana Lekki", "Lumana Victoria Island" |
| **Area** | Functional zones within a property — e.g., "Block A", "Pool Wing", "Rooftop Level" |
| **Room** | Individual rentable units — e.g., "Studio 101", "2BR Suite 205" |

### 4.2 Core Data Models

#### Room

| Field | Type / Notes |
|-------|-------------|
| `id` | UUID — primary key |
| `property_id` | UUID — foreign key to Property |
| `area_id` | UUID — foreign key to Area (nullable) |
| `room_number` | String — display identifier, e.g., "101", "2B-03" |
| `room_type` | Enum — Studio, 1-Bedroom, 2-Bedroom, Penthouse |
| `status` | Enum — Available, Occupied, Maintenance, Out of Service |
| `daily_rate` | Decimal — NGN, used for income calculations |
| `amenities` | JSON — optional structured amenities list |
| `created_at` | Timestamp — auto |

#### Daily Report

| Field | Type / Notes |
|-------|-------------|
| `id` | UUID — primary key |
| `property_id` | UUID — foreign key to Property |
| `room_id` | UUID — foreign key to Room |
| `report_date` | Date — the calendar date the report covers |
| `occupancy_status` | Enum — Occupied, Vacant, Checkout, No-Show |
| `guest_name` | String — nullable, populated if occupied |
| `guest_count` | Integer — number of guests in room |
| `notes` | Text — optional free-text observations |
| `submitted_by` | UUID — foreign key to User (staff who submitted) |

#### Maintenance Issue

| Field | Type / Notes |
|-------|-------------|
| `id` | UUID — primary key |
| `property_id` | UUID — foreign key to Property |
| `room_id` | UUID — foreign key to Room (nullable for common areas) |
| `reported_by` | UUID — foreign key to User |
| `assigned_to` | UUID — foreign key to User (nullable until assigned) |
| `title` | String — short description, e.g., "AC not cooling" |
| `description` | Text — detailed issue description |
| `priority` | Enum — Low, Medium, High, Critical |
| `status` | Enum — Reported, In Progress, Resolved, Closed |
| `category` | Enum — Electrical, Plumbing, HVAC, Furniture, Appliance, Other |
| `photos` | JSON — array of photo URLs (up to 5) |
| `resolved_at` | Timestamp — nullable, set on resolution |
| `created_at` | Timestamp — auto |

#### Income Record

| Field | Type / Notes |
|-------|-------------|
| `id` | UUID — primary key |
| `property_id` | UUID — foreign key to Property |
| `room_id` | UUID — foreign key to Room |
| `record_date` | Date — the calendar date the income belongs to |
| `source` | Enum — Accommodation, Minibar, Laundry, Service Charge, Other |
| `amount` | Decimal — NGN |
| `payment_method` | Enum — Cash, Card, Transfer, POS |
| `guest_name` | String — nullable, associated guest |
| `reference` | String — optional transaction reference |
| `recorded_by` | UUID — foreign key to User |
| `verified` | Boolean — default false, set by manager on reconciliation |
| `created_at` | Timestamp — auto |

---

## 5. Feature Specifications

### 5.1 Property & Room Management

- Super Admin can create, edit, and deactivate properties
- Each property has a name, address, contact details, and operational status
- Areas are defined per property to group rooms by floor, wing, or zone
- Rooms are created within areas with type, number, daily rate, and status
- Room status is editable from the dashboard (Available, Occupied, Maintenance, Out of Service)
- Bulk room import via CSV upload for initial setup
- Room availability grid view showing all rooms across a property for any given date

### 5.2 User Management

- Super Admin manages all user accounts from a central user management screen
- Users are assigned a role (Super Admin, Property Manager, Staff, Viewer)
- Property Manager and Staff roles are scoped to one or more properties
- User invitations are sent via email with a setup link
- Users can update their own profile (name, phone, password)
- Account status toggle: Active / Suspended
- Last login timestamp tracked for audit purposes

### 5.3 Daily Report Submission

- Staff submit one report per room per day via a guided form
- Form fields: room selector, date, occupancy status, guest name, guest count, notes
- Guest name and guest count are required only when occupancy status is "Occupied"
- Reports can be submitted for today or backdated up to 3 days (with reason)
- Duplicate detection: system warns if a report already exists for that room + date
- Bulk submission mode: staff can submit reports for multiple rooms in sequence without returning to the dashboard
- Submission timestamp is automatically recorded
- Manager can view, edit, and approve/reject reports submitted by their staff

### 5.4 Maintenance Issue Logging

- Any staff member can log a maintenance issue from the dashboard or mobile
- Required fields: title, description, priority, category, room (or common area)
- Optional: photo upload (up to 5 images, compressed automatically)
- Issues are assigned to a team member by the Property Manager
- Status transitions: Reported → In Progress → Resolved → Closed
- Priority-based sorting with visual indicators (Critical = red, High = orange)
- Escalation alert if a Critical issue remains unresolved for > 24 hours
- Maintenance board view: Kanban-style columns for each status
- Filter by property, priority, category, assignee, and date range
- Resolution notes required when marking an issue as Resolved

### 5.5 Income Recording

- Staff record income per room per day with source category and amount
- Source categories: Accommodation, Minibar, Laundry, Service Charge, Other
- Payment method tracking: Cash, Card, Transfer, POS
- Optional reference number for reconciliation
- Manager reconciliation view: unverified entries flagged for review
- One-click verification per entry or bulk verify by date/room
- Daily income summary auto-calculated per property
- Discrepancy alerts when recorded income deviates from expected rate

### 6.6 Admin Dashboard

#### Overview Panel
- Cross-property summary cards: total rooms, occupancy rate, open issues, today's income
- Occupancy trend chart (last 7 days and 30 days)
- Top 5 open maintenance issues by priority
- Recent submission activity feed

#### Property View
- Single-property dashboard with room grid and status breakdown
- Occupancy rate vs target gauge
- Income vs target bar chart (daily, weekly, monthly)
- Staff submission compliance tracker (who submitted, who didn't)

#### Maintenance Board
- Kanban board: Reported → In Progress → Resolved → Closed
- Card details: room, priority badge, age in hours, assignee avatar
- Drag-and-drop status updates
- Filters: property, priority, category, assignee, date range

#### Income View
- Daily, weekly, monthly income tables with totals
- Breakdown by source category
- Breakdown by payment method
- Verification status: pending / verified toggle
- Export-ready summary for accounting

#### Report History
- Log of all submitted daily reports with filters
- View individual report details
- Edit / approve / reject actions for managers
- Export filtered results as CSV

---

## 6. Report Generation

All reports support **PDF** and **CSV** export. Reports respect the user's role-based access scope.

| Report Type | Filters | Output |
|-------------|---------|--------|
| **Occupancy Report** | Property, date range, room type | Occupancy rate, room-nights sold, average occupancy by room type, trend chart |
| **Maintenance Report** | Property, date range, priority, category | Open/closed counts, average resolution time, aging analysis, cost estimate |
| **Income Report** | Property, date range, source, payment method | Total income, breakdown by source, breakdown by method, daily trend |
| **Staff Performance** | Property, date range, staff member | Submission count, submission timeliness, issues reported, issues resolved |
| **Guest Activity** | Property, date range | Guest count, average stay length, repeat guest rate, nationality breakdown (if captured) |
| **Consolidated Summary** | Property (or all), date range | One-page executive summary: occupancy, maintenance, income, highlights, and lowlights |

---

## 7. Notifications

Notifications are **in-app only** in V1. Email and WhatsApp delivery planned for V2.

| Event | Who is Notified |
|-------|----------------|
| Daily report not submitted by 6 PM | Property Manager for that property |
| Maintenance issue reported (Critical or High priority) | Property Manager + assigned maintenance staff |
| Maintenance issue unresolved > 24 hours (Critical) | Property Manager + Super Admin |
| Maintenance issue marked Resolved | Staff who reported the issue |
| Income discrepancy detected | Property Manager + Super Admin |
| New user invitation sent | The invited user |

---

## 8. Recommended Tech Stack

| Layer | Recommendation & Rationale |
|-------|---------------------------|
| **Frontend** | Next.js 14 (App Router) — SSR for dashboards, fast page loads, strong ecosystem |
| **Backend / API** | Next.js API Routes + Supabase Edge Functions — serverless, scales automatically |
| **Database** | Supabase (PostgreSQL) — managed, real-time subscriptions, built-in auth |
| **Authentication** | Supabase Auth — email/password, role-based access, JWT tokens |
| **File Storage** | Supabase Storage — for maintenance photos, report exports, user avatars |
| **Hosting** | Vercel — zero-config Next.js deployment, preview branches, analytics |
| **Styling** | Tailwind CSS — utility-first, rapid UI development, consistent design tokens |
| **Charts** | Recharts — lightweight, composable React charts for dashboards |
| **PDF Generation** | @react-pdf/renderer or Puppeteer — server-side PDF export for reports |

> **⚠ WARNING:** Supabase Row Level Security (RLS) policies must be enforced at the database level, not just the application layer. Every table must have RLS enabled with policies that match the role-based access model defined in Section 3. No service-role keys should be exposed to the client bundle.

---

## 9. Screen Inventory

| Screen | Route | Role Access |
|--------|-------|-------------|
| Login | `/login` | All |
| Forgot Password | `/forgot-password` | All |
| Dashboard Overview | `/dashboard` | All (filtered by role) |
| Property List | `/dashboard/properties` | Super Admin |
| Property Detail | `/dashboard/properties/[id]` | Super Admin, Property Manager |
| Room Management | `/dashboard/properties/[id]/rooms` | Super Admin, Property Manager |
| Room Detail | `/dashboard/properties/[id]/rooms/[roomId]` | Super Admin, Property Manager, Staff |
| Daily Report Form | `/dashboard/reports/new` | Staff |
| Daily Report History | `/dashboard/reports` | All (filtered by scope) |
| Daily Report Detail | `/dashboard/reports/[id]` | All (filtered by scope) |
| Maintenance Board | `/dashboard/maintenance` | All (filtered by scope) |
| Maintenance Issue Detail | `/dashboard/maintenance/[id]` | All (filtered by scope) |
| New Maintenance Issue | `/dashboard/maintenance/new` | Staff, Property Manager |
| Income Recording | `/dashboard/income/new` | Staff |
| Income Ledger | `/dashboard/income` | All (filtered by scope) |
| Reports & Exports | `/dashboard/reports-exports` | All (filtered by scope) |
| User Management | `/dashboard/users` | Super Admin |
| Settings | `/dashboard/settings` | Super Admin, Property Manager |

---

## 10. Build Phases

### Phase 1 — Foundation (Week 1–2)

- Project scaffolding: Next.js 14 + Supabase + Tailwind setup
- Database schema design and migration (all core tables)
- Supabase RLS policies for all four roles
- Authentication flow: login, forgot password, session management
- Property and room CRUD (Super Admin)
- User management screen (Super Admin)
- Layout shell: sidebar navigation, top bar, responsive layout

### Phase 2 — Submission & Tracking (Week 3–4)

- Daily report submission form with validation
- Bulk submission mode for staff
- Report history and detail views
- Maintenance issue logging with photo upload
- Maintenance board (Kanban) with drag-and-drop
- Income recording form with category and method
- Income ledger with verification workflow

### Phase 3 — Dashboard & Reports (Week 5–6)

- Dashboard overview panel with summary cards and charts
- Property-level dashboard with occupancy and income views
- Occupancy report generation (PDF + CSV)
- Maintenance report generation (PDF + CSV)
- Income report generation (PDF + CSV)
- Staff performance report (PDF + CSV)
- Guest activity report (PDF + CSV)
- Consolidated summary report (PDF + CSV)
- In-app notification system

### Phase 4 — QA & Launch (Week 7)

- End-to-end testing across all roles
- Mobile responsiveness testing (staff use on phones)
- Performance optimisation (Lighthouse audit)
- Data seeding with sample properties and rooms
- User acceptance testing with property manager
- Documentation and handover
- Production deployment to Vercel
- DNS and custom domain setup

> **V2 ROADMAP (post-launch):** Email notifications, WhatsApp integration for alerts, advanced analytics with trends and forecasting, mobile app (React Native or PWA), multi-organisation support, accounting system integration, API for third-party PMS systems.

---

## 11. Open Questions

| # | Question | Owner |
|---|----------|-------|
| 1 | Should guest nationality be a tracked field, or is guest count sufficient for V1? | Yusuf |
| 2 | What is the maximum number of properties expected within the next 12 months? | Yusuf |
| 3 | Should income records support multi-currency (USD/GBP) for international guests, or NGN only? | Yusuf |
| 4 | Is there an existing branding guideline or logo for Lumana, or should we design from scratch? | Yusuf |
| 5 | Should staff submission compliance include GPS/location verification for on-site staff? | Yusuf |
| 6 | What accounting software does Lumana currently use, and should V1 include any integration? | Yusuf |

---

## 12. Timeline & Investment

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1 — Foundation | Week 1–2 | Auth, DB schema, property/room CRUD, user management, layout shell |
| Phase 2 — Submission & Tracking | Week 3–4 | Daily reports, maintenance board, income recording, all submission flows |
| Phase 3 — Dashboard & Reports | Week 5–6 | Dashboards, 6 report types with PDF/CSV, in-app notifications |
| Phase 4 — QA & Launch | Week 7 | Testing, UAT, performance, deployment, handover |
| **Total** | **7 weeks** | **Fully functional Operations Intelligence Dashboard** |

> A detailed Statement of Work (SOW) with milestones, payment terms, and revision policy will be provided as a separate document before project commencement.
import Topbar from '@/components/layout/Topbar'

export const dynamic = 'force-dynamic'

export default function UsersPage() {
  return (
    <div>
      <Topbar title="Users" />
      <div className="p-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-text-main">
            User Management
          </h2>
          <p className="mt-4 text-sm text-text-sub">
            User invite and role management coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}

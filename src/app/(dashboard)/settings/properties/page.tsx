import Topbar from '@/components/layout/Topbar'

export const dynamic = 'force-dynamic'

export default function PropertiesPage() {
  return (
    <div>
      <Topbar title="Properties" />
      <div className="p-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-text-main">
            Property Management
          </h2>
          <p className="mt-4 text-sm text-text-sub">
            Property configuration and area/room management coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}

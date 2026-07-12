import Topbar from '@/components/layout/Topbar'

export const dynamic = 'force-dynamic'

export default function SubmitMaintenancePage() {
  return (
    <div>
      <Topbar title="Report Maintenance Issue" />
      <div className="p-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-text-main">
            Maintenance Issue Form
          </h2>
          <p className="mt-4 text-sm text-text-sub">
            Maintenance reporting form coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}

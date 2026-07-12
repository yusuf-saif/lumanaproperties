import Topbar from '@/components/layout/Topbar'

export const dynamic = 'force-dynamic'

export default function IncomePage() {
  return (
    <div>
      <Topbar title="Income" />
      <div className="p-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-text-main">
            Income Records
          </h2>
          <p className="mt-4 text-sm text-text-sub">
            Income tracking and reporting coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}

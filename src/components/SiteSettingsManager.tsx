'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Save, Loader2, CheckCircle } from 'lucide-react'

interface SiteSettings {
  id: string
  orgName: string
  orgTagline: string | null
  reportFooter: string | null
}

export function SiteSettingsManager() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [orgName, setOrgName] = useState('')
  const [orgTagline, setOrgTagline] = useState('')
  const [reportFooter, setReportFooter] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings/site')
      .then((res) => res.json())
      .then((data) => {
        setSettings(data)
        setOrgName(data.orgName ?? '')
        setOrgTagline(data.orgTagline ?? '')
        setReportFooter(data.reportFooter ?? '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)

    try {
      const res = await fetch('/api/settings/site', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName, orgTagline, reportFooter }),
      })

      if (res.ok) {
        const updated = await res.json()
        setSettings(updated)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-border rounded" />
          <div className="h-10 w-full bg-border rounded" />
          <div className="h-10 w-full bg-border rounded" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="font-medium text-text-main mb-4">Site Settings</h3>
      <p className="text-sm text-text-sub mb-4">
        Configure organization details used in reports and PDF exports.
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-text-sub mb-1 block">
            Organization Name
          </label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Lumana Hotel Apartments"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-text-sub mb-1 block">
            Report Tagline
          </label>
          <input
            type="text"
            value={orgTagline}
            onChange={(e) => setOrgTagline(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Optional tagline for reports"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-text-sub mb-1 block">
            Report Footer
          </label>
          <textarea
            value={reportFooter}
            onChange={(e) => setReportFooter(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={2}
            placeholder="Optional footer text for PDF reports"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}

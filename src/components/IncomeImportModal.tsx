'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react'

export default function IncomeImportModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{
    created: number
    skipped: number
    errors: { row: number; message: string }[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleSubmit = async () => {
    if (!file) return

    setIsSubmitting(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/income/import', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        setResult({ created: 0, skipped: 0, errors: [{ row: 0, message: data.error || 'Import failed' }] })
        return
      }

      setResult({ created: data.created, skipped: data.skipped, errors: data.errors ?? [] })
      if (data.created > 0) {
        router.refresh()
      }
    } catch {
      setResult({ created: 0, skipped: 0, errors: [{ row: 0, message: 'Network error. Please try again.' }] })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setFile(null)
    setResult(null)
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="ghost" size="sm">
        <Upload size={16} className="mr-1.5" />
        Import Income
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
          <div className="relative mx-4 w-full max-w-lg rounded-xl bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-main">Import Income Records</h3>
              <button onClick={handleClose} className="rounded-lg p-1 text-text-sub hover:bg-surface">
                <X size={18} />
              </button>
            </div>

            {!result ? (
              <>
                <div className="mb-4 rounded-lg bg-surface p-4">
                  <p className="mb-2 text-sm font-medium text-text-main">Expected CSV format:</p>
                  <code className="block whitespace-pre text-xs text-text-sub">
{`roomId,amount,paymentMethod,source,recordDate,guestName,reference,notes
room-id,25000,CASH,ACCOMMODATION,2025-07-13,John Doe,,`}
                  </code>
                  <p className="mt-2 text-xs text-text-sub">
                    paymentMethod: CASH | CARD | TRANSFER | POS | ONLINE
                  </p>
                  <p className="text-xs text-text-sub">
                    source: ACCOMMODATION | MINIBAR | LAUNDRY | SERVICE_CHARGE | OTHER
                  </p>
                </div>

                <div className="mb-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-sm text-text-sub hover:border-primary hover:text-primary"
                  >
                    <Upload size={18} />
                    {file ? file.name : 'Choose CSV file'}
                  </button>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={handleClose} size="sm">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} loading={isSubmitting} disabled={!file} size="sm">
                    Import
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  {result.created > 0 && (
                    <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3">
                      <CheckCircle size={16} className="text-success" />
                      <p className="text-sm font-medium text-success">
                        {result.created} record{result.created !== 1 ? 's' : ''} created
                      </p>
                    </div>
                  )}
                  {result.skipped > 0 && (
                    <div className="flex items-center gap-2 rounded-lg bg-warning/10 p-3">
                      <AlertCircle size={16} className="text-warning" />
                      <p className="text-sm font-medium text-warning">
                        {result.skipped} row{result.skipped !== 1 ? 's' : ''} skipped
                      </p>
                    </div>
                  )}
                  {result.errors.length > 0 && (
                    <div className="max-h-48 overflow-y-auto rounded-lg bg-surface p-3">
                      <p className="mb-2 text-xs font-medium text-text-sub">Errors:</p>
                      <ul className="space-y-1">
                        {result.errors.map((err, i) => (
                          <li key={i} className="text-xs text-danger">
                            {err.row > 0 ? `Row ${err.row}: ` : ''}{err.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-end">
                  <Button onClick={handleClose} size="sm">
                    Done
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

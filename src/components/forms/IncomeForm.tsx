'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import type { PaymentMethod, IncomeSource } from '@prisma/client'

interface Room {
  id: string
  name: string
}

interface Property {
  id: string
  name: string
  rooms: Room[]
}

interface IncomeFormProps {
  properties: Property[]
}

const today = () => new Date().toISOString().split('T')[0]

export default function IncomeForm({ properties }: IncomeFormProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    properties.length === 1 ? properties[0].id : ''
  )
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [source, setSource] = useState<IncomeSource>('ACCOMMODATION')
  const [recordDate, setRecordDate] = useState(today())
  const [guestName, setGuestName] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const filteredRooms = useMemo(() => {
    const prop = properties.find((p) => p.id === selectedPropertyId)
    return prop?.rooms ?? []
  }, [properties, selectedPropertyId])

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId)
    setSelectedRoomId('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      const res = await fetch('/api/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoomId,
          propertyId: selectedPropertyId,
          amount: parseFloat(amount),
          paymentMethod,
          source,
          recordDate,
          guestName: guestName.trim() || undefined,
          reference: reference.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to record income')
        return
      }

      setSuccessMsg('Income recorded successfully!')
      setAmount('')
      setSelectedRoomId('')
      setGuestName('')
      setReference('')
      setNotes('')
      setPaymentMethod('CASH')
      setSource('ACCOMMODATION')
      setRecordDate(today())
    } catch {
      setErrorMsg('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {successMsg && (
        <div className="rounded-lg bg-success/10 p-4">
          <p className="text-sm font-medium text-success">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-lg bg-danger/10 p-4">
          <p className="text-sm font-medium text-danger">{errorMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="property" className="block text-sm font-medium text-text-main">
            Property
          </label>
          <select
            id="property"
            value={selectedPropertyId}
            onChange={(e) => handlePropertyChange(e.target.value)}
            disabled={properties.length === 1}
            className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
          >
            <option value="">Select a property</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="room" className="block text-sm font-medium text-text-main">
            Room
          </label>
          <select
            id="room"
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            disabled={!selectedPropertyId}
            className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
          >
            <option value="">Select a room</option>
            {filteredRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-text-main">
            Amount (NGN)
          </label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={0}
            step="0.01"
            required
            placeholder="0.00"
            className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main placeholder:text-text-sub focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="recordDate" className="block text-sm font-medium text-text-main">
            Record Date
          </label>
          <input
            id="recordDate"
            type="date"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-text-main">
            Payment Method
          </label>
          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="TRANSFER">Transfer</option>
            <option value="POS">POS</option>
            <option value="ONLINE">Online</option>
          </select>
        </div>

        <div>
          <label htmlFor="source" className="block text-sm font-medium text-text-main">
            Source
          </label>
          <select
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value as IncomeSource)}
            className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ACCOMMODATION">Accommodation</option>
            <option value="MINIBAR">Minibar</option>
            <option value="LAUNDRY">Laundry</option>
            <option value="SERVICE_CHARGE">Service Charge</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="guestName" className="block text-sm font-medium text-text-main">
            Guest Name
          </label>
          <input
            id="guestName"
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Optional guest name"
            className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main placeholder:text-text-sub focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="reference" className="block text-sm font-medium text-text-main">
            Reference
          </label>
          <input
            id="reference"
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Optional transaction reference"
            className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main placeholder:text-text-sub focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label htmlFor="incomeNotes" className="block text-sm font-medium text-text-main">
          Notes
        </label>
        <textarea
          id="incomeNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Optional notes..."
          className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main placeholder:text-text-sub focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting} size="lg">
          Record Income
        </Button>
      </div>
    </form>
  )
}

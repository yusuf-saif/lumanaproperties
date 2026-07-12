'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import type { PaymentMethod, BookingSource } from '@prisma/client'

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
  const [bookingSource, setBookingSource] = useState<BookingSource>('DIRECT')
  const [checkInDate, setCheckInDate] = useState(today())
  const [checkOutDate, setCheckOutDate] = useState('')
  const [guestName, setGuestName] = useState('')
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
          amount: parseFloat(amount),
          paymentMethod,
          bookingSource,
          checkInDate,
          checkOutDate,
          guestName: guestName.trim() || undefined,
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
      setNotes('')
      setCheckOutDate('')
      setPaymentMethod('CASH')
      setBookingSource('DIRECT')
      setCheckInDate(today())
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
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CARD">Card</option>
            <option value="ONLINE">Online</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="bookingSource" className="block text-sm font-medium text-text-main">
            Booking Source
          </label>
          <select
            id="bookingSource"
            value={bookingSource}
            onChange={(e) => setBookingSource(e.target.value as BookingSource)}
            className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="DIRECT">Direct</option>
            <option value="AIRBNB">Airbnb</option>
            <option value="BOOKING_COM">Booking.com</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

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
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="checkInDate" className="block text-sm font-medium text-text-main">
            Check-in Date
          </label>
          <input
            id="checkInDate"
            type="date"
            value={checkInDate}
            onChange={(e) => setCheckInDate(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="checkOutDate" className="block text-sm font-medium text-text-main">
            Check-out Date
          </label>
          <input
            id="checkOutDate"
            type="date"
            value={checkOutDate}
            onChange={(e) => setCheckOutDate(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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

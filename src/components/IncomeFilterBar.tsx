'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatEnum } from '@/lib/utils/format'
import { DollarSign, Download, Calendar } from 'lucide-react'

interface IncomeRecord {
  id: string
  amount: number
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'ONLINE'
  bookingSource: 'DIRECT' | 'BOOKING_COM' | 'AIRBNB' | 'OTHER'
  guestName: string | null
  checkInDate: string
  checkOutDate: string
  notes: string | null
  createdAt: string
  property: string
  room: string
  recordedBy: string
}

interface IncomeFilterBarProps {
  records: IncomeRecord[]
  properties: Array<{ id: string; name: string }>
}

function startOfMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function today(): string {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

export function IncomeFilterBar({ records, properties }: IncomeFilterBarProps) {
  const [propertyFilter, setPropertyFilter] = useState<string>('ALL')
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL')
  const [bookingFilter, setBookingFilter] = useState<string>('ALL')
  const [dateFrom, setDateFrom] = useState(startOfMonth())
  const [dateTo, setDateTo] = useState(today())

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (propertyFilter !== 'ALL' && r.property !== propertyFilter) return false
      if (paymentFilter !== 'ALL' && r.paymentMethod !== paymentFilter) return false
      if (bookingFilter !== 'ALL' && r.bookingSource !== bookingFilter) return false
      const created = r.createdAt.split('T')[0]
      if (created < dateFrom || created > dateTo) return false
      return true
    })
  }, [records, propertyFilter, paymentFilter, bookingFilter, dateFrom, dateTo])

  const totalIncome = filtered.reduce((sum, r) => sum + r.amount, 0)
  const thisMonth = records.filter((r) => {
    const d = new Date(r.createdAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const thisMonthTotal = thisMonth.reduce((sum, r) => sum + r.amount, 0)

  const lastMonth = records.filter((r) => {
    const d = new Date(r.createdAt)
    const now = new Date()
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear()
  })
  const lastMonthTotal = lastMonth.reduce((sum, r) => sum + r.amount, 0)

  const ytd = records.filter((r) => {
    const d = new Date(r.createdAt)
    return d.getFullYear() === new Date().getFullYear()
  })
  const ytdTotal = ytd.reduce((sum, r) => sum + r.amount, 0)

  function exportCSV() {
    const headers = ['Date', 'Property', 'Room', 'Amount', 'Payment Method', 'Booking Source', 'Guest', 'Check-In', 'Check-Out', 'Recorded By']
    const rows = filtered.map((r) => [
      r.createdAt.split('T')[0],
      r.property,
      r.room,
      r.amount.toString(),
      r.paymentMethod,
      r.bookingSource,
      r.guestName ?? '',
      r.checkInDate,
      r.checkOutDate,
      r.recordedBy,
    ])
    const csv = [headers.join(','), ...rows.map((row) => row.map((c) => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `income-${dateFrom}-to-${dateTo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total" value={formatCurrency(totalIncome)} subtitle="Filtered" icon={<DollarSign />} color="success" />
        <StatCard title="This Month" value={formatCurrency(thisMonthTotal)} subtitle="Current month" icon={<Calendar />} color="primary" />
        <StatCard title="Last Month" value={formatCurrency(lastMonthTotal)} subtitle="Previous month" icon={<Calendar />} color="warning" />
        <StatCard title="YTD" value={formatCurrency(ytdTotal)} subtitle={new Date().getFullYear().toString()} icon={<DollarSign />} color="primary" />
      </div>

      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-sub">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-sub">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-sub">Property</label>
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ALL">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-sub">Payment</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ALL">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CARD">Card</option>
              <option value="ONLINE">Online</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-sub">Booking</label>
            <select
              value={bookingFilter}
              onChange={(e) => setBookingFilter(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ALL">All Sources</option>
              <option value="DIRECT">Direct</option>
              <option value="BOOKING_COM">Booking.com</option>
              <option value="AIRBNB">Airbnb</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <Button variant="ghost" size="sm" onClick={exportCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-border">
          <p className="text-sm text-text-sub">
            Showing {filtered.length} of {records.length} records
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Property</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Room</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Guest</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-sub">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Payment</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Source</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Check-In</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Check-Out</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-sub">Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-text-sub">
                    No income records match your filters
                  </td>
                </tr>
              ) : (
                filtered.map((record) => (
                  <tr key={record.id} className="border-b border-border hover:bg-surface transition-colors">
                    <td className="px-4 py-3 text-sm">{record.createdAt.split('T')[0]}</td>
                    <td className="px-4 py-3 text-sm font-medium">{record.property}</td>
                    <td className="px-4 py-3 text-sm">{record.room}</td>
                    <td className="px-4 py-3 text-sm">{record.guestName ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(record.amount)}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={record.paymentMethod === 'CASH' ? 'warning' : 'default'}>
                        {formatEnum(record.paymentMethod)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={record.bookingSource === 'DIRECT' ? 'success' : 'info'}>
                        {formatEnum(record.bookingSource)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{record.checkInDate}</td>
                    <td className="px-4 py-3 text-sm">{record.checkOutDate}</td>
                    <td className="px-4 py-3 text-sm text-text-sub">{record.recordedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyIncomeUnverified } from '@/lib/notifications'
import Papa from 'papaparse'

const VALID_PAYMENT_METHODS = ['CASH', 'CARD', 'TRANSFER', 'POS', 'ONLINE']
const VALID_INCOME_SOURCES = ['ACCOMMODATION', 'MINIBAR', 'LAUNDRY', 'SERVICE_CHARGE', 'OTHER']

interface CsvRow {
  roomId?: string
  amount?: string
  paymentMethod?: string
  source?: string
  recordDate?: string
  guestName?: string
  reference?: string
  notes?: string
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role === 'VIEWER' || session.user.role === 'STAFF') {
    return NextResponse.json(
      { error: 'Only Property Managers and Super Admins can import income records' },
      { status: 403 }
    )
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 })
  }

  const text = await file.text()
  const parsed = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })

  if (parsed.errors.length > 0) {
    return NextResponse.json(
      { error: 'CSV parsing failed', details: parsed.errors.map((e) => e.message) },
      { status: 400 }
    )
  }

  const rows = parsed.data
  const errors: { row: number; message: string }[] = []
  const validRows: {
    roomId: string
    amount: number
    paymentMethod: string
    source: string
    recordDate: Date
    guestName: string | null
    reference: string | null
    notes: string | null
    propertyId: string
    recordedById: string
  }[] = []

  const roomIds = Array.from(new Set(rows.map((r) => r.roomId).filter(Boolean))) as string[]
  const existingRooms = await prisma.room.findMany({
    where: { id: { in: roomIds } },
    select: { id: true, area: { select: { propertyId: true } } },
  })
  const roomMap = new Map(existingRooms.map((r) => [r.id, r]))

  const userPropertyIds = new Set(session.user.propertyIds ?? [])

  rows.forEach((row, index) => {
    const rowNum = index + 2

    if (!row.roomId?.trim()) {
      errors.push({ row: rowNum, message: 'Missing roomId' })
      return
    }

    const room = roomMap.get(row.roomId.trim())
    if (!room) {
      errors.push({ row: rowNum, message: `Room not found: ${row.roomId}` })
      return
    }

    const propertyId = room.area?.propertyId
    if (!propertyId) {
      errors.push({ row: rowNum, message: `Room ${row.roomId} has no valid area/property` })
      return
    }

    if (session.user.role !== 'SUPER_ADMIN' && !userPropertyIds.has(propertyId)) {
      errors.push({ row: rowNum, message: `Room ${row.roomId} is not in your assigned properties` })
      return
    }

    const amount = parseFloat(row.amount ?? '')
    if (isNaN(amount) || amount <= 0) {
      errors.push({ row: rowNum, message: `Invalid amount: ${row.amount}` })
      return
    }

    if (!row.paymentMethod || !VALID_PAYMENT_METHODS.includes(row.paymentMethod)) {
      errors.push({ row: rowNum, message: `Invalid paymentMethod: ${row.paymentMethod}. Must be one of: ${VALID_PAYMENT_METHODS.join(', ')}` })
      return
    }

    if (!row.source || !VALID_INCOME_SOURCES.includes(row.source)) {
      errors.push({ row: rowNum, message: `Invalid source: ${row.source}. Must be one of: ${VALID_INCOME_SOURCES.join(', ')}` })
      return
    }

    const recordDate = new Date(row.recordDate ?? '')
    if (isNaN(recordDate.getTime())) {
      errors.push({ row: rowNum, message: `Invalid recordDate: ${row.recordDate}. Use YYYY-MM-DD format.` })
      return
    }

    validRows.push({
      roomId: row.roomId.trim(),
      amount,
      paymentMethod: row.paymentMethod,
      source: row.source,
      recordDate,
      guestName: row.guestName?.trim() || null,
      reference: row.reference?.trim() || null,
      notes: row.notes?.trim() || null,
      propertyId,
      recordedById: session.user.id,
    })
  })

  let created = 0
  if (validRows.length > 0) {
    const result = await prisma.incomeRecord.createMany({
      data: validRows.map((r) => ({
        roomId: r.roomId,
        propertyId: r.propertyId,
        recordedById: r.recordedById,
        amount: r.amount,
        paymentMethod: r.paymentMethod as 'CASH' | 'CARD' | 'TRANSFER' | 'POS' | 'ONLINE',
        source: r.source as 'ACCOMMODATION' | 'MINIBAR' | 'LAUNDRY' | 'SERVICE_CHARGE' | 'OTHER',
        recordDate: r.recordDate,
        guestName: r.guestName,
        reference: r.reference,
        notes: r.notes,
      })),
      skipDuplicates: false,
    })
    created = result.count

    const createdRecords = await prisma.incomeRecord.findMany({
      where: {
        recordedById: session.user.id,
        verified: false,
      },
      orderBy: { createdAt: 'desc' },
      take: created,
      select: { id: true, amount: true, roomId: true, propertyId: true },
    })

    const propertyIds = Array.from(new Set(createdRecords.map((r) => r.propertyId)))
    for (const pid of propertyIds) {
      const managersAndAdmins = await prisma.user.findMany({
        where: {
          active: true,
          role: { in: ['SUPER_ADMIN', 'PROPERTY_MANAGER'] },
          propertyUsers: { some: { propertyId: pid } },
        },
        select: { id: true },
      })

      const recordsForProperty = createdRecords.filter((r) => r.propertyId === pid)
      for (const record of recordsForProperty) {
        await notifyIncomeUnverified(record, managersAndAdmins)
      }
    }
  }

  return NextResponse.json({
    success: true,
    created,
    skipped: errors.length,
    errors,
  })
}

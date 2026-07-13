import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Papa from 'papaparse'

const VALID_ROOM_TYPES = ['STUDIO', 'ONE_BEDROOM', 'TWO_BEDROOM', 'THREE_BEDROOM', 'PENTHOUSE']

interface CsvRow {
  name?: string
  type?: string
  dailyRate?: string
  areaId?: string
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
  const validRows: { name: string; type: string; dailyRate: number; areaId: string }[] = []

  const areaIds = Array.from(new Set(rows.map((r) => r.areaId).filter(Boolean))) as string[]
  const existingAreas = await prisma.area.findMany({
    where: { id: { in: areaIds } },
    select: { id: true },
  })
  const existingAreaIds = new Set(existingAreas.map((a) => a.id))

  rows.forEach((row, index) => {
    const rowNum = index + 2

    if (!row.name?.trim()) {
      errors.push({ row: rowNum, message: 'Missing name' })
      return
    }
    if (!row.type || !VALID_ROOM_TYPES.includes(row.type)) {
      errors.push({ row: rowNum, message: `Invalid type: ${row.type}. Must be one of: ${VALID_ROOM_TYPES.join(', ')}` })
      return
    }
    const rate = parseFloat(row.dailyRate ?? '')
    if (isNaN(rate) || rate <= 0) {
      errors.push({ row: rowNum, message: `Invalid dailyRate: ${row.dailyRate}` })
      return
    }
    if (!row.areaId || !existingAreaIds.has(row.areaId)) {
      errors.push({ row: rowNum, message: `Invalid areaId: ${row.areaId}` })
      return
    }

    validRows.push({
      name: row.name.trim(),
      type: row.type,
      dailyRate: rate,
      areaId: row.areaId,
    })
  })

  let created = 0
  if (validRows.length > 0) {
    const result = await prisma.room.createMany({
      data: validRows.map((r) => ({
        name: r.name,
        type: r.type as 'STUDIO' | 'ONE_BEDROOM' | 'TWO_BEDROOM' | 'THREE_BEDROOM' | 'PENTHOUSE',
        dailyRate: r.dailyRate,
        areaId: r.areaId,
      })),
      skipDuplicates: false,
    })
    created = result.count
  }

  return NextResponse.json({
    success: true,
    created,
    skipped: errors.length,
    errors,
  })
}

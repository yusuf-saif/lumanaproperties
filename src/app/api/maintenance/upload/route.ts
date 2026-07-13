import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const MAX_FILE_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png']
const MAX_FILES = 3

async function fileToBase64DataUrl(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString('base64')
  return `data:${file.type};base64,${base64}`
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const files: File[] = []

  for (const [key, value] of Array.from(formData.entries())) {
    if (key === 'files' && value instanceof File) {
      files.push(value)
    }
  }

  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 })
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_FILES} files allowed` },
      { status: 400 }
    )
  }

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Only JPEG and PNG allowed.` },
        { status: 400 }
      )
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large: ${file.name}. Max 2MB per file.` },
        { status: 400 }
      )
    }
  }

  try {
    const photos = await Promise.all(files.map(fileToBase64DataUrl))
    return NextResponse.json({ success: true, photos })
  } catch {
    return NextResponse.json(
      { error: 'Failed to process files' },
      { status: 500 }
    )
  }
}

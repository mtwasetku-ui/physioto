import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listTreatmentNoteTemplates } from '@/lib/cliniko'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const templates = await listTreatmentNoteTemplates()
    return NextResponse.json({ templates })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to load templates' }, { status: 502 })
  }
}


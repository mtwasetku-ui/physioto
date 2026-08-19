import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { searchPatients } from '@/lib/cliniko'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()

  if (q.length < 2) return NextResponse.json({ patients: [] })

  try {
    const patients = await searchPatients(q, 12)
    return NextResponse.json({ patients })
  } catch (e: any) {
    console.error('[patient-search]', e)
    return NextResponse.json({ error: e?.message || 'Search failed' }, { status: 502 })
  }
}

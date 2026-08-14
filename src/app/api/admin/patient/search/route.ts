import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { searchPatients } from '@/lib/cliniko'

// GET /api/admin/patients/search?q=jane — used by the assignment picker
// in /admin so patients are found by name instead of typing a raw Cliniko
// patient ID by hand.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase()
  if (!email || !adminEmail || email.toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  if (q.trim().length < 2) return NextResponse.json({ patients: [] })

  try {
    const patients = await searchPatients(q)
    return NextResponse.json({ patients })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Search failed' }, { status: 502 })
  }
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClinikoPractitionerIdForEmail } from '@/lib/db'
import { listUpcomingAppointmentsForPractitioner } from '@/lib/cliniko'

// GET /api/appointments/diary — the logged-in physio's own upcoming visits,
// across every patient, straight from Cliniko. practitionerId is always
// resolved server-side from the session, same as /api/appointments — never
// accepted from the client, so nobody can view someone else's diary by
// passing a different id.
export async function GET() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const practitionerId = await getClinikoPractitionerIdForEmail(email)
  if (!practitionerId) {
    return NextResponse.json(
      { error: "Your account isn't linked to a Cliniko practitioner yet — ask Micheal to link it from the Staff page." },
      { status: 403 }
    )
  }

  try {
    const appointments = await listUpcomingAppointmentsForPractitioner(practitionerId)
    return NextResponse.json({ appointments })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to load diary' }, { status: 502 })
  }
}

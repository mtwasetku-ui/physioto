import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClinikoPractitionerIdForEmail } from '@/lib/db'
import { getIndividualAppointment, idFromLink } from '@/lib/cliniko'

// Shared by the appointment update and cancel routes: confirms the
// logged-in physio is linked to a Cliniko practitioner, then fetches the
// appointment itself and checks it was actually booked under *that*
// practitioner before allowing the change — so a physio can edit/cancel
// their own bookings, never someone else's, even though every call still
// goes out under the one shared admin API key.
export async function requireOwnAppointment(appointmentId: string) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const practitionerId = await getClinikoPractitionerIdForEmail(email)
  if (!practitionerId) {
    return {
      error: NextResponse.json(
        { error: "Your account isn't linked to a practitioner record yet — ask Micheal to link it from the Staff page." },
        { status: 403 }
      ),
    }
  }

  let appointment: any
  try {
    appointment = await getIndividualAppointment(appointmentId)
  } catch (e: any) {
    return { error: NextResponse.json({ error: e.message || 'Appointment not found' }, { status: 404 }) }
  }

  const ownerId = idFromLink(appointment?.practitioner?.links?.self)
  if (!ownerId || ownerId !== practitionerId) {
    return { error: NextResponse.json({ error: "That's not your appointment to change." }, { status: 403 }) }
  }

  return { email, practitionerId }
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { removeAssignmentForEmail, writeAuditLog } from '@/lib/db'

// DELETE — a physio removing a patient from their own "My patients" list.
// Scoped to the logged-in session's email only (never accepted from the
// client) so nobody can remove another physio's assignment from here —
// that stays an admin-only action via /api/admin/assignments. Removing an
// assignment doesn't touch Cliniko or delete anything about the patient;
// it just stops the patient showing up in this physio's list. Re-booking
// or being re-assigned by Micheal brings them back.
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Wire field is "patientId" (not "clinikoPatientId") — this is the one
  // request body a practitioner would actually see in devtools, so it
  // stays generic even though the DB/audit layer underneath still keys on
  // the Cliniko patient id (Final Agreement §4).
  const { patientId } = await req.json()
  if (!patientId) {
    return NextResponse.json({ error: 'patientId required' }, { status: 400 })
  }

  await removeAssignmentForEmail(email, patientId)
  await writeAuditLog({
    actorEmail: email,
    action: 'portal_assignment_remove',
    clinikoPatientId: patientId,
  })

  return NextResponse.json({ ok: true })
}

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

  const { clinikoPatientId } = await req.json()
  if (!clinikoPatientId) {
    return NextResponse.json({ error: 'clinikoPatientId required' }, { status: 400 })
  }

  await removeAssignmentForEmail(email, clinikoPatientId)
  await writeAuditLog({
    actorEmail: email,
    action: 'portal_assignment_remove',
    clinikoPatientId,
  })

  return NextResponse.json({ ok: true })
}

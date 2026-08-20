import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isPatientAssignedToEmail } from '@/lib/db'
import { updatePatient } from '@/lib/cliniko'

// Editing demographics is a sensitive action (Final Agreement §10), so it
// gets the same isPatientAssignedToEmail gate as notes and attachments —
// a practitioner can view/search any patient to book them, but can't edit
// another practitioner's patient just by knowing the id in the URL.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const assigned = await isPatientAssignedToEmail(email, params.id)
  if (!assigned) return NextResponse.json({ error: 'Not assigned to this patient' }, { status: 403 })

  try {
    const input = await req.json()
    const clean = (v: any) => typeof v === 'string' ? v.trim() : v

    const patient = await updatePatient(params.id, {
      firstName: clean(input.firstName),
      lastName: clean(input.lastName),
      dateOfBirth: clean(input.dateOfBirth) || null,
      address1: clean(input.address1) || null,
      address2: clean(input.address2) || null,
      city: clean(input.city) || null,
      state: clean(input.state) || null,
      postCode: clean(input.postCode) || null,
      phone: clean(input.phone) || null,
    })

    return NextResponse.json({ patient })
  } catch (e: any) {
    console.error('[patient-update]', e)
    return NextResponse.json({ error: e?.message || 'Could not update patient' }, { status: 502 })
  }
}

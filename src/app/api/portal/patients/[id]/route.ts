import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updatePatient } from '@/lib/cliniko'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

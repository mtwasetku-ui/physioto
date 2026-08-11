import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { addAssignment, removeAssignment, writeAuditLog } from '@/lib/db'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase()
  if (!email || !adminEmail || email.toLowerCase() !== adminEmail) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { email }
}

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { email, clinikoPatientId, patientLabel } = await req.json()
  if (!email || !clinikoPatientId) {
    return NextResponse.json({ error: 'email and clinikoPatientId required' }, { status: 400 })
  }

  const assignment = await addAssignment(email, clinikoPatientId, patientLabel)
  await writeAuditLog({
    actorEmail: auth.email!,
    action: 'admin_assignment_add',
    clinikoPatientId,
    detail: { email },
  })
  return NextResponse.json({ assignment })
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await removeAssignment(id)
  await writeAuditLog({ actorEmail: auth.email!, action: 'admin_assignment_remove', detail: { id } })
  return NextResponse.json({ ok: true })
}

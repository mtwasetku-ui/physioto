import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isPatientAssignedToEmail, writeAuditLog } from '@/lib/db'
import { finalizeAttachment } from '@/lib/cliniko'

export async function POST(req: Request) {
  const { patientId, uploadUrl, fileName } = await req.json()
  if (!patientId || !uploadUrl) {
    return NextResponse.json({ error: 'patientId and uploadUrl required' }, { status: 400 })
  }

  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const assigned = await isPatientAssignedToEmail(email, patientId)
  if (!assigned) return NextResponse.json({ error: 'Not assigned to this patient' }, { status: 403 })

  try {
    const attachment = await finalizeAttachment({ patientId, uploadUrl })
    await writeAuditLog({
      actorEmail: email,
      action: 'attachment_upload',
      clinikoPatientId: patientId,
      detail: { fileName },
    })
    return NextResponse.json({ attachment })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to finalize attachment' }, { status: 502 })
  }
}

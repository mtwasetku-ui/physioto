import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isPatientAssignedToEmail } from '@/lib/db'
import { getAttachmentPresignedPost } from '@/lib/cliniko'

export async function POST(req: Request) {
  const { patientId } = await req.json()
  if (!patientId) {
    return NextResponse.json({ error: 'patientId required' }, { status: 400 })
  }

  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const assigned = await isPatientAssignedToEmail(email, patientId)
  if (!assigned) return NextResponse.json({ error: 'Not assigned to this patient' }, { status: 403 })

  try {
    // Cliniko generates this itself per-patient (GET, no body) — it
    // returns { url, fields } for the S3 POST.
    const presigned = await getAttachmentPresignedPost(patientId)
    return NextResponse.json(presigned)
  } catch (e: any) {
    console.error('[attachments/presign] failed', e)
    return NextResponse.json({ error: e.message || 'Failed to get upload URL' }, { status: 502 })
  }
}

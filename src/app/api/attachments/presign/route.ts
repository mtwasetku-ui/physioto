import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isPatientAssignedToEmail } from '@/lib/db'
import { getAttachmentPresignedPost } from '@/lib/cliniko'

export async function POST(req: Request) {
  const { patientId, fileName, contentType } = await req.json()
  if (!patientId || !fileName) {
    return NextResponse.json({ error: 'patientId and fileName required' }, { status: 400 })
  }

  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const assigned = await isPatientAssignedToEmail(email, patientId)
  if (!assigned) return NextResponse.json({ error: 'Not assigned to this patient' }, { status: 403 })

  try {
    // Field names here (url/fields/key) match Cliniko's documented shape
    // but haven't been round-tripped against a live sandbox — verify
    // against a real response before relying on this in production.
    const presigned = await getAttachmentPresignedPost(fileName, contentType || 'application/octet-stream')
    return NextResponse.json(presigned)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to get upload URL' }, { status: 502 })
  }
}

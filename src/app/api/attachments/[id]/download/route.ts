import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isPatientAssignedToEmail, writeAuditLog } from '@/lib/db'
import { fetchAttachmentBytes } from '@/lib/cliniko'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url)
  const patientId = searchParams.get('patientId')
  if (!patientId) return NextResponse.json({ error: 'patientId required' }, { status: 400 })
  const filename = searchParams.get('filename') || undefined

  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const assigned = await isPatientAssignedToEmail(email, patientId)
  if (!assigned) return NextResponse.json({ error: 'Not assigned to this patient' }, { status: 403 })

  try {
    const upstream = await fetchAttachmentBytes(params.id)
    await writeAuditLog({ actorEmail: email, action: 'attachment_view', clinikoPatientId: patientId, detail: { attachmentId: params.id } })

    // The presigned S3 response the file actually comes from often
    // doesn't carry a friendly Content-Disposition — fall back to the
    // filename Cliniko has on record (passed through as a query param
    // from the attachments list) rather than downloading as an unnamed
    // file.
    const upstreamDisposition = upstream.headers.get('content-disposition')
    const disposition = upstreamDisposition || (filename ? `attachment; filename="${filename.replace(/"/g, '')}"` : 'attachment')

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream',
        'Content-Disposition': disposition,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch attachment' }, { status: 502 })
  }
}

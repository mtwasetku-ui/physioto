import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isPatientAssignedToEmail, writeAuditLog } from '@/lib/db'
import { getAttachmentPresignedPost, finalizeAttachment } from '@/lib/cliniko'

export const runtime = 'nodejs'

// Vercel Serverless Functions hard-cap request bodies at 4.5MB — this is a
// platform limit, not something we can raise from app code or vercel.json.
// We cap a bit below that to leave room for multipart overhead (boundary
// strings, field headers, the filename, etc.) so we fail on our own terms
// with a clear message instead of Vercel returning a bare 413.
//
// This route exists because the browser can't POST directly to Cliniko's
// S3 bucket (cliniko-files-*.s3.*.amazonaws.com) — that bucket has no CORS
// policy allowing our origin, so a client-side fetch() gets blocked before
// it ever leaves the browser. A server-to-server request has no such
// restriction, since CORS is purely a browser-enforced rule. See
// README.portal.md "Open next steps" for the longer-term fix (asking
// Cliniko support to whitelist our origin, which would let us go back to
// direct-to-S3 uploads and lift this size cap).
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024 // 4MB

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Reject oversized requests before we even try to parse the body —
  // Content-Length is set by the browser for a normal file upload.
  const contentLength = Number(req.headers.get('content-length') || 0)
  if (contentLength && contentLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `File is too large. Uploads are currently limited to ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.` },
      { status: 413 },
    )
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid upload request' }, { status: 400 })
  }

  const patientId = form.get('patientId')
  const file = form.get('file')
  if (typeof patientId !== 'string' || !patientId) {
    return NextResponse.json({ error: 'patientId required' }, { status: 400 })
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file required' }, { status: 400 })
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `File is too large. Uploads are currently limited to ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.` },
      { status: 413 },
    )
  }

  const assigned = await isPatientAssignedToEmail(email, patientId)
  if (!assigned) return NextResponse.json({ error: 'Not assigned to this patient' }, { status: 403 })

  try {
    // Step 1: ask Cliniko for a presigned S3 POST for this patient.
    const { url, fields } = await getAttachmentPresignedPost(patientId)

    // Step 2: upload to S3 ourselves (server-to-server — no CORS applies).
    // fields.key has an unresolved "${filename}" placeholder that S3
    // substitutes server-side; success_action_status:201 makes S3 return
    // XML containing the real <Key>, which Cliniko needs in step 3.
    const s3Form = new FormData()
    for (const [k, v] of Object.entries(fields as Record<string, string>)) {
      s3Form.append(k, v)
    }
    s3Form.append('file', file, file.name)

    const s3Res = await fetch(url, { method: 'POST', body: s3Form })
    const s3Xml = await s3Res.text()
    if (!s3Res.ok) {
      const s3Error = s3Xml.match(/<Message>(.*?)<\/Message>/)?.[1]
      throw new Error(s3Error || `S3 upload failed (HTTP ${s3Res.status})`)
    }
    const realKey = s3Xml.match(/<Key>(.*?)<\/Key>/)?.[1]
    if (!realKey) throw new Error('S3 did not return an object key')

    // Step 3: register the object as a real Cliniko patient attachment.
    const attachment = await finalizeAttachment({
      patientId,
      uploadUrl: `${url}${realKey}`,
    })

    await writeAuditLog({
      actorEmail: email,
      action: 'attachment_upload',
      clinikoPatientId: patientId,
      detail: { fileName: file.name },
    })

    return NextResponse.json({ attachment })
  } catch (e: any) {
    console.error('[attachments/upload] failed', e)
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 502 })
  }
}

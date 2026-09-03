import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { markSmsRequestSent, addSmsReply, closeSmsRequest, writeAuditLog } from '@/lib/db'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase()
  if (!email || !adminEmail || email.toLowerCase() !== adminEmail) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { email }
}

// PATCH /api/admin/sms-requests/[id] — { action: 'sent' | 'reply' | 'close', replyBody? }
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const id = Number(params.id)
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const { action, replyBody } = await req.json()

  try {
    if (action === 'sent') {
      const request = await markSmsRequestSent(id)
      await writeAuditLog({ actorEmail: auth.email!, action: 'sms_request_mark_sent', clinikoPatientId: request.cliniko_patient_id, detail: { requestId: id } })
      return NextResponse.json({ request })
    }
    if (action === 'reply') {
      if (!replyBody?.trim()) return NextResponse.json({ error: 'replyBody required' }, { status: 400 })
      const request = await addSmsReply(id, replyBody.trim())
      await writeAuditLog({ actorEmail: auth.email!, action: 'sms_request_reply', clinikoPatientId: request.cliniko_patient_id, detail: { requestId: id } })
      return NextResponse.json({ request })
    }
    if (action === 'close') {
      const request = await closeSmsRequest(id)
      await writeAuditLog({ actorEmail: auth.email!, action: 'sms_request_close', clinikoPatientId: request.cliniko_patient_id, detail: { requestId: id } })
      return NextResponse.json({ request })
    }
    return NextResponse.json({ error: "action must be 'sent', 'reply', or 'close'" }, { status: 400 })
  } catch (err) {
    console.error('[api:admin/sms-requests/[id]:PATCH] failed', err)
    return NextResponse.json({ error: 'Failed to save — the database did not confirm the write. Nothing was changed.' }, { status: 500 })
  }
}

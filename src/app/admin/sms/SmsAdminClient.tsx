'use client'

import { useState } from 'react'
import { Copy, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SmsRequest {
  id: number
  cliniko_patient_id: string
  appointment_id: string | null
  requested_by_email: string
  patient_name: string | null
  patient_phone: string | null
  message: string
  status: 'pending' | 'sent' | 'replied' | 'closed'
  reply_body: string | null
  created_at: string
  sent_at: string | null
  replied_at: string | null
  closed_at: string | null
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const STATUS_LABEL: Record<SmsRequest['status'], string> = {
  pending: 'Needs sending',
  sent: 'Sent — awaiting reply',
  replied: 'Replied',
  closed: 'Closed',
}

const STATUS_STYLE: Record<SmsRequest['status'], string> = {
  pending: 'bg-amber-100 text-amber-800',
  sent: 'bg-blue-100 text-blue-800',
  replied: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-gray-100 text-gray-600',
}

export default function SmsAdminClient({
  initialOpen,
  initialClosed,
}: {
  initialOpen: SmsRequest[]
  initialClosed: SmsRequest[]
}) {
  const [open, setOpen] = useState(initialOpen)
  const [closed, setClosed] = useState(initialClosed)
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({})
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  async function act(id: number, action: 'sent' | 'reply' | 'close', replyBody?: string) {
    setBusyId(id)
    setError(null)
    const res = await fetch(`/api/admin/sms-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, replyBody }),
    })
    if (res.ok) {
      const { request } = await res.json()
      if (request.status === 'closed') {
        setOpen((prev) => prev.filter((r) => r.id !== id))
        setClosed((prev) => [request, ...prev])
      } else {
        setOpen((prev) => prev.map((r) => (r.id === id ? request : r)))
      }
      setReplyDrafts((prev) => ({ ...prev, [id]: '' }))
    } else {
      const body = await res.json().catch(() => null)
      setError(body?.error || `Failed to update (HTTP ${res.status})`)
    }
    setBusyId(null)
  }

  function copyPhone(id: number, phone: string) {
    navigator.clipboard.writeText(phone).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500)
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-foreground mb-1">SMS requests</h1>
        <p className="text-sm text-muted-foreground">
          Practitioners request texts here — send each from your own phone, then paste the patient's reply back in.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {open.length === 0 ? (
        <p className="text-sm text-muted-foreground">No open requests.</p>
      ) : (
        <div className="space-y-3">
          {open.map((r) => (
            <div key={r.id} className="bg-white border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="font-medium text-foreground">{r.patient_name || 'Unknown patient'}</div>
                  <div className="text-xs text-muted-foreground">
                    Requested by {r.requested_by_email} · {timeAgo(r.created_at)}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_STYLE[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
              </div>

              {r.patient_phone && (
                <div className="flex items-center gap-2 text-sm mb-2">
                  <Phone size={13} className="text-muted-foreground" />
                  <a href={`tel:${r.patient_phone}`} className="text-primary hover:underline">
                    {r.patient_phone}
                  </a>
                  <button
                    type="button"
                    onClick={() => copyPhone(r.id, r.patient_phone!)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Copy size={12} />
                    {copiedId === r.id ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}

              <div className="bg-secondary/50 rounded-md p-2.5 text-sm text-foreground mb-3">{r.message}</div>

              {r.status === 'pending' && (
                <Button size="sm" onClick={() => act(r.id, 'sent')} disabled={busyId === r.id}>
                  {busyId === r.id ? 'Marking…' : "I've sent this"}
                </Button>
              )}

              {r.status === 'sent' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground block">Patient's reply (paste it in once they respond)</label>
                  <textarea
                    value={replyDrafts[r.id] ?? ''}
                    onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    rows={2}
                    className="w-full px-2 py-1.5 rounded-md border border-input text-sm"
                    placeholder="Paste the patient's SMS reply here…"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => act(r.id, 'reply', replyDrafts[r.id])}
                      disabled={busyId === r.id || !replyDrafts[r.id]?.trim()}
                    >
                      {busyId === r.id ? 'Saving…' : 'Save reply'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => act(r.id, 'close')}
                      disabled={busyId === r.id}
                      className="text-xs px-2.5 py-1.5 rounded-md border border-input hover:bg-secondary disabled:opacity-50"
                    >
                      Close (no reply needed)
                    </button>
                  </div>
                </div>
              )}

              {r.status === 'replied' && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Patient replied:</div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-md p-2.5 text-sm text-foreground">{r.reply_body}</div>
                  <button
                    type="button"
                    onClick={() => act(r.id, 'close')}
                    disabled={busyId === r.id}
                    className="text-xs px-2.5 py-1.5 rounded-md border border-input hover:bg-secondary disabled:opacity-50"
                  >
                    Mark as closed
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {closed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Recently closed</h2>
          <div className="space-y-2">
            {closed.map((r) => (
              <div key={r.id} className="bg-white border border-border rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{r.patient_name || 'Unknown patient'} · {r.requested_by_email}</span>
                  <span>{timeAgo(r.closed_at || r.created_at)}</span>
                </div>
                <div className="text-foreground">{r.message}</div>
                {r.reply_body && <div className="text-muted-foreground mt-1">Reply: {r.reply_body}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

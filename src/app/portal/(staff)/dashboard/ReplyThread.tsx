'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, MessageSquare, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DashboardReplyRow } from '@/lib/db'
import { When, PostBody } from './dashboardText'

const REPLY_MAX = 1000

// Replies under one dashboard post: collapsed to a "N replies" / "Reply"
// toggle, expands to the thread plus a reply box. Everyone who can see the
// post sees every reply.
export default function ReplyThread({
  postId,
  replies,
  currentEmail,
  isAdmin,
  canReply,
}: {
  postId: string
  replies: DashboardReplyRow[]
  currentEmail: string
  isAdmin: boolean
  canReply: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const count = replies.length
  if (!canReply && count === 0) return null

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const body = text.trim()
    if (!body) return
    setError(null)
    setSending(true)
    try {
      const res = await fetch(`/api/portal/dashboard/posts/${postId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Failed to send your reply')
        return
      }
      setText('')
      router.refresh()
    } catch {
      setError('Network error — please try again')
    } finally {
      setSending(false)
    }
  }

  async function remove(reply: DashboardReplyRow) {
    if (!window.confirm('Delete this reply?')) return
    setError(null)
    setDeletingId(reply.id)
    try {
      const res = await fetch(`/api/portal/dashboard/replies/${reply.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Failed to delete the reply')
        return
      }
      router.refresh()
    } catch {
      setError('Network error — please try again')
    } finally {
      setDeletingId(null)
    }
  }

  const label = count > 0 ? `${count} ${count === 1 ? 'reply' : 'replies'}` : 'Reply'

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <MessageSquare className="h-4 w-4" aria-hidden />
        {label}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {count > 0 && (
            <ul className="space-y-3">
              {replies.map((r) => {
                const mine = r.author_email === currentEmail.toLowerCase()
                const canDelete = mine || isAdmin
                return (
                  <li key={r.id} className="rounded-md bg-muted/50 p-3">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{r.author_name || r.author_email}</span>
                        {' · '}
                        <When iso={r.created_at} />
                      </p>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => remove(r)}
                          disabled={deletingId === r.id}
                          aria-label="Delete reply"
                          className="shrink-0 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                    </div>
                    <PostBody text={r.body} />
                  </li>
                )
              })}
            </ul>
          )}

          {canReply && (
            <form onSubmit={send} className="space-y-2">
              <label htmlFor={`reply-${postId}`} className="sr-only">
                Write a reply
              </label>
              <textarea
                id={`reply-${postId}`}
                rows={2}
                maxLength={REPLY_MAX}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a reply…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" size="sm" disabled={sending || !text.trim()}>
                {sending ? 'Sending…' : 'Reply'}
              </Button>
            </form>
          )}
          {!canReply && error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}
    </div>
  )
}

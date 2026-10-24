'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DashboardPostRow } from '@/lib/db'

const TITLE_MAX = 120
const BODY_MAX = 5000

const inputClass =
  'w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

// ISO string -> value for <input type="datetime-local"> in the viewer's local time.
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(value: string): string | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

// Server renders in UTC, the browser in local time — suppress the harmless
// text mismatch rather than flash a wrong time.
function When({ iso }: { iso: string }) {
  const d = new Date(iso)
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {d.toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
    </time>
  )
}

// Plain text with clickable http(s) links. Built as React nodes — never
// injected as HTML.
function PostBody({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s<]+)/g)
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
      {parts.map((part, i) => {
        if (!/^https?:\/\//.test(part)) return part
        const trimmed = part.replace(/[.,;:!?)\]]+$/, '')
        const trailing = part.slice(trimmed.length)
        return (
          <span key={i}>
            <a href={trimmed} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
              {trimmed}
            </a>
            {trailing}
          </span>
        )
      })}
    </p>
  )
}

function statusOf(post: DashboardPostRow): 'live' | 'scheduled' | 'expired' {
  const now = Date.now()
  if (new Date(post.publish_at).getTime() > now) return 'scheduled'
  if (post.expires_at && new Date(post.expires_at).getTime() <= now) return 'expired'
  return 'live'
}

function PostForm({
  initial,
  onDone,
  onCancel,
}: {
  initial?: DashboardPostRow
  onDone: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [pinned, setPinned] = useState(initial?.pinned ?? false)
  const [publishAt, setPublishAt] = useState(initial ? toLocalInput(initial.publish_at) : '')
  const [expiresAt, setExpiresAt] = useState(initial ? toLocalInput(initial.expires_at) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const payload = {
        title,
        body,
        pinned,
        publishAt: fromLocalInput(publishAt),
        expiresAt: fromLocalInput(expiresAt),
      }
      const res = await fetch(initial ? `/api/admin/dashboard-posts/${initial.id}` : '/api/admin/dashboard-posts', {
        method: initial ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Failed to save the post')
        return
      }
      onDone()
    } catch {
      setError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-border bg-white p-5">
      <div>
        <label htmlFor="post-title" className="mb-1.5 block text-sm font-medium text-foreground">
          Title
        </label>
        <input
          id="post-title"
          required
          maxLength={TITLE_MAX}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="post-body" className="mb-1.5 block text-sm font-medium text-foreground">
          Post
        </label>
        <textarea
          id="post-body"
          required
          rows={6}
          maxLength={BODY_MAX}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">Plain text. Links are made clickable automatically.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="post-publish" className="mb-1.5 block text-sm font-medium text-foreground">
            Show from <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input id="post-publish" type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} className={inputClass} />
          <p className="mt-1 text-xs text-muted-foreground">Blank = straight away.</p>
        </div>
        <div>
          <label htmlFor="post-expires" className="mb-1.5 block text-sm font-medium text-foreground">
            Hide after <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input id="post-expires" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputClass} />
          <p className="mt-1 text-xs text-muted-foreground">Blank = stays until archived.</p>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="h-4 w-4 rounded border-input" />
        Pin to the top (also shows a banner above the calendar until they open the dashboard)
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Post'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default function DashboardClient({
  posts,
  isAdmin,
  loadError,
}: {
  posts: DashboardPostRow[]
  isAdmin: boolean
  loadError: boolean
}) {
  const router = useRouter()
  // Captured once on first render so "New" tags stay put for this visit even
  // after we mark the dashboard as seen and refresh.
  const [newIds] = useState(() => new Set(posts.filter((p) => p.is_unread).map((p) => p.id)))
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Opening the dashboard clears the nav badge and the calendar banner.
  useEffect(() => {
    if (newIds.size === 0) return
    fetch('/api/portal/dashboard/seen', { method: 'POST' })
      .then((res) => {
        if (res.ok) router.refresh()
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function patch(id: string, payload: Record<string, unknown>) {
    setActionError(null)
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/dashboard-posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setActionError(data?.error || 'That change failed')
        return
      }
      router.refresh()
    } catch {
      setActionError('Network error — please try again')
    } finally {
      setBusyId(null)
    }
  }

  function archive(post: DashboardPostRow) {
    if (!window.confirm(`Archive “${post.title}”? Staff will no longer see it.`)) return
    patch(post.id, { archived: true })
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="serif mb-1 text-2xl font-semibold text-primary">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Notices for the team.</p>
        </div>
        {isAdmin && !creating && (
          <Button onClick={() => { setCreating(true); setEditingId(null) }}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden />
            New post
          </Button>
        )}
      </div>

      {creating && (
        <div className="mb-6">
          <PostForm
            onDone={() => { setCreating(false); router.refresh() }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {actionError && <p className="mb-4 text-sm text-destructive">{actionError}</p>}

      {loadError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          The dashboard couldn’t be loaded just now. Please refresh in a moment.
        </div>
      )}

      {!loadError && posts.length === 0 && !creating && (
        <div className="rounded-lg border border-border bg-white p-8 text-center text-sm text-muted-foreground">
          Nothing posted right now.
        </div>
      )}

      <ul className="space-y-4">
        {posts.map((post) => {
          const status = statusOf(post)
          const isNew = newIds.has(post.id)

          if (isAdmin && editingId === post.id) {
            return (
              <li key={post.id}>
                <PostForm
                  initial={post}
                  onDone={() => { setEditingId(null); router.refresh() }}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            )
          }

          return (
            <li key={post.id} className="rounded-lg border border-border bg-white p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {post.pinned && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <Pin className="h-3.5 w-3.5" aria-hidden />
                    Pinned
                  </span>
                )}
                {isNew && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">New</span>
                )}
                {isAdmin && status === 'scheduled' && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">Scheduled</span>
                )}
                {isAdmin && status === 'expired' && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Expired</span>
                )}
              </div>

              <h2 className="mb-1 text-base font-semibold text-foreground">{post.title}</h2>
              <p className="mb-3 text-xs text-muted-foreground">
                <When iso={post.publish_at} />
                {post.author_name ? ` · ${post.author_name}` : ''}
                {isAdmin && post.expires_at && (
                  <>
                    {' · hides '}
                    <When iso={post.expires_at} />
                  </>
                )}
              </p>
              <PostBody text={post.body} />

              {isAdmin && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                  <Button size="sm" variant="outline" disabled={busyId === post.id} onClick={() => { setEditingId(post.id); setCreating(false) }}>
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" disabled={busyId === post.id} onClick={() => patch(post.id, { pinned: !post.pinned })}>
                    {post.pinned ? 'Unpin' : 'Pin'}
                  </Button>
                  <Button size="sm" variant="outline" disabled={busyId === post.id} onClick={() => archive(post)}>
                    Archive
                  </Button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// Shared validation for dashboard post create/update (admin API routes).
// Posts are plain text — the UI renders them as text (never as HTML).

export const TITLE_MAX = 120
export const BODY_MAX = 5000

function parseDate(value: unknown): { ok: true; iso: string | null } | { ok: false } {
  if (value === null || value === '' || value === undefined) return { ok: true, iso: null }
  if (typeof value !== 'string') return { ok: false }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return { ok: false }
  return { ok: true, iso: d.toISOString() }
}

export interface ParsedPostFields {
  title?: string
  body?: string
  pinned?: boolean
  publishAt?: string | null
  expiresAt?: string | null
  archived?: boolean
}

// partial=true (PATCH): only validates fields that are present.
// partial=false (POST): title and body are required.
export function parsePostFields(
  input: any,
  partial: boolean
): { ok: true; fields: ParsedPostFields } | { ok: false; error: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Invalid request' }
  const fields: ParsedPostFields = {}

  if (input.title !== undefined || !partial) {
    const title = typeof input.title === 'string' ? input.title.trim() : ''
    if (!title) return { ok: false, error: 'A title is required' }
    if (title.length > TITLE_MAX) return { ok: false, error: `Title must be ${TITLE_MAX} characters or fewer` }
    fields.title = title
  }

  if (input.body !== undefined || !partial) {
    const body = typeof input.body === 'string' ? input.body.trim() : ''
    if (!body) return { ok: false, error: 'The post needs some text' }
    if (body.length > BODY_MAX) return { ok: false, error: `Post must be ${BODY_MAX} characters or fewer` }
    fields.body = body
  }

  if (input.pinned !== undefined) {
    if (typeof input.pinned !== 'boolean') return { ok: false, error: 'Invalid pinned value' }
    fields.pinned = input.pinned
  }

  if (input.archived !== undefined) {
    if (typeof input.archived !== 'boolean') return { ok: false, error: 'Invalid archived value' }
    fields.archived = input.archived
  }

  if (input.publishAt !== undefined) {
    const p = parseDate(input.publishAt)
    if (!p.ok) return { ok: false, error: 'Invalid publish date' }
    // null/blank publish date = "now" on create; on edit it means "leave as is"
    fields.publishAt = p.iso
  }

  if (input.expiresAt !== undefined) {
    const p = parseDate(input.expiresAt)
    if (!p.ok) return { ok: false, error: 'Invalid expiry date' }
    fields.expiresAt = p.iso
  }

  if (fields.publishAt && fields.expiresAt && new Date(fields.expiresAt) <= new Date(fields.publishAt)) {
    return { ok: false, error: 'The expiry must be after the publish date' }
  }

  return { ok: true, fields }
}

export const REPLY_MAX = 1000

export function parseReplyBody(
  input: any
): { ok: true; body: string } | { ok: false; error: string } {
  const body = input && typeof input.body === 'string' ? input.body.trim() : ''
  if (!body) return { ok: false, error: 'Write something to reply' }
  if (body.length > REPLY_MAX) return { ok: false, error: `Replies must be ${REPLY_MAX} characters or fewer` }
  return { ok: true, body }
}

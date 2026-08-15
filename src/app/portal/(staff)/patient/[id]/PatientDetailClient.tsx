'use client'

import { useEffect, useState } from 'react'
import { Calendar, MapPin, Phone, Cake, Paperclip, Upload, FileText, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ClinikoPatientInfo } from '@/lib/cliniko'

type Tab = 'note' | 'timeline' | 'attachments' | 'book'

// ── Safe HTML rendering for "paragraph" question answers ─────────
//
// Cliniko stores paragraph-question answers as HTML (their editor
// supports basic rich text) and only sanitizes to a small allowlist of
// tags on their end — see https://docs.api.cliniko.com/. Rendering that
// string directly as text (the old behaviour here) shows the raw tags
// literally, e.g. "<p>Mobility with Gutter frame...</p>", instead of a
// formatted paragraph. Rendering it with dangerouslySetInnerHTML would
// fix the display but re-trusts a third-party string as markup. Instead
// we parse it and only rebuild the same allowlisted tags as real React
// elements — anything else is unwrapped to its plain text content.
const ALLOWED_HTML_TAGS = new Set(['P', 'DIV', 'BR', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'H1', 'H2', 'B', 'I', 'U', 'A'])

function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sanitizedHtmlNode(node: ChildNode, key: string): React.ReactNode {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent
  if (node.nodeType !== Node.ELEMENT_NODE) return null
  const el = node as Element
  const tag = el.tagName
  const children = Array.from(el.childNodes).map((child, i) => sanitizedHtmlNode(child, `${key}-${i}`))

  if (!ALLOWED_HTML_TAGS.has(tag)) {
    // Not on Cliniko's own allowlist — drop the wrapper, keep its text.
    return <span key={key}>{children}</span>
  }
  if (tag === 'BR') return <br key={key} />
  if (tag === 'A') {
    const href = el.getAttribute('href') || ''
    const safeHref = /^https?:\/\//i.test(href) ? href : undefined
    return (
      <a key={key} href={safeHref} target="_blank" rel="noopener noreferrer" className="text-primary underline">
        {children}
      </a>
    )
  }
  const Tag = tag.toLowerCase() as any
  return <Tag key={key}>{children}</Tag>
}

// Renders a Cliniko paragraph-question answer as actual formatted text
// rather than a raw HTML string. Falls back to plain stripped text if
// parsing fails or (during server rendering) DOMParser isn't available.
function ClinikoHtml({ html, className }: { html: string; className?: string }) {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return <div className={className}>{stripHtmlTags(html)}</div>
  }
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return <div className={className}>{Array.from(doc.body.childNodes).map((n, i) => sanitizedHtmlNode(n, String(i)))}</div>
  } catch {
    return <div className={className}>{stripHtmlTags(html)}</div>
  }
}

interface Question {
  // Cliniko questions have no numeric id — name is the only identifier,
  // and only unique within its own section.
  name: string
  type: string
  answers?: { value: string; selected?: boolean }[]
  required?: boolean
}
interface Section {
  name: string
  questions: Question[]
}
interface Template {
  id: number
  name: string
  content: { sections: Section[] }
}

// Composite key for a question, since Cliniko only identifies questions
// by (section name, question name) — never a plain id.
function questionKey(sectionName: string, question: Question) {
  return `${sectionName}::${question.name}`
}

// Body chart questions can't be answered through this plain form — they
// need a drawing surface Cliniko itself provides — so they're dropped
// entirely rather than shown as an "unsupported" warning.
const DROPPED_QUESTION_TYPES = ['bodycharts']
function visibleQuestions(section: Section): Question[] {
  return section.questions.filter((q) => !DROPPED_QUESTION_TYPES.includes(q.type))
}

const TEMPLATE_NAMES = ['Initial Consultation', 'Standard Consultation']

export default function PatientDetailClient({
  patientId,
  patient,
  nextAppointment,
  authorEmail,
  isAdmin,
}: {
  patientId: string
  patient: ClinikoPatientInfo
  nextAppointment: any
  authorEmail: string
  isAdmin: boolean
}) {
  const [tab, setTab] = useState<Tab>('note')

  return (
    <div>
      <h1 className="serif text-2xl text-foreground font-semibold mb-1">
        {patient.firstName} {patient.lastName}
      </h1>
      <p className="text-muted-foreground text-sm mb-6">Patient home visit</p>

      <PatientInfoBlock patient={patient} nextAppointment={nextAppointment} />

      <div className="flex gap-1 border-b border-border mb-6 mt-8">
        {(
          [
            ['note', 'New note', FileText],
            ['timeline', 'Visit history', Clock],
            ['attachments', 'Attachments', Paperclip],
            ...(isAdmin ? ([['book', 'Book visit', Calendar]] as const) : []),
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'note' && <NoteForm patientId={patientId} authorEmail={authorEmail} />}
      {tab === 'timeline' && <Timeline patientId={patientId} />}
      {tab === 'attachments' && <Attachments patientId={patientId} />}
      {tab === 'book' && isAdmin && <BookVisit patientId={patientId} />}
    </div>
  )
}

// ── Patient info block ──────────────────────────────────────────

function PatientInfoBlock({ patient, nextAppointment }: { patient: ClinikoPatientInfo; nextAppointment: any }) {
  return (
    <div className="bg-white border border-border rounded-lg p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <InfoRow icon={MapPin} label="Address" value={patient.address || 'Not on file'} />
      <InfoRow icon={Phone} label="Phone" value={patient.phone || 'Not on file'} />
      <InfoRow icon={Cake} label="Date of birth" value={patient.dateOfBirth || 'Not on file'} />
      <InfoRow
        icon={Calendar}
        label="Your next visit"
        value={
          nextAppointment
            ? new Date(nextAppointment.starts_at).toLocaleString('en-AU', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: 'numeric',
                minute: '2-digit',
              })
            : 'None scheduled'
        }
      />
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm text-foreground font-medium">{value}</div>
      </div>
    </div>
  )
}

// ── New note form ────────────────────────────────────────────────

function NoteForm({ patientId, authorEmail }: { patientId: string; authorEmail: string }) {
  const [templates, setTemplates] = useState<Template[] | null>(null)
  const [templateName, setTemplateName] = useState<string>(TEMPLATE_NAMES[0])
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [existingDraftId, setExistingDraftId] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [bookingId, setBookingId] = useState<string>('')

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates))
      .catch(() => setError('Could not load note templates from Cliniko.'))
  }, [])

  useEffect(() => {
    setBookingId('')
    // Recent + upcoming visits for this patient, so the note can be
    // linked to the actual appointment it was written for.
    fetch(`/api/appointments/for-patient?patientId=${patientId}`)
      .then((r) => r.json())
      .then((data) => {
        const list = data.appointments || []
        setAppointments(list)
        // Default to today's visit if there is one, otherwise leave unlinked.
        const today = list.find((a: any) => new Date(a.starts_at).toDateString() === new Date().toDateString())
        if (today) setBookingId(String(today.id))
      })
      .catch(() => setAppointments([]))
  }, [patientId])

  useEffect(() => {
    setAnswers({})
    setExistingDraftId(null)
    // Offer the physio's own most recent draft for this patient to continue,
    // rather than always starting blank. If that draft is already linked to
    // a visit, carry the link over so continuing a draft doesn't silently
    // drop it.
    fetch(`/api/notes?patientId=${patientId}&draftOnly=true`)
      .then((r) => r.json())
      .then((data) => {
        const mine = (data.notes || []).find((n: any) => n.title === authorEmail && n.draft)
        if (mine) {
          setExistingDraftId(mine.id)
          // Cliniko only gives us the booking as a link
          // (".../bookings/{id}") on the note, not a flat id — pull the id
          // off the end of that URL.
          const bookingSelf = mine.booking?.links?.self as string | undefined
          const existingBookingId = bookingSelf?.split('/').filter(Boolean).pop()
          if (existingBookingId) setBookingId(existingBookingId)
        }
      })
      .catch(() => {})
  }, [patientId, templateName, authorEmail])

  const template = templates?.find((t) => t.name === templateName)

  if (error) return <div className="text-destructive text-sm">{error}</div>
  if (!templates) return <div className="text-muted-foreground text-sm">Loading templates from Cliniko…</div>

  if (!template) {
    return (
      <div className="bg-white border border-border rounded-lg p-6 text-sm">
        <p className="text-destructive font-medium mb-1">Template not found</p>
        <p className="text-muted-foreground">
          No Cliniko treatment note template is named exactly &quot;{templateName}&quot;. Check the template name in
          Cliniko matches exactly, including capitalisation.
        </p>
      </div>
    )
  }

  const unsupported = new Set<string>()
  for (const s of template.content.sections) {
    for (const q of visibleQuestions(s)) {
      if (!['text', 'paragraph', 'radiobuttons', 'checkboxes', 'date'].includes(q.type)) {
        unsupported.add(q.type)
      }
    }
  }

  async function save(draft: boolean) {
    setStatus('saving')
    setSaveError(null)
    const sections = template!.content.sections
      .map((s) => {
        const questions = visibleQuestions(s)
        if (questions.length === 0) return null // section was only a body chart
        return {
          name: s.name,
          answers: questions.map((q) => ({
            questionName: q.name,
            value: answers[questionKey(s.name, q)] ?? (q.type === 'checkboxes' ? [] : ''),
          })),
        }
      })
      .filter((s): s is { name: string; answers: any[] } => s !== null)

    const res = await fetch('/api/notes', {
      method: existingDraftId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        existingDraftId
          ? { noteId: existingDraftId, templateName, sections, draft, patientId, bookingId: bookingId || undefined }
          : { patientId, templateName, sections, draft, bookingId: bookingId || undefined }
      ),
    })

    if (res.ok) {
      const data = await res.json()
      setStatus('saved')
      if (draft) setExistingDraftId(data.note?.id ?? existingDraftId)
      else {
        setExistingDraftId(null)
        setAnswers({})
      }
    } else {
      // The API route already returns Cliniko's real rejection reason in
      // `error` — surface it instead of a generic message so the actual
      // problem (e.g. a specific field Cliniko rejected) is visible.
      const body = await res.json().catch(() => null)
      setSaveError(body?.error || `Save failed (HTTP ${res.status})`)
      setStatus('error')
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <select
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          className="h-10 px-3 rounded-md border border-input bg-white text-sm"
        >
          {TEMPLATE_NAMES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        {existingDraftId && (
          <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">
            Continuing your draft
          </span>
        )}
      </div>

      {appointments.length > 0 && (
        <div className="mb-4">
          <label className="text-xs font-medium text-muted-foreground block mb-1">Link to visit (optional)</label>
          <select
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-white text-sm max-w-sm"
          >
            <option value="">Not linked to a specific visit</option>
            {appointments.map((a: any) => (
              <option key={a.id} value={a.id}>
                {new Date(a.starts_at).toLocaleString('en-AU', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
                {new Date(a.starts_at) > new Date() ? ' (upcoming)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {unsupported.size > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
          This template includes question type(s) not yet supported here ({Array.from(unsupported).join(', ')}).
          Add those directly in Cliniko after saving.
        </div>
      )}

      <div className="space-y-6">
        {template.content.sections
          .map((section) => ({ section, questions: visibleQuestions(section) }))
          .filter(({ questions }) => questions.length > 0)
          .map(({ section, questions }) => (
            <div key={section.name} className="bg-white border border-border rounded-lg p-5">
              <h3 className="font-semibold text-foreground mb-4">{section.name}</h3>
              <div className="space-y-4">
                {questions.map((q) => {
                  const key = questionKey(section.name, q)
                  return (
                    <QuestionField
                      key={key}
                      question={q}
                      value={answers[key]}
                      onChange={(v) => setAnswers((a) => ({ ...a, [key]: v }))}
                    />
                  )
                })}
              </div>
            </div>
          ))}
      </div>

      <div className="flex items-center gap-3 mt-6">
        <Button variant="outline" onClick={() => save(true)} disabled={status === 'saving'}>
          Save as draft
        </Button>
        <Button onClick={() => save(false)} disabled={status === 'saving'}>
          Save as final
        </Button>
        {status === 'saved' && <span className="text-sm text-primary font-medium">Saved</span>}
        {status === 'error' && (
          <span className="text-sm text-destructive font-medium">{saveError || "Couldn't save — try again"}</span>
        )}
      </div>
      {!existingDraftId ? null : (
        <p className="text-xs text-muted-foreground mt-2">
          Saving as final locks this note permanently in Cliniko — nobody, including Micheal, can edit it again.
        </p>
      )}
    </div>
  )
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: Question
  value: string | string[] | undefined
  onChange: (v: string | string[]) => void
}) {
  if (question.type === 'paragraph') {
    return (
      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">{question.name}</label>
        <textarea
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    )
  }

  if (question.type === 'radiobuttons') {
    return (
      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">{question.name}</label>
        <div className="flex flex-wrap gap-2">
          {(question.answers || []).map((a) => a.value).map((opt) => (
            <button
              type="button"
              key={opt}
              onClick={() => onChange(opt)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                value === opt ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-secondary'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (question.type === 'checkboxes') {
    const selected = (value as string[]) || []
    return (
      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">{question.name}</label>
        <div className="flex flex-wrap gap-2">
          {(question.answers || []).map((a) => a.value).map((opt) => {
            const active = selected.includes(opt)
            return (
              <button
                type="button"
                key={opt}
                onClick={() => onChange(active ? selected.filter((s) => s !== opt) : [...selected, opt])}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  active ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-secondary'
                }`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // 'text' and any unrecognised-but-simple types fall back to a single-line input
  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-1.5">{question.name}</label>
      <input
        type="text"
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  )
}

// ── Visit timeline ───────────────────────────────────────────────

function Timeline({ patientId }: { patientId: string }) {
  const [notes, setNotes] = useState<any[] | null>(null)

  useEffect(() => {
    fetch(`/api/notes?patientId=${patientId}`)
      .then((r) => r.json())
      .then((data) => setNotes(data.notes || []))
      .catch(() => setNotes([]))
  }, [patientId])

  if (!notes) return <div className="text-muted-foreground text-sm">Loading visit history…</div>
  if (notes.length === 0) return <div className="text-muted-foreground text-sm">No visit notes yet.</div>

  return (
    <div className="relative pl-6">
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
      <div className="space-y-6">
        {notes.map((note) => (
          <div key={note.id} className="relative">
            <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full bg-primary border-2 border-white shadow" />
            <div className="bg-white border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {new Date(note.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">{note.title}</span>
                </div>
                {note.draft && (
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">Draft</span>
                )}
              </div>
              {(note.content?.sections || []).map((s: any) => {
                // Only show questions that actually have content — an
                // empty section full of "—" placeholders is exactly the
                // "summary" look we're moving away from here.
                const answered = s.questions
                  .map((q: any) => {
                    const isMultiChoice = Array.isArray(q.answers)
                    const value = isMultiChoice
                      ? q.answers.filter((a: any) => a.selected).map((a: any) => a.value)
                      : q.answer
                    const hasValue = isMultiChoice ? value.length > 0 : !!(value && String(value).trim())
                    return { q, value, hasValue }
                  })
                  .filter(({ hasValue }: any) => hasValue)

                if (answered.length === 0) return null

                return (
                  <div key={s.name} className="mb-4 last:mb-0">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {s.name}
                    </div>
                    {answered.map(({ q, value }: any) => {
                      if (q.type === 'paragraph') {
                        return (
                          <div key={`${s.name}::${q.name}`} className="mb-3 last:mb-0">
                            <div className="text-xs font-medium text-foreground mb-0.5">{q.name}</div>
                            <ClinikoHtml
                              html={value}
                              className="text-sm text-muted-foreground leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0"
                            />
                          </div>
                        )
                      }
                      const display = Array.isArray(value) ? value.join(', ') : value
                      return (
                        <div key={`${s.name}::${q.name}`} className="text-sm mb-1">
                          <span className="text-foreground font-medium">{q.name}: </span>
                          <span className="text-muted-foreground">{display}</span>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Attachments ──────────────────────────────────────────────────

function Attachments({ patientId }: { patientId: string }) {
  const [attachments, setAttachments] = useState<any[] | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function refresh() {
    fetch(`/api/attachments?patientId=${patientId}`)
      .then((r) => r.json())
      .then((data) => setAttachments(data.attachments || []))
      .catch(() => setAttachments([]))
  }

  useEffect(refresh, [patientId])

  // Cliniko's S3 bucket has no CORS policy for our origin, so a browser
  // fetch() straight to S3 gets blocked before it leaves the browser. This
  // route uploads through our own server instead (server-to-server has no
  // CORS restriction) — see README.portal.md "Open next steps" for the
  // longer-term fix and why that caps us at MAX_UPLOAD_MB for now.
  const MAX_UPLOAD_MB = 4

  async function handleUpload(file: File) {
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError(`File is too large. Uploads are currently limited to ${MAX_UPLOAD_MB}MB.`)
      return
    }
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('patientId', patientId)
      formData.append('file', file)

      const res = await fetch('/api/attachments/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || `Upload failed (HTTP ${res.status})`)
      }

      refresh()
    } catch (e: any) {
      setError(e?.message || 'Upload failed — try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-dashed border-input text-sm text-muted-foreground hover:border-primary hover:text-primary cursor-pointer mb-4 transition-colors">
        <Upload className="h-4 w-4" />
        {uploading ? 'Uploading…' : `Upload file (up to ${MAX_UPLOAD_MB}MB)`}
        <input
          type="file"
          className="hidden"
          disabled={uploading}
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        />
      </label>
      {error && <p className="text-destructive text-sm mb-4">{error}</p>}

      {!attachments ? (
        <div className="text-muted-foreground text-sm">Loading attachments…</div>
      ) : attachments.length === 0 ? (
        <div className="text-muted-foreground text-sm">No attachments yet.</div>
      ) : (
        <div className="bg-white border border-border rounded-lg divide-y divide-border">
          {attachments.map((a) => (
            <a
              key={a.id}
              href={`/api/attachments/${a.id}/download?patientId=${patientId}&filename=${encodeURIComponent(a.filename || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors"
            >
              <Paperclip className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm text-foreground">{a.filename}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(a.created_at).toLocaleDateString('en-AU')}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// 7:00am–7:00pm in 15-minute increments, e.g. "05:00" -> "5:00 AM".
// Booking is manual-entry only (no Cliniko available_times lookup — see
// PR notes: that endpoint 404s whenever a type isn't individually
// enabled for online bookings on this specific business, which isn't
// worth chasing per-type in Cliniko's settings just to populate a slot
// picker).
const TIME_OPTIONS: { value: string; label: string }[] = (() => {
  const opts: { value: string; label: string }[] = []
  for (let minutes = 7 * 60; minutes <= 19 * 60; minutes += 15) {
    const h24 = Math.floor(minutes / 60)
    const m = minutes % 60
    const value = `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12
    const period = h24 < 12 ? 'AM' : 'PM'
    opts.push({ value, label: `${h12}:${String(m).padStart(2, '0')} ${period}` })
  }
  return opts
})()

// Admin-only. Always books under Physio to Home + Micheal's own
// practitioner record — see /api/appointments and lib/cliniko.ts. There's
// no business/practitioner picker here on purpose, since this account has
// a few businesses sharing one API key and this should never create a
// booking under someone else's name or in a different business.
function BookVisit({ patientId }: { patientId: string }) {
  const [types, setTypes] = useState<{ id: string; name: string; duration_in_minutes: number }[] | null>(null)
  const [appointmentTypeId, setAppointmentTypeId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/appointments')
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) {
          setFetchError(data?.error || `Failed to load appointment types (HTTP ${r.status})`)
          setTypes([])
          return
        }
        setTypes(data.appointmentTypes || [])
        if (data.appointmentTypes?.[0]) setAppointmentTypeId(data.appointmentTypes[0].id)
      })
      .catch((e) => {
        setFetchError(e?.message || 'Network error loading appointment types')
        setTypes([])
      })
  }, [])

  const selectedType = types?.find((t) => t.id === appointmentTypeId)

  async function book() {
    if (!appointmentTypeId || !date || !time || !selectedType) return
    setStatus('saving')
    setError(null)
    const startsAt = new Date(`${date}T${time}:00`).toISOString()

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId,
        appointmentTypeId,
        startsAt,
        durationMinutes: selectedType.duration_in_minutes,
        notes: notes || undefined,
      }),
    })

    if (res.ok) {
      setStatus('saved')
      setDate('')
      setTime('')
      setNotes('')
    } else {
      const body = await res.json().catch(() => null)
      setError(body?.error || `Booking failed (HTTP ${res.status})`)
      setStatus('error')
    }
  }

  if (!types) return <div className="text-muted-foreground text-sm">Loading appointment types…</div>

  if (types.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        {fetchError ? (
          <>Couldn&apos;t load appointment types: {fetchError}</>
        ) : (
          <>
            No appointment types found for Physio to Home under your practitioner record in Cliniko. Check
            CLINIKO_BUSINESS_ID / CLINIKO_PRACTITIONER_ID are set correctly.
          </>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white border border-border rounded-lg p-5 max-w-md">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Appointment type</label>
          <select
            className="w-full border border-input rounded-md px-3 py-2 text-sm bg-white"
            value={appointmentTypeId}
            onChange={(e) => setAppointmentTypeId(e.target.value)}
          >
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.duration_in_minutes} min)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Date</label>
          <input
            type="date"
            className="w-full border border-input rounded-md px-3 py-2 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {date && (
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Time</label>
            <select
              className="w-full border border-input rounded-md px-3 py-2 text-sm bg-white"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            >
              <option value="">Select a time</option>
              {TIME_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Notes (optional)</label>
          <textarea
            className="w-full border border-input rounded-md px-3 py-2 text-sm min-h-[70px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-5">
        <Button onClick={book} disabled={status === 'saving' || !date || !time}>
          {status === 'saving' ? 'Booking…' : 'Book appointment'}
        </Button>
        {status === 'saved' && <span className="text-sm text-emerald-700 font-medium">Booked ✓</span>}
        {status === 'error' && <span className="text-sm text-destructive font-medium">{error}</span>}
      </div>
    </div>
  )
}

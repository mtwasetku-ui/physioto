'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Calendar, MapPin, Phone, Cake, Paperclip, Upload, FileText, Clock, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ClinikoPatientInfo } from '@/lib/cliniko'
import { TIME_OPTIONS } from '@/lib/timeOptions'

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

// Turns the plain text typed into a "paragraph" textarea into the HTML
// Cliniko expects for that field type. Escape first so the physio's own
// text (e.g. "10 x 2 <-> alternate sides") can't be misread as markup,
// then convert line breaks to real <br> tags — a bare "\n" has no effect
// once the string is rendered as HTML, which is what was causing entries
// to come out as one squashed line.
function plainTextToParagraphHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
}

// Reverses plainTextToParagraphHtml, for loading a saved draft's paragraph
// answers back into an editable plain-text textarea. <br> tags (and any
// </p><p> paragraph breaks Cliniko's own editor may have produced) become
// newlines first, then any remaining tags are stripped and the HTML
// entities we escaped on save are unescaped.
function paragraphHtmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

// Rebuilds the NoteForm `answers` state (keyed the same way the form
// itself keys them — see questionKey) from a note as Cliniko returns it,
// so continuing a draft restores what was already typed instead of
// opening the form blank next to a read-only "Draft" copy.
function answersFromNoteContent(note: any): Record<string, string | string[]> {
  const answers: Record<string, string | string[]> = {}
  for (const s of note?.content?.sections || []) {
    for (const q of s.questions || []) {
      const key = `${s.name}::${q.name}`
      if (q.type === 'radiobuttons' || q.type === 'checkboxes') {
        const selected = (q.answers || []).filter((a: any) => a.selected).map((a: any) => a.value)
        answers[key] = q.type === 'checkboxes' ? selected : selected[0] ?? ''
      } else if (q.type === 'paragraph') {
        answers[key] = paragraphHtmlToPlainText(q.answer || '')
      } else {
        answers[key] = q.answer || ''
      }
    }
  }
  return answers
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

// Renders a paragraph-question answer as actual formatted text rather
// than a raw HTML string. Falls back to plain stripped text if parsing
// fails or (during server rendering) DOMParser isn't available.
// Named generically (not e.g. "ClinikoHtml") because component names are
// visible at runtime in React DevTools, and this file is practitioner-
// facing (Final Agreement §4).
function RichAnswerHtml({ html, className }: { html: string; className?: string }) {
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
  // ?appointmentId=... — set by the "Add treatment note" button on the
  // calendar, so a note started from there is pre-linked to that specific
  // visit instead of falling back to NoteForm's own "today's appointment"
  // guess.
  const searchParams = useSearchParams()
  const linkAppointmentId = searchParams.get('appointmentId')

  return (
    <div>
      <h1 className="serif text-2xl text-foreground font-semibold mb-1">
        {patient.firstName} {patient.lastName}
      </h1>
      <p className="text-muted-foreground text-sm mb-6">Patient home visit</p>

      <PatientInfoBlock patient={patient} nextAppointment={nextAppointment} patientId={patientId} />

      <div className="flex gap-1 border-b border-border mb-6 mt-8">
        {(
          [
            ['note', 'New note', FileText],
            ['timeline', 'Visit history', Clock],
            ['attachments', 'Attachments', Paperclip],
            ['book', 'Book visit', Calendar],
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

      {tab === 'note' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <NoteForm patientId={patientId} authorEmail={authorEmail} initialAppointmentId={linkAppointmentId} />
          <div className="lg:sticky lg:top-4">
            <NoteHistoryPanel patientId={patientId} />
          </div>
        </div>
      )}
      {tab === 'timeline' && <Timeline patientId={patientId} />}
      {tab === 'attachments' && <Attachments patientId={patientId} />}
      {tab === 'book' && (
        <>
          <UpcomingAppointments patientId={patientId} />
          <BookVisit patientId={patientId} patientLabel={`${patient.firstName} ${patient.lastName}`.trim()} />
        </>
      )}
    </div>
  )
}

// ── Patient info block ──────────────────────────────────────────

function PatientInfoBlock({
  patient,
  nextAppointment,
  patientId,
}: {
  patient: ClinikoPatientInfo
  nextAppointment: any
  patientId: string
}) {
  const [editing, setEditing] = useState(false)

  return (
    <>
      <div className="bg-white border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Patient details</h2>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit details
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={MapPin} label="Address" value={patient.address || 'Not on file'} />
          <InfoRow icon={Phone} label="Phone" value={patient.phone || 'Not on file'} />
          <InfoRow icon={Cake} label="Date of birth" value={patient.dateOfBirth || 'Not on file'} />
          <InfoRow
            icon={Calendar}
            label="Your next visit"
            value={
              nextAppointment
                ? new Date(nextAppointment.starts_at).toLocaleString('en-AU', {
                    weekday: 'short', day: 'numeric', month: 'short',
                    hour: 'numeric', minute: '2-digit',
                  })
                : 'None scheduled'
            }
          />
        </div>
      </div>
      {editing && <EditPatientDialog patient={patient} patientId={patientId} onClose={() => setEditing(false)} />}
    </>
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

function EditPatientDialog({
  patient,
  patientId,
  onClose,
}: {
  patient: ClinikoPatientInfo
  patientId: string
  onClose: () => void
}) {
  const [form, setForm] = useState({
    firstName: patient.firstName,
    lastName: patient.lastName,
    dateOfBirth: patient.dateOfBirth || '',
    phone: patient.phone || '',
    address1: patient.address1 || '',
    address2: patient.address2 || '',
    city: patient.city || '',
    state: patient.state || '',
    postCode: patient.postCode || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/portal/patients/${patientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not save patient details')
      // Reload so the server fetches the latest Cliniko record.
      window.location.reload()
    } catch (e: any) {
      setError(e?.message || 'Could not save patient details')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white border border-border shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">Edit patient details</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Changes are saved directly to the patient record.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First name" value={form.firstName} onChange={(v) => set('firstName', v)} />
            <Field label="Last name" value={form.lastName} onChange={(v) => set('lastName', v)} />
            <Field label="Date of birth" type="date" value={form.dateOfBirth} onChange={(v) => set('dateOfBirth', v)} />
            <Field label="Phone" value={form.phone} onChange={(v) => set('phone', v)} />
          </div>

          <div>
            <div className="text-sm font-medium mb-3">Address</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Address line 1" value={form.address1} onChange={(v) => set('address1', v)} />
              <Field label="Address line 2" value={form.address2} onChange={(v) => set('address2', v)} />
              <Field label="Suburb / city" value={form.city} onChange={(v) => set('city', v)} />
              <Field label="State" value={form.state} onChange={(v) => set('state', v)} />
              <Field label="Postcode" value={form.postCode} onChange={(v) => set('postCode', v)} />
            </div>
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 rounded p-3">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  )
}

// ── New note form ────────────────────────────────────────────────

function NoteForm({
  patientId,
  authorEmail,
  initialAppointmentId,
}: {
  patientId: string
  authorEmail: string
  initialAppointmentId?: string | null
}) {
  const [templates, setTemplates] = useState<Template[] | null>(null)
  const [templateName, setTemplateName] = useState<string>(TEMPLATE_NAMES[0])
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [existingDraftId, setExistingDraftId] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string>('')
  const [arriving, setArriving] = useState(false)
  const [arriveError, setArriveError] = useState<string | null>(null)
  const [markingDna, setMarkingDna] = useState(false)
  const [dnaError, setDnaError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates))
      .catch(() => setError('Could not load note templates.'))
  }, [])

  useEffect(() => {
    setBookingId('')
    setAppointmentsError(null)
    // Recent + upcoming visits for this patient, so the note can be
    // linked to the actual appointment it was written for.
    fetch(`/api/appointments/for-patient?patientId=${patientId}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) {
          setAppointmentsError(data?.error || `Failed to load appointments (HTTP ${r.status})`)
          setAppointments([])
          return
        }
        const list = data.appointments || []
        setAppointments(list)
        // Coming from "Add treatment note" on the calendar for a specific
        // visit takes priority over the "today" guess below.
        if (initialAppointmentId) {
          setBookingId(initialAppointmentId)
          return
        }
        // Default to today's visit if there is one, otherwise leave unlinked.
        const today = list.find((a: any) => new Date(a.starts_at).toDateString() === new Date().toDateString())
        if (today) setBookingId(String(today.id))
      })
      .catch((e) => {
        setAppointmentsError(e?.message || 'Network error loading appointments')
        setAppointments([])
      })
  }, [patientId, initialAppointmentId])

  useEffect(() => {
    setAnswers({})
    setExistingDraftId(null)
    // Offer the physio's own most recent draft for this patient to continue,
    // rather than always starting blank. If that draft is already linked to
    // a visit, carry the link over so continuing a draft doesn't silently
    // drop it. Also restore the answers already typed into it — otherwise
    // the form re-opens blank (with existingDraftId quietly set), so
    // "continuing" a draft looks like the draft can't be edited at all.
    fetch(`/api/notes?patientId=${patientId}&draftOnly=true`)
      .then((r) => r.json())
      .then((data) => {
        const mine = (data.notes || []).find((n: any) => n.title === authorEmail && n.draft)
        if (mine) {
          setExistingDraftId(mine.id)
          setAnswers(answersFromNoteContent(mine))
          // Cliniko only gives us the booking as a link
          // (".../bookings/{id}") on the note, not a flat id — pull the id
          // off the end of that URL.
          const bookingSelf = mine.booking?.links?.self as string | undefined
          const existingBookingId = bookingSelf?.split('/').filter(Boolean).pop()
          if (existingBookingId) setBookingId(existingBookingId)
          // The draft may have been started on a different template than
          // whatever the dropdown currently shows — switch to match so the
          // restored answers actually line up with the sections rendered.
          const templateSelf = mine.treatment_note_template?.links?.self as string | undefined
          const draftTemplateId = templateSelf?.split('/').filter(Boolean).pop()
          if (draftTemplateId) {
            const draftTemplate = templates?.find((t) => String(t.id) === draftTemplateId)
            if (draftTemplate && draftTemplate.name !== templateName) setTemplateName(draftTemplate.name)
          }
        }
      })
      .catch(() => {})
  }, [patientId, templateName, authorEmail, templates])

  const template = templates?.find((t) => t.name === templateName)

  if (error) return <div className="text-destructive text-sm">{error}</div>
  if (!templates) return <div className="text-muted-foreground text-sm">Loading templates…</div>

  if (!template) {
    return (
      <div className="bg-white border border-border rounded-lg p-6 text-sm">
        <p className="text-destructive font-medium mb-1">Template not found</p>
        <p className="text-muted-foreground">
          No treatment note template is named exactly &quot;{templateName}&quot;. Check the template name
          matches exactly, including capitalisation.
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
          answers: questions.map((q) => {
            const raw = answers[questionKey(s.name, q)] ?? (q.type === 'checkboxes' ? [] : '')
            return {
              questionName: q.name,
              // Cliniko stores/renders "paragraph" answers as HTML — its own
              // editor wraps each line in real markup. Our plain <textarea>
              // only gives back literal "\n" characters, which aren't markup
              // and collapse to nothing once rendered as HTML, squashing
              // every line into one run-on blob. Escape first (so a typed
              // "<" or ">" isn't misread as a tag), then turn line breaks
              // into real <br> tags so the spacing survives in Cliniko, PDF
              // exports, and this portal's own note view.
              value: q.type === 'paragraph' ? plainTextToParagraphHtml((raw as string) || '') : raw,
            }
          }),
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

  const selectedAppointment = appointments.find((a: any) => String(a.id) === bookingId)

  async function setArrived(arrived: boolean) {
    if (!bookingId) return
    setArriving(true)
    setArriveError(null)
    const res = await fetch(`/api/appointments/${bookingId}/arrive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, arrived }),
    })
    if (res.ok) {
      setAppointments((prev) =>
        prev.map((a: any) => (String(a.id) === bookingId ? { ...a, patient_arrived: arrived, did_not_arrive: arrived ? false : a.did_not_arrive } : a))
      )
    } else {
      const body = await res.json().catch(() => null)
      setArriveError(body?.error || `Failed to update arrival status (HTTP ${res.status})`)
    }
    setArriving(false)
  }

  async function setDidNotArrive(didNotArrive: boolean) {
    if (!bookingId) return
    setMarkingDna(true)
    setDnaError(null)
    const res = await fetch(`/api/appointments/${bookingId}/dna`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, didNotArrive }),
    })
    if (res.ok) {
      setAppointments((prev) =>
        prev.map((a: any) =>
          String(a.id) === bookingId ? { ...a, did_not_arrive: didNotArrive, patient_arrived: didNotArrive ? false : a.patient_arrived } : a
        )
      )
    } else {
      const body = await res.json().catch(() => null)
      setDnaError(body?.error || `Failed to update did-not-arrive status (HTTP ${res.status})`)
    }
    setMarkingDna(false)
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

      {appointmentsError && (
        <div className="mb-4 text-xs text-muted-foreground">Couldn&apos;t load visits to link, please book a visit first.</div>
      )}

      {appointments.length > 0 && (
        <div className="mb-4">
          <label className="text-xs font-medium text-muted-foreground block mb-1">Link to visit (optional)</label>
          <div className="flex items-center gap-2">
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
                  {a.patient_arrived ? ' — arrived' : ''}
                  {a.did_not_arrive ? ' — did not arrive' : ''}
                </option>
              ))}
            </select>

            {bookingId &&
              (selectedAppointment?.patient_arrived ? (
                <button
                  type="button"
                  onClick={() => setArrived(false)}
                  disabled={arriving}
                  title="Mark not arrived"
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium hover:bg-emerald-200 whitespace-nowrap disabled:opacity-50"
                >
                  {arriving ? 'Undoing…' : 'Arrived ✓'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setArrived(true)}
                  disabled={arriving}
                  className="text-xs px-2.5 py-1.5 rounded-md border border-input hover:bg-secondary whitespace-nowrap disabled:opacity-50"
                >
                  {arriving ? 'Marking…' : 'Mark arrived'}
                </button>
              ))}

            {bookingId &&
              (selectedAppointment?.did_not_arrive ? (
                <button
                  type="button"
                  onClick={() => setDidNotArrive(false)}
                  disabled={markingDna}
                  title="Undo did not arrive"
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 font-medium hover:bg-red-200 whitespace-nowrap disabled:opacity-50"
                >
                  {markingDna ? 'Undoing…' : 'Did not arrive ✓'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setDidNotArrive(true)}
                  disabled={markingDna}
                  className="text-xs px-2.5 py-1.5 rounded-md border border-input hover:bg-secondary whitespace-nowrap disabled:opacity-50"
                >
                  {markingDna ? 'Marking…' : 'Did not arrive'}
                </button>
              ))}
          </div>
          {arriveError && <p className="text-xs text-destructive mt-1">{arriveError}</p>}
          {dnaError && <p className="text-xs text-destructive mt-1">{dnaError}</p>}
        </div>
      )}

      {unsupported.size > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
          This template includes question type(s) not yet supported here ({Array.from(unsupported).join(', ')}).
          Ask Micheal to add those after saving.
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
          Saving as final locks this note permanently — nobody, including Micheal, can edit it again.
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
            <NoteCard note={note} />
          </div>
        ))}
      </div>
    </div>
  )
}

// A single note's date/author/draft-badge header plus its answered
// questions — shared between the full visit timeline and the compact
// "previous notes" panel shown next to the note form (see
// NoteHistoryPanel below). `compact` tightens padding/text size for the
// narrower sidebar without changing what's shown.
function NoteCard({ note, compact }: { note: any; compact?: boolean }) {
  return (
    <div className={`bg-white border border-border rounded-lg ${compact ? 'p-3' : 'p-5'}`}>
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="min-w-0">
          <span className={`font-medium text-foreground ${compact ? 'text-sm' : 'text-base'}`}>
            {new Date(note.visitDate || note.created_at).toLocaleDateString('en-AU', {
              day: 'numeric',
              month: 'long',
              year: compact ? undefined : 'numeric',
            })}
          </span>
          <span className={`font-semibold text-primary ml-2 ${compact ? 'text-sm' : 'text-sm'}`}>
            {note.visitPractitionerName || note.authorDisplayName || note.title}
          </span>
        </div>
        {note.draft && (
          <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 font-medium flex-shrink-0">
            Draft
          </span>
        )}
      </div>
      {(note.content?.sections || []).map((s: any) => {
        // Only show questions that actually have content — an empty
        // section full of "—" placeholders is exactly the "summary" look
        // we're moving away from here.
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
            <div className={`font-bold text-primary uppercase tracking-wide mb-2 ${compact ? 'text-xs' : 'text-sm'}`}>{s.name}</div>
            {answered.map(({ q, value }: any) => {
              if (q.type === 'paragraph') {
                return (
                  <div key={`${s.name}::${q.name}`} className="mb-3 last:mb-0">
                    <div className={`font-medium text-foreground mb-0.5 ${compact ? 'text-xs' : 'text-sm'}`}>{q.name}</div>
                    <RichAnswerHtml
                      html={value}
                      className={`text-muted-foreground leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 ${compact ? 'text-sm' : 'text-base'}`}
                    />
                  </div>
                )
              }
              const display = Array.isArray(value) ? value.join(', ') : value
              return (
                <div key={`${s.name}::${q.name}`} className={`mb-1 ${compact ? 'text-sm' : 'text-base'}`}>
                  <span className="text-foreground font-medium">{q.name}: </span>
                  <span className="text-muted-foreground">{display}</span>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// Previous notes for this patient, shown alongside the note form so a
// physio can glance back at recent visits while writing today's — the
// same idea as Cliniko's own "Previous notes" side panel. Reuses the
// same /api/notes data as the full Visit history tab, just rendered
// smaller and narrower.
const NOTE_HISTORY_PAGE_SIZE = 5

function NoteHistoryPanel({ patientId }: { patientId: string }) {
  const [notes, setNotes] = useState<any[] | null>(null)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setNotes(null)
    setPage(1)
    fetch(`/api/notes?patientId=${patientId}`)
      .then((r) => r.json())
      .then((data) => setNotes(data.notes || []))
      .catch(() => setNotes([]))
  }, [patientId])

  // Filtering changes which notes are in scope, so jump back to page 1
  // rather than risk landing on a page number that no longer exists.
  useEffect(() => {
    setPage(1)
  }, [filter])

  if (!notes) return <div className="text-muted-foreground text-sm">Loading previous notes…</div>

  const term = filter.trim().toLowerCase()
  const filtered = term
    ? notes.filter((n: any) => JSON.stringify(n.content?.sections || []).toLowerCase().includes(term))
    : notes

  const pageCount = Math.max(1, Math.ceil(filtered.length / NOTE_HISTORY_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageStart = (currentPage - 1) * NOTE_HISTORY_PAGE_SIZE
  const paged = filtered.slice(pageStart, pageStart + NOTE_HISTORY_PAGE_SIZE)

  return (
    <div>
      <h2 className="text-base font-semibold text-foreground mb-3">Previous notes</h2>
      {notes.length > 0 && (
        <input
          type="text"
          placeholder="Filter treatment notes…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full h-10 px-3 mb-3 rounded-md border border-input bg-white text-base"
        />
      )}
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No previous notes yet.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes match &quot;{filter}&quot;.</p>
      ) : (
        <>
          <div className="space-y-3">
            {paged.map((note: any) => (
              <NoteCard key={note.id} note={note} compact />
            ))}
          </div>
          {pageCount > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="text-sm font-medium text-primary disabled:text-muted-foreground disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage === pageCount}
                className="text-sm font-medium text-primary disabled:text-muted-foreground disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
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

// Mirrors lib/cliniko.ts CANCELLATION_REASONS — kept as a separate copy
// rather than an import because cliniko.ts is server-only (it reads the
// Cliniko API key at module scope) and must never end up in the client
// bundle. Cliniko requires one of these codes on every cancellation;
// there's no free-text-only option.
const CLIENT_CANCELLATION_REASONS = [
  { code: 10, label: 'Feeling better' },
  { code: 20, label: 'Condition worse' },
  { code: 30, label: 'Sick' },
  { code: 31, label: 'COVID-19 related' },
  { code: 40, label: 'Away' },
  { code: 60, label: 'Work' },
  { code: 50, label: 'Other' },
] as const

// Patient's upcoming visits, each with a "Cancel visit" action. Cliniko
// doesn't support actually deleting an appointment through this endpoint
// — cancelling sets cancelled_at (and requires a reason code) rather than
// removing the record, which keeps history and invoicing intact. That's
// the closest available action to "delete" and is what /api/appointments/
// [id]/cancel already does server-side.
function UpcomingAppointments({ patientId }: { patientId: string }) {
  const [appointments, setAppointments] = useState<any[] | null>(null)
  // Not surfaced in the UI: an unassigned/unloadable state just falls
  // through to "No upcoming appointments." below rather than showing
  // a scary error box for something the patient/staff can't act on.
  const [, setLoadError] = useState<string | null>(null)
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [reason, setReason] = useState<number | ''>('')
  const [cancelNote, setCancelNote] = useState('')
  const [scope, setScope] = useState<'occurrence' | 'series'>('occurrence')
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  // Appointment note — Cliniko's own `notes` field on the booking itself,
  // not a treatment/clinical note. Visible in Cliniko's diary, not part of
  // the patient's clinical record.
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteError, setNoteError] = useState<string | null>(null)

  function startEditNote(id: string, current: string) {
    setEditingNoteId(id)
    setNoteDraft(current)
    setNoteError(null)
  }

  async function saveNote(id: string) {
    setNoteSaving(true)
    setNoteError(null)
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: noteDraft }),
    })
    if (res.ok) {
      setAppointments((prev) => (prev || []).map((a: any) => (String(a.id) === id ? { ...a, notes: noteDraft } : a)))
      setEditingNoteId(null)
    } else {
      const body = await res.json().catch(() => null)
      setNoteError(body?.error || `Failed to save note (HTTP ${res.status})`)
    }
    setNoteSaving(false)
  }

  useEffect(() => {
    setAppointments(null)
    setLoadError(null)
    fetch(`/api/appointments/for-patient?patientId=${patientId}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) {
          setLoadError(data?.error || `Failed to load appointments (HTTP ${r.status})`)
          setAppointments([])
          return
        }
        setAppointments(data.appointments || [])
      })
      .catch((e) => {
        setLoadError(e?.message || 'Network error loading appointments')
        setAppointments([])
      })
  }, [patientId])

  function startCancel(id: string) {
    setCancelingId(id)
    setReason('')
    setCancelNote('')
    setScope('occurrence')
    setCancelError(null)
  }

  async function confirmCancel(id: string) {
    if (!reason) {
      setCancelError('Select a reason first.')
      return
    }
    setCancelling(true)
    setCancelError(null)
    const res = await fetch(`/api/appointments/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, note: cancelNote || undefined, scope }),
    })
    const body = await res.json().catch(() => null)
    if (res.ok) {
      // A series cancel can knock out more than just the one clicked —
      // mark everything the API actually cancelled, not just `id`.
      const cancelledIds: string[] = body?.cancelledIds || [id]
      setAppointments((prev) =>
        (prev || []).map((a: any) =>
          cancelledIds.includes(String(a.id)) ? { ...a, cancelled_at: new Date().toISOString() } : a
        )
      )
      setCancelingId(null)
      if (body?.failures?.length) {
        setCancelError(
          `Cancelled, but ${body.failures.length} other occurrence(s) in the series couldn't be cancelled — you may need to cancel those individually.`
        )
      }
    } else {
      setCancelError(body?.error || `Failed to cancel (HTTP ${res.status})`)
    }
    setCancelling(false)
  }

  if (appointments === null) {
    return <div className="text-muted-foreground text-sm mb-5">Loading upcoming appointments…</div>
  }

  const upcoming = appointments
    .filter((a: any) => !a.cancelled_at && new Date(a.starts_at) > new Date())
    .sort((a: any, b: any) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())

  return (
    <div className="bg-white border border-border rounded-lg p-5 max-w-md mb-5">
      <h2 className="text-sm font-semibold text-foreground mb-3">Upcoming appointments</h2>
      {upcoming.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
      ) : (
        <ul className="space-y-3">
          {upcoming.map((a: any) => {
            const id = String(a.id)
            return (
              <li key={id} className="border border-border rounded-md p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {new Date(a.starts_at).toLocaleString('en-AU', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                    {editingNoteId !== id && a.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5">{a.notes}</p>
                    )}
                  </div>
                  {cancelingId !== id && editingNoteId !== id && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditNote(id, a.notes || '')}
                        className="text-xs px-2.5 py-1.5 rounded-md border border-input hover:bg-secondary whitespace-nowrap"
                      >
                        {a.notes ? 'Edit note' : 'Add note'}
                      </button>
                      <button
                        type="button"
                        onClick={() => startCancel(id)}
                        className="text-xs px-2.5 py-1.5 rounded-md border border-input text-destructive hover:bg-red-50 whitespace-nowrap"
                      >
                        Cancel visit
                      </button>
                    </div>
                  )}
                </div>

                {editingNoteId === id && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    <label className="text-xs font-medium text-muted-foreground block">
                      Appointment note — visible on the booking in Cliniko, not the treatment record
                    </label>
                    <textarea
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      rows={3}
                      placeholder="e.g. Patient asked to be reminded to bring their referral letter"
                      className="w-full px-2 py-1.5 rounded-md border border-input text-sm"
                    />
                    {noteError && <p className="text-xs text-destructive">{noteError}</p>}
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => saveNote(id)} disabled={noteSaving}>
                        {noteSaving ? 'Saving…' : 'Save note'}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setEditingNoteId(null)}
                        disabled={noteSaving}
                        className="text-xs px-2.5 py-1.5 rounded-md border border-input hover:bg-secondary disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {cancelingId === id && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    {a.seriesId && (
                      <div className="space-y-1.5 mb-1">
                        <label className="flex items-center gap-2 text-sm text-foreground">
                          <input
                            type="radio"
                            name={`cancel-scope-${id}`}
                            checked={scope === 'occurrence'}
                            onChange={() => setScope('occurrence')}
                          />
                          Just this appointment
                        </label>
                        <label className="flex items-center gap-2 text-sm text-foreground">
                          <input
                            type="radio"
                            name={`cancel-scope-${id}`}
                            checked={scope === 'series'}
                            onChange={() => setScope('series')}
                          />
                          This and all future appointments in the series
                        </label>
                      </div>
                    )}
                    <select
                      value={reason}
                      onChange={(e) => setReason(Number(e.target.value))}
                      className="w-full h-9 px-2 rounded-md border border-input bg-white text-sm"
                    >
                      <option value="">Reason for cancelling…</option>
                      {CLIENT_CANCELLATION_REASONS.map((r) => (
                        <option key={r.code} value={r.code}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Note (optional)"
                      value={cancelNote}
                      onChange={(e) => setCancelNote(e.target.value)}
                      className="w-full h-9 px-2 rounded-md border border-input text-sm"
                    />
                    {cancelError && <p className="text-xs text-destructive">{cancelError}</p>}
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => confirmCancel(id)} disabled={cancelling}>
                        {cancelling ? 'Cancelling…' : scope === 'series' ? 'Confirm — cancel series' : 'Confirm cancellation'}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setCancelingId(null)}
                        disabled={cancelling}
                        className="text-xs px-2.5 py-1.5 rounded-md border border-input hover:bg-secondary disabled:opacity-50"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// Books under the logged-in physio's own Cliniko practitioner record —
// see /api/appointments and lib/cliniko.ts. There's no business/
// practitioner picker here on purpose, since this account has a few
// businesses sharing one API key and this should never create a booking
// under someone else's name or in a different business; the practitioner
// id is always resolved server-side from the session, never from a prop
// here.
const MAX_REPEAT_APPOINTMENTS = 20

function BookVisit({ patientId, patientLabel }: { patientId: string; patientLabel?: string }) {
  const [types, setTypes] = useState<{ id: string; name: string; duration_in_minutes: number }[] | null>(null)
  const [appointmentTypeId, setAppointmentTypeId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [repeat, setRepeat] = useState<'none' | 'weekly' | 'fortnightly' | 'monthly'>('none')
  const [repeatCount, setRepeatCount] = useState(4)
  const [repeatError, setRepeatError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(1)

  function updateRepeatCount(raw: string) {
    const n = Number(raw)
    if (!raw || Number.isNaN(n)) {
      setRepeatCount(1)
      setRepeatError(null)
      return
    }
    if (n > MAX_REPEAT_APPOINTMENTS) {
      setRepeatCount(MAX_REPEAT_APPOINTMENTS)
      setRepeatError(`Maximum ${MAX_REPEAT_APPOINTMENTS} appointments.`)
      return
    }
    setRepeatCount(n)
    setRepeatError(null)
  }

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
    if (repeat !== 'none' && repeatCount > MAX_REPEAT_APPOINTMENTS) {
      setRepeatError(`Maximum ${MAX_REPEAT_APPOINTMENTS} appointments.`)
      return
    }
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
        patientLabel: patientLabel || undefined,
        ...(repeat !== 'none' ? { repeat, repeatCount } : {}),
      }),
    })

    const body = await res.json().catch(() => null)
    if (res.ok) {
      setStatus('saved')
      setSavedCount(body?.appointments?.length ?? 1)
      if (body?.failures?.length) {
        setError(`${body.failures.length} of ${repeatCount} in the series couldn't be booked — Cliniko rejected those dates.`)
      }
      setDate('')
      setTime('')
      setNotes('')
      setRepeat('none')
      setRepeatCount(4)
    } else {
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
            No appointment types found for Physio to Home under your practitioner record. If you&apos;re
            newly added, ask Micheal to double check the link on the Staff page.
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

        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Repeat</label>
          <select
            className="w-full border border-input rounded-md px-3 py-2 text-sm bg-white"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value as typeof repeat)}
          >
            <option value="none">Does not repeat</option>
            <option value="weekly">Weekly</option>
            <option value="fortnightly">Fortnightly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {repeat !== 'none' && (
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Number of appointments</label>
            <input
              type="number"
              min={2}
              max={MAX_REPEAT_APPOINTMENTS}
              className="w-full border border-input rounded-md px-3 py-2 text-sm"
              value={repeatCount}
              onChange={(e) => updateRepeatCount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Including this one, up to {MAX_REPEAT_APPOINTMENTS}.</p>
            {repeatError && <p className="text-xs text-destructive mt-1">{repeatError}</p>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mt-5">
        <Button onClick={book} disabled={status === 'saving' || !date || !time || !!repeatError}>
          {status === 'saving'
            ? 'Booking…'
            : repeat !== 'none'
              ? `Book ${repeatCount} appointments`
              : 'Book appointment'}
        </Button>
        {status === 'saved' && (
          <span className="text-sm text-emerald-700 font-medium">
            {savedCount > 1 ? `Booked ${savedCount} appointments ✓` : 'Booked ✓'}
          </span>
        )}
        {status === 'error' && <span className="text-sm text-destructive font-medium">{error}</span>}
        {status === 'saved' && error && <span className="text-sm text-amber-700 font-medium">{error}</span>}
      </div>
    </div>
  )
}

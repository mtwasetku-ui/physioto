'use client'

import { useEffect, useState } from 'react'
import { Calendar, MapPin, Phone, Cake, Paperclip, Upload, FileText, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ClinikoPatientInfo } from '@/lib/cliniko'

type Tab = 'note' | 'timeline' | 'attachments'

interface Question {
  id: number
  name: string
  question_type: string
  answer_options?: string[]
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

const TEMPLATE_NAMES = ['Initial Consultation', 'Standard Consultation']

export default function PatientDetailClient({
  patientId,
  patient,
  nextAppointment,
  authorEmail,
}: {
  patientId: string
  patient: ClinikoPatientInfo
  nextAppointment: any
  authorEmail: string
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
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({})
  const [existingDraftId, setExistingDraftId] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates))
      .catch(() => setError('Could not load note templates from Cliniko.'))
  }, [])

  useEffect(() => {
    setAnswers({})
    setExistingDraftId(null)
    // Offer the physio's own most recent draft for this patient to continue,
    // rather than always starting blank.
    fetch(`/api/notes?patientId=${patientId}&draftOnly=true`)
      .then((r) => r.json())
      .then((data) => {
        const mine = (data.notes || []).find((n: any) => n.title === authorEmail && n.draft)
        if (mine) setExistingDraftId(mine.id)
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
    for (const q of s.questions) {
      if (!['text', 'paragraph_text', 'radio_buttons', 'checkboxes'].includes(q.question_type)) {
        unsupported.add(q.question_type)
      }
    }
  }

  async function save(draft: boolean) {
    setStatus('saving')
    const sections = template!.content.sections.map((s) => ({
      name: s.name,
      answers: s.questions.map((q) => ({ questionId: q.id, value: answers[q.id] ?? (q.question_type === 'checkboxes' ? [] : '') })),
    }))

    const res = await fetch('/api/notes', {
      method: existingDraftId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        existingDraftId
          ? { noteId: existingDraftId, templateName, sections, draft, patientId }
          : { patientId, templateName, sections, draft }
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

      {unsupported.size > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
          This template includes question type(s) not yet supported here ({Array.from(unsupported).join(', ')}).
          Add those directly in Cliniko after saving.
        </div>
      )}

      <div className="space-y-6">
        {template.content.sections.map((section) => (
          <div key={section.name} className="bg-white border border-border rounded-lg p-5">
            <h3 className="font-semibold text-foreground mb-4">{section.name}</h3>
            <div className="space-y-4">
              {section.questions.map((q) => (
                <QuestionField key={q.id} question={q} value={answers[q.id]} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
              ))}
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
        {status === 'error' && <span className="text-sm text-destructive font-medium">Couldn&apos;t save — try again</span>}
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
  if (question.question_type === 'paragraph_text') {
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

  if (question.question_type === 'radio_buttons') {
    return (
      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">{question.name}</label>
        <div className="flex flex-wrap gap-2">
          {(question.answer_options || []).map((opt) => (
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

  if (question.question_type === 'checkboxes') {
    const selected = (value as string[]) || []
    return (
      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">{question.name}</label>
        <div className="flex flex-wrap gap-2">
          {(question.answer_options || []).map((opt) => {
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
              {(note.content?.sections || []).map((s: any) => (
                <div key={s.name} className="mb-3 last:mb-0">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{s.name}</div>
                  {s.questions.map((q: any) => (
                    <div key={q.id} className="text-sm mb-1">
                      <span className="text-foreground font-medium">{q.name}: </span>
                      <span className="text-muted-foreground">
                        {Array.isArray(q.answer) ? q.answer.join(', ') || '—' : q.answer || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
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

  async function handleUpload(file: File) {
    setUploading(true)
    setError(null)
    try {
      // Step 1: server asks Cliniko for a presigned S3 POST
      const presignRes = await fetch('/api/attachments/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, fileName: file.name, contentType: file.type }),
      })
      if (!presignRes.ok) throw new Error('presign failed')
      const { url, fields, key } = await presignRes.json()

      // Step 2: browser uploads straight to S3, never touching our server
      const formData = new FormData()
      Object.entries(fields).forEach(([k, v]) => formData.append(k, v as string))
      formData.append('file', file)
      const s3Res = await fetch(url, { method: 'POST', body: formData })
      if (!s3Res.ok) throw new Error('S3 upload failed')

      // Step 3: server registers the object as a real Cliniko attachment
      const finalizeRes = await fetch('/api/attachments/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, key, fileName: file.name, contentType: file.type }),
      })
      if (!finalizeRes.ok) throw new Error('finalize failed')

      refresh()
    } catch {
      setError('Upload failed — try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-dashed border-input text-sm text-muted-foreground hover:border-primary hover:text-primary cursor-pointer mb-4 transition-colors">
        <Upload className="h-4 w-4" />
        {uploading ? 'Uploading…' : 'Upload file (up to 500MB)'}
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
              href={`/api/attachments/${a.id}/download?patientId=${patientId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors"
            >
              <Paperclip className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm text-foreground">{a.file_name}</span>
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

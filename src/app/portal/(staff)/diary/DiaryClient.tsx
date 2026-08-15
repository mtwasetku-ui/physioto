'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, User, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { TIME_OPTIONS } from '@/lib/timeOptions'

interface DiaryAppointment {
  id: string
  startsAt: string
  endsAt: string
  patientId: string | null
  patientName: string | null
  patientArrived: boolean
  didNotArrive: boolean
  cancelledAt: string | null
  notes: string | null
}

interface AppointmentType {
  id: string
  name: string
  duration_in_minutes: number
}

// Cliniko's fixed cancellation reason codes — mirrors lib/cliniko.ts
// CANCELLATION_REASONS, duplicated here since this is a client component
// and that file also touches server-only env vars.
const CANCELLATION_REASONS = [
  { code: 10, label: 'Feeling better' },
  { code: 20, label: 'Condition worse' },
  { code: 30, label: 'Sick' },
  { code: 31, label: 'COVID-19 related' },
  { code: 40, label: 'Away' },
  { code: 60, label: 'Work' },
  { code: 50, label: 'Other' },
]

function dayLabel(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })
}

function toDateInput(iso: string) {
  return new Date(iso).toISOString().slice(0, 10)
}

function toTimeInput(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function DiaryClient() {
  const [appointments, setAppointments] = useState<DiaryAppointment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [arriving, setArriving] = useState<string | null>(null)
  const [types, setTypes] = useState<AppointmentType[] | null>(null)

  function load() {
    fetch('/api/appointments/diary')
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) {
          setError(data?.error || `Failed to load diary (HTTP ${r.status})`)
          setAppointments([])
          return
        }
        setAppointments(data.appointments || [])
      })
      .catch((e) => {
        setError(e?.message || 'Network error loading diary')
        setAppointments([])
      })
  }

  useEffect(load, [])

  // Appointment types for the reschedule form — same endpoint the
  // booking form uses, scoped to the logged-in physio's own practitioner.
  useEffect(() => {
    fetch('/api/appointments')
      .then((r) => r.json())
      .then((data) => setTypes(data.appointmentTypes || []))
      .catch(() => setTypes([]))
  }, [])

  async function markArrived(appt: DiaryAppointment) {
    if (!appt.patientId) return
    setArriving(appt.id)
    const res = await fetch(`/api/appointments/${appt.id}/arrive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: appt.patientId }),
    })
    if (res.ok) {
      setAppointments((prev) => prev?.map((a) => (a.id === appt.id ? { ...a, patientArrived: true } : a)) ?? null)
    }
    setArriving(null)
  }

  function removeFromList(id: string) {
    setAppointments((prev) => prev?.filter((a) => a.id !== id) ?? null)
  }

  function replaceInList(id: string, updates: Partial<DiaryAppointment>) {
    setAppointments((prev) => prev?.map((a) => (a.id === id ? { ...a, ...updates } : a)) ?? null)
  }

  return (
    <div>
      <h1 className="serif text-2xl text-foreground font-semibold mb-1">Your diary</h1>
      <p className="text-muted-foreground text-sm mb-6">Your upcoming visits, across all patients.</p>

      {error && <div className="bg-white border border-border rounded-lg p-4 text-sm text-destructive mb-4">{error}</div>}

      {appointments === null && !error && <div className="text-muted-foreground text-sm">Loading…</div>}

      {appointments?.length === 0 && !error && (
        <div className="bg-white border border-border rounded-lg p-8 text-center text-muted-foreground">
          No upcoming visits booked.
        </div>
      )}

      {appointments && appointments.length > 0 && (
        <Grouped
          appointments={appointments}
          types={types}
          onArrive={markArrived}
          arriving={arriving}
          onCancelled={removeFromList}
          onRescheduled={replaceInList}
        />
      )}
    </div>
  )
}

function Grouped({
  appointments,
  types,
  onArrive,
  arriving,
  onCancelled,
  onRescheduled,
}: {
  appointments: DiaryAppointment[]
  types: AppointmentType[] | null
  onArrive: (a: DiaryAppointment) => void
  arriving: string | null
  onCancelled: (id: string) => void
  onRescheduled: (id: string, updates: Partial<DiaryAppointment>) => void
}) {
  const groups: { label: string; items: DiaryAppointment[] }[] = []
  for (const appt of appointments) {
    const label = dayLabel(appt.startsAt)
    const group = groups.find((g) => g.label === label)
    if (group) group.items.push(appt)
    else groups.push({ label, items: [appt] })
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.label}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">{g.label}</h2>
          <div className="bg-white border border-border rounded-lg divide-y divide-border">
            {g.items.map((appt) => (
              <AppointmentRow
                key={appt.id}
                appt={appt}
                types={types}
                onArrive={onArrive}
                arriving={arriving}
                onCancelled={onCancelled}
                onRescheduled={onRescheduled}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function AppointmentRow({
  appt,
  types,
  onArrive,
  arriving,
  onCancelled,
  onRescheduled,
}: {
  appt: DiaryAppointment
  types: AppointmentType[] | null
  onArrive: (a: DiaryAppointment) => void
  arriving: string | null
  onCancelled: (id: string) => void
  onRescheduled: (id: string, updates: Partial<DiaryAppointment>) => void
}) {
  const [expanded, setExpanded] = useState<'reschedule' | 'cancel' | null>(null)

  return (
    <div>
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            {appt.patientId ? (
              <Link href={`/portal/patient/${appt.patientId}`} className="font-medium text-foreground hover:underline">
                {appt.patientName || `Patient ${appt.patientId}`}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{appt.patientName || 'Unknown patient'}</span>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Clock className="h-3.5 w-3.5" />
              {new Date(appt.startsAt).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}
              {' – '}
              {new Date(appt.endsAt).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {appt.patientArrived ? (
            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> Arrived
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onArrive(appt)}
              disabled={arriving === appt.id || !appt.patientId}
              className="text-xs px-2.5 py-1.5 rounded-md border border-input hover:bg-secondary whitespace-nowrap disabled:opacity-50"
            >
              {arriving === appt.id ? 'Marking…' : 'Mark arrived'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setExpanded(expanded === 'reschedule' ? null : 'reschedule')}
            className="text-xs px-2.5 py-1.5 rounded-md border border-input hover:bg-secondary whitespace-nowrap flex items-center gap-1"
          >
            Reschedule {expanded === 'reschedule' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          <button
            type="button"
            onClick={() => setExpanded(expanded === 'cancel' ? null : 'cancel')}
            className="text-xs px-2.5 py-1.5 rounded-md border border-input text-destructive hover:bg-destructive/5 whitespace-nowrap flex items-center gap-1"
          >
            Cancel {expanded === 'cancel' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {expanded === 'reschedule' && (
        <RescheduleForm
          appt={appt}
          types={types}
          onDone={(updates) => {
            onRescheduled(appt.id, updates)
            setExpanded(null)
          }}
          onCancel={() => setExpanded(null)}
        />
      )}

      {expanded === 'cancel' && (
        <CancelForm
          appt={appt}
          onDone={() => {
            onCancelled(appt.id)
            setExpanded(null)
          }}
          onCancel={() => setExpanded(null)}
        />
      )}
    </div>
  )
}

function RescheduleForm({
  appt,
  types,
  onDone,
  onCancel,
}: {
  appt: DiaryAppointment
  types: AppointmentType[] | null
  onDone: (updates: Partial<DiaryAppointment>) => void
  onCancel: () => void
}) {
  const [date, setDate] = useState(toDateInput(appt.startsAt))
  const [time, setTime] = useState(toTimeInput(appt.startsAt))
  const [appointmentTypeId, setAppointmentTypeId] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const selectedType = types?.find((t) => t.id === appointmentTypeId)
  const durationMinutes = selectedType?.duration_in_minutes ?? Math.round((new Date(appt.endsAt).getTime() - new Date(appt.startsAt).getTime()) / 60000)

  async function save() {
    setStatus('saving')
    setError(null)
    const startsAt = new Date(`${date}T${time}:00`).toISOString()
    const res = await fetch(`/api/appointments/${appt.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startsAt,
        durationMinutes,
        ...(appointmentTypeId ? { appointmentTypeId } : {}),
      }),
    })
    if (res.ok) {
      const endsAt = new Date(new Date(startsAt).getTime() + durationMinutes * 60000).toISOString()
      onDone({ startsAt, endsAt })
    } else {
      const body = await res.json().catch(() => null)
      setError(body?.error || `Failed to reschedule (HTTP ${res.status})`)
      setStatus('error')
    }
  }

  return (
    <div className="px-5 pb-4 pt-1 bg-secondary/30 border-t border-border">
      <div className="flex flex-wrap items-end gap-3 pt-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 px-2 rounded-md border border-input bg-white text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Time</label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-9 px-2 rounded-md border border-input bg-white text-sm"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        {types && types.length > 0 && (
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Appointment type</label>
            <select
              value={appointmentTypeId}
              onChange={(e) => setAppointmentTypeId(e.target.value)}
              className="h-9 px-2 rounded-md border border-input bg-white text-sm"
            >
              <option value="">Keep current type</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.duration_in_minutes} min)
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          type="button"
          onClick={save}
          disabled={status === 'saving'}
          className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className="h-9 px-3 text-sm text-muted-foreground hover:text-foreground">
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  )
}

function CancelForm({ appt, onDone, onCancel }: { appt: DiaryAppointment; onDone: () => void; onCancel: () => void }) {
  const [reason, setReason] = useState<number | ''>('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function confirmCancel() {
    if (!reason) return
    setStatus('saving')
    setError(null)
    const res = await fetch(`/api/appointments/${appt.id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, note: note || undefined }),
    })
    if (res.ok) {
      onDone()
    } else {
      const body = await res.json().catch(() => null)
      setError(body?.error || `Failed to cancel (HTTP ${res.status})`)
      setStatus('error')
    }
  }

  return (
    <div className="px-5 pb-4 pt-1 bg-destructive/5 border-t border-border">
      <div className="flex flex-wrap items-end gap-3 pt-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value ? Number(e.target.value) : '')}
            className="h-9 px-2 rounded-md border border-input bg-white text-sm"
          >
            <option value="">Select a reason…</option>
            {CANCELLATION_REASONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-medium text-muted-foreground block mb-1">Note (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-9 w-full px-2 rounded-md border border-input bg-white text-sm"
          />
        </div>
        <button
          type="button"
          onClick={confirmCancel}
          disabled={!reason || status === 'saving'}
          className="h-9 px-3 rounded-md bg-destructive text-destructive-foreground text-sm font-medium disabled:opacity-50"
        >
          {status === 'saving' ? 'Cancelling…' : 'Confirm cancel'}
        </button>
        <button type="button" onClick={onCancel} className="h-9 px-3 text-sm text-muted-foreground hover:text-foreground">
          Back
        </button>
      </div>
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  )
}

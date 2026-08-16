'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Clock, User, CheckCircle2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Ban, FilePlus2 } from 'lucide-react'
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

function startOfWeek(d: Date) {
  const day = d.getDay() // 0 = Sun
  const diffToMonday = (day + 6) % 7
  const monday = new Date(d)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(d.getDate() - diffToMonday)
  return monday
}

function addDays(d: Date, n: number) {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

function toDateInput(iso: string) {
  return new Date(iso).toISOString().slice(0, 10)
}

function toTimeInput(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function DiaryClient() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [selected, setSelected] = useState(() => new Date())
  const [appointments, setAppointments] = useState<DiaryAppointment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [arriving, setArriving] = useState<string | null>(null)
  const [types, setTypes] = useState<AppointmentType[] | null>(null)

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  function load() {
    setError(null)
    const from = weekStart.toISOString()
    const to = addDays(weekStart, 7).toISOString()
    fetch(`/api/appointments/diary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) {
          setError(data?.error || `Failed to load calendar (HTTP ${r.status})`)
          setAppointments([])
          return
        }
        setAppointments(data.appointments || [])
      })
      .catch((e) => {
        setError(e?.message || 'Network error loading calendar')
        setAppointments([])
      })
  }

  useEffect(load, [weekStart])

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

  function replaceInList(id: string, updates: Partial<DiaryAppointment>) {
    setAppointments((prev) => prev?.map((a) => (a.id === id ? { ...a, ...updates } : a)) ?? null)
  }

  const dayAppointments = (appointments ?? [])
    .filter((a) => sameDay(new Date(a.startsAt), selected))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())

  const countsByDay = new Map<string, number>()
  for (const a of appointments ?? []) {
    const key = new Date(a.startsAt).toDateString()
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1)
  }

  return (
    <div>
      <h1 className="serif text-2xl text-foreground font-semibold mb-1">Your calendar</h1>
      <p className="text-muted-foreground text-sm mb-6">Visits for your assigned patients only.</p>

      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setWeekStart((w) => addDays(w, -7))}
          className="h-8 w-8 rounded-md border border-input hover:bg-secondary flex items-center justify-center"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-medium text-foreground">
          {weekStart.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
          {' – '}
          {addDays(weekStart, 6).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
        <button
          type="button"
          onClick={() => setWeekStart((w) => addDays(w, 7))}
          className="h-8 w-8 rounded-md border border-input hover:bg-secondary flex items-center justify-center"
          aria-label="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-6">
        {days.map((d) => {
          const isSelected = sameDay(d, selected)
          const isToday = sameDay(d, new Date())
          const count = countsByDay.get(d.toDateString()) ?? 0
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => setSelected(d)}
              className={`flex flex-col items-center gap-0.5 rounded-lg py-2 border transition-colors ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : isToday
                    ? 'border-primary text-foreground bg-white'
                    : 'border-border bg-white text-foreground hover:bg-secondary'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wide opacity-80">
                {d.toLocaleDateString('en-AU', { weekday: 'short' })}
              </span>
              <span className="text-sm font-semibold">{d.getDate()}</span>
              <span
                className={`h-1.5 w-1.5 rounded-full mt-0.5 ${
                  count > 0 ? (isSelected ? 'bg-primary-foreground' : 'bg-primary') : 'bg-transparent'
                }`}
              />
            </button>
          )
        })}
      </div>

      {error && <div className="bg-white border border-border rounded-lg p-4 text-sm text-destructive mb-4">{error}</div>}

      {appointments === null && !error && <div className="text-muted-foreground text-sm">Loading…</div>}

      {appointments !== null && !error && (
        <>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {sameDay(selected, new Date())
              ? 'Today'
              : selected.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>

          {dayAppointments.length === 0 ? (
            <div className="bg-white border border-border rounded-lg p-8 text-center text-muted-foreground">
              No visits this day.
            </div>
          ) : (
            <div className="bg-white border border-border rounded-lg divide-y divide-border">
              {dayAppointments.map((appt) => (
                <AppointmentRow
                  key={appt.id}
                  appt={appt}
                  types={types}
                  onArrive={markArrived}
                  arriving={arriving}
                  onRescheduled={replaceInList}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function AppointmentRow({
  appt,
  types,
  onArrive,
  arriving,
  onRescheduled,
}: {
  appt: DiaryAppointment
  types: AppointmentType[] | null
  onArrive: (a: DiaryAppointment) => void
  arriving: string | null
  onRescheduled: (id: string, updates: Partial<DiaryAppointment>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const cancelled = !!appt.cancelledAt

  return (
    <div>
      <div className="flex items-center justify-between px-5 py-4">
        <div className={`flex items-center gap-3 min-w-0 ${cancelled ? 'opacity-50' : ''}`}>
          <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            {appt.patientId ? (
              <Link
                href={`/portal/patient/${appt.patientId}`}
                className={`font-medium text-foreground hover:underline ${cancelled ? 'line-through' : ''}`}
              >
                {appt.patientName || `Patient ${appt.patientId}`}
              </Link>
            ) : (
              <span className={`font-medium text-foreground ${cancelled ? 'line-through' : ''}`}>
                {appt.patientName || 'Unknown patient'}
              </span>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Clock className="h-3.5 w-3.5" />
              {new Date(appt.startsAt).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}
              {' – '}
              {new Date(appt.endsAt).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {cancelled ? (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground font-medium shrink-0">
            <Ban className="h-3.5 w-3.5" /> Cancelled
          </span>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            {appt.patientId && (
              <Link
                href={`/portal/patient/${appt.patientId}?appointmentId=${appt.id}`}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium whitespace-nowrap"
              >
                <FilePlus2 className="h-3.5 w-3.5" /> Add treatment note
              </Link>
            )}
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
              onClick={() => setExpanded((e) => !e)}
              className="text-xs px-2.5 py-1.5 rounded-md border border-input hover:bg-secondary whitespace-nowrap flex items-center gap-1"
            >
              Reschedule {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        )}
      </div>

      {expanded && !cancelled && (
        <RescheduleForm
          appt={appt}
          types={types}
          onDone={(updates) => {
            onRescheduled(appt.id, updates)
            setExpanded(false)
          }}
          onCancel={() => setExpanded(false)}
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
  const durationMinutes =
    selectedType?.duration_in_minutes ?? Math.round((new Date(appt.endsAt).getTime() - new Date(appt.startsAt).getTime()) / 60000)

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

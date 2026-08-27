'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Clock, User, CheckCircle2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Ban, FilePlus2, X } from 'lucide-react'
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
  appointmentTypeColor: string | null
}

interface AppointmentType {
  id: string
  name: string
  duration_in_minutes: number
}

// Fallback palette for appointment types that don't have a colour set in
// Cliniko — hashed by id so the same type always lands on the same colour
// within a session, rather than everything defaulting to one flat blue.
const FALLBACK_COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#db2777']

function colorForAppointment(appt: DiaryAppointment) {
  if (appt.appointmentTypeColor) return appt.appointmentTypeColor
  const key = appt.patientId || appt.id
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash)
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length]
}

const HOUR_HEIGHT = 56 // px per hour in the grid
const DEFAULT_START_HOUR = 8
const DEFAULT_END_HOUR = 18

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

function formatHourLabel(h: number) {
  const d = new Date()
  d.setHours(h, 0, 0, 0)
  return d.toLocaleTimeString('en-AU', { hour: 'numeric', hour12: true })
}

function timeRangeLabel(appt: DiaryAppointment) {
  const fmt = (iso: string) => new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
  return `${fmt(appt.startsAt)} – ${fmt(appt.endsAt)}`
}

export default function DiaryClient() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [appointments, setAppointments] = useState<DiaryAppointment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [arriving, setArriving] = useState<string | null>(null)
  const [types, setTypes] = useState<AppointmentType[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

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

  async function setArrived(appt: DiaryAppointment, arrived: boolean) {
    if (!appt.patientId) return
    setArriving(appt.id)
    const res = await fetch(`/api/appointments/${appt.id}/arrive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: appt.patientId, arrived }),
    })
    if (res.ok) {
      setAppointments((prev) => prev?.map((a) => (a.id === appt.id ? { ...a, patientArrived: arrived } : a)) ?? null)
    }
    setArriving(null)
  }

  function replaceInList(id: string, updates: Partial<DiaryAppointment>) {
    setAppointments((prev) => prev?.map((a) => (a.id === id ? { ...a, ...updates } : a)) ?? null)
  }

  function appointmentsForDay(d: Date) {
    return (appointments ?? []).filter((a) => sameDay(new Date(a.startsAt), d))
  }

  // Grid hour bounds — default to a normal 8am–6pm working day, but widen
  // to fit anything booked outside that window rather than clipping it.
  const { startHour, endHour } = useMemo(() => {
    let minH = DEFAULT_START_HOUR
    let maxH = DEFAULT_END_HOUR
    for (const a of appointments ?? []) {
      const s = new Date(a.startsAt)
      const e = new Date(a.endsAt)
      if (s.getHours() < minH) minH = s.getHours()
      const eHour = e.getHours() + (e.getMinutes() > 0 ? 1 : 0)
      if (eHour > maxH) maxH = eHour
    }
    return { startHour: Math.max(0, minH), endHour: Math.min(24, maxH) }
  }, [appointments])

  const hours = useMemo(() => Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i), [startHour, endHour])
  const gridHeight = (endHour - startHour) * HOUR_HEIGHT

  function topFor(iso: string) {
    const d = new Date(iso)
    const minutesFromStart = (d.getHours() - startHour) * 60 + d.getMinutes()
    return (minutesFromStart / 60) * HOUR_HEIGHT
  }

  function heightFor(startIso: string, endIso: string) {
    const mins = (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000
    return Math.max(22, (mins / 60) * HOUR_HEIGHT)
  }

  const selected = (appointments ?? []).find((a) => a.id === selectedId) ?? null
  const columnTemplate = `56px repeat(7, minmax(130px, 1fr))`

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

      {error && <div className="bg-white border border-border rounded-lg p-4 text-sm text-destructive mb-4">{error}</div>}

      {appointments === null && !error && <div className="text-muted-foreground text-sm">Loading…</div>}

      {appointments !== null && !error && (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <div style={{ minWidth: 56 + 7 * 130 }}>
              {/* Header row: day names + dates */}
              <div className="grid border-b border-border" style={{ gridTemplateColumns: columnTemplate }}>
                <div />
                {days.map((d) => {
                  const isToday = sameDay(d, new Date())
                  return (
                    <div
                      key={d.toISOString()}
                      className={`text-center py-2 border-l border-border ${isToday ? 'bg-amber-50' : ''}`}
                    >
                      <div className="text-xs font-semibold text-foreground">
                        {d.toLocaleDateString('en-AU', { weekday: 'short' })}, {d.getDate()}{' '}
                        {d.toLocaleDateString('en-AU', { month: 'short' })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Grid body */}
              <div className="relative" style={{ height: gridHeight }}>
                <div className="absolute inset-0 grid" style={{ gridTemplateColumns: columnTemplate }}>
                  {/* Time labels */}
                  <div className="relative">
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground whitespace-nowrap"
                        style={{ top: (h - startHour) * HOUR_HEIGHT }}
                      >
                        {formatHourLabel(h)}
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {days.map((d) => {
                    const isToday = sameDay(d, new Date())
                    return (
                      <div
                        key={d.toISOString()}
                        className={`relative border-l border-border ${isToday ? 'bg-amber-50/40' : ''}`}
                      >
                        {hours.map((h) => (
                          <div
                            key={h}
                            className="absolute left-0 right-0 border-t border-border/60"
                            style={{ top: (h - startHour) * HOUR_HEIGHT }}
                          />
                        ))}

                        {appointmentsForDay(d).map((appt) => (
                          <button
                            key={appt.id}
                            type="button"
                            onClick={() => setSelectedId(appt.id)}
                            className={`absolute left-1 right-1 rounded-md px-1.5 py-1 text-left text-white text-[11px] leading-tight overflow-hidden shadow-sm hover:brightness-95 ${
                              selectedId === appt.id ? 'ring-2 ring-offset-1 ring-primary' : ''
                            }`}
                            style={{
                              top: topFor(appt.startsAt),
                              height: heightFor(appt.startsAt, appt.endsAt),
                              backgroundColor: appt.cancelledAt ? '#9ca3af' : colorForAppointment(appt),
                              opacity: appt.cancelledAt ? 0.7 : 1,
                            }}
                          >
                            <div className={`font-semibold truncate ${appt.cancelledAt ? 'line-through' : ''}`}>
                              {appt.patientName || 'Unknown patient'}
                            </div>
                            <div className="opacity-90 truncate">{timeRangeLabel(appt)}</div>
                          </button>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <SelectedAppointmentPanel
          key={selected.id}
          appt={selected}
          types={types}
          arriving={arriving}
          onArrive={setArrived}
          onRescheduled={replaceInList}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}

function SelectedAppointmentPanel({
  appt,
  types,
  onArrive,
  arriving,
  onRescheduled,
  onClose,
}: {
  appt: DiaryAppointment
  types: AppointmentType[] | null
  onArrive: (a: DiaryAppointment, arrived: boolean) => void
  arriving: string | null
  onRescheduled: (id: string, updates: Partial<DiaryAppointment>) => void
  onClose: () => void
}) {
  const [rescheduling, setRescheduling] = useState(false)
  const cancelled = !!appt.cancelledAt

  return (
    <div className="mt-4 bg-white border border-border rounded-lg">
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
              {timeRangeLabel(appt)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {cancelled ? (
            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground font-medium">
              <Ban className="h-3.5 w-3.5" /> Cancelled
            </span>
          ) : (
            <>
              {appt.patientId && (
                <Link
                  href={`/portal/patient/${appt.patientId}?appointmentId=${appt.id}`}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium whitespace-nowrap"
                >
                  <FilePlus2 className="h-3.5 w-3.5" /> Add treatment note
                </Link>
              )}
              {appt.patientArrived ? (
                <button
                  type="button"
                  onClick={() => onArrive(appt, false)}
                  disabled={arriving === appt.id}
                  title="Mark not arrived"
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium hover:bg-emerald-200 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> {arriving === appt.id ? 'Undoing…' : 'Arrived'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onArrive(appt, true)}
                  disabled={arriving === appt.id || !appt.patientId}
                  className="text-xs px-2.5 py-1.5 rounded-md border border-input hover:bg-secondary whitespace-nowrap disabled:opacity-50"
                >
                  {arriving === appt.id ? 'Marking…' : 'Mark arrived'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setRescheduling((e) => !e)}
                className="text-xs px-2.5 py-1.5 rounded-md border border-input hover:bg-secondary whitespace-nowrap flex items-center gap-1"
              >
                Reschedule {rescheduling ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {rescheduling && !cancelled && (
        <RescheduleForm
          appt={appt}
          types={types}
          onDone={(updates) => {
            onRescheduled(appt.id, updates)
            setRescheduling(false)
          }}
          onCancel={() => setRescheduling(false)}
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

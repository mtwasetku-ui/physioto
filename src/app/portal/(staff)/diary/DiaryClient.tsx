'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
const PX_PER_MIN = HOUR_HEIGHT / 60
const DEFAULT_START_HOUR = 8
const DEFAULT_END_HOUR = 18
const SNAP_MINUTES = 15 // matches TIME_OPTIONS' granularity elsewhere in the app
const CLICK_THRESHOLD_PX = 5 // movement below this counts as a click, not a drag

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

function formatHourLabel(h: number) {
  const d = new Date()
  d.setHours(h, 0, 0, 0)
  return d.toLocaleTimeString('en-AU', { hour: 'numeric', hour12: true })
}

function timeRangeLabel(appt: DiaryAppointment) {
  const fmt = (iso: string) => new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
  return `${fmt(appt.startsAt)} – ${fmt(appt.endsAt)}`
}

interface DragState {
  id: string
  startClientY: number
  startClientX: number
  deltaPx: number // vertical movement, in px
  originDayIndex: number
  targetDayIndex: number
  offsetX: number // px to visually translate towards the target day column
}

// Shifts an ISO datetime by whole days (calendar-aware, so DST transitions
// don't skew the time-of-day) and then by a number of minutes.
function shiftDateTime(iso: string, dayDelta: number, minuteDelta: number) {
  const d = new Date(iso)
  d.setDate(d.getDate() + dayDelta)
  d.setMinutes(d.getMinutes() + minuteDelta)
  return d.toISOString()
}

export default function DiaryClient() {
  const router = useRouter()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [appointments, setAppointments] = useState<DiaryAppointment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const dayColRefs = useRef<Array<HTMLDivElement | null>>([])

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

  function appointmentsForDay(d: Date) {
    return (appointments ?? []).filter((a) => sameDay(new Date(a.startsAt), d))
  }

  // Grid hour bounds — default to a normal 8am–6pm working day, but widen
  // to fit anything booked (or dragged) outside that window rather than
  // clipping it. Recomputes whenever appointments change, so a drag that
  // moves a visit earlier/later than the current range expands the grid
  // on the next render.
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

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>, appt: DiaryAppointment, dayIndex: number) {
    if (savingId) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const next: DragState = {
      id: appt.id,
      startClientY: e.clientY,
      startClientX: e.clientX,
      deltaPx: 0,
      originDayIndex: dayIndex,
      targetDayIndex: dayIndex,
      offsetX: 0,
    }
    dragRef.current = next
    setDrag(next)
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>, appt: DiaryAppointment) {
    if (!dragRef.current || dragRef.current.id !== appt.id) return
    const deltaPx = e.clientY - dragRef.current.startClientY

    // Figure out which day column the pointer is currently over.
    let targetDayIndex = dragRef.current.originDayIndex
    for (let i = 0; i < dayColRefs.current.length; i++) {
      const el = dayColRefs.current[i]
      if (!el) continue
      const rect = el.getBoundingClientRect()
      if (e.clientX >= rect.left && e.clientX < rect.right) {
        targetDayIndex = i
        break
      }
    }

    // Translate visually from the origin column to wherever the target
    // column actually sits on screen (columns can vary slightly in width).
    const originEl = dayColRefs.current[dragRef.current.originDayIndex]
    const targetEl = dayColRefs.current[targetDayIndex]
    const offsetX = originEl && targetEl ? targetEl.getBoundingClientRect().left - originEl.getBoundingClientRect().left : 0

    const next = { ...dragRef.current, deltaPx, targetDayIndex, offsetX }
    dragRef.current = next
    setDrag(next)
  }

  async function onPointerUp(e: React.PointerEvent<HTMLDivElement>, appt: DiaryAppointment) {
    const current = dragRef.current
    dragRef.current = null
    setDrag(null)
    if (!current || current.id !== appt.id) return

    const dayDelta = current.targetDayIndex - current.originDayIndex

    if (Math.abs(current.deltaPx) < CLICK_THRESHOLD_PX && dayDelta === 0) {
      // Treated as a click, not a drag — go to the patient's page.
      if (appt.patientId) router.push(`/portal/patient/${appt.patientId}`)
      return
    }

    if (appt.cancelledAt) return // cancelled visits can be viewed but not dragged

    const rawMinutes = current.deltaPx / PX_PER_MIN
    const snappedMinutes = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES
    if (snappedMinutes === 0 && dayDelta === 0) return

    const durationMs = new Date(appt.endsAt).getTime() - new Date(appt.startsAt).getTime()
    const newStartsAt = shiftDateTime(appt.startsAt, dayDelta, snappedMinutes)
    const newEndsAt = new Date(new Date(newStartsAt).getTime() + durationMs).toISOString()

    const previous = appointments
    setAppointments((prev) => prev?.map((a) => (a.id === appt.id ? { ...a, startsAt: newStartsAt, endsAt: newEndsAt } : a)) ?? null)
    setSavingId(appt.id)
    setError(null)

    const res = await fetch(`/api/appointments/${appt.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startsAt: newStartsAt, durationMinutes: Math.round(durationMs / 60_000) }),
    })

    if (!res.ok) {
      setAppointments(previous) // revert the optimistic move
      const body = await res.json().catch(() => null)
      setError(body?.error || `Failed to reschedule (HTTP ${res.status})`)
    }
    setSavingId(null)
  }

  function onPointerCancel() {
    dragRef.current = null
    setDrag(null)
  }

  const columnTemplate = `56px repeat(7, minmax(130px, 1fr))`

  return (
    <div>
      <h1 className="serif text-2xl text-foreground font-semibold mb-1">Your calendar</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Visits for your assigned patients only. Drag a visit to change its time or move it to another day, or click it to open the patient.
      </p>

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
                  {days.map((d, dayIndex) => {
                    const isToday = sameDay(d, new Date())
                    return (
                      <div
                        key={d.toISOString()}
                        ref={(el) => {
                          dayColRefs.current[dayIndex] = el
                        }}
                        className={`relative border-l border-border ${isToday ? 'bg-amber-50/40' : ''}`}
                      >
                        {hours.map((h) => (
                          <div
                            key={h}
                            className="absolute left-0 right-0 border-t border-border/60"
                            style={{ top: (h - startHour) * HOUR_HEIGHT }}
                          />
                        ))}

                        {appointmentsForDay(d).map((appt) => {
                          const isDragging = drag?.id === appt.id
                          const blockHeight = heightFor(appt.startsAt, appt.endsAt)
                          const naturalTop = topFor(appt.startsAt)
                          const rawTop = isDragging ? naturalTop + drag!.deltaPx : naturalTop
                          const top = Math.min(Math.max(rawTop, 0), Math.max(0, gridHeight - blockHeight))
                          return (
                            <div
                              key={appt.id}
                              onPointerDown={(e) => onPointerDown(e, appt, dayIndex)}
                              onPointerMove={(e) => onPointerMove(e, appt)}
                              onPointerUp={(e) => onPointerUp(e, appt)}
                              onPointerCancel={onPointerCancel}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if ((e.key === 'Enter' || e.key === ' ') && appt.patientId) {
                                  e.preventDefault()
                                  router.push(`/portal/patient/${appt.patientId}`)
                                }
                              }}
                              className={`absolute left-1 right-1 rounded-md px-1.5 py-1 text-left text-white text-[11px] leading-tight overflow-hidden shadow-sm select-none ${
                                appt.cancelledAt ? 'cursor-pointer' : isDragging ? 'cursor-grabbing z-10 shadow-md' : 'cursor-grab hover:brightness-95'
                              } ${savingId === appt.id ? 'opacity-60' : ''}`}
                              style={{
                                top,
                                height: blockHeight,
                                transform: isDragging && drag!.offsetX ? `translateX(${drag!.offsetX}px)` : undefined,
                                backgroundColor: appt.cancelledAt ? '#9ca3af' : colorForAppointment(appt),
                                opacity: appt.cancelledAt ? 0.7 : savingId === appt.id ? 0.6 : 1,
                                touchAction: 'none',
                              }}
                            >
                              <div className={`font-semibold truncate ${appt.cancelledAt ? 'line-through' : ''}`}>
                                {appt.patientName || 'Unknown patient'}
                              </div>
                              <div className="opacity-90 truncate">{timeRangeLabel(appt)}</div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

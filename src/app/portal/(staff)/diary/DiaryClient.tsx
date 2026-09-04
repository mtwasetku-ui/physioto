'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, StickyNote, Car, X, GripHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

// A practitioner's own local travel-time marker — never a Cliniko
// appointment, see /api/travel-blocks. Deliberately minimal: just a
// window of time and a label.
interface TravelBlock {
  id: string
  startsAt: string
  endsAt: string
  label: string
  linkedAppointmentId: string | null
}

// The grid renders appointments and travel blocks side by side, so drag/
// resize logic is written once against this shared shape rather than
// duplicated per type.
type Block =
  | { kind: 'appointment'; data: DiaryAppointment }
  | { kind: 'travel'; data: TravelBlock }

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
const TRAVEL_SNAP_MINUTES = 5 // travel time is finer-grained than appointment booking slots
const MIN_TRAVEL_MINUTES = 5
const DEFAULT_TRAVEL_MINUTES = 15
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

function addMinutes(d: Date, n: number) {
  const copy = new Date(d)
  copy.setMinutes(copy.getMinutes() + n)
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

function timeRangeLabel(startsAt: string, endsAt: string) {
  const fmt = (iso: string) => new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
  return `${fmt(startsAt)} – ${fmt(endsAt)}`
}

function durationMinutesBetween(startsAt: string, endsAt: string) {
  return Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000)
}

// Move/resize gestures share one state shape. `mode` distinguishes them:
// - 'move': dragging the block body — can change start time and/or day.
// - 'resize': dragging the bottom-edge handle — changes duration only,
//   travel blocks only (appointment durations come from their Cliniko type).
interface DragState {
  kind: 'appointment' | 'travel'
  id: string
  mode: 'move' | 'resize'
  startClientY: number
  startClientX: number
  deltaPx: number // vertical movement, in px
  originDayIndex: number
  targetDayIndex: number
  offsetX: number // px to visually translate towards the target day column
}

// A travel block being drawn from scratch by click-dragging empty grid
// space. Tracked in local (pre-snap) pixels within the day column; snapped
// down to real start/duration only once the gesture ends.
interface DraftState {
  dayIndex: number
  startTopPx: number
  currentTopPx: number
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
  const [travelBlocks, setTravelBlocks] = useState<TravelBlock[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  // Appointment note — Cliniko's own `notes` field on the booking itself,
  // not a treatment/clinical note. Edited here via a small modal so a drag
  // gesture on the block doesn't get mistaken for opening it.
  const [noteModalId, setNoteModalId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteError, setNoteError] = useState<string | null>(null)
  // Same pattern, for renaming a travel block's label.
  const [travelModalId, setTravelModalId] = useState<string | null>(null)
  const [travelLabelDraft, setTravelLabelDraft] = useState('')
  const [travelSaving, setTravelSaving] = useState(false)
  const [travelError, setTravelError] = useState<string | null>(null)
  // Click-drag-to-create a new travel block on empty grid space.
  const [draft, setDraft] = useState<DraftState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const draftRef = useRef<DraftState | null>(null)
  const dayColRefs = useRef<Array<HTMLDivElement | null>>([])

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  function load() {
    setError(null)
    const from = weekStart.toISOString()
    const to = addDays(weekStart, 7).toISOString()
    Promise.all([
      fetch(`/api/appointments/diary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`).then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data?.error || `Failed to load calendar (HTTP ${r.status})`)
        return data.appointments || []
      }),
      fetch(`/api/travel-blocks?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`).then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data?.error || `Failed to load travel blocks (HTTP ${r.status})`)
        return data.travelBlocks || []
      }),
    ])
      .then(([appts, travel]) => {
        setAppointments(appts)
        setTravelBlocks(travel)
      })
      .catch((e) => {
        setError(e?.message || 'Network error loading calendar')
        setAppointments((prev) => prev ?? [])
        setTravelBlocks((prev) => prev ?? [])
      })
  }

  useEffect(load, [weekStart])

  function appointmentsForDay(d: Date) {
    return (appointments ?? []).filter((a) => sameDay(new Date(a.startsAt), d))
  }

  function travelBlocksForDay(d: Date) {
    return (travelBlocks ?? []).filter((t) => sameDay(new Date(t.startsAt), d))
  }

  // Grid hour bounds — default to a normal 8am–6pm working day, but widen
  // to fit anything booked (or dragged) outside that window rather than
  // clipping it. Recomputes whenever appointments or travel blocks change,
  // so a drag that moves something earlier/later than the current range
  // expands the grid on the next render.
  const { startHour, endHour } = useMemo(() => {
    let minH = DEFAULT_START_HOUR
    let maxH = DEFAULT_END_HOUR
    for (const a of [...(appointments ?? []), ...(travelBlocks ?? [])]) {
      const s = new Date(a.startsAt)
      const e = new Date(a.endsAt)
      if (s.getHours() < minH) minH = s.getHours()
      const eHour = e.getHours() + (e.getMinutes() > 0 ? 1 : 0)
      if (eHour > maxH) maxH = eHour
    }
    return { startHour: Math.max(0, minH), endHour: Math.min(24, maxH) }
  }, [appointments, travelBlocks])

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

  // Converts a pixel offset within a day column back into a snapped
  // minutes-from-startHour value — shared by the empty-space draft-create
  // gesture and (indirectly) by the move/resize snapping below.
  function pxToSnappedMinutes(px: number, snap: number) {
    const rawMinutes = (px / PX_PER_MIN) 
    return Math.round(rawMinutes / snap) * snap
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>, block: Block, dayIndex: number, mode: DragState['mode'] = 'move') {
    if (savingId) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const next: DragState = {
      kind: block.kind,
      id: block.data.id,
      mode,
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

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>, block: Block) {
    if (!dragRef.current || dragRef.current.id !== block.data.id) return
    const deltaPx = e.clientY - dragRef.current.startClientY

    if (dragRef.current.mode === 'resize') {
      // Resizing never changes day or triggers the column-swap visuals.
      const next = { ...dragRef.current, deltaPx }
      dragRef.current = next
      setDrag(next)
      return
    }

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

  async function onPointerUp(e: React.PointerEvent<HTMLDivElement>, block: Block) {
    const current = dragRef.current
    dragRef.current = null
    setDrag(null)
    if (!current || current.id !== block.data.id) return

    if (current.mode === 'resize') {
      await handleResizeEnd(current, block)
      return
    }

    const dayDelta = current.targetDayIndex - current.originDayIndex

    if (Math.abs(current.deltaPx) < CLICK_THRESHOLD_PX && dayDelta === 0) {
      // Treated as a click, not a drag.
      if (block.kind === 'appointment' && block.data.patientId) {
        router.push(`/portal/patient/${block.data.patientId}?appointmentId=${block.data.id}`)
      }
      return
    }

    if (block.kind === 'appointment' && block.data.cancelledAt) return // cancelled visits can be viewed but not dragged

    const snap = block.kind === 'travel' ? TRAVEL_SNAP_MINUTES : SNAP_MINUTES
    const rawMinutes = current.deltaPx / PX_PER_MIN
    const snappedMinutes = Math.round(rawMinutes / snap) * snap
    if (snappedMinutes === 0 && dayDelta === 0) return

    const durationMs = new Date(block.data.endsAt).getTime() - new Date(block.data.startsAt).getTime()
    const newStartsAt = shiftDateTime(block.data.startsAt, dayDelta, snappedMinutes)
    const newEndsAt = new Date(new Date(newStartsAt).getTime() + durationMs).toISOString()

    if (block.kind === 'appointment') {
      const previous = appointments
      setAppointments((prev) => prev?.map((a) => (a.id === block.data.id ? { ...a, startsAt: newStartsAt, endsAt: newEndsAt } : a)) ?? null)
      setSavingId(block.data.id)
      setError(null)
      const res = await fetch(`/api/appointments/${block.data.id}`, {
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
    } else {
      const previous = travelBlocks
      setTravelBlocks((prev) => prev?.map((t) => (t.id === block.data.id ? { ...t, startsAt: newStartsAt, endsAt: newEndsAt } : t)) ?? null)
      setSavingId(block.data.id)
      setError(null)
      const res = await fetch(`/api/travel-blocks/${block.data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startsAt: newStartsAt, durationMinutes: Math.round(durationMs / 60_000) }),
      })
      if (!res.ok) {
        setTravelBlocks(previous)
        const body = await res.json().catch(() => null)
        setError(body?.error || `Failed to move travel time (HTTP ${res.status})`)
      }
      setSavingId(null)
    }
  }

  async function handleResizeEnd(current: DragState, block: Block) {
    if (block.kind !== 'travel') return // only travel blocks support resize
    const snappedMinutes = Math.round(current.deltaPx / PX_PER_MIN / TRAVEL_SNAP_MINUTES) * TRAVEL_SNAP_MINUTES
    if (snappedMinutes === 0) return

    const currentDuration = durationMinutesBetween(block.data.startsAt, block.data.endsAt)
    const newDuration = Math.max(MIN_TRAVEL_MINUTES, currentDuration + snappedMinutes)
    if (newDuration === currentDuration) return
    const newEndsAt = addMinutes(new Date(block.data.startsAt), newDuration).toISOString()

    const previous = travelBlocks
    setTravelBlocks((prev) => prev?.map((t) => (t.id === block.data.id ? { ...t, endsAt: newEndsAt } : t)) ?? null)
    setSavingId(block.data.id)
    setError(null)
    const res = await fetch(`/api/travel-blocks/${block.data.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startsAt: block.data.startsAt, durationMinutes: newDuration }),
    })
    if (!res.ok) {
      setTravelBlocks(previous)
      const body = await res.json().catch(() => null)
      setError(body?.error || `Failed to resize travel time (HTTP ${res.status})`)
    }
    setSavingId(null)
  }

  function onPointerCancel() {
    dragRef.current = null
    setDrag(null)
  }

  function openNoteModal(e: React.PointerEvent | React.MouseEvent, appt: DiaryAppointment) {
    e.stopPropagation()
    e.preventDefault()
    dragRef.current = null
    setDrag(null)
    setNoteModalId(appt.id)
    setNoteDraft(appt.notes || '')
    setNoteError(null)
  }

  async function saveNote() {
    if (!noteModalId) return
    setNoteSaving(true)
    setNoteError(null)
    const res = await fetch(`/api/appointments/${noteModalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: noteDraft }),
    })
    if (res.ok) {
      setAppointments((prev) => prev?.map((a) => (a.id === noteModalId ? { ...a, notes: noteDraft } : a)) ?? null)
      setNoteModalId(null)
    } else {
      const body = await res.json().catch(() => null)
      setNoteError(body?.error || `Failed to save note (HTTP ${res.status})`)
    }
    setNoteSaving(false)
  }

  function openTravelModal(e: React.PointerEvent | React.MouseEvent, block: TravelBlock) {
    e.stopPropagation()
    e.preventDefault()
    dragRef.current = null
    setDrag(null)
    setTravelModalId(block.id)
    setTravelLabelDraft(block.label)
    setTravelError(null)
  }

  async function saveTravelLabel() {
    if (!travelModalId) return
    setTravelSaving(true)
    setTravelError(null)
    const res = await fetch(`/api/travel-blocks/${travelModalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: travelLabelDraft }),
    })
    if (res.ok) {
      setTravelBlocks((prev) => prev?.map((t) => (t.id === travelModalId ? { ...t, label: travelLabelDraft || 'Travel' } : t)) ?? null)
      setTravelModalId(null)
    } else {
      const body = await res.json().catch(() => null)
      setTravelError(body?.error || `Failed to save (HTTP ${res.status})`)
    }
    setTravelSaving(false)
  }

  async function deleteTravelBlock(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    e.preventDefault()
    const previous = travelBlocks
    setTravelBlocks((prev) => prev?.filter((t) => t.id !== id) ?? null)
    const res = await fetch(`/api/travel-blocks/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      setTravelBlocks(previous)
      const body = await res.json().catch(() => null)
      setError(body?.error || `Failed to delete travel block (HTTP ${res.status})`)
    }
  }

  // Quick action from an appointment: drop a default-length travel block
  // right before it (to travel *to* the visit) or right after (to travel
  // *away* from it), pre-linked so it's obviously related. Duration and
  // time are both still freely adjustable afterwards via drag/resize.
  async function addTravelAdjacent(e: React.MouseEvent, appt: DiaryAppointment, side: 'before' | 'after') {
    e.stopPropagation()
    e.preventDefault()
    const startsAt = side === 'before' ? addMinutes(new Date(appt.startsAt), -DEFAULT_TRAVEL_MINUTES).toISOString() : appt.endsAt
    const endsAt = side === 'before' ? appt.startsAt : addMinutes(new Date(appt.endsAt), DEFAULT_TRAVEL_MINUTES).toISOString()
    const label = side === 'before' ? `Travel to ${appt.patientName || 'visit'}` : `Travel from ${appt.patientName || 'visit'}`

    setError(null)
    const res = await fetch('/api/travel-blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startsAt, endsAt, label, linkedAppointmentId: appt.id }),
    })
    const body = await res.json().catch(() => null)
    if (res.ok && body?.travelBlock) {
      setTravelBlocks((prev) => [...(prev ?? []), body.travelBlock])
    } else {
      setError(body?.error || `Failed to add travel time (HTTP ${res.status})`)
    }
  }

  // Click-drag on empty grid space (not on a block) sketches out a new
  // travel block. A plain click with no real movement is ignored so this
  // doesn't fire on every stray tap on the grid background.
  function onGridPointerDown(e: React.PointerEvent<HTMLDivElement>, dayIndex: number) {
    if (e.target !== e.currentTarget) return // let block-level handlers own their own pointer events
    if (savingId || dragRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const startTopPx = e.clientY - rect.top
    e.currentTarget.setPointerCapture(e.pointerId)
    const next: DraftState = { dayIndex, startTopPx, currentTopPx: startTopPx }
    draftRef.current = next
    setDraft(next)
  }

  function onGridPointerMove(e: React.PointerEvent<HTMLDivElement>, dayIndex: number) {
    if (!draftRef.current || draftRef.current.dayIndex !== dayIndex) return
    const rect = e.currentTarget.getBoundingClientRect()
    const next = { ...draftRef.current, currentTopPx: e.clientY - rect.top }
    draftRef.current = next
    setDraft(next)
  }

  async function onGridPointerUp(e: React.PointerEvent<HTMLDivElement>, dayIndex: number, day: Date) {
    const current = draftRef.current
    draftRef.current = null
    setDraft(null)
    if (!current || current.dayIndex !== dayIndex) return

    const top = Math.min(current.startTopPx, current.currentTopPx)
    const bottom = Math.max(current.startTopPx, current.currentTopPx)
    const draggedMinutes = pxToSnappedMinutes(bottom - top, TRAVEL_SNAP_MINUTES)
    const startMinutesFromGridStart = pxToSnappedMinutes(top, TRAVEL_SNAP_MINUTES)
    const durationMinutes = Math.max(MIN_TRAVEL_MINUTES, draggedMinutes || DEFAULT_TRAVEL_MINUTES)

    const dayStart = new Date(day)
    dayStart.setHours(startHour, 0, 0, 0)
    const startsAt = addMinutes(dayStart, startMinutesFromGridStart).toISOString()
    const endsAt = addMinutes(new Date(startsAt), durationMinutes).toISOString()

    setError(null)
    const res = await fetch('/api/travel-blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startsAt, endsAt, label: 'Travel' }),
    })
    const body = await res.json().catch(() => null)
    if (res.ok && body?.travelBlock) {
      setTravelBlocks((prev) => [...(prev ?? []), body.travelBlock])
    } else {
      setError(body?.error || `Failed to add travel time (HTTP ${res.status})`)
    }
  }

  const columnTemplate = `56px repeat(7, minmax(130px, 1fr))`

  return (
    <div>
      <h1 className="serif text-2xl text-foreground font-semibold mb-1">Your calendar</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Visits for your assigned patients only. Drag a visit to change its time or move it to another day, or click it to open the
        patient. Click and drag on empty space — or use the <Car size={12} className="inline -mt-0.5" /> button on a visit — to block
        out travel time; drag its bottom edge to resize.
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

      {(appointments === null || travelBlocks === null) && !error && (
        <div className="text-muted-foreground text-sm">Loading…</div>
      )}

      {appointments !== null && travelBlocks !== null && !error && (
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
                    const isDrafting = draft?.dayIndex === dayIndex
                    const draftTop = isDrafting ? Math.min(draft!.startTopPx, draft!.currentTopPx) : 0
                    const draftHeight = isDrafting ? Math.max(4, Math.abs(draft!.currentTopPx - draft!.startTopPx)) : 0
                    return (
                      <div
                        key={d.toISOString()}
                        ref={(el) => {
                          dayColRefs.current[dayIndex] = el
                        }}
                        onPointerDown={(e) => onGridPointerDown(e, dayIndex)}
                        onPointerMove={(e) => onGridPointerMove(e, dayIndex)}
                        onPointerUp={(e) => onGridPointerUp(e, dayIndex, d)}
                        onPointerCancel={() => {
                          draftRef.current = null
                          setDraft(null)
                        }}
                        className={`relative border-l border-border cursor-crosshair ${isToday ? 'bg-amber-50/40' : ''}`}
                        style={{ touchAction: 'none' }}
                      >
                        {hours.map((h) => (
                          <div
                            key={h}
                            className="absolute left-0 right-0 border-t border-border/60 pointer-events-none"
                            style={{ top: (h - startHour) * HOUR_HEIGHT }}
                          />
                        ))}

                        {isDrafting && (
                          <div
                            className="absolute left-1 right-1 rounded-md border-2 border-dashed border-slate-400 bg-slate-200/50 pointer-events-none"
                            style={{ top: draftTop, height: draftHeight }}
                          />
                        )}

                        {appointmentsForDay(d).map((appt) => {
                          const block: Block = { kind: 'appointment', data: appt }
                          const isDragging = drag?.id === appt.id
                          const blockHeight = heightFor(appt.startsAt, appt.endsAt)
                          const naturalTop = topFor(appt.startsAt)
                          const rawTop = isDragging && drag!.mode === 'move' ? naturalTop + drag!.deltaPx : naturalTop
                          const top = Math.min(Math.max(rawTop, 0), Math.max(0, gridHeight - blockHeight))
                          return (
                            <div
                              key={appt.id}
                              onPointerDown={(e) => onPointerDown(e, block, dayIndex)}
                              onPointerMove={(e) => onPointerMove(e, block)}
                              onPointerUp={(e) => onPointerUp(e, block)}
                              onPointerCancel={onPointerCancel}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if ((e.key === 'Enter' || e.key === ' ') && appt.patientId) {
                                  e.preventDefault()
                                  router.push(`/portal/patient/${appt.patientId}?appointmentId=${appt.id}`)
                                }
                              }}
                              className={`group absolute left-1 right-1 rounded-md px-1.5 py-1 text-left text-white text-[11px] leading-tight overflow-hidden shadow-sm select-none ${
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
                              <div className="flex items-start justify-between gap-1">
                                <div className={`font-semibold truncate ${appt.cancelledAt ? 'line-through' : ''}`}>
                                  {appt.patientName || 'Unknown patient'}
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  {!appt.cancelledAt && (
                                    <button
                                      type="button"
                                      title="Add travel time before this visit"
                                      onPointerDown={(e) => e.stopPropagation()}
                                      onClick={(e) => addTravelAdjacent(e, appt, 'before')}
                                      className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-black/20"
                                    >
                                      <Car size={11} />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    title={appt.notes ? 'Edit appointment note' : 'Add appointment note'}
                                    onPointerDown={(e) => openNoteModal(e, appt)}
                                    onClick={(e) => e.stopPropagation()}
                                    className={`shrink-0 rounded p-0.5 hover:bg-black/20 ${appt.notes ? 'opacity-100' : 'opacity-50'}`}
                                  >
                                    <StickyNote size={11} />
                                  </button>
                                </div>
                              </div>
                              <div className="opacity-90 truncate">{timeRangeLabel(appt.startsAt, appt.endsAt)}</div>
                            </div>
                          )
                        })}

                        {travelBlocksForDay(d).map((tb) => {
                          const block: Block = { kind: 'travel', data: tb }
                          const isDragging = drag?.id === tb.id
                          const naturalHeight = heightFor(tb.startsAt, tb.endsAt)
                          const blockHeight =
                            isDragging && drag!.mode === 'resize' ? Math.max(14, naturalHeight + drag!.deltaPx) : naturalHeight
                          const naturalTop = topFor(tb.startsAt)
                          const rawTop = isDragging && drag!.mode === 'move' ? naturalTop + drag!.deltaPx : naturalTop
                          const top = Math.min(Math.max(rawTop, 0), Math.max(0, gridHeight - blockHeight))
                          return (
                            <div
                              key={tb.id}
                              onPointerDown={(e) => onPointerDown(e, block, dayIndex)}
                              onPointerMove={(e) => onPointerMove(e, block)}
                              onPointerUp={(e) => onPointerUp(e, block)}
                              onPointerCancel={onPointerCancel}
                              role="button"
                              tabIndex={0}
                              className={`group absolute left-1 right-1 rounded-md px-1.5 py-1 text-left text-slate-700 text-[11px] leading-tight overflow-hidden select-none border border-dashed border-slate-400 ${
                                isDragging ? 'cursor-grabbing z-10 shadow-md' : 'cursor-grab hover:brightness-95'
                              } ${savingId === tb.id ? 'opacity-60' : ''}`}
                              style={{
                                top,
                                height: blockHeight,
                                transform: isDragging && drag!.mode === 'move' && drag!.offsetX ? `translateX(${drag!.offsetX}px)` : undefined,
                                backgroundColor: '#e2e8f0',
                                backgroundImage:
                                  'repeating-linear-gradient(135deg, rgba(100,116,139,0.15) 0px, rgba(100,116,139,0.15) 4px, transparent 4px, transparent 9px)',
                                opacity: savingId === tb.id ? 0.6 : 1,
                                touchAction: 'none',
                              }}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="font-semibold truncate flex items-center gap-1">
                                  <Car size={11} className="shrink-0" />
                                  <span className="truncate">{tb.label}</span>
                                </div>
                                <button
                                  type="button"
                                  title="Remove travel time"
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={(e) => deleteTravelBlock(e, tb.id)}
                                  className="opacity-0 group-hover:opacity-100 shrink-0 rounded p-0.5 hover:bg-black/10"
                                >
                                  <X size={11} />
                                </button>
                              </div>
                              <div
                                className="opacity-80 truncate"
                                onPointerDown={(e) => openTravelModal(e, tb)}
                                title="Click to rename"
                              >
                                {timeRangeLabel(tb.startsAt, tb.endsAt)}
                              </div>
                              {/* Resize handle — drag to adjust duration only. */}
                              <div
                                onPointerDown={(e) => onPointerDown(e, block, dayIndex, 'resize')}
                                onPointerMove={(e) => onPointerMove(e, block)}
                                onPointerUp={(e) => onPointerUp(e, block)}
                                onPointerCancel={onPointerCancel}
                                className="absolute left-0 right-0 bottom-0 h-2.5 flex items-center justify-center cursor-ns-resize opacity-0 group-hover:opacity-70"
                                style={{ touchAction: 'none' }}
                              >
                                <GripHorizontal size={12} />
                              </div>
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

      {noteModalId && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => !noteSaving && setNoteModalId(null)}
        >
          <div className="bg-white rounded-lg p-5 max-w-sm w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-foreground mb-1">Appointment note</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Visible on the booking in Cliniko — not part of the patient's treatment record.
            </p>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={4}
              autoFocus
              placeholder="e.g. Patient asked to be reminded to bring their referral letter"
              className="w-full px-2 py-1.5 rounded-md border border-input text-sm"
            />
            {noteError && <p className="text-xs text-destructive mt-1">{noteError}</p>}
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" onClick={saveNote} disabled={noteSaving}>
                {noteSaving ? 'Saving…' : 'Save note'}
              </Button>
              <button
                type="button"
                onClick={() => setNoteModalId(null)}
                disabled={noteSaving}
                className="text-xs px-2.5 py-1.5 rounded-md border border-input hover:bg-secondary disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {travelModalId && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => !travelSaving && setTravelModalId(null)}
        >
          <div className="bg-white rounded-lg p-5 max-w-sm w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-foreground mb-1">Travel time</h3>
            <p className="text-xs text-muted-foreground mb-3">
              A personal block on your own diary — not sent to Cliniko or visible to patients.
            </p>
            <input
              value={travelLabelDraft}
              onChange={(e) => setTravelLabelDraft(e.target.value)}
              autoFocus
              placeholder="e.g. Travel to Jane Smith"
              className="w-full px-2 py-1.5 rounded-md border border-input text-sm"
            />
            {travelError && <p className="text-xs text-destructive mt-1">{travelError}</p>}
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" onClick={saveTravelLabel} disabled={travelSaving}>
                {travelSaving ? 'Saving…' : 'Save'}
              </Button>
              <button
                type="button"
                onClick={() => setTravelModalId(null)}
                disabled={travelSaving}
                className="text-xs px-2.5 py-1.5 rounded-md border border-input hover:bg-secondary disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

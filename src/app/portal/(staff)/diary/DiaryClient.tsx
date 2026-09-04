'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, StickyNote, Car, X, GripHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  hasFinalNote: boolean
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

// Green once the visit's note is finalised — lets a physio see at a
// glance, from the diary alone, which visits still need paperwork done.
// Takes priority over the appointment-type colour precisely so it's
// visible regardless of what type of visit it was.
const FINAL_NOTE_COLOR = '#16a34a'

function colorForAppointment(appt: DiaryAppointment) {
  if (appt.hasFinalNote) return FINAL_NOTE_COLOR
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

// Touch drags require a brief hold before they arm, so an ordinary swipe
// to scroll the page doesn't get mistaken for "move this visit". Mouse
// input skips this entirely (arms immediately, as before) — the jitter
// problem is a touchscreen-specific one.
const LONG_PRESS_MS = 260
const PRE_ARM_CANCEL_PX = 10 // finger movement past this before the hold fires reads as "scrolling", not "holding"

const TRAVEL_DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60]

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

// "HH:mm" snapped to the nearest 15 minutes, for pre-filling the add-travel
// time dropdown (which only offers 15-minute steps, matching TIME_OPTIONS).
function nearestQuarterHour(d: Date) {
  const snapped = Math.round(d.getMinutes() / 15) * 15
  const copy = new Date(d)
  copy.setMinutes(0, 0, 0)
  copy.setMinutes(snapped)
  return `${String(copy.getHours()).padStart(2, '0')}:${String(copy.getMinutes()).padStart(2, '0')}`
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

// A touch-only holding pattern: pointerdown starts this timer instead of
// arming a drag immediately. If the timer fires with minimal movement, we
// arm the real drag (see armDrag). If the finger moves too much first, or
// lifts before the timer fires, we treat it as a scroll/tap instead.
interface PendingLongPress {
  pointerId: number
  el: HTMLDivElement
  block: Block
  dayIndex: number
  mode: DragState['mode']
  startClientX: number
  startClientY: number
  timer: ReturnType<typeof setTimeout>
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
  // Per-visit travel popup — the single entry point for setting travel
  // time on a booked appointment (before AND after, both in 5-min steps),
  // opened from the one car icon on the block. Mirrors whatever travel
  // blocks are already linked to this appointment (from a previous save
  // here, or from the booking form's travel steppers) so re-opening it
  // shows the current before/after minutes rather than always starting
  // from zero — this doubles as the edit UI, not just "add".
  const [travelPopupAppt, setTravelPopupAppt] = useState<DiaryAppointment | null>(null)
  const [travelPopupBeforeId, setTravelPopupBeforeId] = useState<string | null>(null)
  const [travelPopupAfterId, setTravelPopupAfterId] = useState<string | null>(null)
  const [travelPopupBeforeMin, setTravelPopupBeforeMin] = useState(0)
  const [travelPopupAfterMin, setTravelPopupAfterMin] = useState(0)
  const [travelPopupSaving, setTravelPopupSaving] = useState(false)
  const [travelPopupError, setTravelPopupError] = useState<string | null>(null)
  // Add-travel dialog — a form, not a drag gesture, so it works the same
  // (and just as precisely) on a phone as on a desktop. Opened either by
  // tapping empty grid space (prefills the tapped day/time) or the "+"
  // button in a day's header (prefills a sensible default).
  const [addTravelDay, setAddTravelDay] = useState<Date | null>(null)
  const [addTravelStart, setAddTravelStart] = useState('09:00')
  const [addTravelDuration, setAddTravelDuration] = useState(DEFAULT_TRAVEL_MINUTES)
  const [addTravelLabel, setAddTravelLabel] = useState('')
  const [addTravelSaving, setAddTravelSaving] = useState(false)
  const [addTravelError, setAddTravelError] = useState<string | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const pendingRef = useRef<PendingLongPress | null>(null)
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

  function hasLinkedTravel(appointmentId: string) {
    return (travelBlocks ?? []).some((t) => t.linkedAppointmentId === appointmentId)
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

  function pxToSnappedMinutes(px: number, snap: number) {
    const rawMinutes = px / PX_PER_MIN
    return Math.round(rawMinutes / snap) * snap
  }

  // Actually arms a drag: sets the live drag state and takes pointer
  // capture. Called immediately for mouse input, or after the long-press
  // timer fires for touch input (see onPointerDown/onTouchHoldFire).
  function armDrag(el: HTMLDivElement, pointerId: number, block: Block, dayIndex: number, mode: DragState['mode'], startClientX: number, startClientY: number) {
    try {
      el.setPointerCapture(pointerId)
    } catch {
      // Capture can fail if the pointer was already released — harmless,
      // the drag just won't track outside the element in that edge case.
    }
    const next: DragState = {
      kind: block.kind,
      id: block.data.id,
      mode,
      startClientY,
      startClientX,
      deltaPx: 0,
      originDayIndex: dayIndex,
      targetDayIndex: dayIndex,
      offsetX: 0,
    }
    dragRef.current = next
    setDrag(next)
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>, block: Block, dayIndex: number, mode: DragState['mode'] = 'move') {
    if (savingId) return
    e.stopPropagation()
    const el = e.currentTarget
    const pointerId = e.pointerId
    const startClientX = e.clientX
    const startClientY = e.clientY

    // Mouse (and the dedicated resize handle, which is a small deliberate
    // target either way) arm instantly, matching desktop drag conventions.
    if (mode === 'resize' || e.pointerType === 'mouse') {
      armDrag(el, pointerId, block, dayIndex, mode, startClientX, startClientY)
      return
    }

    // Touch: wait for a brief hold before committing to a drag. If the
    // finger is actually trying to scroll the page, it'll move past
    // PRE_ARM_CANCEL_PX well before LONG_PRESS_MS and we bail out below
    // without ever calling setPointerCapture — so native scrolling isn't
    // interrupted for that gesture.
    if (pendingRef.current) {
      clearTimeout(pendingRef.current.timer)
      pendingRef.current = null
    }
    const timer = setTimeout(() => {
      pendingRef.current = null
      armDrag(el, pointerId, block, dayIndex, mode, startClientX, startClientY)
    }, LONG_PRESS_MS)
    pendingRef.current = { pointerId, el, block, dayIndex, mode, startClientX, startClientY, timer }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>, block: Block) {
    if (pendingRef.current && pendingRef.current.block.data.id === block.data.id) {
      const dx = e.clientX - pendingRef.current.startClientX
      const dy = e.clientY - pendingRef.current.startClientY
      if (Math.hypot(dx, dy) > PRE_ARM_CANCEL_PX) {
        // Reads as a scroll attempt, not a hold-to-drag — let it go.
        clearTimeout(pendingRef.current.timer)
        pendingRef.current = null
      }
      return // not armed yet either way
    }

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
    // Finger lifted before the hold timer fired — a tap, not a drag.
    if (pendingRef.current && pendingRef.current.block.data.id === block.data.id) {
      clearTimeout(pendingRef.current.timer)
      pendingRef.current = null
      if (block.kind === 'appointment' && block.data.patientId) {
        router.push(`/portal/patient/${block.data.patientId}?appointmentId=${block.data.id}`)
      }
      return
    }

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
      // Treated as a click, not a drag (mouse case — touch taps are
      // handled by the pendingRef branch above).
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

  function onPointerCancel(block: Block) {
    if (pendingRef.current && pendingRef.current.block.data.id === block.data.id) {
      clearTimeout(pendingRef.current.timer)
      pendingRef.current = null
    }
    if (dragRef.current && dragRef.current.id === block.data.id) {
      dragRef.current = null
      setDrag(null)
    }
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

  // Opens the single travel popup for a visit. Looks for travel blocks
  // already linked to this appointment — one ending exactly when it
  // starts (the "before" leg) and/or one starting exactly when it ends
  // (the "after" leg) — and pre-fills their current minutes so this
  // works as both "add" and "edit".
  function openTravelPopup(e: React.PointerEvent | React.MouseEvent, appt: DiaryAppointment) {
    e.stopPropagation()
    e.preventDefault()
    dragRef.current = null
    setDrag(null)

    const before = (travelBlocks ?? []).find((t) => t.linkedAppointmentId === appt.id && t.endsAt === appt.startsAt)
    const after = (travelBlocks ?? []).find((t) => t.linkedAppointmentId === appt.id && t.startsAt === appt.endsAt)

    setTravelPopupAppt(appt)
    setTravelPopupBeforeId(before?.id ?? null)
    setTravelPopupAfterId(after?.id ?? null)
    setTravelPopupBeforeMin(before ? durationMinutesBetween(before.startsAt, before.endsAt) : 0)
    setTravelPopupAfterMin(after ? durationMinutesBetween(after.startsAt, after.endsAt) : 0)
    setTravelPopupError(null)
  }

  // Reconciles the popup's before/after minutes against whatever travel
  // blocks already exist for this visit: creates a new one where there
  // wasn't one and minutes > 0, updates one whose duration changed,
  // deletes one that's been set back to 0. The visit's own start/end time
  // never moves — only the linked travel block(s) do.
  async function saveTravelPopup() {
    if (!travelPopupAppt) return
    const appt = travelPopupAppt
    setTravelPopupSaving(true)
    setTravelPopupError(null)

    async function reconcile(side: 'before' | 'after', existingId: string | null, minutes: number): Promise<TravelBlock | 'deleted' | null> {
      if (minutes <= 0) {
        if (existingId) {
          const res = await fetch(`/api/travel-blocks/${existingId}`, { method: 'DELETE' })
          if (!res.ok) throw new Error(`Failed to remove travel time (HTTP ${res.status})`)
          return 'deleted'
        }
        return null // nothing wanted, nothing existed — no-op
      }
      const label = side === 'before' ? `Travel to ${appt.patientName || 'visit'}` : `Travel from ${appt.patientName || 'visit'}`
      // The visit's own time is the fixed anchor either side: "before"
      // always ends exactly when the visit starts, "after" always starts
      // exactly when the visit ends — only the other end moves with `minutes`.
      const startsAt = side === 'before' ? addMinutes(new Date(appt.startsAt), -minutes).toISOString() : appt.endsAt
      if (existingId) {
        const res = await fetch(`/api/travel-blocks/${existingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startsAt, durationMinutes: minutes }),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error || `Failed to update travel time (HTTP ${res.status})`)
        return data.travelBlock as TravelBlock
      }
      const endsAt = side === 'before' ? appt.startsAt : addMinutes(new Date(appt.endsAt), minutes).toISOString()
      const res = await fetch('/api/travel-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startsAt, endsAt, label, linkedAppointmentId: appt.id }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || `Failed to add travel time (HTTP ${res.status})`)
      return data.travelBlock as TravelBlock
    }

    try {
      const [beforeResult, afterResult] = await Promise.all([
        reconcile('before', travelPopupBeforeId, travelPopupBeforeMin),
        reconcile('after', travelPopupAfterId, travelPopupAfterMin),
      ])
      setTravelBlocks((prev) => {
        let next = prev ?? []
        for (const [existingId, result] of [
          [travelPopupBeforeId, beforeResult],
          [travelPopupAfterId, afterResult],
        ] as const) {
          if (result === 'deleted' && existingId) next = next.filter((t) => t.id !== existingId)
          else if (result && result !== 'deleted') {
            next = existingId ? next.map((t) => (t.id === existingId ? result : t)) : [...next, result]
          }
        }
        return next
      })
      setTravelPopupAppt(null)
    } catch (e: any) {
      setTravelPopupError(e?.message || 'Failed to save travel time')
    }
    setTravelPopupSaving(false)
  }

  // Opens the add-travel dialog for a given day, defaulting the start
  // time to whatever was tapped (or 9am, from the day header's + button).
  function openAddTravelModal(day: Date, prefillTime?: Date) {
    setAddTravelDay(day)
    setAddTravelStart(prefillTime ? nearestQuarterHour(prefillTime) : '09:00')
    setAddTravelDuration(DEFAULT_TRAVEL_MINUTES)
    setAddTravelLabel('')
    setAddTravelError(null)
  }

  // A real tap on empty grid space (not a drag — plain onClick, which the
  // browser only fires when the gesture wasn't consumed as a scroll)
  // opens the add-travel dialog prefilled with the tapped time.
  function onGridClick(e: React.MouseEvent<HTMLDivElement>, day: Date) {
    if (e.target !== e.currentTarget) return // a block owns clicks on itself
    if (savingId) return
    const rect = e.currentTarget.getBoundingClientRect()
    const topPx = e.clientY - rect.top
    const minutesFromGridStart = pxToSnappedMinutes(topPx, SNAP_MINUTES)
    const dayStart = new Date(day)
    dayStart.setHours(startHour, 0, 0, 0)
    openAddTravelModal(day, addMinutes(dayStart, minutesFromGridStart))
  }

  async function saveAddTravel() {
    if (!addTravelDay) return
    const [h, m] = addTravelStart.split(':').map(Number)
    const startsAt = new Date(addTravelDay)
    startsAt.setHours(h, m, 0, 0)
    const endsAt = addMinutes(startsAt, addTravelDuration)

    setAddTravelSaving(true)
    setAddTravelError(null)
    const res = await fetch('/api/travel-blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), label: addTravelLabel || 'Travel' }),
    })
    const body = await res.json().catch(() => null)
    if (res.ok && body?.travelBlock) {
      setTravelBlocks((prev) => [...(prev ?? []), body.travelBlock])
      setAddTravelDay(null)
    } else {
      setAddTravelError(body?.error || `Failed to add travel time (HTTP ${res.status})`)
    }
    setAddTravelSaving(false)
  }

  const columnTemplate = `56px repeat(7, minmax(130px, 1fr))`

  return (
    <div>
      <h1 className="serif text-2xl text-foreground font-semibold mb-1">Your calendar</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Visits for your assigned patients only. Press and hold a visit to move it, or tap it to open the patient. Tap the{' '}
        <Car size={12} className="inline -mt-0.5" /> on a visit to set travel time before and after it, or tap empty space to block
        out unlinked travel time; drag its bottom edge to resize.
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
                      className={`flex items-center justify-center gap-1 py-2 border-l border-border ${isToday ? 'bg-amber-50' : ''}`}
                    >
                      <div className="text-xs font-semibold text-foreground text-center">
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
                        onClick={(e) => onGridClick(e, d)}
                        className={`relative border-l border-border cursor-pointer ${isToday ? 'bg-amber-50/40' : ''}`}
                      >
                        {hours.map((h) => (
                          <div
                            key={h}
                            className="absolute left-0 right-0 border-t border-border/60 pointer-events-none"
                            style={{ top: (h - startHour) * HOUR_HEIGHT }}
                          />
                        ))}

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
                              onPointerCancel={() => onPointerCancel(block)}
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
                                // Allow normal vertical scrolling through this block until a
                                // drag actually arms — only then do we take over the gesture.
                                touchAction: isDragging ? 'none' : 'pan-y',
                              }}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className={`font-semibold truncate ${appt.cancelledAt ? 'line-through' : ''}`}>
                                  {appt.patientName || 'Unknown patient'}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {!appt.cancelledAt && (
                                    <button
                                      type="button"
                                      title="Set travel time for this visit"
                                      onPointerDown={(e) => openTravelPopup(e, appt)}
                                      onClick={(e) => e.stopPropagation()}
                                      className={`shrink-0 rounded-full p-1 ${
                                        hasLinkedTravel(appt.id) ? 'bg-black/35 hover:bg-black/45' : 'bg-black/20 hover:bg-black/30'
                                      }`}
                                    >
                                      <Car size={12} />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    title={appt.notes ? 'Edit appointment note' : 'Add appointment note'}
                                    onPointerDown={(e) => openNoteModal(e, appt)}
                                    onClick={(e) => e.stopPropagation()}
                                    className={`shrink-0 rounded-full p-1 ${appt.notes ? 'bg-black/35 hover:bg-black/45' : 'bg-black/20 hover:bg-black/30'}`}
                                  >
                                    <StickyNote size={12} />
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
                          // Derived from the live block height (not tb.startsAt/endsAt)
                          // so the minute count updates in real time while resizing,
                          // rather than jumping only once the drag is released and saved.
                          const liveMinutes = Math.round(blockHeight / PX_PER_MIN)
                          return (
                            <div
                              key={tb.id}
                              onPointerDown={(e) => onPointerDown(e, block, dayIndex)}
                              onPointerMove={(e) => onPointerMove(e, block)}
                              onPointerUp={(e) => onPointerUp(e, block)}
                              onPointerCancel={() => onPointerCancel(block)}
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
                                touchAction: isDragging ? 'none' : 'pan-y',
                              }}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="font-semibold truncate flex items-center gap-1">
                                  <Car size={11} className="shrink-0" />
                                  <span className="truncate">
                                    {tb.label} <span className="font-normal opacity-80">({liveMinutes} min)</span>
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  title="Remove travel time"
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={(e) => deleteTravelBlock(e, tb.id)}
                                  className="opacity-70 md:opacity-0 md:group-hover:opacity-100 shrink-0 rounded p-0.5 hover:bg-black/10"
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
                              {/* Resize handle — drag to adjust duration only. Kept as an
                                  instant-arm target (no long-press) since it's small and
                                  deliberately grabbed, not something a scroll swipe crosses. */}
                              <div
                                onPointerDown={(e) => onPointerDown(e, block, dayIndex, 'resize')}
                                onPointerMove={(e) => onPointerMove(e, block)}
                                onPointerUp={(e) => onPointerUp(e, block)}
                                onPointerCancel={() => onPointerCancel(block)}
                                className="absolute left-0 right-0 bottom-0 h-3.5 flex items-center justify-center cursor-ns-resize opacity-0 group-hover:opacity-70"
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

      {travelPopupAppt && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => !travelPopupSaving && setTravelPopupAppt(null)}
        >
          <div className="bg-white rounded-lg p-5 max-w-sm w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-foreground mb-1">Travel time for this visit</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Personal blocks on your own diary either side of {travelPopupAppt.patientName || 'this visit'} — not sent to Cliniko.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <DiaryTravelStepper label="Before" minutes={travelPopupBeforeMin} onChange={setTravelPopupBeforeMin} />
              <DiaryTravelStepper label="After" minutes={travelPopupAfterMin} onChange={setTravelPopupAfterMin} />
            </div>
            {travelPopupError && <p className="text-xs text-destructive mt-2">{travelPopupError}</p>}
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" onClick={saveTravelPopup} disabled={travelPopupSaving}>
                {travelPopupSaving ? 'Saving…' : 'Save'}
              </Button>
              <button
                type="button"
                onClick={() => setTravelPopupAppt(null)}
                disabled={travelPopupSaving}
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

      {addTravelDay && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => !addTravelSaving && setAddTravelDay(null)}
        >
          <div className="bg-white rounded-lg p-5 max-w-sm w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-foreground mb-1">Add travel time</h3>
            <p className="text-xs text-muted-foreground mb-3">
              {addTravelDay.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })} — a personal block on
              your own diary, not sent to Cliniko.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Start time</label>
                <select
                  value={addTravelStart}
                  onChange={(e) => setAddTravelStart(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md border border-input text-sm"
                >
                  {TIME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Duration</label>
                <select
                  value={addTravelDuration}
                  onChange={(e) => setAddTravelDuration(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-md border border-input text-sm"
                >
                  {TRAVEL_DURATION_OPTIONS.map((mins) => (
                    <option key={mins} value={mins}>
                      {mins} min
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <label className="block text-xs text-muted-foreground mb-1">Label (optional)</label>
            <input
              value={addTravelLabel}
              onChange={(e) => setAddTravelLabel(e.target.value)}
              placeholder="Travel"
              className="w-full px-2 py-1.5 rounded-md border border-input text-sm"
            />
            {addTravelError && <p className="text-xs text-destructive mt-1">{addTravelError}</p>}
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" onClick={saveAddTravel} disabled={addTravelSaving}>
                {addTravelSaving ? 'Adding…' : 'Add travel time'}
              </Button>
              <button
                type="button"
                onClick={() => setAddTravelDay(null)}
                disabled={addTravelSaving}
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

// A compact +/- stepper in 5-minute increments — matches the one on the
// booking form (PatientDetailClient) so travel time looks and behaves the
// same whether it's set at booking time or from the diary afterwards.
function DiaryTravelStepper({ label, minutes, onChange }: { label: string; minutes: number; onChange: (m: number) => void }) {
  return (
    <div className="flex items-center gap-1.5 border border-input rounded-md px-2 py-1.5">
      <span className="text-xs text-muted-foreground w-10">{label}</span>
      <button
        type="button"
        onClick={() => onChange(Math.max(0, minutes - TRAVEL_SNAP_MINUTES))}
        disabled={minutes === 0}
        className="h-6 w-6 rounded border border-input text-sm leading-none flex items-center justify-center hover:bg-secondary disabled:opacity-40"
        aria-label={`Decrease ${label.toLowerCase()} travel time`}
      >
        −
      </button>
      <span className="text-sm text-foreground w-12 text-center tabular-nums">{minutes > 0 ? `${minutes} min` : 'None'}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(120, minutes + TRAVEL_SNAP_MINUTES))}
        className="h-6 w-6 rounded border border-input text-sm leading-none flex items-center justify-center hover:bg-secondary"
        aria-label={`Increase ${label.toLowerCase()} travel time`}
      >
        +
      </button>
    </div>
  )
}

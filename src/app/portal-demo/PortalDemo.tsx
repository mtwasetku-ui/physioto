'use client'

import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, Users, LayoutDashboard, UserRound, Search, Plus, ChevronLeft, ChevronRight, ArrowUpRight, Check, X, Activity, FileText, HeartPulse, Megaphone } from 'lucide-react'

type Section = 'Diary' | 'Patients' | 'Overview' | 'Profile'
const patients = [
  { name: 'Margaret Wilson', initials: 'MW', suburb: 'Devonport', focus: 'Post-operative knee rehabilitation', next: '9:00 am' },
  { name: 'Robert Thompson', initials: 'RT', suburb: 'Burnie', focus: 'Balance and falls prevention', next: '10:30 am' },
  { name: 'Elizabeth Martin', initials: 'EM', suburb: 'Ulverstone', focus: 'Chronic lower back pain', next: '1:00 pm' },
  { name: 'James Anderson', initials: 'JA', suburb: 'Hobart', focus: 'Neurological rehabilitation', next: '2:30 pm' },
]
const announcements = [
  { title: 'Updated appointment reminder policy', date: '16 Nov 2026', author: 'Admin Team', summary: 'From next week, appointment reminders will be sent 24 hours before your visit.', body: 'From next week, appointment reminders will be sent 24 hours before your visit. If you have any questions, please contact the administration team.', tone: 'orange', icon: 'calendar' },
  { title: 'Winter wellness tips', date: '12 Nov 2026', author: 'Physio Team', summary: 'Simple tips to stay active and prevent falls during the cooler months.', body: 'As the weather cools, encourage patients to stay active with safe indoor movement, regular strength exercises and practical falls-prevention strategies.', tone: 'green', icon: 'heart' },
  { title: 'Team update', date: '10 Nov 2026', author: 'Admin Team', summary: 'Welcome to Shweta, our newest physiotherapist!', body: 'Please join us in welcoming Shweta to the Physio to Home team. We are looking forward to working together to support patients across Tasmania.', tone: 'blue', icon: 'team' },
]
const initialAppointments = [
  { time: '9:00', name: 'Margaret Wilson', detail: 'Home visit · Devonport · Knee rehabilitation', type: 'Follow-up', tone: '' },
  { time: '10:30', name: 'Robert Thompson', detail: 'Home visit · Burnie · Balance assessment', type: 'Initial', tone: 'blue' },
  { time: '12:00', name: 'Travel time', detail: 'Burnie → Ulverstone', type: 'Travel', tone: 'orange' },
  { time: '1:00', name: 'Elizabeth Martin', detail: 'Home visit · Ulverstone · Back pain', type: 'Follow-up', tone: '' },
  { time: '2:30', name: 'James Anderson', detail: 'Home visit · Hobart · Neurological rehab', type: 'Follow-up', tone: '' },
]
const nav: { label: Section; icon: typeof CalendarDays }[] = [
  { label: 'Diary', icon: CalendarDays }, { label: 'Patients', icon: Users }, { label: 'Overview', icon: LayoutDashboard }, { label: 'Profile', icon: UserRound },
]

export default function PortalDemo() {
  const [section, setSection] = useState<Section>('Diary')
  const [weekOffset, setWeekOffset] = useState(0)
  const [demoAppointments, setDemoAppointments] = useState(initialAppointments.map(appointment => ({ ...appointment, day: 0 })))
  const [drag, setDrag] = useState<{ id: string; startClientX: number; startClientY: number; deltaPx: number; originDay: number; targetDay: number; offsetX: number } | null>(null)
  const dragRef = useRef<typeof drag>(null)
  const suppressClickRef = useRef(false)
  const pendingTouchRef = useRef<{ id: string; x: number; y: number; timer: ReturnType<typeof setTimeout> } | null>(null)
  const dayColRefs = useRef<Array<HTMLDivElement | null>>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<(typeof patients)[number] | null>(null)
  const [showNote, setShowNote] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const [showBooking, setShowBooking] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<(typeof announcements)[number] | null>(null)
  const [toast, setToast] = useState('')
  const filtered = useMemo(() => patients.filter(p => (p.name + p.suburb + p.focus).toLowerCase().includes(search.toLowerCase())), [search])
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400) }
  const weekStart = new Date(2026, 10, 16 + weekOffset * 7)

  // Match the live diary's pointer-delta drag model and quarter-hour snapping.
  const PX_PER_MIN = 64 / 60
  function armAppointmentDrag(el: HTMLDivElement, pointerId: number, x: number, y: number, appointment: typeof demoAppointments[number]) {
    try { el.setPointerCapture(pointerId) } catch {}
    const next = { id: appointment.name, startClientX: x, startClientY: y, deltaPx: 0, originDay: appointment.day, targetDay: appointment.day, offsetX: 0 }
    dragRef.current = next
    setDrag(next)
  }
  function beginAppointmentDrag(e: React.PointerEvent<HTMLDivElement>, appointment: typeof demoAppointments[number]) {
    e.stopPropagation()
    suppressClickRef.current = false
    if (e.pointerType === 'mouse') {
      armAppointmentDrag(e.currentTarget, e.pointerId, e.clientX, e.clientY, appointment)
      return
    }
    if (pendingTouchRef.current) clearTimeout(pendingTouchRef.current.timer)
    const el = e.currentTarget
    const pointerId = e.pointerId
    const x = e.clientX
    const y = e.clientY
    const timer = setTimeout(() => {
      pendingTouchRef.current = null
      armAppointmentDrag(el, pointerId, x, y, appointment)
    }, 260)
    pendingTouchRef.current = { id: appointment.name, x, y, timer }
  }
  function moveAppointmentDrag(e: React.PointerEvent<HTMLDivElement>, appointment: typeof demoAppointments[number]) {
    const pending = pendingTouchRef.current
    if (pending?.id === appointment.name) {
      if (Math.hypot(e.clientX - pending.x, e.clientY - pending.y) > 10) {
        clearTimeout(pending.timer)
        pendingTouchRef.current = null
      }
      return
    }
    const current = dragRef.current
    if (!current || current.id !== appointment.name) return
    let targetDay = current.originDay
    for (let i = 0; i < dayColRefs.current.length; i++) {
      const col = dayColRefs.current[i]
      if (!col) continue
      const rect = col.getBoundingClientRect()
      if (e.clientX >= rect.left && e.clientX < rect.right) { targetDay = i; break }
    }
    const origin = dayColRefs.current[current.originDay]
    const target = dayColRefs.current[targetDay]
    const offsetX = origin && target ? target.getBoundingClientRect().left - origin.getBoundingClientRect().left : 0
    const next = { ...current, deltaPx: e.clientY - current.startClientY, targetDay, offsetX }
    dragRef.current = next
    setDrag(next)
  }
  function finishAppointmentDrag(e: React.PointerEvent<HTMLDivElement>, appointment: typeof demoAppointments[number]) {
    if (pendingTouchRef.current?.id === appointment.name) {
      clearTimeout(pendingTouchRef.current.timer)
      pendingTouchRef.current = null
      return
    }
    const current = dragRef.current
    if (!current || current.id !== appointment.name) return
    let targetDay = current.originDay
    for (let i = 0; i < dayColRefs.current.length; i++) {
      const col = dayColRefs.current[i]
      if (!col) continue
      const rect = col.getBoundingClientRect()
      if (e.clientX >= rect.left && e.clientX < rect.right) { targetDay = i; break }
    }
    dragRef.current = null
    setDrag(null)
    if (Math.abs(current.deltaPx) < 5 && targetDay === current.originDay) return
    suppressClickRef.current = true
    const parts = appointment.time.split(':')
    const originalMinutes = (Number(parts[0]) - 8) * 60 + Number(parts[1] || 0)
    const deltaMinutes = Math.round((current.deltaPx / PX_PER_MIN) / 15) * 15
    const newMinutes = Math.max(0, Math.min(600, originalMinutes + deltaMinutes))
    const hour = 8 + Math.floor(newMinutes / 60)
    const minute = newMinutes % 60
    const time = String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0')
    setDemoAppointments(items => items.map(item => item.name === appointment.name ? { ...item, day: targetDay, time } : item))
    notify('Moved sample visit to ' + ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][targetDay] + ' at ' + time + '.')
  }
  function cancelAppointmentDrag(appointment: typeof demoAppointments[number]) {
    if (pendingTouchRef.current?.id === appointment.name) { clearTimeout(pendingTouchRef.current.timer); pendingTouchRef.current = null }
    if (dragRef.current?.id === appointment.name) { dragRef.current = null; setDrag(null) }
  }

  return (
    <div className="demo-shell">
      <aside className="demo-side">
        <div className="demo-brand"><span className="demo-brand-mark">+</span><span className="demo-brand-copy">Physio to Home<small>Practitioner workspace</small></span></div>
        <nav className="demo-nav" aria-label="Demo navigation">
          {nav.map(({ label, icon: Icon }) => <button key={label} className={section === label ? 'active' : ''} onClick={() => setSection(label)}><Icon size={19}/><span className="demo-nav-label">{label}</span></button>)}
        </nav>
        <div className="demo-side-foot"><div className="flex items-center gap-2"><span className="demo-avatar">SG</span><span><strong className="block text-white">Shweta Gautam</strong><span>Physiotherapist</span></span></div><p className="mt-4">DEMONSTRATION MODE · FICTIONAL DATA</p></div>
      </aside>

      <div className="demo-main">
        <header className="demo-top">
          <div className="demo-top-label">Physio to Home <span className="mx-2 opacity-40">/</span> <strong className="text-[var(--demo-ink)]">{section}</strong></div>
          <div className="demo-top-right"><span className="demo-pill">Demo environment</span><span className="demo-avatar">SG</span><span className="hidden sm:inline">Shweta Gautam</span></div>
        </header>
        <main className="demo-content">
          <AnimatePresence mode="wait">
            <motion.div key={section} className="demo-motion-in" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -7 }} transition={{ duration: .22 }}>
              {section === 'Diary' && <>
                <section className="mb-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ff5638] text-white"><Megaphone size={22}/></span>
                      <div><h1 className="text-2xl font-extrabold tracking-tight text-[#102d23]">Announcements</h1><p className="text-sm text-[#738078]">Important updates and information</p></div>
                    </div>
                    <span className="text-xs font-bold text-[#55733e]">3 recent updates</span>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-3">
                    {announcements.map((item, index) => <article key={item.title} className={"overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md "+(index===0?"border-[#ff5638]":"border-[#e6e8df")}>
                      <div className={"flex h-20 items-center justify-center "+(item.tone==='orange'?'bg-[#fff0dc]':item.tone==='green'?'bg-[#dff1e5]':'bg-[#dcecff]')}>
                        {item.icon==='calendar'?<CalendarDays size={36} className="text-[#176044]"/>:item.icon==='heart'?<HeartPulse size={38} className="text-[#176044]"/>:<Users size={38} className="text-[#145078]"/>}
                      </div>
                      <div className="p-4">
                        <div className="mb-2 flex items-start justify-between gap-2"><h2 className="text-base font-extrabold leading-snug text-[#102d23]">{item.title}</h2>{index===0&&<span className="rounded-full bg-[#ff5638] px-2.5 py-1 text-[10px] font-extrabold text-white">New</span>}</div>
                        <p className="min-h-[42px] text-sm leading-relaxed text-[#46574e]">{item.summary}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#738078]"><span className="inline-flex items-center gap-1"><CalendarDays size={13}/>{item.date}</span><span className="inline-flex items-center gap-1"><Users size={13}/>{item.author}</span></div>
                        <button className="mt-3 text-xs font-extrabold text-[#26734f] transition hover:text-[#ff5638]" onClick={()=>setSelectedAnnouncement(item)}>Read more <ArrowUpRight size={13} className="ml-1 inline"/></button>
                      </div>
                    </article>)}
                  </div>
                </section>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div><div className="demo-eyebrow">Your weekly schedule</div><h2 className="demo-heading">Your diary</h2><p className="demo-sub">Monday to Sunday · 8:00 am–7:00 pm · Tasmania time</p></div>
                  <div className="flex items-center gap-2"><button className="demo-btn light !px-3 !py-2" aria-label="Previous week" onClick={() => setWeekOffset(offset => offset - 1)}><ChevronLeft size={16}/></button><span className="rounded-xl border border-[#e6e8df] bg-white px-4 py-2 text-xs font-extrabold">Week of {weekStart.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span><button className="demo-btn light !px-3 !py-2" aria-label="Next week" onClick={() => setWeekOffset(offset => offset + 1)}><ChevronRight size={16}/></button><button className="demo-btn lime" onClick={() => setShowBooking(true)}><Plus size={16} className="mr-2 inline"/>New appointment</button></div>
                </div>
                <section className="demo-panel w-full">
                  <div className="overflow-x-auto">
                    <div className="min-w-[1050px]">
                      <div className="grid grid-cols-[58px_repeat(7,minmax(0,1fr))] border-b border-[#e6e8df]">
                        <div className="border-r border-[#e6e8df] px-2 py-3 text-[10px] font-bold uppercase tracking-wide text-[#89958a]">Time</div>
                        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((weekday,index)=><div key={weekday} className="border-r border-[#e6e8df] px-2 py-3 text-center last:border-r-0"><div className="text-xs font-extrabold text-[#24382d]">{weekday}</div><div className="mt-1 text-[11px] text-[#75816f]">{new Date(weekStart.getFullYear(),weekStart.getMonth(),weekStart.getDate()+index).toLocaleDateString("en-AU",{day:"numeric",month:"short"})}</div></div>)}
                      </div>
                      <div className="grid grid-cols-[58px_repeat(7,minmax(0,1fr))]">
                        <div className="relative h-[704px] border-r border-[#e6e8df]">{Array.from({length:12},(_,i)=>{const hour=i+8;return <div key={hour} className="absolute left-0 right-0 border-t border-[#e6e8df] pr-2 text-right" style={{top:i*64}}><span className="relative -top-2.5 bg-white px-1 text-[10px] font-semibold tabular-nums text-[#7c897f]">{hour===12?"12 pm":hour>12?`${hour-12} pm`:`${hour} am`}</span></div>})}</div>
                        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((weekday,index)=><div key={weekday} ref={el=>{dayColRefs.current[index]=el}} className="relative h-[704px] border-r border-[#e6e8df] last:border-r-0 bg-[#fbfcf8] transition-colors hover:bg-[#f5f8ef]">
                          {Array.from({length:12},(_,i)=><div key={i} className="pointer-events-none absolute left-0 right-0 border-t border-[#e1e6dc]" style={{top:i*64}}/>)}
                          {demoAppointments.map((a)=>{if(a.day!==index)return null;const parts=a.time.split(":");const minutes=(Number(parts[0])-8)*60+Number(parts[1]||0);const top=minutes/60*64;const activeDrag=drag?.id===a.name;return <div key={a.name} onPointerDown={e=>beginAppointmentDrag(e,a)} onPointerMove={e=>moveAppointmentDrag(e,a)} onPointerUp={e=>finishAppointmentDrag(e,a)} onPointerCancel={()=>cancelAppointmentDrag(a)} onClick={()=>{if(suppressClickRef.current){suppressClickRef.current=false;return}if(!activeDrag&&a.name!=="Travel time")setSelected(patients.find(p=>p.name===a.name)??null)}} className={"absolute left-1 right-1 z-10 select-none touch-pan-y cursor-grab overflow-hidden rounded-lg border p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing "+(a.tone==="blue"?"border-[#c9d9eb] bg-[#edf4fb]":a.tone==="orange"?"border-[#f0d5b8] bg-[#fff2e5]":"border-[#cbdcc8] bg-[#edf5e9]")} style={{top:top+3,height:56,transform:activeDrag?'translate('+(drag?.offsetX ?? 0)+'px, '+(drag?.deltaPx ?? 0)+'px)':undefined,zIndex:activeDrag?30:10,transition:activeDrag?'none':undefined}}>
                            <div className="text-[10px] font-extrabold text-[#55733e]">{a.time}</div><div className="mt-1 truncate text-[11px] font-bold leading-tight text-[#24382d]">{a.name}</div><div className="mt-1 truncate text-[10px] text-[#738078]">{a.type}</div>
                          </div>})}
                        </div>)}
                      </div>
                    </div>
                  </div>
                </section>
              </>}
              {section === 'Patients' && <>
                <div className="demo-heading-row"><div><div className="demo-eyebrow">Your caseload</div><h1 className="demo-heading">Patients, made simple.</h1><p className="demo-sub">Search and open a sample patient record.</p></div><span className="demo-pill">4 sample records</span></div>
                <section className="demo-panel"><div className="demo-panel-head"><div className="demo-panel-title">My patients</div><span className="demo-small">Fictional training data</span></div><div className="relative"><Search size={17} className="absolute left-3 top-3.5 text-[#8b978e]"/><input className="demo-search pl-10" placeholder="Search name, suburb or treatment focus…" value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="demo-list">{filtered.map(p=><button key={p.name} className="demo-patient text-left" onClick={()=>setSelected(p)}><span className="demo-avatar">{p.initials}</span><span className="demo-patient-info"><span className="demo-patient-name block">{p.name}</span><span className="demo-patient-detail block">{p.suburb} · {p.focus}</span></span><ArrowUpRight size={17}/></button>)}{filtered.length===0&&<div className="demo-empty">No sample patients match that search.</div>}</div></section>
              </>}
              {section === 'Overview' && <>
                <div className="demo-heading-row"><div><div className="demo-eyebrow">Practice snapshot</div><h1 className="demo-heading">A clearer view of your work.</h1><p className="demo-sub">A quick overview of your sample activity.</p></div></div>
                <div className="demo-stats"><Stat label="Assigned patients" value="4" note="Across Tasmania"/><Stat label="Visits this week" value="18" note="Sample activity"/><Stat label="Notes completed" value="16" note="2 drafts remaining"/><Stat label="Upcoming visits" value="7" note="Next 7 days"/></div>
                <div className="demo-grid"><section className="demo-panel"><div className="demo-panel-title mb-4">This week's activity</div>{['Monday','Tuesday','Wednesday','Thursday','Friday'].map((d,i)=><div key={d} className="mb-4"><div className="mb-2 flex justify-between text-xs font-bold"><span>{d}</span><span>{[4,3,5,2,4][i]} visits</span></div><div className="h-2 overflow-hidden rounded-full bg-[#edf0e8]"><div className="h-full rounded-full bg-[#2c7756]" style={{width:[80,60,100,40,80][i]+'%'}}/></div></div>)}</section><section className="demo-panel"><div className="demo-panel-title mb-4">To keep on top of</div><div className="demo-list"><QuickAction icon={<FileText size={18}/>} title="2 draft notes" detail="Ready for review" onClick={()=>setShowNote(true)}/><QuickAction icon={<CalendarDays size={18}/>} title="Next visit" detail="Margaret Wilson · 9:00 am" onClick={()=>setSection('Diary')}/></div></section></div>
              </>}
              {section === 'Profile' && <>
                <div className="demo-heading-row"><div><div className="demo-eyebrow">Your workspace</div><h1 className="demo-heading">Your profile.</h1><p className="demo-sub">A sample practitioner account view.</p></div></div>
                <section className="demo-panel max-w-2xl"><div className="flex items-center gap-4 border-b border-[#e6e8df] pb-5"><span className="demo-avatar !h-14 !w-14 text-lg">SG</span><div><div className="text-lg font-extrabold">Shweta Gautam</div><div className="demo-small">Physiotherapist · Sample account</div></div></div><div className="grid gap-4 py-5 sm:grid-cols-2"><Info label="Email" value="shweta.demo@example.test"/><Info label="Role" value="Practitioner"/><Info label="Service area" value="Tasmania-wide"/><Info label="Account status" value="Demo only"/></div><div className="demo-notice">This is a demonstration profile. No real account settings or passwords are connected.</div><button className="demo-btn light" onClick={()=>notify('Profile controls are preview-only.')}>Explore account settings</button></section>
              </>}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav className="demo-mobile-nav" aria-label="Demo navigation">{nav.map(({label,icon:Icon})=><button key={label} className={section===label?'active':''} onClick={()=>setSection(label)}><Icon size={19}/>{label}</button>)}</nav>

      <AnimatePresence>
        {selectedAnnouncement && <motion.div className="demo-modal-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setSelectedAnnouncement(null)}><motion.section role="dialog" aria-modal="true" aria-label="Announcement details" className="demo-modal" initial={{scale:.96,y:12}} animate={{scale:1,y:0}} exit={{scale:.97,y:8}} onClick={e=>e.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><div className="demo-eyebrow">Announcement · {selectedAnnouncement.date}</div><h2 className="mt-2">{selectedAnnouncement.title}</h2><p className="demo-small mt-1">Posted by {selectedAnnouncement.author}</p></div><button className="rounded-full p-2 hover:bg-[#eef0e9]" onClick={()=>setSelectedAnnouncement(null)} aria-label="Close"><X size={18}/></button></div><p className="mt-5 text-sm leading-relaxed text-[#46574e]">{selectedAnnouncement.body}</p><div className="demo-modal-actions"><button className="demo-btn" onClick={()=>setSelectedAnnouncement(null)}>Close</button></div></motion.section></motion.div>}
        {selected && <motion.div className="demo-modal-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setSelected(null)}><motion.section role="dialog" aria-modal="true" aria-label="Sample patient details" className="demo-modal" initial={{scale:.96,y:12}} animate={{scale:1,y:0}} exit={{scale:.97,y:8}} onClick={e=>e.stopPropagation()}><div className="flex items-start justify-between"><div className="flex items-center gap-3"><span className="demo-avatar !h-12 !w-12">{selected.initials}</span><div><h2>{selected.name}</h2><span className="demo-small">Sample patient · {selected.suburb}</span></div></div><button className="rounded-full p-2 hover:bg-[#eef0e9]" onClick={()=>setSelected(null)} aria-label="Close"><X size={18}/></button></div><div className="my-5 rounded-xl bg-[#f2f4ec] p-4"><div className="demo-eyebrow">Current treatment focus</div><p className="mt-2 text-sm font-bold text-[#102d23]">{selected.focus}</p></div><div className="grid grid-cols-2 gap-3"><Info label="Next appointment" value={selected.next}/><Info label="Care setting" value="Home visit"/></div><div className="demo-notice mt-5">All patient names and clinical details on this screen are fictional examples.</div><div className="demo-modal-actions"><button className="demo-btn light" onClick={()=>setSelected(null)}>Close</button><button className="demo-btn" onClick={()=>{setSelected(null);setShowNote(true)}}>Add sample note</button></div></motion.section></motion.div>}
        {showNote && <motion.div className="demo-modal-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowNote(false)}><motion.section role="dialog" aria-modal="true" aria-label="Sample treatment note" className="demo-modal" initial={{scale:.96,y:12}} animate={{scale:1,y:0}} exit={{scale:.97,y:8}} onClick={e=>e.stopPropagation()}><div className="flex justify-between"><div><h2>Clinical note preview</h2><p>Explore the note workflow using fictional content.</p></div><button onClick={()=>setShowNote(false)} aria-label="Close"><X size={18}/></button></div><div className="mt-5 rounded-xl border border-[#e6e8df] p-4"><label className="text-xs font-bold text-[#738078]">SESSION SUMMARY</label><p className="mt-2 text-sm">Sample: patient reports improved confidence with sit-to-stand transfers. Continue graded strengthening and balance exercises.</p></div><div className="demo-notice mt-4">Saving is disabled in demonstration mode. No clinical record will be created.</div><div className="demo-modal-actions"><button className="demo-btn light" onClick={()=>setShowNote(false)}>Close</button><button className="demo-btn" onClick={()=>{setShowNote(false);setNoteSaved(true);notify('Demo note preview completed — nothing was saved.')}}><Check size={15} className="inline mr-2"/>Preview complete</button></div></motion.section></motion.div>}
        {showBooking && <motion.div className="demo-modal-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowBooking(false)}><motion.section role="dialog" aria-modal="true" aria-label="Sample appointment booking" className="demo-modal" initial={{scale:.96,y:12}} animate={{scale:1,y:0}} exit={{scale:.97,y:8}} onClick={e=>e.stopPropagation()}><h2>New appointment</h2><p>In the live portal, this workflow connects to the booking system. Here it is a safe preview only.</p><div className="demo-notice mt-4">No appointment will be created and no external system will be contacted.</div><div className="demo-modal-actions"><button className="demo-btn light" onClick={()=>setShowBooking(false)}>Cancel</button><button className="demo-btn" onClick={()=>{setShowBooking(false);notify('Booking action is disabled in demo mode.')}}>Explore booking flow</button></div></motion.section></motion.div>}
      </AnimatePresence>
      <AnimatePresence>{toast&&<motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:10}} className="fixed bottom-24 right-5 z-[100] rounded-xl bg-[#102d23] px-5 py-3 text-sm font-semibold text-white shadow-xl sm:bottom-6">{toast}</motion.div>}</AnimatePresence>
      <div className="fixed bottom-3 left-1/2 z-[60] hidden -translate-x-1/2 rounded-full bg-[#102d23] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#d8f078] shadow-lg md:block">Demo only · fictional data · no live connections</div>
    </div>
  )
}

function Stat({label,value,note}:{label:string;value:string;note:string}) { return <div className="demo-stat"><div className="demo-stat-label">{label}</div><div className="demo-stat-value">{value}</div><div className="demo-stat-note">{note}</div></div> }
function QuickAction({icon,title,detail,onClick}:{icon:React.ReactNode;title:string;detail:string;onClick:()=>void}) { return <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl border border-[#e6e8df] p-3 text-left transition hover:-translate-y-0.5 hover:border-[#9dbd9f] hover:shadow-sm"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf4df] text-[#376347]">{icon}</span><span className="min-w-0 flex-1"><span className="block text-[13px] font-extrabold">{title}</span><span className="mt-1 block text-[11px] text-[#738078]">{detail}</span></span><ArrowUpRight size={16}/></button> }
function Info({label,value}:{label:string;value:string}) { return <div><div className="text-[10px] font-extrabold uppercase tracking-widest text-[#829087]">{label}</div><div className="mt-1 text-sm font-bold">{value}</div></div> }

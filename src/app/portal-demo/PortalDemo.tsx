'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, Users, LayoutDashboard, UserRound, Search, Plus, ChevronLeft, ChevronRight, Clock3, MapPin, ArrowUpRight, Check, X, Activity, FileText, HeartPulse } from 'lucide-react'

type Section = 'Diary' | 'Patients' | 'Overview' | 'Profile'
const patients = [
  { name: 'Margaret Wilson', initials: 'MW', suburb: 'Devonport', focus: 'Post-operative knee rehabilitation', next: '9:00 am' },
  { name: 'Robert Thompson', initials: 'RT', suburb: 'Burnie', focus: 'Balance and falls prevention', next: '10:30 am' },
  { name: 'Elizabeth Martin', initials: 'EM', suburb: 'Ulverstone', focus: 'Chronic lower back pain', next: '1:00 pm' },
  { name: 'James Anderson', initials: 'JA', suburb: 'Hobart', focus: 'Neurological rehabilitation', next: '2:30 pm' },
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
  const [day, setDay] = useState(16)
  const [demoAppointments, setDemoAppointments] = useState(initialAppointments.map(appointment => ({ ...appointment, day: 16 })))
  const [draggedAppointment, setDraggedAppointment] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<(typeof patients)[number] | null>(null)
  const [showNote, setShowNote] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const [showBooking, setShowBooking] = useState(false)
  const [toast, setToast] = useState('')
  const filtered = useMemo(() => patients.filter(p => (p.name + p.suburb + p.focus).toLowerCase().includes(search.toLowerCase())), [search])
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400) }

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
                <div className="demo-heading-row"><div><div className="demo-eyebrow">Monday, 16 November 2026</div><h1 className="demo-heading">Your day, in focus.</h1><p className="demo-sub">Here’s what your schedule looks like today.</p></div><button className="demo-btn lime" onClick={() => setShowBooking(true)}><Plus size={16} className="inline mr-2"/>New appointment</button></div>
                <div className="demo-stats">
                  <Stat label="Today's visits" value="4" note="Across 3 locations"/>
                  <Stat label="Travel time" value="1h 15m" note="Planned between visits"/>
                  <Stat label="Notes to finish" value="2" note="Keep your records up to date"/>
                  <Stat label="Next appointment" value="9:00 am" note="Margaret · Devonport"/>
                </div>
                <div className="demo-grid">
                  <section className="demo-panel"><div className="demo-panel-head"><div><div className="demo-panel-title">Your diary</div><div className="demo-small">Monday 16 – Sunday 22 November · Tasmania time</div></div><div className="flex items-center gap-2"><button className="demo-btn light !px-3 !py-2" aria-label="Previous day" onClick={() => setDay(d => Math.max(16,d-1))}><ChevronLeft size={16}/></button><button className="demo-btn light !px-3 !py-2" aria-label="Next day" onClick={() => setDay(d => Math.min(22,d+1))}><ChevronRight size={16}/></button></div></div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-7">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((weekday,index)=><div key={weekday} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(draggedAppointment!==null){setDemoAppointments(items=>items.map((item,i)=>i===draggedAppointment?{...item,day:16+index}:item));setDraggedAppointment(null);notify(`Moved sample visit to ${weekday}.`)}}} className="min-h-40 rounded-xl border border-[#e6e8df] bg-[#fbfcf8] p-2 transition-colors hover:border-[#9dbd9f]"><button className="mb-2 flex w-full items-center justify-between text-xs font-extrabold" onClick={()=>{setDay(16+index);setCalendarView('day')}}><span>{weekday}</span><span className="text-[#75816f]">{16+index} Nov</span></button>{demoAppointments.map((a,i)=>a.day===16+index?<div key={a.time+a.name} draggable onDragStart={()=>setDraggedAppointment(i)} onDragEnd={()=>setDraggedAppointment(null)} onClick={()=>a.name!=='Travel time'&&setSelected(patients.find(p=>p.name===a.name)??null)} className="mb-2 cursor-grab rounded-lg border border-[#e6e8df] bg-white p-2 text-left shadow-sm active:cursor-grabbing"><div className="text-[10px] font-extrabold text-[#55733e]">{a.time}</div><div className="mt-1 text-[11px] font-bold leading-tight">{a.name}</div><div className="mt-1 text-[10px] text-[#738078]">{a.type}</div></div>:null)}<div className="mt-2 text-center text-[10px] text-[#9aa49a]">Drop visit here</div></div>)}</div>
                  </section>
                  <section className="demo-panel"><div className="demo-panel-head"><div><div className="demo-panel-title">Quick actions</div><div className="demo-small">Common tasks, one tap away</div></div><Activity size={19}/></div>
                    <div className="demo-list">
                      <QuickAction icon={<FileText size={18}/>} title="Complete a treatment note" detail="Add a note to a recent visit" onClick={() => setShowNote(true)}/>
                      <QuickAction icon={<Users size={18}/>} title="Find a patient" detail="Search your assigned patients" onClick={() => setSection('Patients')}/>
                      <QuickAction icon={<HeartPulse size={18}/>} title="Review patient details" detail="Open a sample patient record" onClick={() => setSelected(patients[0])}/>
                    </div>
                    <div className="mt-5 rounded-2xl bg-[#f1f4e9] p-4"><div className="text-xs font-extrabold uppercase tracking-widest text-[#55733e]">A little reminder</div><p className="mt-2 text-sm font-semibold leading-relaxed">Take a moment between visits to complete your clinical notes.</p><p className="mt-2 text-xs text-[#75816f]">Your records help keep every care journey connected.</p></div>
                  </section>
                </div>
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

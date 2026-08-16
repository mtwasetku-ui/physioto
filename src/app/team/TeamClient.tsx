'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Award, Heart, X } from 'lucide-react'
import { teamMembers, type TeamMember } from '@/data/teamData'

function TeamCard({ member, onOpen, delayClass }: { member: TeamMember; onOpen: (m: TeamMember) => void; delayClass: string }) {
  return (
    <div
      className={`card-lift fade-up ${delayClass} group relative h-[420px] cursor-pointer overflow-hidden rounded-2xl`}
      onClick={() => onOpen(member)}
    >
      {member.photo ? (
        <Image
          src={member.photo}
          alt={member.name}
          fill
          className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0E2C22] to-[#0A231B]">
          <span className="font-display text-8xl font-extrabold text-white/80">{member.name.charAt(0)}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A231B] via-[#0A231B]/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className="font-display text-2xl font-bold tracking-tight text-white">{member.name}</h3>
        <p className="mt-1 text-base font-medium text-[#FFC53D]">{member.title}</p>
      </div>
      <div className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm transition-colors group-hover:bg-[#FF5638]/80">
        <span className="text-sm font-medium text-white">Tap to learn more</span>
      </div>
    </div>
  )
}

function TeamModal({ member, onClose }: { member: TeamMember; onClose: () => void }) {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 20)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#0A231B]/70 p-4 backdrop-blur-sm md:p-8"
      onClick={onClose}
      style={{ perspective: '1600px' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto grid w-full max-w-5xl grid-cols-1 rounded-3xl bg-gradient-to-br from-[#0E2C22] to-[#0A231B] shadow-2xl md:grid-cols-[340px_1fr]"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1), opacity 0.4s ease',
          transform: entered ? 'rotateY(0deg) scale(1)' : 'rotateY(-100deg) scale(0.9)',
          opacity: entered ? 1 : 0,
        }}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-10 rounded-full bg-white/15 p-2.5 transition-colors hover:bg-white/25"
          aria-label="Close"
        >
          <X className="h-6 w-6 text-white" />
        </button>

        {/* Photo side */}
        <div className="relative h-64 overflow-hidden rounded-t-3xl md:aspect-[3/4] md:h-auto md:max-h-[85vh] md:self-start md:rounded-l-3xl md:rounded-tr-none md:sticky md:top-0">
          {member.photo ? (
            <Image
              src={member.photo}
              alt={member.name}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 340px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#0A231B]/60">
              <span className="font-display text-8xl font-extrabold text-white/80">{member.name.charAt(0)}</span>
            </div>
          )}
        </div>

        {/* Detail side */}
        <div className="flex flex-col p-8 md:p-12">
          <div className="mb-6 border-b border-[#4E9B72]/30 pb-6">
            <h3 className="font-display text-4xl font-bold text-white md:text-5xl">{member.name}</h3>
            <p className="mt-2 text-xl font-medium text-[#FFC53D] md:text-2xl">{member.title}</p>
            {member["AHPRA registration number"] && (
              <p className="mt-2 text-base text-[#7FB69B]">
                AHPRA: {member["AHPRA registration number"]}
              </p>
            )}
          </div>

          <div className="space-y-6">
            {member.qualifications && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Award className="h-5 w-5 flex-shrink-0 text-[#FFC53D]" />
                  <span className="text-lg font-semibold uppercase tracking-wide text-[#FFC53D]">Qualifications</span>
                </div>
                <p className="pl-7 text-lg leading-relaxed text-white/90 md:text-xl">{member.qualifications}</p>
              </div>
            )}
            {member.specialties && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Heart className="h-5 w-5 flex-shrink-0 text-[#FFC53D]" />
                  <span className="text-lg font-semibold uppercase tracking-wide text-[#FFC53D]">Specialties</span>
                </div>
                <p className="pl-7 text-lg leading-relaxed text-white/90 md:text-xl">{member.specialties}</p>
              </div>
            )}
            {member.bio && (
              <div className="space-y-4 border-t border-[#4E9B72]/25 pt-6">
                {member.bio.split(/\n\s*\n/).map((paragraph, index) => (
                  <p key={index} className="text-lg leading-relaxed text-white/90 md:text-xl">
                    {paragraph.trim()}
                  </p>
                ))}
              </div>
            )}
            {!member.qualifications && !member.specialties && !member.bio && (
              <p className="text-lg italic text-[#FFC53D]">More information coming soon.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const sortedMembers = [...teamMembers].sort((a, b) => a.order - b.order)
const DELAYS = ['d1', 'd2', 'd3', 'd4', 'd5']

export default function TeamClient() {
  const [expanded, setExpanded] = useState<TeamMember | null>(null)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setVisibleSections((p) => new Set(Array.from(p).concat(e.target.id))) }),
      { threshold: 0.1 }
    )
    Object.values(sectionRefs.current).forEach((r) => { if (r) observer.observe(r) })
    return () => observer.disconnect()
  }, [])

  const setRef = (id: string) => (el: HTMLElement | null) => { sectionRefs.current[id] = el }
  const vis = (id: string) => visibleSections.has(id)

  return (
    <div className="font-body min-h-screen overflow-x-hidden bg-[#FBF8F1] text-[#12241D]">
      <div className="pth-grain" aria-hidden="true" />

      {/* HERO */}
      <section id="team-hero" ref={setRef('team-hero') as any} className="relative overflow-hidden bg-[#0E2C22] py-24">
        <div className="dots pointer-events-none absolute inset-0 text-white/5" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 text-center lg:px-8">
          <p className={`fade-up ${vis('team-hero') ? 'in' : ''} text-xs font-bold uppercase tracking-[0.24em] text-[#FFC53D]`}>Our people</p>
          <h1 className={`fade-up d1 ${vis('team-hero') ? 'in' : ''} font-display mt-3 text-4xl font-extrabold tracking-tight text-white md:text-5xl`}>
            Meet <span className="italic text-[#FF5638]">our team</span>
          </h1>
          <p className={`fade-up d2 ${vis('team-hero') ? 'in' : ''} mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-slate-300 md:text-xl`}>
            AHPRA registered physiotherapists delivering expert in-home care across Tasmania.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
        <div className={`fade-up ${vis('team-hero') ? 'in' : ''} card-lift mb-12 rounded-2xl border border-[#12241D]/10 bg-white p-12 shadow-sm`}>
          <h2 className="font-display mb-6 text-3xl font-bold tracking-tight text-[#12241D]">Compassionate care in your home</h2>
          <p className="mb-6 text-lg leading-relaxed text-slate-600">At Physio to Home, we prioritise your comfort and well-being by providing personalised in-home physiotherapy services tailored to your unique living environment and treatment needs.</p>
          <p className="mb-6 text-lg leading-relaxed text-slate-600">Our founder recognised something that clinic-based care often misses: recovery happens at home. By seeing you in your own environment, we can tailor treatment to your real daily challenges — the stairs you climb, the chair you sit in, the garden you love.</p>
          <p className="text-lg leading-relaxed text-slate-600">With over 15 years of experience across musculoskeletal, neurological, orthopaedic, and aged care settings, we bring clinical excellence directly to your doorstep across Tasmania.</p>
        </div>

        <div id="team-why" ref={setRef('team-why') as any} className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { title: 'Comfortable Treatment Plans', desc: 'Tailored treatment plans designed to utilise your home environment for optimal recovery and healing.' },
            { title: 'Expert Care Delivered', desc: 'Professional physiotherapists come to you, ensuring convenience and personalised attention in your own space.' },
            { title: 'Personalised Therapy Solutions', desc: 'We provide in-home physiotherapy services tailored to your environment, ensuring comfort and effective treatment plans based on your living space.' },
          ].map(({ title, desc }, i) => (
            <div key={title} className={`fade-up d${i + 1} ${vis('team-why') ? 'in' : ''} card-lift rounded-2xl border border-[#12241D]/10 bg-[#F2EFE4] p-6`}>
              <h3 className="mb-3 text-lg font-bold text-[#12241D]">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
            </div>
          ))}
        </div>

        <div id="team-stats" ref={setRef('team-stats') as any} className={`fade-up ${vis('team-stats') ? 'in' : ''} mb-12 rounded-2xl bg-[#0E2C22] p-10 text-center text-white`}>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {['AHPRA Registered', '15+ Years Experience', 'Evidence-Based Care', 'DVA Approved'].map((item) => (
              <div key={item}>
                <p className="font-display text-lg font-bold text-[#FFC53D]">&#10003;</p>
                <p className="text-sm text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="team-grid" ref={setRef('team-grid') as any} className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className={`fade-up ${vis('team-grid') ? 'in' : ''} mb-12 text-center`}>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FF5638]">The clinicians</p>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[#12241D]">Our physiotherapists</h2>
          <p className="mt-2 text-sm text-slate-500">Tap any card to learn more about our physiotherapists</p>
        </div>

        {sortedMembers.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {sortedMembers.map((member, i) => (
              <TeamCard key={member.id} member={member} onOpen={setExpanded} delayClass={DELAYS[i % DELAYS.length]} />
            ))}
          </div>
        ) : (
          <p className="text-center italic text-slate-400">Team profiles coming soon.</p>
        )}
      </div>

      {expanded && <TeamModal member={expanded} onClose={() => setExpanded(null)} />}
    </div>
  )
}

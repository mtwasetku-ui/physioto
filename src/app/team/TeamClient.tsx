'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Award, Heart, X } from 'lucide-react'
import { teamMembers, type TeamMember } from '@/data/teamData'

function TeamCard({ member, onOpen }: { member: TeamMember; onOpen: (m: TeamMember) => void }) {
  return (
    <div
      className="relative cursor-pointer rounded-2xl overflow-hidden shadow-lg group"
      style={{ height: '420px' }}
      onClick={() => onOpen(member)}
    >
      {member.photo ? (
        <Image
          src={member.photo}
          alt={member.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center">
          <span className="text-8xl font-bold text-white opacity-80">{member.name.charAt(0)}</span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
        <h3 className="text-2xl font-bold text-white">{member.name}</h3>
        <p className="text-emerald-200 font-medium text-base mt-1">{member.title}</p>
      </div>
      <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1">
        <span className="text-white text-sm font-medium">Tap to learn more</span>
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
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 overflow-y-auto"
      onClick={onClose}
      style={{ perspective: '1600px' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-3xl shadow-2xl w-full max-w-5xl my-auto grid grid-cols-1 md:grid-cols-[340px_1fr]"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1), opacity 0.4s ease',
          transform: entered ? 'rotateY(0deg) scale(1)' : 'rotateY(-100deg) scale(0.9)',
          opacity: entered ? 1 : 0,
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 bg-white/15 hover:bg-white/25 rounded-full p-2.5 transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Photo side */}
        <div className="relative h-64 md:h-auto md:self-start md:sticky md:top-0 md:aspect-[3/4] md:max-h-[85vh] rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none overflow-hidden">
          {member.photo ? (
            <Image
              src={member.photo}
              alt={member.name}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 340px"
            />
          ) : (
            <div className="w-full h-full bg-emerald-900/40 flex items-center justify-center">
              <span className="text-8xl font-bold text-white opacity-80">{member.name.charAt(0)}</span>
            </div>
          )}
        </div>

        {/* Detail side */}
        <div className="p-8 md:p-12 flex flex-col">
          <div className="mb-6 pb-6 border-b border-emerald-400/40">
            <h3 className="text-4xl md:text-5xl font-bold text-white">{member.name}</h3>
            <p className="text-emerald-200 font-medium text-xl md:text-2xl mt-2">{member.title}</p>
            {member["AHPRA registration number"] && (
              <p className="text-emerald-300/70 text-base mt-2">
                AHPRA: {member["AHPRA registration number"]}
              </p>
            )}
          </div>

          <div className="space-y-6">
            {member.qualifications && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-emerald-200 flex-shrink-0" />
                  <span className="text-emerald-100 font-semibold text-lg uppercase tracking-wide">Qualifications</span>
                </div>
                <p className="text-emerald-50 text-lg md:text-xl leading-relaxed pl-7">{member.qualifications}</p>
              </div>
            )}
            {member.specialties && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-emerald-200 flex-shrink-0" />
                  <span className="text-emerald-100 font-semibold text-lg uppercase tracking-wide">Specialties</span>
                </div>
                <p className="text-emerald-50 text-lg md:text-xl leading-relaxed pl-7">{member.specialties}</p>
              </div>
            )}
            {member.bio && (
              <div className="space-y-4 border-t border-emerald-400/30 pt-6">
                {member.bio.split(/\n\s*\n/).map((paragraph, index) => (
                  <p key={index} className="text-emerald-50 text-lg md:text-xl leading-relaxed">
                    {paragraph.trim()}
                  </p>
                ))}
              </div>
            )}
            {!member.qualifications && !member.specialties && !member.bio && (
              <p className="text-emerald-200 text-lg italic">More information coming soon.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const sortedMembers = [...teamMembers].sort((a, b) => a.order - b.order)

export default function TeamClient() {
  const [expanded, setExpanded] = useState<TeamMember | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Meet Our Team</h1>
          <p className="text-xl text-emerald-100 max-w-3xl mx-auto">AHPRA registered physiotherapists delivering expert in-home care across Tasmania.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-3xl shadow-lg p-12 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Compassionate Care in Your Home</h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-6">At Physio to Home, we prioritise your comfort and well-being by providing personalised in-home physiotherapy services tailored to your unique living environment and treatment needs.</p>
          <p className="text-lg text-gray-600 leading-relaxed mb-6">Our founder recognised something that clinic-based care often misses: recovery happens at home. By seeing you in your own environment, we can tailor treatment to your real daily challenges — the stairs you climb, the chair you sit in, the garden you love.</p>
          <p className="text-lg text-gray-600 leading-relaxed">With over 15 years of experience across musculoskeletal, neurological, orthopaedic, and aged care settings, we bring clinical excellence directly to your doorstep across Tasmania.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[
            { title: 'Comfortable Treatment Plans', desc: 'Tailored treatment plans designed to utilise your home environment for optimal recovery and healing.' },
            { title: 'Expert Care Delivered', desc: 'Professional physiotherapists come to you, ensuring convenience and personalised attention in your own space.' },
            { title: 'Personalised Therapy Solutions', desc: 'We provide in-home physiotherapy services tailored to your environment, ensuring comfort and effective treatment plans based on your living space.' },
          ].map(({ title, desc }) => (
            <div key={title} className="bg-emerald-50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-3xl p-10 text-white text-center mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['AHPRA Registered', '15+ Years Experience', 'Evidence-Based Care', 'DVA Approved'].map((item) => (
              <div key={item}><p className="font-bold text-lg">✓</p><p className="text-emerald-100 text-sm">{item}</p></div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Our Physiotherapists</h2>
          <p className="text-gray-500 text-sm">Tap any card to learn more about our physiotherapists</p>
        </div>

        {sortedMembers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedMembers.map((member) => (
              <TeamCard key={member.id} member={member} onOpen={setExpanded} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 italic">Team profiles coming soon.</p>
        )}
      </div>

      {expanded && <TeamModal member={expanded} onClose={() => setExpanded(null)} />}
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import { Award, Heart, RotateCcw } from 'lucide-react'
import { teamMembers, type TeamMember } from '@/data/teamData'

function FlipCard({ member }: { member: TeamMember }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      className="relative cursor-pointer"
      style={{ perspective: '1200px', height: '420px' }}
      onClick={() => setFlipped((f) => !f)}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.65s cubic-bezier(0.4, 0.2, 0.2, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* FRONT */}
        <div
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          className="absolute inset-0 rounded-2xl overflow-hidden shadow-lg group"
        >
          {member.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.photo}
              alt={member.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center">
              <span className="text-8xl font-bold text-white opacity-80">{member.name.charAt(0)}</span>
            </div>
          )}
          {/* Name overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
            <h3 className="text-2xl font-bold text-white">{member.name}</h3>
            <p className="text-blue-200 font-medium text-sm mt-1">{member.title}</p>
          </div>
          {/* Tap hint */}
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
            <RotateCcw className="w-3 h-3 text-white" />
            <span className="text-white text-xs font-medium">Tap to learn more</span>
          </div>
        </div>

        {/* BACK */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-blue-600 to-blue-800 p-7 flex flex-col"
        >
          <div className="mb-5 pb-4 border-b border-blue-400/40">
            <h3 className="text-2xl font-bold text-white">{member.name}</h3>
            <p className="text-blue-200 font-medium text-sm mt-1">{member.title}</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {member.qualifications && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-blue-200 flex-shrink-0" />
                  <span className="text-blue-100 font-semibold text-sm uppercase tracking-wide">Qualifications</span>
                </div>
                <p className="text-blue-50 text-sm leading-relaxed pl-6">{member.qualifications}</p>
              </div>
            )}
            {member.specialties && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-blue-200 flex-shrink-0" />
                  <span className="text-blue-100 font-semibold text-sm uppercase tracking-wide">Specialties</span>
                </div>
                <p className="text-blue-50 text-sm leading-relaxed pl-6">{member.specialties}</p>
              </div>
            )}
            {member.bio && (
              <div>
                <p className="text-blue-50 text-sm leading-relaxed border-t border-blue-400/30 pt-4">{member.bio}</p>
              </div>
            )}
            {!member.qualifications && !member.specialties && !member.bio && (
              <p className="text-blue-200 text-sm italic">More information coming soon.</p>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <div className="bg-white/10 rounded-full px-3 py-1 flex items-center gap-1">
              <RotateCcw className="w-3 h-3 text-blue-200" />
              <span className="text-blue-200 text-xs">Tap to flip back</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const sortedMembers = [...teamMembers].sort((a, b) => a.order - b.order)

export default function TeamClient() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Meet Our Team</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">AHPRA registered physiotherapists delivering expert in-home care across Tasmania.</p>
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
            <div key={title} className="bg-blue-50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-10 text-white text-center mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['AHPRA Registered', '15+ Years Experience', 'Evidence-Based Care', 'DVA Approved'].map((item) => (
              <div key={item}><p className="font-bold text-lg">✓</p><p className="text-blue-100 text-sm">{item}</p></div>
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
              <FlipCard key={member.id} member={member} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 italic">Team profiles coming soon.</p>
        )}
      </div>
    </div>
  )
}

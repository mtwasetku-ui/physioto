'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Phone, Calendar, CheckCircle, Star, MapPin, Clock, Shield, Award, ChevronRight } from 'lucide-react'
import pb from '@/lib/pocketbaseClient'

interface Service { id: string; name: string; description: string }
interface Testimonial { id: string; client_name: string; review_text: string; rating: number; service_type?: string }

const servicePhotos: Record<string, string> = {
  'musculoskeletal': '/image/blog/neck-pain-cervicogenic-headache-home-physiotherapy.jpg',
  'post-surgery': '/image/blog/hip-fracture-rehabilitation-home-physiotherapy.jpg',
  'falls': '/image/blog/falls-prevention-home-physiotherapy.jpg',
  'neurological': '/image/blog/neck-pain-cervicogenic-headache-home-physiotherapy.jpg',
  'aged': '/image/blog/hip-fracture-rehabilitation-home-physiotherapy.jpg',
  'equipment': '/image/blog/falls-prevention-home-physiotherapy.jpg',
  'default': '/image/blog/neck-pain-cervicogenic-headache-home-physiotherapy.jpg',
}

const getServicePhoto = (name: string) => {
  const lower = name.toLowerCase()
  for (const [key, url] of Object.entries(servicePhotos)) {
    if (lower.includes(key)) return url
  }
  return servicePhotos['default']
}

const fallbackServices = [
  { id: '1', name: 'Musculoskeletal Pain', description: 'Back, neck, hip, shoulder and joint pain treated with hands-on manual therapy and targeted exercise, adapted to your home environment.' },
  { id: '2', name: 'Post-Surgery Rehabilitation', description: "Expert recovery support following joint replacements, fractures, and orthopaedic surgery — progressing you safely toward full independence." },
  { id: '3', name: 'Falls Prevention', description: 'Comprehensive balance and strength assessment in your own home, followed by a structured program designed to meaningfully reduce falls risk.' },
]

const stats = [
  { value: '15+', label: 'Years of Experience' },
  { value: 'TAS', label: 'Statewide Service' },
  { value: 'Same-week', label: 'Appointments' },
  { value: 'AHPRA', label: 'Registered Team' },
]

const trustBadges = ['No GP Referral Required','AHPRA Registered Team','Specialist Physiotherapists','Private Health Rebates','NDIS (Self & Plan Managed)','DVA Welcome','Medicare Care Plans']

const conditions = [
  { emoji: '🧠', label: 'Neurological Rehab' },
  { emoji: '👴', label: 'Aged Care & Mobility' },
  { emoji: '🫀', label: 'Chronic Pain' },
  { emoji: '🏃', label: 'Equipment Prescription' },
  { emoji: '💊', label: 'Osteoporosis' },
  { emoji: '🦶', label: 'Foot & Ankle' },
  { emoji: '💼', label: 'Work Injuries' },
  { emoji: '🤕', label: 'Headaches & Migraines' },
]

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sd = await pb.collection('services').getFullList({ sort: 'order', $autoCancel: false } as any)
        setServices((sd as any[]).slice(0, 3))
        const td = await pb.collection('testimonials').getFullList({ filter: 'featured = true', sort: '-created', $autoCancel: false } as any)
        setTestimonials((td as any[]).slice(0, 3))
      } catch {
        setServices(fallbackServices as any)
      }
    }
    fetchData()
  }, [])

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
    <div className="min-h-screen overflow-x-hidden">

      {/* HERO */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0">
          <Image src="/image/blog/mobile-physiotherapy-home-visits.jpg" alt="Physiotherapy at home" fill className="object-cover" priority />
          <div className="absolute inset-0 hero-fade" />
        </div>
        <div className="absolute inset-0 dots text-white/5 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full pt-32 pb-56 md:py-0">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-cyan-300 text-xs font-semibold tracking-widest uppercase">Tasmania-Wide Service</span>
            </div>
            <h1 className="serif text-5xl md:text-6xl lg:text-[4.5rem] text-white mb-6 leading-[1.1]">
              Physiotherapy<br /><span className="italic text-cyan-300">in your home.</span>
            </h1>
            <p className="text-slate-200 text-lg md:text-xl mb-8 max-w-xl leading-relaxed font-light">
              Our team of AHPRA-registered physiotherapists brings expert, hands-on care directly to your door — whether you're in Hobart, Launceston, or anywhere across Tasmania.
            </p>
            <div className="flex flex-wrap gap-2 mb-10">
              {trustBadges.map((b) => (
                <span key={b} className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/90 border border-white/20 rounded-full px-3 py-1 text-xs font-medium">
                  <CheckCircle className="w-3 h-3 text-cyan-400" />{b}
                </span>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/booking">
                <button className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-7 py-4 rounded-xl text-base transition-all shadow-lg shadow-cyan-500/30 hover:-translate-y-0.5">
                  <Calendar className="w-4 h-4" /> Book an Appointment
                </button>
              </Link>
              <a href="tel:1300433233">
                <button className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/30 font-medium px-7 py-4 rounded-xl text-base transition-all">
                  <Phone className="w-4 h-4" /> 1300 433 233
                </button>
              </a>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/96 backdrop-blur-md border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-200">
            {stats.map(({ value, label }) => (
              <div key={label} className="py-5 px-6 text-center">
                <div className="serif font-bold text-2xl text-cyan-700 mb-0.5">{value}</div>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" ref={setRef('how') as any} className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className={`text-center mb-14 fade-up ${vis('how') ? 'in' : ''}`}>
            <div className="divider mx-auto" />
            <p className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="serif text-4xl md:text-5xl text-slate-900 mb-4">Expert care, <span className="italic">at your door</span></h2>
            <p className="text-slate-500 text-lg max-w-lg mx-auto">Getting started is straightforward — we handle the complexity so you can focus on recovering.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: '01', icon: Phone, title: 'Get in Touch', desc: "Call 1300 433 233 or submit a booking request. We'll have a quick conversation about what you're dealing with and find a time that suits you — usually within the same week." },
              { n: '02', icon: MapPin, title: 'We Come to You', desc: 'Your physiotherapist arrives at your home, aged care facility, or workplace — fully equipped to assess and begin treatment at your first visit. No waiting rooms, no parking, no travel stress.' },
              { n: '03', icon: ArrowRight, title: 'Recover & Thrive', desc: "You'll receive a personalised plan designed around your home, your goals, and your life — not a generic protocol. We review and adapt it as you improve." },
            ].map(({ n, icon: Icon, title, desc }, i) => (
              <div key={title} className={`bg-slate-50 rounded-2xl p-8 card-lift fade-up d${i+1} ${vis('how') ? 'in' : ''}`}>
                <span className="serif text-5xl font-bold text-cyan-100 block mb-4" style={{lineHeight:1}}>{n}</span>
                <div className="w-11 h-11 bg-cyan-600 rounded-xl flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" ref={setRef('about') as any} className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 dots text-white/5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className={`fade-up ${vis('about') ? 'in' : ''}`}>
              <div className="divider" />
              <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3">A Team Built for Excellence</p>
              <h2 className="serif text-4xl md:text-5xl text-white mb-6 leading-tight">
                Specialist care,<br /><span className="italic text-cyan-300">where you live.</span>
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-5">
                Physio to Home brings together a team of highly experienced, AHPRA-registered physiotherapists with extensive clinical backgrounds across hospital, rehabilitation, aged care, and community settings in Australia and internationally — giving our team a depth of expertise rarely found in a home-visit service.
              </p>
              <p className="text-slate-400 leading-relaxed mb-8">
                We cover musculoskeletal and orthopaedic rehabilitation, neurological conditions, aged care, NDIS, falls prevention, chronic pain, and post-surgery recovery. Our team includes a specialist in cervicogenic dizziness — one of the most commonly misdiagnosed conditions in older adults — and practitioners with specific expertise in stroke, Parkinson&apos;s disease, and complex pain management. Every treatment plan is built around your real daily environment.
              </p>
              <div className="flex flex-wrap gap-2">
                {['All AHPRA Registered','Extensive Clinical Experience','Specialist Expertise','Evidence-Based Practice'].map((b) => (
                  <span key={b} className="inline-flex items-center gap-1.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded-full px-3 py-1.5 text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />{b}
                  </span>
                ))}
              </div>
            </div>
            <div className={`grid grid-cols-2 gap-4 fade-up d2 ${vis('about') ? 'in' : ''}`}>
              {[
                { Icon: Award, title: 'All AHPRA Registered', desc: 'Every member of our team is fully registered and regulated by the Australian Health Practitioner Regulation Agency' },
                { Icon: Clock, title: 'Same-Week Appointments', desc: 'Fast access to the right clinician — often within the same week of your first call' },
                { Icon: MapPin, title: 'Across Tasmania', desc: 'Serving communities throughout Tasmania, from the north to the south' },
                { Icon: Shield, title: 'Fully Insured', desc: 'Comprehensive professional indemnity & public liability' },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h4 className="text-white font-semibold text-sm mb-1">{title}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES — photo cards */}
      <section id="services" ref={setRef('services') as any} className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className={`mb-14 fade-up ${vis('services') ? 'in' : ''}`}>
            <div className="divider" />
            <p className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-3">What Our Team Treats</p>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <h2 className="serif text-4xl md:text-5xl text-slate-900">Services <span className="italic">built around you</span></h2>
              <Link href="/services" className="inline-flex items-center gap-1.5 text-cyan-600 font-semibold hover:text-cyan-700 transition-colors shrink-0 text-sm">
                View All Services <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {(services.length > 0 ? services : fallbackServices).map((s, i) => (
              <Link
                key={s.id}
                href="/services"
                className={`service-card group relative rounded-2xl overflow-hidden h-80 block card-lift fade-up d${i+1} ${vis('services') ? 'in' : ''}`}
              >
                <img
                  src={getServicePhoto(s.name)}
                  alt={s.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 service-card-overlay" />
                <div className="absolute inset-0 p-7 flex flex-col justify-end">
                  <h3 className="text-xl font-bold text-white mb-2">{s.name}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4 line-clamp-2">{s.description}</p>
                  <span className="inline-flex items-center gap-1.5 text-cyan-300 font-semibold text-sm group-hover:gap-3 transition-all">
                    Learn more <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className={`bg-gradient-to-br from-slate-50 to-cyan-50/40 rounded-2xl p-7 border border-slate-100 fade-up ${vis('services') ? 'in' : ''}`}>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">We also help with</p>
            <div className="flex flex-wrap gap-2">
              {conditions.map(({ emoji, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm text-slate-700 font-medium shadow-sm">
                  {emoji} {label}
                </span>
              ))}
              <span className="inline-flex items-center bg-cyan-600 text-white rounded-full px-4 py-2 text-sm font-medium">+ many more</span>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section id="testimonials" ref={setRef('testimonials') as any} className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className={`text-center mb-14 fade-up ${vis('testimonials') ? 'in' : ''}`}>
              <div className="divider mx-auto" />
              <p className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-3">Client Stories</p>
              <h2 className="serif text-4xl md:text-5xl text-slate-900">What our clients <span className="italic">say</span></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div key={t.id} className={`bg-white rounded-2xl p-8 border border-slate-100 shadow-sm card-lift fade-up d${i+1} ${vis('testimonials') ? 'in' : ''}`}>
                  <div className="serif text-6xl text-cyan-400 opacity-20 leading-none mb-1">"</div>
                  <div className="flex gap-0.5 mb-4">
                    {[1,2,3,4,5].map((s) => <Star key={s} className={`w-4 h-4 ${s <= (t.rating||5) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />)}
                  </div>
                  <p className="text-slate-600 leading-relaxed italic text-sm mb-6">{t.review_text}</p>
                  <div className="border-t border-slate-100 pt-4">
                    <p className="font-semibold text-slate-900 text-sm">{t.client_name}</p>
                    {t.service_type && <p className="text-cyan-600 text-xs mt-0.5">{t.service_type}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FUNDING */}
      <section id="funding" ref={setRef('funding') as any} className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className={`text-center mb-10 fade-up ${vis('funding') ? 'in' : ''}`}>
            <p className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-3">Payments & Funding</p>
            <h2 className="serif text-3xl md:text-4xl text-slate-900 mb-3">Multiple ways to access care</h2>
            <p className="text-slate-500 max-w-md mx-auto text-sm">We work with a range of funding options so accessing quality physiotherapy is as simple as possible.</p>
          </div>
          <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 fade-up ${vis('funding') ? 'in' : ''}`}>
            {[{e:'🏠',l:'My Aged Care',s:'Home care packages'},{e:'💳',l:'Private Health',s:'On-the-spot rebates'},{e:'♿',l:'NDIS',s:'Self & plan managed only'},{e:'🎖️',l:'DVA',s:'Department of Veterans Affairs'},{e:'🏥',l:'Medicare',s:'Chronic Disease Care Plans'}].map(({e,l,s}) => (
              <div key={l} className="bg-gradient-to-br from-cyan-50 to-slate-50 rounded-2xl p-6 text-center border border-cyan-100 card-lift">
                <div className="text-3xl mb-3">{e}</div>
                <p className="font-bold text-slate-900 text-sm mb-1">{l}</p>
                <p className="text-slate-500 text-xs">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 dots text-white/5 pointer-events-none" />
        <div className="absolute -top-20 right-0 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-20 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-4">Get Started Today</p>
          <h2 className="serif text-4xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight">
            The right team,<br /><span className="italic text-cyan-300">at your door.</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10 leading-relaxed">
            Our team of specialist physiotherapists is ready to deliver the quality of care you deserve — in the comfort of your own home. No GP referral needed. Same-week appointments available across Tasmania.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking">
              <button className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-bold px-8 py-4 rounded-xl text-base transition-all shadow-lg shadow-cyan-500/30 hover:-translate-y-0.5">
                <Calendar className="w-4 h-4" /> Book Your Appointment
              </button>
            </Link>
            <a href="tel:1300433233">
              <button className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium px-8 py-4 rounded-xl text-base transition-all">
                <Phone className="w-4 h-4" /> 1300 433 233
              </button>
            </a>
          </div>
          <p className="text-slate-600 text-xs mt-8">Launceston &middot; Hobart &middot; North West Coast &middot; Regional Tasmania</p>
        </div>
      </section>
    </div>
  )
}

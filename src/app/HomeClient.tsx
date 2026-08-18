'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Phone,
  Calendar,
  CheckCircle,
  Star,
  MapPin,
  Clock,
  Shield,
  Award,
  ChevronRight,
  Plus,
  Home,
  CreditCard,
  Accessibility,
  Medal,
  Cross,
} from 'lucide-react'
import pb from '@/lib/pocketbaseClient'

interface Service {
  id: string
  name: string
  description: string
}

interface Testimonial {
  id: string
  client_name: string
  review_text: string
  rating: number
  service_type?: string
}

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
  {
    id: '1',
    name: 'Back, Neck & Joint Pain',
    description:
      'Back, neck, hip, shoulder and joint pain treated with hands-on manual therapy and targeted exercise, adapted to your home environment.',
  },
  {
    id: '2',
    name: 'Post-Surgery Rehabilitation',
    description:
      'Expert recovery support following joint replacements, fractures, and orthopaedic surgery — progressing you safely toward full independence.',
  },
  {
    id: '3',
    name: 'Falls Prevention',
    description:
      'Comprehensive balance and strength assessment in your own home, followed by a structured program designed to meaningfully reduce falls risk.',
  },
]

const stats = [
  { value: '15+', label: 'Years of Experience' },
  { value: 'TAS', label: 'Tasmania-Wide Service' },
  { value: 'Same-week', label: 'Appointments' },
  { value: 'AHPRA', label: 'Registered Team' },
]

const trustBadges = [
  'No GP Referral Required',
  'AHPRA Registered Team',
  'Specialist Physiotherapists',
  'Private Health Rebates',
  'NDIS (Self & Plan Managed)',
  'DVA Welcome',
  'Medicare Care Plans',
]

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

const funding = [
  {
    Icon: Home,
    label: 'My Aged Care',
    sub: 'Home care packages',
    tint: 'bg-[#FFF3D3]',
  },
  {
    Icon: CreditCard,
    label: 'Private Health',
    sub: 'On-the-spot rebates',
    tint: 'bg-[#E7F2E7]',
  },
  {
    Icon: Accessibility,
    label: 'NDIS',
    sub: 'Self & plan managed only',
    tint: 'bg-[#FDE9E3]',
  },
  {
    Icon: Medal,
    label: 'DVA',
    sub: "Department of Veterans' Affairs",
    tint: 'bg-[#F2EFE4]',
  },
  {
    Icon: Cross,
    label: 'Medicare',
    sub: 'Chronic Disease Care Plans',
    tint: 'bg-[#E7F2E7]',
  },
]

const Scribble = ({ className = '' }: { className?: string }) => (
  <svg
    className={`scribble absolute -bottom-3 left-0 w-full ${className}`}
    viewBox="0 0 300 12"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M3 9 C 60 2, 150 11, 297 4"
      stroke="#FF5638"
      strokeWidth="5"
      strokeLinecap="round"
    />
  </svg>
)

export default function HomeClient() {
  const [services, setServices] = useState<Service[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sd = await pb.collection('services').getFullList({
          sort: 'order',
          $autoCancel: false,
        } as any)

        setServices((sd as any[]).slice(0, 3))

        const td = await pb.collection('testimonials').getFullList({
          filter: 'featured = true',
          sort: '-created',
          $autoCancel: false,
        } as any)

        setTestimonials((td as any[]).slice(0, 3))
      } catch {
        setServices(fallbackServices as any)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisibleSections(
              (p) => new Set(Array.from(p).concat(e.target.id))
            )
          }
        }),
      { threshold: 0.1 }
    )

    Object.values(sectionRefs.current).forEach((r) => {
      if (r) observer.observe(r)
    })

    return () => observer.disconnect()
  }, [testimonials.length])

  const setRef =
    (id: string) =>
    (el: HTMLElement | null) => {
      sectionRefs.current[id] = el
    }

  const vis = (id: string) => visibleSections.has(id)

  return (
    <div className="font-body min-h-screen overflow-x-hidden bg-[#FBF8F1] text-[#12241D]">
      <div className="pth-grain" aria-hidden="true" />

      {/* HERO */}
      <section
        id="hero"
        ref={setRef('hero') as any}
        className="relative flex min-h-[92vh] items-center overflow-hidden"
      >
        <div className="absolute inset-0">
          <Image
            src="/image/blog/mobile-physiotherapy-home-visits.jpg"
            alt="Mobile physiotherapy home visits across Tasmania"
            fill
            priority
            sizes="100vw"
            quality={75}
            className="kenburns object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#0A231B]/95 via-[#0A231B]/75 to-[#0A231B]/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A231B]/85 via-transparent to-[#0A231B]/20" />
        </div>

        <div className="dots pointer-events-none absolute inset-0 text-white/5" />

        {/* availability pill */}
        <div className="absolute right-8 top-28 z-10 hidden items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm lg:flex">
          <span className="pulse-ring inline-block h-2.5 w-2.5 rounded-full bg-[#4E9B72]" />
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/90">
            Same-week visits available
          </span>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-24 pt-32 lg:px-8">
          <div className="max-w-4xl">
            <div
              className={`fade-up ${
                vis('hero') ? 'in' : ''
              } mb-7 flex items-center gap-2`}
            >
              <MapPin className="h-4 w-4 text-[#FFC53D]" />

              <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#FFC53D]">
                Tasmania-Wide Mobile Physiotherapy
              </span>
            </div>

            <h1
              className={`fade-up d1 ${
                vis('hero') ? 'in' : ''
              } font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-white md:text-6xl lg:text-[4.4rem]`}
            >
              Tasmania-wide physiotherapy

              <span className="relative mt-2 block italic text-[#FFC53D]">
                in your home.
                <Scribble />
              </span>
            </h1>

            <p
              className={`fade-up d2 ${
                vis('hero') ? 'in' : ''
              } mt-8 max-w-2xl text-lg font-light leading-relaxed text-slate-200 md:text-xl`}
            >
              Our team of{' '}
              <strong className="font-semibold text-white">
                AHPRA-registered physiotherapists
              </strong>{' '}
              brings expert, hands-on care directly to your door across
              Tasmania. We provide personalised assessment, treatment and
              rehabilitation in the comfort of your home, aged care facility
              or workplace.
            </p>

            <div
              className={`fade-up d3 ${
                vis('hero') ? 'in' : ''
              } mt-8 flex flex-wrap gap-2`}
            >
              {trustBadges.slice(0, 4).map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm transition-colors hover:border-[#FFC53D]/60"
                >
                  <CheckCircle className="h-3.5 w-3.5 text-[#4E9B72]" />
                  {b}
                </span>
              ))}
            </div>

            <div
              className={`fade-up d4 ${
                vis('hero') ? 'in' : ''
              } mt-10 flex flex-col gap-3 sm:flex-row`}
            >
              <Link href="/booking">
                <button className="sheen inline-flex items-center gap-2 rounded-xl bg-[#FF5638] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#FF5638]/40 transition-all hover:-translate-y-0.5 hover:bg-[#E8482B]">
                  <Calendar className="h-4 w-4" />
                  Book an Appointment
                </button>
              </Link>

              <a href="tel:1300433233">
                <button className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/20">
                  <Phone className="h-4 w-4 text-[#FFC53D]" />
                  1300 433 233
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* STATS — overlapping card */}
      <div className="relative z-20 mx-auto -mt-14 max-w-7xl px-6 lg:px-8">
        <div className="fade-up in grid grid-cols-2 divide-x divide-[#12241D]/10 overflow-hidden rounded-2xl border border-[#12241D]/10 bg-white shadow-[0_24px_60px_-24px_rgba(10,35,27,0.35)] md:grid-cols-4">
          {stats.map(({ value, label }, i) => (
            <div
              key={label}
              className={`group px-6 py-6 text-center transition-colors hover:bg-[#FBF8F1] ${
                i >= 2
                  ? 'border-t border-[#12241D]/10 md:border-t-0'
                  : ''
              }`}
            >
              <div className="font-display text-3xl font-extrabold tracking-tight text-[#FF5638] transition-transform duration-300 group-hover:-translate-y-0.5">
                {value}
              </div>

              <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TRUST MARQUEE */}
      <div className="marquee mt-14 overflow-hidden border-y border-[#4E9B72]/20 bg-[#0E2C22] py-4">
        <div className="marquee-track flex w-max items-center">
          {[...trustBadges, ...trustBadges].map((b, i) => (
            <span key={i} className="flex items-center">
              <span className="font-display whitespace-nowrap px-8 text-sm font-bold uppercase tracking-[0.2em] text-[#C7D8CC]">
                {b}
              </span>

              <Plus
                className="h-4 w-4 shrink-0 text-[#FF5638]"
                strokeWidth={3}
              />
            </span>
          ))}
        </div>
      </div>

      {/* WHY CHOOSE US — editorial index */}
      <section
        id="why"
        ref={setRef('why') as any}
        className="border-b border-[#12241D]/10 bg-white py-24"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div
            className={`fade-up ${
              vis('why') ? 'in' : ''
            } mb-14 max-w-2xl`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FF5638]">
              Why choose us
            </p>

            <h2 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-[#12241D] md:text-5xl">
              Why choose{' '}
              <span className="italic text-[#FF5638]">
                Physio to Home
              </span>
            </h2>
          </div>

          <div className="border-b border-[#12241D]/10">
            {[
              {
                Icon: Award,
                title: 'Personalised',
                desc: 'One-on-one attention and an individualised care plan, built around your home, your goals, and your life — not a generic protocol.',
              },
              {
                Icon: Shield,
                title: 'Dedicated',
                desc: "You'll work with the same clinical team throughout your recovery, building trust and continuity as you build strength.",
              },
              {
                Icon: CheckCircle,
                title: 'Expert',
                desc: 'Every clinician is AHPRA-registered and experienced, bringing hospital, rehabilitation, and community-care expertise to your door.',
              },
            ].map(({ Icon, title, desc }, i) => (
              <div
                key={title}
                className={`fade-up d${i + 1} ${
                  vis('why') ? 'in' : ''
                } group grid grid-cols-[auto_1fr] items-start gap-6 border-t border-[#12241D]/10 py-9 md:grid-cols-[72px_1fr_auto] md:gap-10`}
              >
                <span className="font-display text-lg font-extrabold text-[#FF5638]">
                  0{i + 1}
                </span>

                <div>
                  <h3 className="font-display text-2xl font-bold tracking-tight text-[#12241D] transition-all duration-300 group-hover:translate-x-1.5 group-hover:text-[#FF5638] md:text-3xl">
                    {title}
                  </h3>

                  <p className="mt-2 max-w-2xl leading-relaxed text-slate-500">
                    {desc}
                  </p>
                </div>

                <div className="col-start-2 flex h-14 w-14 items-center justify-center rounded-xl bg-[#F2EFE4] text-[#0E2C22] transition-all duration-300 group-hover:rotate-6 group-hover:bg-[#FF5638] group-hover:text-white md:col-start-3">
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — the visit route */}
      <section
        id="how"
        ref={setRef('how') as any}
        className="relative overflow-hidden bg-[#FBF8F1] py-24"
      >
        <div className="dots pointer-events-none absolute inset-0 text-[#0E2C22]/5" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div
            className={`fade-up ${
              vis('how') ? 'in' : ''
            } mb-16 max-w-2xl`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FF5638]">
              Simple process
            </p>

            <h2 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-[#12241D] md:text-5xl">
              Expert care,{' '}
              <span className="italic text-[#FF5638]">
                at your door
              </span>
            </h2>

            <p className="mt-4 text-lg text-slate-500">
              Getting started is straightforward — we handle the complexity
              so you can focus on recovering.
            </p>
          </div>

          <div className="relative">
            <div
              className="absolute left-[18%] right-[18%] top-12 hidden border-t-2 border-dashed border-[#FF5638]/35 md:block"
              aria-hidden="true"
            />

            <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
              {[
                {
                  n: '01',
                  icon: Phone,
                  title: 'Get in Touch',
                  desc: "Call 1300 433 233 or submit a booking request. We'll have a quick conversation about what you're dealing with and find a time that suits you — usually within the same week.",
                },
                {
                  n: '02',
                  icon: MapPin,
                  title: 'We Come to You',
                  desc: 'Your physiotherapist arrives at your home, aged care facility, or workplace — fully equipped to assess and begin treatment at your first visit. No waiting rooms, no parking, no travel stress.',
                },
                {
                  n: '03',
                  icon: ArrowRight,
                  title: 'Recover & Thrive',
                  desc: "You'll receive a personalised plan designed around your home, your goals, and your life — not a generic protocol. We review and adapt it as you improve.",
                },
              ].map(({ n, icon: Icon, title, desc }, i) => (
                <div
                  key={title}
                  className={`fade-up d${i + 1} ${
                    vis('how') ? 'in' : ''
                  } group text-center md:text-left`}
                >
                  <div className="relative z-10 mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#12241D]/10 bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_18px_36px_-16px_rgba(255,86,56,0.45)] md:mx-0">
                    <span className="text-outline font-display text-4xl font-extrabold">
                      {n}
                    </span>
                  </div>

                  <div className="mt-6 flex items-center justify-center gap-3 md:justify-start">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E2C22] text-[#FFC53D] transition-colors duration-300 group-hover:bg-[#FF5638] group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>

                    <h3 className="font-display text-xl font-bold text-[#12241D]">
                      {title}
                    </h3>
                  </div>

                  <p className="mt-3 leading-relaxed text-slate-500">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        ref={setRef('about') as any}
        className="relative overflow-hidden bg-[#0E2C22] py-24"
      >
        <div className="dots pointer-events-none absolute inset-0 text-white/5" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div
              className={`fade-up ${
                vis('about') ? 'in' : ''
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FFC53D]">
                A team built for excellence
              </p>

              <h2 className="font-display mt-3 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
                Specialist care,
                <br />
                <span className="italic text-[#FF5638]">
                  where you live.
                </span>
              </h2>

              <p className="mt-6 text-lg leading-relaxed text-slate-300">
                Physio to Home brings together a team of highly experienced,
                AHPRA-registered physiotherapists with extensive clinical
                backgrounds across hospital, rehabilitation, aged care, and
                community settings in Australia and internationally — giving
                our team a depth of expertise rarely found in a home-visit
                service.
              </p>

              <p className="mt-4 leading-relaxed text-slate-400">
                We cover back, neck and joint pain, orthopaedic rehabilitation,
                neurological conditions, aged care, NDIS, falls prevention,
                chronic pain, and post-surgery recovery. Our team includes
                practitioners with specific expertise in cervicogenic
                dizziness, stroke, Parkinson&apos;s disease, and complex pain
                management. Every treatment plan is built around your real
                daily environment.
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                {[
                  'All AHPRA Registered',
                  'Extensive Clinical Experience',
                  'Specialist Expertise',
                  'Evidence-Based Practice',
                ].map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#4E9B72]/30 bg-[#4E9B72]/10 px-3.5 py-1.5 text-xs font-semibold text-[#7FB69B] transition-colors hover:border-[#FFC53D]/50 hover:text-[#FFC53D]"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    {b}
                  </span>
                ))}
              </div>
            </div>

            <div
              className={`fade-up d2 ${
                vis('about') ? 'in' : ''
              } grid grid-cols-2 gap-4`}
            >
              {[
                {
                  Icon: Award,
                  title: 'All AHPRA Registered',
                  desc: 'Every member of our team is fully registered and regulated by the Australian Health Practitioner Regulation Agency',
                },
                {
                  Icon: Clock,
                  title: 'Same-Week Appointments',
                  desc: 'Fast access to the right clinician — often within the same week of your first call',
                },
                {
                  Icon: MapPin,
                  title: 'Tasmania-Wide Service',
                  desc: 'Mobile physiotherapy delivered to homes, aged care facilities and workplaces across Tasmania',
                },
                {
                  Icon: Shield,
                  title: 'Fully Insured',
                  desc: 'Comprehensive professional indemnity & public liability',
                },
              ].map(({ Icon, title, desc }, i) => (
                <div
                  key={title}
                  className={`fade-up d${i + 1} ${
                    vis('about') ? 'in' : ''
                  } group rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#FF5638]/50 hover:bg-white/[0.08]`}
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF5638]/15 text-[#FF8A70] transition-colors duration-300 group-hover:bg-[#FF5638] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h4 className="text-sm font-bold text-white">
                    {title}
                  </h4>

                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES — photo cards */}
      <section
        id="services"
        ref={setRef('services') as any}
        className="bg-white py-24"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div
            className={`fade-up ${
              vis('services') ? 'in' : ''
            } mb-14`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FF5638]">
              What our team treats
            </p>

            <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <h2 className="font-display text-4xl font-extrabold tracking-tight text-[#12241D] md:text-5xl">
                Services{' '}
                <span className="italic text-[#FF5638]">
                  built around you
                </span>
              </h2>

              <Link
                href="/services"
                className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-[#FF5638] transition-colors hover:text-[#E8482B]"
              >
                View All Services
                <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(services.length > 0 ? services : fallbackServices).map(
              (s, i) => (
                <Link
                  key={s.id}
                  href="/services"
                  className={`fade-up d${Math.min(i + 1, 5)} ${
                    vis('services') ? 'in' : ''
                  } card-lift group relative block h-[420px] overflow-hidden rounded-2xl`}
                >
                  <Image
                    src={getServicePhoto(s.name)}
                    alt={`${s.name} home physiotherapy`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A231B] via-[#0A231B]/40 to-transparent" />

                  <span className="font-display absolute left-5 top-5 rounded-full bg-[#FFC53D] px-3.5 py-1 text-sm font-extrabold text-[#0E2C22]">
                    0{i + 1}
                  </span>

                  <div className="absolute inset-0 flex flex-col justify-end p-7">
                    <h3 className="font-display text-2xl font-bold tracking-tight text-white">
                      {s.name}
                    </h3>

                    <p className="mb-4 mt-2 line-clamp-2 text-sm leading-relaxed text-slate-300">
                      {s.description}
                    </p>

                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#FFC53D] transition-all duration-300 group-hover:gap-3.5">
                      Learn more
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              )
            )}
          </div>

          <div
            className={`fade-up ${
              vis('services') ? 'in' : ''
            } rounded-2xl border border-[#12241D]/10 bg-[#F2EFE4] p-7`}
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
              We also help with
            </p>

            <div className="flex flex-wrap gap-2">
              {conditions.map(({ emoji, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#12241D]/10 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FF5638]/50 hover:shadow"
                >
                  {emoji} {label}
                </span>
              ))}

              <span className="inline-flex items-center rounded-full bg-[#0E2C22] px-4 py-2 text-sm font-bold text-white">
                + many more
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section
          id="testimonials"
          ref={setRef('testimonials') as any}
          className="bg-[#F2EFE4] py-24"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div
              className={`fade-up ${
                vis('testimonials') ? 'in' : ''
              } mb-14 text-center`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FF5638]">
                Client stories
              </p>

              <h2 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-[#12241D] md:text-5xl">
                What our clients{' '}
                <span className="italic text-[#FF5638]">
                  say
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <div
                  key={t.id}
                  className={`fade-up d${i + 1} ${
                    vis('testimonials') ? 'in' : ''
                  } card-lift rounded-2xl border border-[#12241D]/10 bg-white p-8 shadow-sm`}
                >
                  <div className="font-display mb-1 text-6xl leading-none text-[#FF5638]/25">
                    &ldquo;
                  </div>

                  <div className="mb-4 flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= (t.rating || 5)
                            ? 'fill-[#FFC53D] text-[#FFC53D]'
                            : 'text-[#12241D]/15'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="mb-6 text-sm italic leading-relaxed text-slate-600">
                    {t.review_text}
                  </p>

                  <div className="border-t border-[#12241D]/10 pt-4">
                    <p className="text-sm font-bold text-[#12241D]">
                      {t.client_name}
                    </p>

                    {t.service_type && (
                      <p className="mt-0.5 text-xs font-semibold text-[#FF5638]">
                        {t.service_type}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FUNDING */}
      <section
        id="funding"
        ref={setRef('funding') as any}
        className="border-t border-[#12241D]/10 bg-white py-24"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div
            className={`fade-up ${
              vis('funding') ? 'in' : ''
            } mb-12 text-center`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FF5638]">
              Payments & funding
            </p>

            <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[#12241D] md:text-4xl">
              Multiple ways to access care
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm text-slate-500">
              We work with a range of funding options so accessing quality
              physiotherapy is as simple as possible.
            </p>
          </div>

          <div
            className={`fade-up d1 ${
              vis('funding') ? 'in' : ''
            } grid grid-cols-2 gap-4 md:grid-cols-5`}
          >
            {funding.map(({ Icon, label, sub, tint }, i) => (
              <div
                key={label}
                className={`card-lift fade-up d${Math.min(
                  i + 1,
                  5
                )} ${
                  vis('funding') ? 'in' : ''
                } group rounded-xl border border-[#12241D]/10 ${tint} p-6 text-center`}
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#0E2C22] shadow-sm transition-all duration-300 group-hover:-rotate-6 group-hover:bg-[#0E2C22] group-hover:text-[#FFC53D]">
                  <Icon className="h-5 w-5" />
                </div>

                <p className="text-sm font-bold text-[#12241D]">
                  {label}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#0E2C22] py-28">
        <div className="dots pointer-events-none absolute inset-0 text-white/5" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FFC53D]">
            Get started today
          </p>

          <h2 className="font-display mt-4 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            The right team,
            <br />

            <span className="relative inline-block italic text-[#FF5638]">
              at your door.
              <Scribble className="-bottom-2" />
            </span>
          </h2>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-400">
            Our team of specialist physiotherapists is ready to deliver the
            quality of care you deserve — in the comfort of your own home.
            No GP referral needed. Same-week appointments are available across
            Tasmania.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/booking">
              <button className="sheen inline-flex items-center gap-2 rounded-xl bg-[#FF5638] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#FF5638]/40 transition-all hover:-translate-y-0.5 hover:bg-[#E8482B]">
                <Calendar className="h-4 w-4" />
                Book Your Appointment
              </button>
            </Link>

            <a href="tel:1300433233">
              <button className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-8 py-4 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/20">
                <Phone className="h-4 w-4 text-[#FFC53D]" />
                1300 433 233
              </button>
            </a>
          </div>

          <p className="mt-9 text-xs uppercase tracking-[0.22em] text-[#7FB69B]/70">
            Hobart · North West Coast · Northern Tasmania · Southern Tasmania ·
            Regional Tasmania
          </p>
        </div>
      </section>
    </div>
  )
}

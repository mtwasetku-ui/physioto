'use client'

import React, { useState, useEffect } from 'react'
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  FileDown,
  Check,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/form-elements'
import { useToast } from '@/hooks/use-toast'

const FORMSPREE_URL = 'https://formspree.io/f/xgoneqlg'

interface FormData {
  name: string
  email: string
  phone: string
  service: string
  preferredDate: string
  preferredTime: string
  notes: string
}

const SERVICES = [
  'General Physiotherapy',
  'Falls Prevention',
  'Post-Surgery Rehabilitation',
  'Stroke Rehabilitation',
  'Aged Care Physiotherapy',
  'NDIS Physiotherapy',
  'Chronic Pain Management',
  'Other',
]

const TIME_OPTIONS = [
  'No preference',
  'Morning (8am – 12pm)',
  'Afternoon (12pm – 4pm)',
  'Late Afternoon (4pm – 6pm)',
]

const inputCx =
  'h-12 rounded-xl border-[#12241D]/15 bg-white px-4 text-[#12241D] shadow-sm transition-all placeholder:text-slate-400 focus-visible:border-[#FF5638] focus-visible:ring-2 focus-visible:ring-[#FF5638]/20 focus-visible:ring-offset-0'

const selectCx =
  'h-12 w-full rounded-xl border border-[#12241D]/15 bg-white px-4 text-sm text-[#12241D] shadow-sm transition-all focus:outline-none focus:border-[#FF5638] focus:ring-2 focus:ring-[#FF5638]/20'

export default function BookingClient() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    service: '',
    preferredDate: '',
    preferredTime: '',
    notes: '',
  })

  const [errors, setErrors] = useState<Partial<FormData>>({})

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 80)

    return () => clearTimeout(timer)
  }, [])

  const validateForm = () => {
    const e: Partial<FormData> = {}

    if (!formData.name.trim()) {
      e.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      e.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      e.email = 'Email is invalid'
    }

    if (!formData.phone.trim()) {
      e.phone = 'Phone number is required'
    }

    if (!formData.service) {
      e.service = 'Please select a service'
    }

    setErrors(e)

    return Object.keys(e).length === 0
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          _subject: 'New Booking Request — Physio to Home',
        }),
      })

      if (!res.ok) {
        throw new Error('Submission failed')
      }

      toast({
        title: 'Booking Request Sent!',
        description:
          "We'll confirm your appointment by phone or email within one business day.",
      })

      setFormData({
        name: '',
        email: '',
        phone: '',
        service: '',
        preferredDate: '',
        preferredTime: '',
        notes: '',
      })

      setErrors({})
    } catch {
      toast({
        title: 'Submission Failed',
        description:
          'There was an error sending your request. Please try again or call us on 1300 433 233.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const processSteps = [
    {
      number: '01',
      title: 'Submit a Request',
      description:
        'Tell us a little about yourself, your needs and your preferred appointment time.',
    },
    {
      number: '02',
      title: 'We Confirm',
      description:
        'Our team will contact you to discuss your needs and confirm a suitable appointment.',
    },
    {
      number: '03',
      title: 'We Come to You',
      description:
        'Your physiotherapist comes directly to your home at the agreed appointment time.',
    },
    {
      number: '04',
      title: 'Your Treatment Plan',
      description:
        'After your assessment, we develop a personalised plan around your goals and environment.',
    },
  ]

  const contactDetails = [
    {
      Icon: Phone,
      title: 'Phone',
      content: (
        <a
          href="tel:1300433233"
          className="font-medium text-slate-200 transition-colors hover:text-[#FF5638]"
        >
          1300 433 233
        </a>
      ),
      sub: 'Mon–Fri: 8am – 6pm, Sat: 9am – 2pm',
    },
    {
      Icon: Mail,
      title: 'Email',
      content: (
        <a
          href="mailto:info@physiotohome.com"
          className="font-medium text-slate-200 transition-colors hover:text-[#FF5638]"
        >
          info@physiotohome.com
        </a>
      ),
      sub: "We'll respond within 24 hours",
    },
    {
      Icon: MapPin,
      title: 'Location',
      content: (
        <p className="font-medium text-slate-200">
          Tasmania
        </p>
      ),
      sub: 'Serving clients across the state',
    },
    {
      Icon: Clock,
      title: 'Availability',
      content: (
        <p className="font-medium text-slate-200">
          Mon–Sat: 9am – 5pm
        </p>
      ),
      sub: 'After-hours appointments available on request',
    },
  ]

  return (
    <div className="font-body min-h-screen overflow-x-hidden bg-[#FBF8F1] text-[#12241D]">
      {/* =====================================================
          HERO — SOLID GREEN
      ===================================================== */}
      <section className="relative overflow-hidden bg-[#0E2C22] py-24 text-white md:py-32">
        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center lg:px-8">
          <p
            className={`fade-up ${
              visible ? 'in' : ''
            } text-xs font-bold uppercase tracking-[0.28em] text-[#FFC53D]`}
          >
            Get Started Today
          </p>

          <h1
            className={`fade-up d1 ${
              visible ? 'in' : ''
            } font-display mx-auto mt-4 max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl`}
          >
            Physiotherapy{' '}
            <span className="italic text-[#FF5638]">
              that comes to you
            </span>
          </h1>

          <p
            className={`fade-up d2 ${
              visible ? 'in' : ''
            } mx-auto mt-7 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg`}
          >
            Professional physiotherapy delivered directly to your
            home across Tasmania — personalised care without the
            stress of travelling to a clinic.
          </p>

          <div
            className={`fade-up d3 ${
              visible ? 'in' : ''
            } mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row`}
          >
            <a
              href="#appointment"
              className="sheen inline-flex items-center gap-2 rounded-xl bg-[#FF5638] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#FF5638]/30 transition-all hover:-translate-y-1 hover:bg-[#E8482B]"
            >
              Request an Appointment
              <ArrowRight className="h-4 w-4" />
            </a>

            <a
              href="tel:1300433233"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:-translate-y-1 hover:bg-white/10"
            >
              <Phone className="h-4 w-4" />
              1300 433 233
            </a>
          </div>
        </div>
      </section>

      {/* =====================================================
          STATS
      ===================================================== */}
      <div className="relative z-20 mx-auto -mt-10 max-w-5xl px-6 lg:px-8">
        <div
          className={`fade-up ${
            visible ? 'in' : ''
          } grid overflow-hidden rounded-2xl border border-[#12241D]/10 bg-white shadow-[0_24px_60px_-24px_rgba(10,35,27,0.35)] sm:grid-cols-3`}
        >
          {[
            {
              value: '15+',
              label: 'Years of experience',
            },
            {
              value: '1-on-1',
              label: 'Personalised care',
            },
            {
              value: 'Tasmania',
              label: 'State-wide service',
            },
          ].map(({ value, label }, index) => (
            <div
              key={label}
              className={`px-6 py-7 text-center transition-colors hover:bg-[#F2EFE4] ${
                index !== 0
                  ? 'border-t border-[#12241D]/10 sm:border-l sm:border-t-0'
                  : ''
              }`}
            >
              <div className="font-display text-2xl font-extrabold tracking-tight text-[#FF5638]">
                {value}
              </div>

              <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div
          className={`fade-up ${
            visible ? 'in' : ''
          } mb-14 text-center`}
        >
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FF5638]">
            Simple Process
          </p>

          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[#12241D] md:text-4xl">
            How It Works
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            Getting started is simple. We take care of the details
            so you can focus on getting better.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step, index) => (
            <div
              key={step.number}
              className={`fade-up d${index + 1} ${
                visible ? 'in' : ''
              } card-lift rounded-2xl border border-[#12241D]/10 bg-white p-7`}
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0E2C22] font-display text-sm font-bold text-[#FFC53D]">
                  {step.number}
                </div>

                <ArrowRight className="h-4 w-4 text-[#FF5638]" />
              </div>

              <h3 className="font-display mb-3 text-lg font-bold text-[#12241D]">
                {step.title}
              </h3>

              <p className="text-sm leading-relaxed text-slate-500">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================
          NDIS
      ===================================================== */}
      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div
          className={`fade-up ${
            visible ? 'in' : ''
          } relative overflow-hidden rounded-2xl bg-[#0E2C22] p-8 text-white md:p-10`}
        >
          <div className="relative z-10 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="flex items-start gap-5">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-white text-[#0E2C22] shadow-sm">
                <FileDown className="h-6 w-6" />
              </div>

              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-[#FFC53D]">
                  NDIS
                </p>

                <h3 className="font-display text-xl font-bold">
                  NDIS Client Intake Form
                </h3>

                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
                  Self-managed or plan-managed NDIS participant?
                  Download and complete our intake form before your
                  appointment.
                </p>
              </div>
            </div>

            <a
              href="/ndis.pdf"
              download
              className="sheen inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-[#FF5638] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#FF5638]/20 transition-all hover:-translate-y-1 hover:bg-[#E8482B]"
            >
              <FileDown className="h-4 w-4" />
              Download Form
            </a>
          </div>
        </div>
      </section>

      {/* =====================================================
          APPOINTMENT SECTION
      ===================================================== */}
      <section
        id="appointment"
        className="relative bg-[#F2EFE4] py-24"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FF5638]">
              Get Started
            </p>

            <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[#12241D] md:text-4xl">
              Request an Appointment
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-slate-500">
              Tell us what you need and when you would prefer to be
              seen. Our team will get back to you to confirm your
              appointment.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            {/* =================================================
                CONTACT
            ================================================= */}
            <div
              className={`fade-up ${
                visible ? 'in' : ''
              }`}
            >
              <div className="rounded-2xl bg-[#0E2C22] p-8 text-white shadow-[0_24px_48px_-20px_rgba(10,35,27,0.35)] md:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#FFC53D]">
                  Contact Us
                </p>

                <h3 className="font-display mt-3 text-2xl font-extrabold">
                  We&apos;re here to help
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  If you&apos;re unsure which service is right for
                  you, simply get in touch. We&apos;re happy to
                  discuss your needs before booking.
                </p>

                <div className="mt-8 space-y-5">
                  {contactDetails.map(
                    ({ Icon, title, content, sub }) => (
                      <div
                        key={title}
                        className="group flex items-start gap-4"
                      >
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#FFC53D] transition-all duration-300 group-hover:bg-[#FF5638] group-hover:text-white">
                          <Icon className="h-5 w-5" />
                        </div>

                        <div>
                          <h4 className="mb-0.5 text-sm font-bold text-white">
                            {title}
                          </h4>

                          <div>{content}</div>

                          <p className="mt-1 text-xs text-slate-400">
                            {sub}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* =================================================
                  WHAT TO EXPECT
              ================================================= */}
              <div className="card-lift mt-6 rounded-2xl border border-[#12241D]/10 bg-white p-8">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#FF5638]">
                  Your Visit
                </p>

                <h3 className="font-display mt-2 text-xl font-bold text-[#12241D]">
                  What to Expect
                </h3>

                <div className="mt-6 space-y-4">
                  {[
                    'We come to you — no travel required',
                    'Initial assessment at your first visit',
                    'Personalised treatment plan',
                    'Treatment tailored to your home environment',
                    'My Aged Care, NDIS and private clients welcome',
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3"
                    >
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#FFC53D] text-[#0E2C22]">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>

                      <span className="text-sm leading-relaxed text-slate-600">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* =================================================
                BOOKING FORM
            ================================================= */}
            <div
              className={`fade-up d1 ${
                visible ? 'in' : ''
              } card-lift rounded-2xl border border-[#12241D]/10 bg-white p-7 shadow-[0_24px_60px_-24px_rgba(10,35,27,0.3)] md:p-10`}
            >
              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#FF5638]">
                  Booking Request
                </p>

                <h3 className="font-display mt-2 text-2xl font-extrabold text-[#12241D]">
                  Tell us about your needs
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Fields marked with * are required.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* FULL NAME */}
                <div>
                  <Label htmlFor="name">
                    Full Name *
                  </Label>

                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Smith"
                    className={`${inputCx} ${
                      errors.name
                        ? 'border-red-500'
                        : ''
                    }`}
                  />

                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* EMAIL */}
                <div>
                  <Label htmlFor="email">
                    Email Address *
                  </Label>

                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className={`${inputCx} ${
                      errors.email
                        ? 'border-red-500'
                        : ''
                    }`}
                  />

                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* PHONE */}
                <div>
                  <Label htmlFor="phone">
                    Phone Number *
                  </Label>

                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0412 345 678"
                    className={`${inputCx} ${
                      errors.phone
                        ? 'border-red-500'
                        : ''
                    }`}
                  />

                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* SERVICE */}
                <div>
                  <Label htmlFor="service">
                    Service Required *
                  </Label>

                  <select
                    id="service"
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    className={`${selectCx} ${
                      errors.service
                        ? 'border-red-500'
                        : ''
                    }`}
                  >
                    <option value="">
                      Select a service...
                    </option>

                    {SERVICES.map((service) => (
                      <option
                        key={service}
                        value={service}
                      >
                        {service}
                      </option>
                    ))}
                  </select>

                  {errors.service && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.service}
                    </p>
                  )}
                </div>

                {/* DATE + TIME */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="preferredDate">
                      Preferred Date
                    </Label>

                    <Input
                      id="preferredDate"
                      name="preferredDate"
                      type="date"
                      value={formData.preferredDate}
                      onChange={handleChange}
                      className={inputCx}
                    />
                  </div>

                  <div>
                    <Label htmlFor="preferredTime">
                      Preferred Time
                    </Label>

                    <select
                      id="preferredTime"
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={handleChange}
                      className={selectCx}
                    >
                      {TIME_OPTIONS.map((time) => (
                        <option
                          key={time}
                          value={time}
                        >
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* NOTES */}
                <div>
                  <Label htmlFor="notes">
                    Additional Notes
                  </Label>

                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Tell us about your condition, your goals, or anything else we should know..."
                    rows={5}
                    className="rounded-xl border-[#12241D]/15 bg-white px-4 shadow-sm transition-all placeholder:text-slate-400 focus-visible:border-[#FF5638] focus-visible:ring-2 focus-visible:ring-[#FF5638]/20 focus-visible:ring-offset-0"
                  />
                </div>

                {/* SUBMIT */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="sheen h-14 w-full rounded-xl bg-[#FF5638] text-base font-bold text-white shadow-lg shadow-[#FF5638]/25 transition-all hover:-translate-y-1 hover:bg-[#E8482B]"
                >
                  {loading ? (
                    'Sending...'
                  ) : (
                    <>
                      Submit Booking Request
                      <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-xs leading-relaxed text-slate-400">
                  We&apos;ll confirm your appointment by phone or
                  email within one business day.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ===================================================== */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div
          className={`fade-up ${
            visible ? 'in' : ''
          } relative overflow-hidden rounded-2xl bg-[#0E2C22] p-10 text-center text-white md:p-14`}
        >
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FFC53D]">
              Ready to get started?
            </p>

            <h2 className="font-display mx-auto mt-3 max-w-2xl text-3xl font-extrabold md:text-4xl">
              Better care, in the comfort of your own home.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300">
              Request an appointment today and let our team help you
              take the next step towards better movement and
              independence.
            </p>

            <a
              href="#appointment"
              className="sheen mt-8 inline-flex items-center gap-2 rounded-xl bg-[#FF5638] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#FF5638]/30 transition-all hover:-translate-y-1 hover:bg-[#E8482B]"
            >
              Request an Appointment
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

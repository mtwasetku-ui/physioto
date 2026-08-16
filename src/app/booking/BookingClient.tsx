'use client'

import React, { useState, useEffect } from 'react'
import { Phone, Mail, MapPin, Clock, Send, FileDown, Calendar as CalendarIcon } from 'lucide-react'
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

const inputCx = 'h-11 rounded-lg border-[#12241D]/15 bg-white focus-visible:ring-[#FF5638] focus-visible:ring-offset-0'
const selectCx = 'w-full rounded-lg border border-[#12241D]/15 bg-white px-3 py-2 text-sm h-11 focus:outline-none focus:ring-2 focus:ring-[#FF5638]'

export default function BookingClient() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '', email: '', phone: '', service: '',
    preferredDate: '', preferredTime: '', notes: '',
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const validateForm = () => {
    const e: Partial<FormData> = {}
    if (!formData.name.trim()) e.name = 'Name is required'
    if (!formData.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Email is invalid'
    if (!formData.phone.trim()) e.phone = 'Phone number is required'
    if (!formData.service) e.service = 'Please select a service'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormData]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    try {
      const res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...formData, _subject: 'New Booking Request — Physio to Home' }),
      })
      if (!res.ok) throw new Error('Submission failed')
      toast({ title: 'Booking Request Sent!', description: "We'll confirm your appointment by phone or email within one business day." })
      setFormData({ name: '', email: '', phone: '', service: '', preferredDate: '', preferredTime: '', notes: '' })
    } catch {
      toast({ title: 'Submission Failed', description: 'There was an error sending your request. Please try again or call us on 1300 433 233.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="font-body min-h-screen overflow-x-hidden bg-[#FBF8F1] text-[#12241D]">
      <div className="pth-grain" aria-hidden="true" />

      {/* HERO */}
      <section className="dots relative overflow-hidden bg-[#0E2C22] py-24 text-white">
        <div className="pointer-events-none absolute inset-0 text-white/5" />
        <div className="absolute -top-20 right-[-40px] h-96 w-96 rounded-full bg-[#FF5638]/15 blur-3xl" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center lg:px-8">
          <p className="fade-up in text-xs font-bold uppercase tracking-[0.24em] text-[#FFC53D]">Get Started Today</p>
          <h1 className="fade-up d1 in font-display mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
            Physiotherapy <span className="italic text-[#FFC53D]">that comes to you</span>
          </h1>
          <p className="fade-up d2 in mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            Physio to Home brings professional physiotherapy directly to your door across Tasmania. Whether you&apos;re
            recovering from surgery, managing a chronic condition, or looking to improve your strength and balance —
            we assess and treat you in the comfort of your own home.
          </p>
          <p className="fade-up d3 in mx-auto mt-4 max-w-2xl text-slate-400">
            With over 15 years of clinical experience, our team provides personalised, one-on-one care with no waiting
            rooms and no travel stress. We accept My Aged Care, GP Management Plans, private health insurance, NDIS,
            and private paying clients.
          </p>
        </div>
      </section>

      {/* STATS — overlapping card, matches homepage */}
      <div className="relative z-20 mx-auto -mt-12 max-w-5xl px-6 lg:px-8">
        <div className="fade-up in grid grid-cols-1 divide-y divide-[#12241D]/10 overflow-hidden rounded-2xl border border-[#12241D]/10 bg-white shadow-[0_24px_60px_-24px_rgba(10,35,27,0.35)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { value: '15+', label: 'Years of experience' },
            { value: '1-on-1', label: 'Personalised care' },
            { value: 'Tasmania', label: 'State-wide service' },
          ].map(({ value, label }) => (
            <div key={label} className="px-6 py-6 text-center transition-colors hover:bg-[#FBF8F1]">
              <div className="font-display text-2xl font-extrabold tracking-tight text-[#FF5638]">{value}</div>
              <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className={`fade-up ${visible ? 'in' : ''} mb-14 text-center`}>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FF5638]">Simple process</p>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[#12241D] md:text-4xl">How It Works</h2>
          <p className="mx-auto mt-3 max-w-md text-slate-500">
            Getting started is straightforward. Here&apos;s what to expect from booking through to your first visit.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { step: '1', title: 'Submit a Request', desc: 'Fill in the booking form below with your details, preferred service, and a convenient time.' },
            { step: '2', title: 'We Confirm', desc: "We'll call or email you within one business day to confirm your appointment and answer any questions." },
            { step: '3', title: 'We Come to You', desc: 'Your physiotherapist visits you at home at the agreed time, bringing all necessary equipment.' },
            { step: '4', title: 'Your Treatment Plan', desc: "After your initial assessment, you'll receive a personalised plan tailored to your goals and needs." },
          ].map(({ step, title, desc }, i) => (
            <div key={step} className={`fade-up d${i + 1} ${visible ? 'in' : ''} card-lift rounded-2xl border border-[#12241D]/10 bg-white p-6 shadow-sm`}>
              <div className="font-display mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#0E2C22] text-[#FFC53D] font-bold">{step}</div>
              <h3 className="mb-2 font-bold text-[#12241D]">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* NDIS INTAKE FORM */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className={`fade-up ${visible ? 'in' : ''} mb-16 flex flex-col items-start justify-between gap-6 rounded-2xl border border-[#12241D]/10 bg-[#F2EFE4] p-8 md:flex-row md:items-center`}>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white text-[#0E2C22] shadow-sm">
              <FileDown className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display mb-1 text-lg font-bold text-[#12241D]">NDIS Client? Download Our Intake Form</h3>
              <p className="max-w-xl text-sm text-slate-600">
                If you&apos;re a self-managed or plan-managed NDIS participant, please download and complete our
                NDIS Client Intake Form ahead of your appointment. You can email it back in advance to
                Info@physiotohome.com.
              </p>
            </div>
          </div>
          <a
            href="/ndis.pdf"
            download
            className="sheen inline-flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-[#FF5638] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#FF5638]/30 transition-all hover:-translate-y-0.5 hover:bg-[#E8482B]"
          >
            <FileDown className="h-4 w-4" />
            Download NDIS Intake Form
          </a>
        </div>
      </div>

      {/* CONTACT INFO + FORM */}
      <div className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">

          {/* Left — contact info */}
          <div className={`fade-up ${visible ? 'in' : ''}`}>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FF5638]">Get in touch</p>
            <h2 className="font-display mt-3 mb-8 text-3xl font-extrabold tracking-tight text-[#12241D]">Contact details</h2>
            <div className="mb-10 space-y-6">
              {[
                {
                  Icon: Phone,
                  title: 'Phone',
                  content: <a href="tel:1300433233" className="text-slate-600 transition-colors hover:text-[#FF5638]">1300 433 233</a>,
                  sub: 'Mon–Fri: 8am – 6pm, Sat: 9am – 2pm',
                },
                {
                  Icon: Mail,
                  title: 'Email',
                  content: <a href="mailto:info@physiotohome.com" className="text-slate-600 transition-colors hover:text-[#FF5638]">info@physiotohome.com</a>,
                  sub: "We'll respond within 24 hours",
                },
                {
                  Icon: MapPin,
                  title: 'Location',
                  content: <p className="text-slate-600">Tasmania</p>,
                  sub: 'Serving clients across the state',
                },
                {
                  Icon: Clock,
                  title: 'Availability',
                  content: <p className="text-slate-600">Mon–Fri: 8am – 6pm</p>,
                  sub: 'Saturday appointments available on request',
                },
              ].map(({ Icon, title, content, sub }) => (
                <div key={title} className="group flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#F2EFE4] text-[#0E2C22] transition-all duration-300 group-hover:bg-[#FF5638] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-bold text-[#12241D]">{title}</h3>
                    {content}
                    <p className="mt-1 text-sm text-slate-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-[#12241D]/10 bg-[#0E2C22] p-8 text-white">
              <h3 className="font-display mb-4 text-xl font-bold">What to Expect</h3>
              <ul className="space-y-3">
                {[
                  'We come to you — no travel required',
                  'Initial assessment at your first visit',
                  'Personalised treatment plan',
                  'My Aged Care & private health accepted',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-slate-300">
                    <span className="mt-0.5 text-[#FFC53D]">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — form */}
          <div className={`fade-up d1 ${visible ? 'in' : ''} card-lift rounded-2xl border border-[#12241D]/10 bg-white p-8 shadow-xl`}>
            <h2 className="font-display mb-6 text-2xl font-bold text-[#12241D]">Request an Appointment</h2>
            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange}
                  placeholder="John Smith" className={`${inputCx} ${errors.name ? 'border-red-500' : ''}`} />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange}
                  placeholder="john@example.com" className={`${inputCx} ${errors.email ? 'border-red-500' : ''}`} />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange}
                  placeholder="0412 345 678" className={`${inputCx} ${errors.phone ? 'border-red-500' : ''}`} />
                {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
              </div>

              <div>
                <Label htmlFor="service">Service Required *</Label>
                <select id="service" name="service" value={formData.service} onChange={handleChange}
                  className={`${selectCx} ${errors.service ? 'border-red-500' : ''}`}>
                  <option value="">Select a service...</option>
                  {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.service && <p className="mt-1 text-sm text-red-500">{errors.service}</p>}
              </div>

              <div>
                <Label htmlFor="preferredDate">Preferred Date (Optional)</Label>
                <Input id="preferredDate" name="preferredDate" type="date" value={formData.preferredDate} onChange={handleChange} className={inputCx} />
              </div>

              <div>
                <Label htmlFor="preferredTime">Preferred Time (Optional)</Label>
                <select id="preferredTime" name="preferredTime" value={formData.preferredTime} onChange={handleChange}
                  className={selectCx}>
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange}
                  placeholder="Tell us about your condition or anything else we should know..." rows={4}
                  className="rounded-lg border-[#12241D]/15 bg-white focus-visible:ring-[#FF5638] focus-visible:ring-offset-0" />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="sheen w-full rounded-xl bg-[#FF5638] py-6 text-base font-bold text-white shadow-lg shadow-[#FF5638]/30 transition-all hover:-translate-y-0.5 hover:bg-[#E8482B]"
              >
                {loading ? 'Sending...' : <><span>Submit Booking Request</span><Send className="ml-2 h-4 w-4" /></>}
              </Button>

              <p className="text-center text-sm text-slate-500">
                We&apos;ll confirm your appointment by phone or email within one business day.
              </p>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}

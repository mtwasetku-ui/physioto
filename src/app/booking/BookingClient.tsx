'use client'

import React, { useState } from 'react'
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react'
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

export default function BookingClient() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '', email: '', phone: '', service: '',
    preferredDate: '', preferredTime: '', notes: '',
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">

      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Physiotherapy That Comes to You</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Physio to Home brings professional physiotherapy directly to your door across Launceston and surrounds.
            Whether you're recovering from surgery, managing a chronic condition, or looking to improve your strength
            and balance — we assess and treat you in the comfort of your own home.
          </p>
          <p className="text-blue-100 max-w-3xl mx-auto mt-4">
            With over 15 years of clinical experience, Michael provides personalised, one-on-one care with no waiting
            rooms and no travel stress. We accept NDIS, My Aged Care, GP Management Plans, private health insurance,
            and private paying clients.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '15+', label: 'Years of experience' },
              { value: '1-on-1', label: 'Personalised care' },
              { value: '20km', label: 'Service radius' },
              { value: 'NDIS', label: 'Registered provider' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-3xl font-bold text-blue-600">{value}</div>
                <div className="text-sm text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">How It Works</h2>
          <p className="text-gray-500 text-center mb-10">
            Getting started is straightforward. Here's what to expect from booking through to your first visit.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Submit a Request', desc: 'Fill in the booking form below with your details, preferred service, and a convenient time.' },
              { step: '2', title: 'We Confirm', desc: "We'll call or email you within one business day to confirm your appointment and answer any questions." },
              { step: '3', title: 'We Come to You', desc: 'Michael visits you at home at the agreed time, bringing all necessary equipment.' },
              { step: '4', title: 'Your Treatment Plan', desc: 'After your initial assessment, you'll receive a personalised plan tailored to your goals and needs.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-4">{step}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact info + Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Left — contact info */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Get in Touch</h2>
            <div className="space-y-6 mb-10">
              {[
                {
                  Icon: Phone,
                  title: 'Phone',
                  content: <a href="tel:1300433233" className="text-gray-600 hover:text-blue-600 transition-colors">1300 433 233</a>,
                  sub: 'Mon–Fri: 8am – 6pm, Sat: 9am – 2pm',
                },
                {
                  Icon: Mail,
                  title: 'Email',
                  content: <a href="mailto:info@physiotohome.com.au" className="text-gray-600 hover:text-blue-600 transition-colors">info@physiotohome.com.au</a>,
                  sub: "We'll respond within 24 hours",
                },
                {
                  Icon: MapPin,
                  title: 'Location',
                  content: <p className="text-gray-600">Launceston, Tasmania</p>,
                  sub: 'Serving within 20km of Launceston',
                },
                {
                  Icon: Clock,
                  title: 'Availability',
                  content: <p className="text-gray-600">Mon–Fri: 8am – 6pm</p>,
                  sub: 'Saturday appointments available on request',
                },
              ].map(({ Icon, title, content, sub }) => (
                <div key={title} className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                    {content}
                    <p className="text-sm text-gray-500 mt-1">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">What to Expect</h3>
              <ul className="space-y-3 text-gray-700">
                {[
                  'We come to you — no travel required',
                  'Initial assessment at your first visit',
                  'Personalised treatment plan',
                  'NDIS, My Aged Care & private health accepted',
                ].map((item) => (
                  <li key={item} className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Request an Appointment</h2>
            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange}
                  placeholder="John Smith" className={errors.name ? 'border-red-500' : ''} />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange}
                  placeholder="john@example.com" className={errors.email ? 'border-red-500' : ''} />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange}
                  placeholder="0412 345 678" className={errors.phone ? 'border-red-500' : ''} />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <Label htmlFor="service">Service Required *</Label>
                <select id="service" name="service" value={formData.service} onChange={handleChange}
                  className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.service ? 'border-red-500' : 'border-gray-300'}`}>
                  <option value="">Select a service...</option>
                  {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.service && <p className="text-red-500 text-sm mt-1">{errors.service}</p>}
              </div>

              <div>
                <Label htmlFor="preferredDate">Preferred Date (Optional)</Label>
                <Input id="preferredDate" name="preferredDate" type="date" value={formData.preferredDate} onChange={handleChange} />
              </div>

              <div>
                <Label htmlFor="preferredTime">Preferred Time (Optional)</Label>
                <select id="preferredTime" name="preferredTime" value={formData.preferredTime} onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange}
                  placeholder="Tell us about your condition or anything else we should know..." rows={4} />
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? 'Sending...' : <><span>Submit Booking Request</span><Send className="w-4 h-4 ml-2" /></>}
              </Button>

              <p className="text-center text-sm text-gray-500">
                We'll confirm your appointment by phone or email within one business day.
              </p>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}

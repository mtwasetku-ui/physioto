'use client'

import React, { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/form-elements'
import { useToast } from '@/hooks/use-toast'

const FORMSPREE_URL = 'https://formspree.io/f/xgoneqlg'

interface FormData { name: string; email: string; phone: string; message: string }

const inputCx = 'h-11 rounded-lg border-[#12241D]/15 bg-white focus-visible:ring-[#FF5638] focus-visible:ring-offset-0'

export default function ContactClient() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', phone: '', message: '' })
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
    if (!formData.phone.trim()) e.phone = 'Phone is required'
    if (!formData.message.trim()) e.message = 'Message is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Submission failed')
      toast({ title: 'Message Sent!', description: "Thank you for contacting us. We'll get back to you soon." })
      setFormData({ name: '', email: '', phone: '', message: '' })
    } catch {
      toast({ title: 'Submission Failed', description: 'There was an error sending your message. Please try again.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="font-body min-h-screen overflow-x-hidden bg-[#FBF8F1] text-[#12241D]">
      <div className="pth-grain" aria-hidden="true" />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0E2C22] py-24 text-white">
        <div className="pointer-events-none absolute inset-0 text-white/5" />
        <div className="absolute -top-20 right-[-40px] h-96 w-96 rounded-full bg-[#FF5638]/15 blur-3xl" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center lg:px-8">
          <p className="fade-up in text-xs font-bold uppercase tracking-[0.24em] text-[#FFC53D]">We&apos;d love to hear from you</p>
          <h1 className="fade-up d1 in font-display mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
            Contact <span className="italic text-[#FFC53D]">us</span>
          </h1>
          <p className="fade-up d2 in mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
            Have questions? We&apos;re here to help. Reach out and we&apos;ll respond as soon as possible.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">

          {/* Left — info */}
          <div className={`fade-up ${visible ? 'in' : ''}`}>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FF5638]">Get in touch</p>
            <h2 className="font-display mt-3 mb-8 text-3xl font-extrabold tracking-tight text-[#12241D]">Contact details</h2>
            <div className="mb-12 space-y-6">
              {[
                { Icon: Phone, title: 'Phone', content: <a href="tel:1300433233" className="text-slate-600 transition-colors hover:text-[#FF5638]">1300 433 233</a>, sub: 'Mon– Sat: 9am – 5pm' },
                { Icon: Mail, title: 'Email', content: <a href="mailto:info@physiotohome.com" className="text-slate-600 transition-colors hover:text-[#FF5638]">info@physiotohome.com</a>, sub: "We'll respond within 24 hours" },
                { Icon: MapPin, title: 'Service Area', content: <p className="text-slate-600">Across Tasmania</p>, sub: 'We come to you — home, aged care facility, or workplace' },
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
              <h3 className="font-display mb-4 text-xl font-bold">Why Choose Us?</h3>
              <ul className="space-y-3">
                {['15+ years of trusted service across Tasmania', 'AHPRA registered physiotherapy team', 'Convenient home-based care — we come to you', 'Personalised treatment plans'].map((item) => (
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
            <h2 className="font-display mb-6 text-2xl font-bold text-[#12241D]">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {(['name', 'email', 'phone'] as const).map((field) => (
                <div key={field}>
                  <Label htmlFor={field}>{field === 'name' ? 'Full Name' : field === 'email' ? 'Email Address' : 'Phone Number'} *</Label>
                  <Input id={field} name={field} type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'} value={formData[field]} onChange={handleChange}
                    placeholder={field === 'name' ? 'John Smith' : field === 'email' ? 'john@example.com' : '0412 345 678'}
                    className={`${inputCx} ${errors[field] ? 'border-red-500' : ''}`} />
                  {errors[field] && <p className="mt-1 text-sm text-red-500">{errors[field]}</p>}
                </div>
              ))}
              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea id="message" name="message" value={formData.message} onChange={handleChange} placeholder="Tell us how we can help you..." rows={6}
                  className={`rounded-lg border-[#12241D]/15 bg-white focus-visible:ring-[#FF5638] focus-visible:ring-offset-0 ${errors.message ? 'border-red-500' : ''}`} />
                {errors.message && <p className="mt-1 text-sm text-red-500">{errors.message}</p>}
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="sheen w-full rounded-xl bg-[#FF5638] py-6 text-base font-bold text-white shadow-lg shadow-[#FF5638]/30 transition-all hover:-translate-y-0.5 hover:bg-[#E8482B]"
              >
                {loading ? 'Sending...' : <><span>Send Message</span><Send className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

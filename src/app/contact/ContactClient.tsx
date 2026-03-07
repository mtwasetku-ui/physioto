'use client'

import React, { useState } from 'react'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/form-elements'
import { useToast } from '@/hooks/use-toast'

const FORMSPREE_URL = 'https://formspree.io/f/xgoneqlg'

interface FormData { name: string; email: string; phone: string; message: string }

export default function ContactClient() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', phone: '', message: '' })
  const [errors, setErrors] = useState<Partial<FormData>>({})

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">Have questions? We&apos;re here to help. Reach out and we&apos;ll respond as soon as possible.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Get in Touch</h2>
            <div className="space-y-6 mb-12">
              {[
                { Icon: Phone, title: 'Phone', content: <a href="tel:1300433233" className="text-gray-600 hover:text-blue-600 transition-colors">1300 433 233</a>, sub: 'Mon–Fri: 8am – 6pm, Sat: 9am – 2pm' },
                { Icon: Mail, title: 'Email', content: <a href="mailto:info@physiotohome.com.au" className="text-gray-600 hover:text-blue-600 transition-colors">info@physiotohome.com.au</a>, sub: "We'll respond within 24 hours" },
                { Icon: MapPin, title: 'Service Area', content: <p className="text-gray-600">Across Tasmania</p>, sub: 'We come to you — home, aged care facility, or workplace' },
              ].map(({ Icon, title, content, sub }) => (
                <div key={title} className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0"><Icon className="w-6 h-6 text-blue-600" /></div>
                  <div><h3 className="font-semibold text-gray-900 mb-1">{title}</h3>{content}<p className="text-sm text-gray-500 mt-1">{sub}</p></div>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Why Choose Us?</h3>
              <ul className="space-y-3 text-gray-700">
                {['15+ years of trusted service across Tasmania','AHPRA registered physiotherapist','Convenient home-based care — we come to you','Personalised treatment plans'].map((item) => (
                  <li key={item} className="flex items-start"><span className="text-blue-600 mr-2">✓</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {(['name', 'email', 'phone'] as const).map((field) => (
                <div key={field}>
                  <Label htmlFor={field}>{field === 'name' ? 'Full Name' : field === 'email' ? 'Email Address' : 'Phone Number'} *</Label>
                  <Input id={field} name={field} type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'} value={formData[field]} onChange={handleChange}
                    placeholder={field === 'name' ? 'John Smith' : field === 'email' ? 'john@example.com' : '0412 345 678'}
                    className={errors[field] ? 'border-red-500' : ''} />
                  {errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>}
                </div>
              ))}
              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea id="message" name="message" value={formData.message} onChange={handleChange} placeholder="Tell us how we can help you..." rows={6} className={errors.message ? 'border-red-500' : ''} />
                {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? 'Sending...' : <><span>Send Message</span><Send className="w-4 h-4 ml-2" /></>}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Home,
  HeartHandshake,
  ShieldCheck,
  Activity,
  HelpCircle,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/form-elements'
import { useToast } from '@/hooks/use-toast'

const FORMSPREE_URL = 'https://formspree.io/f/xgoneqlg'

interface FormData {
  name: string
  email: string
  phone: string
  message: string
}

const inputCx =
  'h-11 rounded-lg border-[#12241D]/15 bg-white focus-visible:ring-[#FF5638] focus-visible:ring-offset-0'

const faqs = [
  {
    question: 'Do I need a GP referral to see a physiotherapist?',
    answer:
      'Private clients can generally book directly with a physiotherapist without a GP referral. Some funding arrangements, including certain Medicare, DVA or NDIS arrangements, may have specific requirements. If you are unsure, contact us and we can help explain what applies to your situation.',
  },
  {
    question: 'Do you provide physiotherapy at home?',
    answer:
      'Yes. Physio to Home is a mobile physiotherapy service. Our physiotherapists travel to clients rather than requiring you to attend a traditional clinic.',
  },
  {
    question: 'What areas of Tasmania do you service?',
    answer:
      'Physio to Home provides mobile physiotherapy across Tasmania. Contact us with your town or location and we can confirm availability for your area.',
  },
  {
    question: 'Do you accept NDIS clients?',
    answer:
      'Yes. We provide mobile physiotherapy for eligible self-managed and plan-managed NDIS participants. Physio to Home is not currently a registered NDIS provider, so agency-managed participants may need to access a registered provider.',
  },
  {
    question: 'Do you provide DVA physiotherapy?',
    answer:
      'Yes. We provide physiotherapy services for eligible Department of Veterans’ Affairs clients, subject to the applicable referral and funding requirements.',
  },
  {
    question: 'Can I use Medicare for physiotherapy?',
    answer:
      'Eligible patients may be able to access physiotherapy through applicable Medicare arrangements. Medicare funding has specific eligibility and referral requirements, so contact us if you would like to discuss your situation.',
  },
  {
    question: 'Can you visit retirement villages or aged care facilities?',
    answer:
      'Yes. Home visits can be provided in houses, units, apartments, retirement villages and other appropriate residential or community settings.',
  },
  {
    question: 'Can you help after hospital discharge or surgery?',
    answer:
      'Yes. Home physiotherapy can support people returning home after surgery, hospitalisation, joint replacement, fractures, injury or periods of reduced mobility.',
  },
  {
    question: 'How quickly can I get an appointment?',
    answer:
      'We aim to offer same-week appointments where availability allows. Contact us with your location and preferred timing and we can let you know the earliest suitable appointment.',
  },
  {
    question: 'What should I do if I am not sure which service I need?',
    answer:
      'You do not need to diagnose yourself before contacting us. Tell us about your symptoms, goals and location and our team can help you work out the most appropriate next step.',
  },
]

function ContactCard({
  icon: Icon,
  title,
  children,
  description,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  description: string
}) {
  return (
    <div className="group flex items-start gap-4">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#F2EFE4] text-[#0E2C22] transition-all duration-300 group-hover:bg-[#FF5638] group-hover:text-white">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <h3 className="mb-1 font-bold text-[#12241D]">{title}</h3>

        <div className="text-slate-600">{children}</div>

        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          {description}
        </p>
      </div>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType
  title: string
  text: string
}) {
  return (
    <div className="rounded-2xl border border-[#12241D]/10 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#E7F2E7] text-[#2E6B4A]">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="mb-2 font-display text-lg font-bold text-[#12241D]">
        {title}
      </h3>

      <p className="text-sm leading-relaxed text-slate-600">{text}</p>
    </div>
  )
}

export default function ContactClient() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  })

  const [errors, setErrors] = useState<Partial<FormData>>({})

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)

    return () => clearTimeout(t)
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
      e.phone = 'Phone is required'
    }

    if (!formData.message.trim()) {
      e.message = 'Message is required'
    }

    setErrors(e)

    return Object.keys(e).length === 0
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        throw new Error('Submission failed')
      }

      toast({
        title: 'Message Sent!',
        description:
          "Thank you for contacting us. We'll get back to you soon.",
      })

      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
      })
    } catch {
      toast({
        title: 'Submission Failed',
        description:
          'There was an error sending your message. Please try again or call us directly.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="font-body min-h-screen overflow-x-hidden bg-[#FBF8F1] text-[#12241D]">
      <div className="pth-grain" aria-hidden="true" />

      {/* =========================================================
          HERO
      ========================================================= */}

      <section className="relative overflow-hidden bg-[#0E2C22] py-24 text-white">
        <div
          className="absolute -right-20 -top-24 h-96 w-96 rounded-full bg-[#FF5638]/15 blur-3xl"
          aria-hidden="true"
        />

        <div
          className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-[#4E9B72]/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center lg:px-8">
          <p className="fade-up in text-xs font-bold uppercase tracking-[0.24em] text-[#FFC53D]">
            Get in touch
          </p>

          <h1 className="fade-up d1 in font-display mt-4 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
            Contact Physio to Home
            <br />
            <span className="italic text-[#FFC53D]">
              Home Physiotherapy Across Tasmania
            </span>
          </h1>

          <p className="fade-up d2 in mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            Have a question about home physiotherapy, funding,
            availability or whether we service your area? Our team
            is here to help.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF5638] px-6 py-4 font-bold text-white shadow-lg shadow-[#FF5638]/25 transition-all hover:-translate-y-0.5 hover:bg-[#E8482B]"
            >
              <Calendar className="h-5 w-5" />
              Book a Home Visit
            </Link>

            <a
              href="tel:1300433233"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-4 font-bold text-white transition-all hover:bg-white/15"
            >
              <Phone className="h-5 w-5" />
              1300 433 233
            </a>
          </div>
        </div>
      </section>

      {/* =========================================================
          CONTACT + FORM
      ========================================================= */}

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[0.85fr_1.15fr]">
          {/* LEFT */}
          <div className={`fade-up ${visible ? 'in' : ''}`}>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FF5638]">
              We&apos;re here to help
            </p>

            <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[#12241D] md:text-4xl">
              Let&apos;s talk about your physiotherapy needs
            </h2>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              You do not need to know exactly which service you
              need before contacting us. Tell us what is happening,
              where you are located and what you would like help
              with. Our team can help you work out the next step.
            </p>

            <div className="mt-9 space-y-7">
              <ContactCard
                icon={Phone}
                title="Call us"
                description="Speak with our team about appointments, availability and your location."
              >
                <a
                  href="tel:1300433233"
                  className="font-semibold text-[#2E6B4A] transition-colors hover:text-[#FF5638]"
                >
                  1300 433 233
                </a>
              </ContactCard>

              <ContactCard
                icon={Mail}
                title="Email us"
                description="Send us an enquiry and we'll get back to you."
              >
                <a
                  href="mailto:info@physiotohome.com"
                  className="font-semibold text-[#2E6B4A] transition-colors hover:text-[#FF5638]"
                >
                  info@physiotohome.com
                </a>
              </ContactCard>

              <ContactCard
                icon={MapPin}
                title="Service area"
                description="Tell us your town or suburb and we'll confirm availability."
              >
                <p>Across Tasmania</p>
              </ContactCard>
            </div>

            {/* TRUST BOX */}
            <div className="mt-10 rounded-2xl border border-[#12241D]/10 bg-[#0E2C22] p-7 text-white shadow-lg">
              <h3 className="font-display text-xl font-bold">
                Why choose Physio to Home?
              </h3>

              <ul className="mt-5 space-y-3">
                {[
                  'AHPRA-registered physiotherapy team',
                  'Convenient home-based care',
                  'Personalised treatment plans',
                  'Mobile physiotherapy across Tasmania',
                  'Same-week appointments where available',
                  'NDIS and DVA clients welcome',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm leading-relaxed text-slate-300"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#FFC53D]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* FORM */}
          <div
            className={`fade-up d1 ${
              visible ? 'in' : ''
            } card-lift rounded-2xl border border-[#12241D]/10 bg-white p-7 shadow-xl md:p-9`}
          >
            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF5638]">
                Send an enquiry
              </p>

              <h2 className="font-display mt-2 text-2xl font-bold text-[#12241D] md:text-3xl">
                How can we help?
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Complete the short form below and our team will get
                back to you.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="name">Full Name *</Label>

                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className={`${inputCx} ${
                    errors.name ? 'border-red-500' : ''
                  }`}
                />

                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="email">Email Address *</Label>

                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={`${inputCx} ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                  />

                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>

                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="04XX XXX XXX"
                    className={`${inputCx} ${
                      errors.phone ? 'border-red-500' : ''
                    }`}
                  />

                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="message">How can we help? *</Label>

                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us a little about what you need help with, your location, or any questions you have..."
                  rows={7}
                  className={`rounded-lg border-[#12241D]/15 bg-white focus-visible:ring-[#FF5638] focus-visible:ring-offset-0 ${
                    errors.message ? 'border-red-500' : ''
                  }`}
                />

                {errors.message && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="sheen w-full rounded-xl bg-[#FF5638] py-6 text-base font-bold text-white shadow-lg shadow-[#FF5638]/30 transition-all hover:-translate-y-0.5 hover:bg-[#E8482B]"
              >
                {loading ? (
                  'Sending...'
                ) : (
                  <>
                    <span>Send Enquiry</span>
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs leading-relaxed text-slate-400">
                We&apos;ll use the information you provide to
                respond to your enquiry and discuss your
                physiotherapy needs.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* =========================================================
          WHAT HAPPENS NEXT
      ========================================================= */}

      <section className="border-y border-[#E8E2D5] bg-[#F2EFE4] px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FF5638]">
              What happens next?
            </p>

            <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[#12241D] md:text-4xl">
              Getting started is simple
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600">
              Whether you call, email, send an enquiry or book
              online, we&apos;ll help you take the next step.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-4">
            {[
              {
                number: '01',
                title: 'Tell us what you need',
                text: 'Contact us by phone, email or the online enquiry form.',
              },
              {
                number: '02',
                title: 'We discuss your needs',
                text: 'We can talk about your symptoms, goals, funding and location.',
              },
              {
                number: '03',
                title: 'We confirm availability',
                text: 'We confirm whether we can provide a home visit in your area.',
              },
              {
                number: '04',
                title: 'We come to you',
                text: 'Your physiotherapist provides assessment and treatment in your home.',
              },
            ].map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border border-[#12241D]/10 bg-white p-6"
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E2C22] text-sm font-bold text-[#FFC53D]">
                  {step.number}
                </div>

                <h3 className="font-display text-lg font-bold text-[#12241D]">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          WHY HOME PHYSIOTHERAPY
      ========================================================= */}

      <section className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FF5638]">
            Home-based care
          </p>

          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[#12241D] md:text-4xl">
            Why choose home physiotherapy?
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-600">
            Home physiotherapy can make rehabilitation more
            convenient while allowing your physiotherapist to
            consider how you move and function in your everyday
            environment.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          <InfoCard
            icon={Home}
            title="No clinic travel"
            text="Your physiotherapist comes to you, reducing the need for transport, parking and travel to an appointment."
          />

          <InfoCard
            icon={Activity}
            title="Real-world assessment"
            text="Your home environment can provide useful information about how your condition affects everyday movement and activities."
          />

          <InfoCard
            icon={HeartHandshake}
            title="Personalised treatment"
            text="Your treatment plan is built around your condition, goals, lifestyle and level of function."
          />

          <InfoCard
            icon={ShieldCheck}
            title="Support with mobility"
            text="Home visits can be particularly helpful for people who find travelling difficult because of pain, weakness or reduced mobility."
          />

          <InfoCard
            icon={CheckCircle2}
            title="Practical exercises"
            text="Exercises and strategies can be adapted to the space, equipment and routines you actually use."
          />

          <InfoCard
            icon={HeartHandshake}
            title="Comfort and convenience"
            text="Receive professional physiotherapy in a familiar environment without the need to wait in a traditional clinic."
          />
        </div>
      </section>

      {/* =========================================================
          WHO WE HELP
      ========================================================= */}

      <section className="border-y border-[#E8E2D5] bg-[#E7F2E7] px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FF5638]">
              Who we can help
            </p>

            <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[#12241D] md:text-4xl">
              You don&apos;t need to know exactly what service you need
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600">
              If you are unsure whether home physiotherapy is
              suitable for you, contact us. We can discuss your
              situation and help you understand your options.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'Back, neck and joint pain',
              'Recovery after surgery',
              'Falls and balance problems',
              'Neurological conditions',
              'Reduced mobility',
              'Aged care and mobility',
              'Persistent or chronic pain',
              'Sports and other injuries',
              'Hospital discharge rehabilitation',
              'NDIS participants',
              'Eligible DVA clients',
              'People who prefer home-based care',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-[#C8DDCF] bg-white px-4 py-4 text-sm font-medium text-slate-700"
              >
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#4E9B72]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          FUNDING
      ========================================================= */}

      <section className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FF5638]">
            Funding & payment
          </p>

          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[#12241D] md:text-4xl">
            Need help understanding your funding?
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-600">
            We work with a range of funding and payment pathways.
            If you are unsure which option applies to you, contact
            our team.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
          {[
            'NDIS',
            'DVA',
            'Medicare',
            'My Aged Care',
            'Private Health Insurance',
            'Private Pay',
          ].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-[#12241D]/10 bg-[#FBF8F1] p-5 text-center"
            >
              <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-[#4E9B72]" />

              <p className="font-bold text-[#12241D]">{item}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-7 max-w-2xl text-center text-sm leading-6 text-slate-500">
          Funding eligibility and requirements can vary. Contact
          us if you are unsure how your physiotherapy appointments
          may be funded.
        </p>
      </section>

      {/* =========================================================
          TASMANIA SERVICE AREA
      ========================================================= */}

      <section className="bg-[#0E2C22] px-6 py-20 text-white lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <MapPin className="mx-auto mb-5 h-8 w-8 text-[#FFC53D]" />

          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FFC53D]">
            Tasmania-wide mobile service
          </p>

          <h2 className="font-display mt-3 text-3xl font-extrabold md:text-4xl">
            Home physiotherapy across Tasmania
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300">
            Physio to Home brings physiotherapy to you rather than
            requiring you to travel to a traditional clinic. If
            you&apos;re unsure whether we cover your town or suburb,
            contact us and we&apos;ll confirm availability.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200">
              Home visits
            </span>

            <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200">
              Retirement villages
            </span>

            <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200">
              Community settings
            </span>

            <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200">
              Regional Tasmania
            </span>
          </div>

          <div className="mt-9">
            <a
              href="tel:1300433233"
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF5638] px-6 py-4 font-bold text-white shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-[#E8482B]"
            >
              <Phone className="h-5 w-5" />
              Ask About Your Area
            </a>
          </div>
        </div>
      </section>

      {/* =========================================================
          FAQ
      ========================================================= */}

      <section className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
        <div className="text-center">
          <HelpCircle className="mx-auto mb-4 h-8 w-8 text-[#4E9B72]" />

          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FF5638]">
            Frequently asked questions
          </p>

          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[#12241D] md:text-4xl">
            Before you contact us
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Some common questions about home physiotherapy,
            referrals, funding and appointments.
          </p>
        </div>

        <div className="mt-10 divide-y divide-[#12241D]/10 rounded-2xl border border-[#12241D]/10 bg-white px-6 shadow-sm">
          {faqs.map((faq, index) => {
            const open = openFaq === index

            return (
              <div key={faq.question}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenFaq(open ? null : index)
                  }
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-5 py-5 text-left"
                >
                  <span className="font-bold text-[#12241D]">
                    {faq.question}
                  </span>

                  <span
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#F2EFE4] text-[#FF5638] transition-transform ${
                      open ? 'rotate-180' : ''
                    }`}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>

                {open && (
                  <p className="pb-5 pr-10 text-sm leading-7 text-slate-600">
                    {faq.answer}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================= */}

      <section className="relative overflow-hidden bg-[#F2EFE4] px-6 py-20 lg:px-8">
        <div
          className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#FF5638]/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FF5638]">
            Ready to get started?
          </p>

          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[#12241D] md:text-4xl">
            Need a physiotherapist at home?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
            Book a home physiotherapy appointment or contact our
            team to discuss your symptoms, goals, funding or
            location.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF5638] px-7 py-4 font-bold text-white shadow-lg shadow-[#FF5638]/25 transition-all hover:-translate-y-0.5 hover:bg-[#E8482B]"
            >
              <Calendar className="h-5 w-5" />
              Book a Home Visit
            </Link>

            <a
              href="tel:1300433233"
              className="inline-flex items-center gap-2 rounded-xl border border-[#12241D]/15 bg-white px-7 py-4 font-bold text-[#12241D] transition-all hover:-translate-y-0.5 hover:border-[#FF5638] hover:text-[#FF5638]"
            >
              <Phone className="h-5 w-5" />
              1300 433 233
            </a>

            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-4 font-bold text-[#2E6B4A] transition-colors hover:text-[#FF5638]"
            >
              View Our Services
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

"use client";
import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Phone } from "lucide-react";

// Map condition label → blog slug (null = no matching post, renders as plain text)
const CONDITION_LINKS: Record<string, string | null> = {
  // Musculoskeletal
  'Lower back pain':          'lower-back-pain-home-treatment',
  'Neck pain & stiffness':    'neck-pain-cervicogenic-headache-home-physiotherapy',
  'Shoulder impingement':     'rotator-cuff-shoulder-rehabilitation',
  'Frozen shoulder':          'frozen-shoulder-adhesive-capsulitis-home-physiotherapy',
  'Hip pain':                 'hip-osteoarthritis-home-physiotherapy',
  'Knee pain':                'knee-osteoarthritis-home-physiotherapy',
  'Sciatica':                 'sciatica-lumbar-radiculopathy-home-physiotherapy',
  'Plantar fasciitis & heel pain': 'plantar-fasciitis-heel-pain-home-physiotherapy',
  "Tennis & golfer's elbow":  'tennis-elbow-golfers-elbow-home-physiotherapy',
  'Sports injuries':          null,

  // Post-surgery
  'Hip replacement':          'post-surgery-hip-replacement',
  'Knee replacement':         'post-surgery-knee-replacement',
  'Rotator cuff repair':      'rotator-cuff-shoulder-rehabilitation',
  'Spinal surgery':           null,
  'Fracture recovery':        'hip-fracture-rehabilitation-home-physiotherapy',
  'ACL reconstruction':       null,

  // Falls prevention
  'Balance impairment':       'how-to-improve-balance-at-home-older-adults',
  'Dizziness & vertigo':      'falls-prevention-dizziness',
  'Recurrent falls':          'falls-prevention-home-physiotherapy',
  'Fear of falling':          'falls-risk-ageing-parents-family-guide',
  "Parkinson's disease":      'parkinsons-disease-home-physiotherapy',
  'Post-stroke balance issues':'stroke-rehabilitation-home-physiotherapy',

  // Neurological
  'Stroke recovery':          'stroke-rehabilitation-home-physiotherapy',
  'Multiple sclerosis':       'multiple-sclerosis-home-physiotherapy',
  'Acquired brain injury':    null,
  'Cervicogenic dizziness':   'cervicogenic-dizziness-misdiagnosed-clinical-overview',
  'Peripheral neuropathy':    null,

  // Aged care
  'Mobility decline':         'how-to-improve-balance-at-home-older-adults',
  'Osteoporosis':             'osteoporosis-bone-health-home-physiotherapy',
  'Osteoarthritis':           'osteoarthritis-home-physiotherapy',
  'General deconditioning':   'post-covid-fatigue-deconditioning-home-physiotherapy',
  'Aged care assessments':    'my-aged-care-home-physiotherapy-funding',
  'Home exercise programs':   'benefits-of-home-physiotherapy',

  // Chronic pain
  'Fibromyalgia':             null,
  'Chronic lower back pain':  'lower-back-pain-home-treatment',
  'Complex regional pain':    null,
  'Persistent joint pain':    'how-to-exercise-safely-with-arthritis',
  'Post-COVID fatigue':       'post-covid-fatigue-deconditioning-home-physiotherapy',
  'Pain sensitisation':       'chronic-pain-home-physiotherapy',

  // NDIS & funding
  'NDIS eligibility & funding':        'ndis-home-physiotherapy-funding',
  'Choosing an NDIS physiotherapist':  'how-to-choose-ndis-physiotherapist-checklist',
  'Functional capacity assessments':   'ndis-functional-capacity-assessment-physiotherapy',
  'Writing NDIS goals & plan reviews': 'writing-ndis-physiotherapy-goals-plan-review',
  'NDIS support coordinators':         'ndis-support-coordinators-guide-home-physiotherapy-referrals',
  'My Aged Care vs NDIS':              'my-aged-care-vs-ndis-physiotherapy-funding-comparison',
};

const services = [
  {
    id: 'musculoskeletal',
    name: 'Musculoskeletal Pain',
    photo: 'image/blog/neck-pain-cervicogenic-headache-home-physiotherapy.jpg',
    summary: 'Back, neck, hip, shoulder and joint pain treated with hands-on manual therapy and targeted exercise, adapted to your home environment.',
    detail: 'We assess and treat the full spectrum of musculoskeletal conditions — from acute injuries to long-standing chronic pain. Treatment is tailored to your home, using your furniture, floor space, and daily routines as part of the rehabilitation process.',
    conditions: ['Lower back pain', 'Neck pain & stiffness', 'Shoulder impingement', 'Frozen shoulder', 'Hip pain', 'Knee pain', 'Sciatica', 'Plantar fasciitis & heel pain', "Tennis & golfer's elbow", 'Sports injuries'],
  },
  {
    id: 'post-surgery',
    name: 'Post-Surgery Rehabilitation',
    photo: 'image/blog/post-surgery-knee-replacement.jpg',
    summary: 'Expert recovery support following joint replacements, fractures, and orthopaedic surgery — progressing you safely toward full independence.',
    detail: 'Recovering at home after surgery is most effective when guided by an experienced physiotherapist who can see your actual environment. We develop a progressive program that rebuilds strength, mobility, and confidence — right where you live.',
    conditions: ['Hip replacement', 'Knee replacement', 'Rotator cuff repair', 'Spinal surgery', 'Fracture recovery', 'ACL reconstruction'],
  },
  {
    id: 'falls-prevention',
    name: 'Falls Prevention',
    photo: 'image/blog/falls-prevention-dizziness.jpg',
    summary: 'Comprehensive balance and strength assessment in your own home, followed by a structured program designed to meaningfully reduce falls risk.',
    detail: 'Falls are a leading cause of injury in older Australians — but most are preventable. We assess your balance, strength, gait, and home hazards, then design a personalised program to address your specific risk factors.',
    conditions: ['Balance impairment', 'Dizziness & vertigo', 'Recurrent falls', 'Fear of falling', "Parkinson's disease", 'Post-stroke balance issues'],
  },
  {
    id: 'neurological',
    name: 'Neurological Rehabilitation',
    photo: 'image/blog/stroke-rehabilitation-home-physiotherapy.jpg',
    summary: "Specialised rehabilitation for stroke, Parkinson's disease, multiple sclerosis, and other neurological conditions — delivered at home.",
    detail: 'Neurological rehabilitation requires consistency and a familiar environment. Treating you at home allows us to address the real functional challenges you face each day. We use evidence-based techniques to maximise your independence and quality of life.',
    conditions: ['Stroke recovery', "Parkinson's disease", 'Multiple sclerosis', 'Acquired brain injury', 'Cervicogenic dizziness', 'Peripheral neuropathy'],
  },
  {
    id: 'aged-care',
    name: 'Aged Care & Mobility',
    photo: 'image/blog/parkinsons-disease-home-physiotherapy.jpg',
    summary: 'Compassionate, patient-centred physiotherapy for older Australians — supporting independence, dignity, and quality of life at home.',
    detail: 'We understand that maintaining independence is what matters most to older Australians and their families. Our aged care physiotherapy addresses mobility, strength, pain, and daily function — helping you or your loved one stay safely at home for longer.',
    conditions: ['Mobility decline', 'Osteoporosis', 'Osteoarthritis', 'General deconditioning', 'Aged care assessments', 'Home exercise programs'],
  },
  {
    id: 'chronic-pain',
    name: 'Chronic Pain Management',
    photo: 'image/blog/chronic-pain-rural-tasmania.jpg',
    summary: 'Evidence-based approaches to managing persistent pain, restoring function, and improving quality of life — without leaving home.',
    detail: 'Chronic pain is complex, but manageable. We combine hands-on treatment, graded exercise, education, and pain science to help you understand and gradually overcome persistent pain.',
    conditions: ['Fibromyalgia', 'Chronic lower back pain', 'Complex regional pain', 'Persistent joint pain', 'Post-COVID fatigue', 'Pain sensitisation'],
  },
  {
    id: 'ndis-funding',
    name: 'NDIS & Funding Support',
    photo: 'image/blog/ndis-home-physiotherapy-funding.jpg',
    summary: 'Clear, practical guidance on accessing and funding home physiotherapy through the NDIS, My Aged Care, and other schemes.',
    detail: 'Navigating funding shouldn\u2019t be a barrier to getting the physiotherapy you need. We work directly with participants, families, and support coordinators to make eligibility, goal-setting, and plan reviews straightforward.',
    conditions: ['NDIS eligibility & funding', 'Choosing an NDIS physiotherapist', 'Functional capacity assessments', 'Writing NDIS goals & plan reviews', 'NDIS support coordinators', 'My Aged Care vs NDIS'],
  },
];

const fundingOptions: { emoji: string; label: string; desc: string; slug: string | null }[] = [
  { emoji: '💳', label: 'Private Health Insurance', desc: 'On-the-spot rebates with HICAPS', slug: 'private-health-insurance-home-physiotherapy' },
  { emoji: '♿', label: 'NDIS', desc: 'Self & plan managed participants', slug: 'ndis-home-physiotherapy-funding' },
  { emoji: '🎖️', label: 'DVA', desc: "Department of Veterans' Affairs", slug: 'dva-physiotherapy-tasmania' },
  { emoji: '🏥', label: 'Medicare', desc: 'Chronic Disease Management Plans', slug: 'medicare-gp-management-plan-physiotherapy-funding' },
  { emoji: '🤝', label: 'My Aged Care', desc: 'Home Care Package support', slug: 'my-aged-care-home-physiotherapy-funding' },
  { emoji: '💰', label: 'Private Pay', desc: 'Direct billing available', slug: null },
];

const badges = ['No GP Referral Required', 'AHPRA Registered', 'Same-Week Appointments', 'NDIS Welcome'];

function CheckCircle({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ConditionItem({ label }: { label: string }) {
  const slug = CONDITION_LINKS[label];
  return (
    <li style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14.5, color: '#475569' }}>
      <CheckCircle size={13} />
      {slug ? (
        <Link
          href={`/blog/${slug}`}
          style={{ color: '#059669', textDecoration: 'none', fontWeight: 600 }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
        >
          {label}
        </Link>
      ) : (
        <span>{label}</span>
      )}
    </li>
  );
}

function ServiceCard({ service }: { service: typeof services[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderRadius: 20, overflow: 'hidden',
      border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.2s', display: 'flex', flexDirection: 'column'
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}
    >
      <div style={{ position: 'relative', height: 280, overflow: 'hidden' }}>
        <Image src={`/${service.photo}`} alt={service.name} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(4,30,20,0.9) 0%, rgba(4,30,20,0.5) 55%, rgba(4,30,20,0.12) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
          <h3 style={{ margin: '0 0 10px', color: '#fff', fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 24, fontWeight: 600, lineHeight: 1.2 }}>
            {service.name}
          </h3>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.88)', fontSize: 16, lineHeight: 1.6 }}>
            {service.summary}
          </p>
        </div>
      </div>

      <div style={{ padding: '18px 22px', background: '#fff' }}>
        <button onClick={() => setOpen(o => !o)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#059669', fontWeight: 700, fontSize: 16, padding: 0
        }}>
          {open ? 'Show less' : 'Learn more'} <ChevronDown open={open} />
        </button>
        {open && (
          <div style={{ marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <p style={{ margin: '0 0 14px', color: '#475569', fontSize: 16, lineHeight: 1.65 }}>{service.detail}</p>
            <p style={{ margin: '0 0 10px', fontSize: 12.5, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Conditions we treat</p>
            <ul style={{ margin: 0, padding: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 10px', listStyle: 'none' }}>
              {service.conditions.map(c => (
                <ConditionItem key={c} label={c} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #f0fdf9, #fff)', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        .dots-bg { background-image: radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px); background-size: 24px 24px; }
        .card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 26px; }
        @media (max-width: 580px) { .card-grid { grid-template-columns: 1fr; } }
        .funding-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; }
        @media (max-width: 960px) { .funding-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 500px) { .funding-grid { grid-template-columns: repeat(2, 1fr); } }
        .fade-in { opacity: 0; transform: translateY(22px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .fade-in.in { opacity: 1; transform: none; }
      `}</style>

      {/* HERO */}
      <section className="dots-bg" style={{ background: 'linear-gradient(135deg, #064e3b, #022c22)', padding: '88px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -40, width: 380, height: 380, background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <p style={{ color: '#6ee7b7', fontSize: 13, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 18px' }}>What We Offer</p>
          <h1 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 'clamp(42px, 6.5vw, 62px)', color: '#fff', margin: '0 0 20px', lineHeight: 1.15 }}>
            Tasmania-Wide Physiotherapy Services <em style={{ color: '#6ee7b7', fontStyle: 'italic' }}>built around you</em>
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: 19, lineHeight: 1.7, maxWidth: 600, margin: '0 auto 32px' }}>
            Comprehensive in-home physiotherapy across Tasmania, based in Launceston — tailored to your condition, your home, and your goals.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
            {badges.map(b => (
              <span key={b} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(110,231,183,0.3)',
                borderRadius: 999, padding: '7px 15px', fontSize: 14, color: '#d1fae5', fontWeight: 600
              }}>
                <CheckCircle size={13} />{b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section style={{ maxWidth: 1150, margin: '0 auto', padding: '80px 24px' }}>
        <div className={`fade-in ${visible ? 'in' : ''}`} style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ width: 52, height: 4, background: 'linear-gradient(90deg,#059669,#10b981)', borderRadius: 2, margin: '0 auto 22px' }} />
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 'clamp(32px, 4.5vw, 44px)', color: '#0f172a', margin: '0 0 12px' }}>Our Physiotherapy Services</h2>
          <p style={{ color: '#475569', fontSize: 17, maxWidth: 520, margin: '0 auto', lineHeight: 1.65 }}>
            We treat a wide range of conditions. Click any service to learn more about how we can help.
          </p>
        </div>
        <div className="card-grid">
          {services.map((s, i) => (
            <div key={s.id} className={`fade-in ${visible ? 'in' : ''}`} style={{ transitionDelay: `${0.08 * i}s` }}>
              <ServiceCard service={s} />
            </div>
          ))}
        </div>
      </section>

      {/* FUNDING */}
      <section style={{ background: '#ecfdf5', borderTop: '1px solid #d1fae5', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1150, margin: '0 auto' }}>
          <div className={`fade-in ${visible ? 'in' : ''}`} style={{ textAlign: 'center', marginBottom: 44, transitionDelay: '0.3s' }}>
            <div style={{ width: 52, height: 4, background: 'linear-gradient(90deg,#059669,#10b981)', borderRadius: 2, margin: '0 auto 22px' }} />
            <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 'clamp(30px, 4vw, 42px)', color: '#0f172a', margin: '0 0 12px' }}>Funding & Payment Options</h2>
            <p style={{ color: '#475569', fontSize: 16, maxWidth: 440, margin: '0 auto' }}>We make accessing quality care as simple as possible.</p>
          </div>
          <div className="funding-grid">
            {fundingOptions.map(({ emoji, label, desc, slug }) => {
              const cardStyle: React.CSSProperties = {
                display: 'block', background: '#fff', borderRadius: 18, padding: '24px 16px',
                textAlign: 'center', border: '1px solid #d1fae5',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textDecoration: 'none',
                transition: 'box-shadow 0.2s, transform 0.2s'
              };
              const handlers = {
                onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.boxShadow = '0 8px 22px rgba(5,150,105,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; },
                onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'none'; },
              };
              const content = (
                <>
                  <div style={{ fontSize: 34, marginBottom: 10 }}>{emoji}</div>
                  <p style={{ margin: '0 0 5px', fontWeight: 700, color: '#0f172a', fontSize: 14.5 }}>{label}</p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>{desc}</p>
                  {slug && (
                    <p style={{ margin: '8px 0 0', color: '#059669', fontSize: 12.5, fontWeight: 700 }}>Learn more &rarr;</p>
                  )}
                </>
              );
              return slug ? (
                <Link key={label} href={`/blog/${slug}`} style={cardStyle} {...handlers}>
                  {content}
                </Link>
              ) : (
                <div key={label} style={cardStyle} {...handlers}>
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="dots-bg" style={{ background: 'linear-gradient(135deg, #064e3b, #022c22)', padding: '88px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -30, width: 300, height: 300, background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 660, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <p style={{ color: '#6ee7b7', fontSize: 13, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 16px' }}>Get Started Today</p>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 'clamp(36px, 5.5vw, 52px)', color: '#fff', margin: '0 0 18px', lineHeight: 1.2 }}>
            Ready to begin<br /><em style={{ color: '#6ee7b7' }}>your recovery?</em>
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: 18, lineHeight: 1.7, marginBottom: 40 }}>
            Book your appointment today and experience professional physiotherapy in the comfort of your own home. No GP referral needed.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
            <Link href="/booking" style={{
              display: 'inline-flex', alignItems: 'center', gap: 9,
              background: '#10b981', color: '#fff', fontWeight: 700,
              border: 'none', borderRadius: 12, padding: '16px 32px', fontSize: 17,
              cursor: 'pointer', boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
              transition: 'background 0.15s, transform 0.15s', textDecoration: 'none'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#34d399'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.transform = 'none'; }}
            >
              <Calendar size={18} /> Book Your Appointment
            </Link>
            <a href="tel:1300433233" style={{
              display: 'inline-flex', alignItems: 'center', gap: 9,
              background: 'rgba(255,255,255,0.08)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.18)', borderRadius: 12,
              padding: '16px 32px', fontSize: 17, cursor: 'pointer',
              transition: 'background 0.15s', textDecoration: 'none'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            >
              <Phone size={18} /> 1300 433 233
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

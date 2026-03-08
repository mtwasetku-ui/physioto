"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// Map condition label → blog slug (null = no matching post, renders as plain text)
const CONDITION_LINKS: Record<string, string | null> = {
  // Musculoskeletal
  'Lower back pain':          'lower-back-pain-home-treatment',
  'Neck pain & stiffness':    'neck-pain-cervicogenic-headache-home-physiotherapy',
  'Shoulder impingement':     'rotator-cuff-shoulder-rehabilitation',
  'Hip & knee pain':          'knee-osteoarthritis-home-physiotherapy',
  'Sciatica':                 'sciatica-lumbar-radiculopathy-home-physiotherapy',
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
};

const services = [
  {
    id: 'musculoskeletal',
    name: 'Musculoskeletal Pain',
    photo: 'https://images.unsplash.com/photo-1620815952154-0f6f1b5d47e7?auto=format&fit=crop&w=800&q=80',
    summary: 'Back, neck, hip, shoulder and joint pain treated with hands-on manual therapy and targeted exercise, adapted to your home environment.',
    detail: 'We assess and treat the full spectrum of musculoskeletal conditions — from acute injuries to long-standing chronic pain. Treatment is tailored to your home, using your furniture, floor space, and daily routines as part of the rehabilitation process.',
    conditions: ['Lower back pain', 'Neck pain & stiffness', 'Shoulder impingement', 'Hip & knee pain', 'Sciatica', 'Sports injuries'],
  },
  {
    id: 'post-surgery',
    name: 'Post-Surgery Rehabilitation',
    photo: 'https://images.unsplash.com/photo-1576669801775-ff43c5ab079d?auto=format&fit=crop&w=800&q=80',
    summary: 'Expert recovery support following joint replacements, fractures, and orthopaedic surgery — progressing you safely toward full independence.',
    detail: 'Recovering at home after surgery is most effective when guided by an experienced physiotherapist who can see your actual environment. We develop a progressive program that rebuilds strength, mobility, and confidence — right where you live.',
    conditions: ['Hip replacement', 'Knee replacement', 'Rotator cuff repair', 'Spinal surgery', 'Fracture recovery', 'ACL reconstruction'],
  },
  {
    id: 'falls-prevention',
    name: 'Falls Prevention',
    photo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
    summary: 'Comprehensive balance and strength assessment in your own home, followed by a structured program designed to meaningfully reduce falls risk.',
    detail: 'Falls are a leading cause of injury in older Australians — but most are preventable. We assess your balance, strength, gait, and home hazards, then design a personalised program to address your specific risk factors.',
    conditions: ['Balance impairment', 'Dizziness & vertigo', 'Recurrent falls', 'Fear of falling', "Parkinson's disease", 'Post-stroke balance issues'],
  },
  {
    id: 'neurological',
    name: 'Neurological Rehabilitation',
    photo: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=800&q=80',
    summary: "Specialised rehabilitation for stroke, Parkinson's disease, multiple sclerosis, and other neurological conditions — delivered at home.",
    detail: 'Neurological rehabilitation requires consistency and a familiar environment. Treating you at home allows us to address the real functional challenges you face each day. We use evidence-based techniques to maximise your independence and quality of life.',
    conditions: ['Stroke recovery', "Parkinson's disease", 'Multiple sclerosis', 'Acquired brain injury', 'Cervicogenic dizziness', 'Peripheral neuropathy'],
  },
  {
    id: 'aged-care',
    name: 'Aged Care & Mobility',
    photo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    summary: 'Compassionate, patient-centred physiotherapy for older Australians — supporting independence, dignity, and quality of life at home.',
    detail: 'We understand that maintaining independence is what matters most to older Australians and their families. Our aged care physiotherapy addresses mobility, strength, pain, and daily function — helping you or your loved one stay safely at home for longer.',
    conditions: ['Mobility decline', 'Osteoporosis', 'Osteoarthritis', 'General deconditioning', 'Aged care assessments', 'Home exercise programs'],
  },
  {
    id: 'chronic-pain',
    name: 'Chronic Pain Management',
    photo: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=800&q=80',
    summary: 'Evidence-based approaches to managing persistent pain, restoring function, and improving quality of life — without leaving home.',
    detail: 'Chronic pain is complex, but manageable. We combine hands-on treatment, graded exercise, education, and pain science to help you understand and gradually overcome persistent pain.',
    conditions: ['Fibromyalgia', 'Chronic lower back pain', 'Complex regional pain', 'Persistent joint pain', 'Post-COVID fatigue', 'Pain sensitisation'],
  },
];

const fundingOptions = [
  { emoji: '💳', label: 'Private Health Insurance', desc: 'On-the-spot rebates with HICAPS' },
  { emoji: '♿', label: 'NDIS', desc: 'Self & plan managed participants' },
  { emoji: '🎖️', label: 'DVA', desc: "Department of Veterans' Affairs" },
  { emoji: '🏥', label: 'Medicare', desc: 'Chronic Disease Management Plans' },
  { emoji: '🤝', label: 'My Aged Care', desc: 'Home Care Package support' },
  { emoji: '💰', label: 'Private Pay', desc: 'Direct billing available' },
];

const badges = ['No GP Referral Required', 'AHPRA Registered', 'Same-Week Appointments', 'NDIS Welcome'];

function CheckCircle({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ConditionItem({ label }: { label: string }) {
  const slug = CONDITION_LINKS[label];
  return (
    <li style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#475569' }}>
      <CheckCircle size={11} />
      {slug ? (
        <Link
          href={`/blog/${slug}`}
          style={{ color: '#0891b2', textDecoration: 'none', fontWeight: 500 }}
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
      <div style={{ position: 'relative', height: 260, overflow: 'hidden' }}>
        <img src={service.photo} alt={service.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.1) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 18, left: 18, right: 18 }}>
          <h3 style={{ margin: '0 0 8px', color: '#fff', fontFamily: "'Playfair Display', Georgia, serif", fontSize: 19, fontWeight: 600, lineHeight: 1.2 }}>
            {service.name}
          </h3>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.82)', fontSize: 13, lineHeight: 1.6 }}>
            {service.summary}
          </p>
        </div>
      </div>

      <div style={{ padding: '14px 18px', background: '#fff' }}>
        <button onClick={() => setOpen(o => !o)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#0891b2', fontWeight: 700, fontSize: 13, padding: 0
        }}>
          {open ? 'Show less' : 'Learn more'} <ChevronDown open={open} />
        </button>
        {open && (
          <div style={{ marginTop: 14, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
            <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: 13, lineHeight: 1.65 }}>{service.detail}</p>
            <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Conditions we treat</p>
            <ul style={{ margin: 0, padding: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', listStyle: 'none' }}>
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #f8fafc, #fff)', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&display=swap');
        .dots-bg { background-image: radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px); background-size: 24px 24px; }
        .card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
        @media (max-width: 900px) { .card-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 580px) { .card-grid { grid-template-columns: 1fr; } }
        .funding-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; }
        @media (max-width: 960px) { .funding-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 500px) { .funding-grid { grid-template-columns: repeat(2, 1fr); } }
        .fade-in { opacity: 0; transform: translateY(22px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .fade-in.in { opacity: 1; transform: none; }
      `}</style>

      {/* HERO */}
      <section className="dots-bg" style={{ background: '#0f172a', padding: '80px 24px 72px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -40, width: 380, height: 380, background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <p style={{ color: '#22d3ee', fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 16px' }}>What We Offer</p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(38px, 6vw, 58px)', color: '#fff', margin: '0 0 18px', lineHeight: 1.15 }}>
            Services <em style={{ color: '#67e8f9', fontStyle: 'italic' }}>built around you</em>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 17, lineHeight: 1.7, maxWidth: 560, margin: '0 auto 28px' }}>
            Comprehensive in-home physiotherapy across Launceston and surrounds — tailored to your condition, your home, and your goals.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
            {badges.map(b => (
              <span key={b} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 999, padding: '5px 12px', fontSize: 11.5, color: 'rgba(255,255,255,0.85)', fontWeight: 500
              }}>
                <CheckCircle size={11} />{b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 24px' }}>
        <div className={`fade-in ${visible ? 'in' : ''}`} style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ width: 48, height: 3, background: 'linear-gradient(90deg,#0891b2,#06b6d4)', borderRadius: 2, margin: '0 auto 20px' }} />
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 38px)', color: '#0f172a', margin: '0 0 10px' }}>Our Physiotherapy Services</h2>
          <p style={{ color: '#64748b', fontSize: 14, maxWidth: 480, margin: '0 auto', lineHeight: 1.65 }}>
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
      <section style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className={`fade-in ${visible ? 'in' : ''}`} style={{ textAlign: 'center', marginBottom: 40, transitionDelay: '0.3s' }}>
            <div style={{ width: 48, height: 3, background: 'linear-gradient(90deg,#0891b2,#06b6d4)', borderRadius: 2, margin: '0 auto 20px' }} />
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px, 3.5vw, 36px)', color: '#0f172a', margin: '0 0 10px' }}>Funding & Payment Options</h2>
            <p style={{ color: '#64748b', fontSize: 13.5, maxWidth: 400, margin: '0 auto' }}>We make accessing quality care as simple as possible.</p>
          </div>
          <div className="funding-grid">
            {fundingOptions.map(({ emoji, label, desc }) => (
              <div key={label} style={{
                background: '#fff', borderRadius: 16, padding: '20px 14px',
                textAlign: 'center', border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'box-shadow 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.09)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{emoji}</div>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#0f172a', fontSize: 11 }}>{label}</p>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: 10.5 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="dots-bg" style={{ background: '#0f172a', padding: '80px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -30, width: 300, height: 300, background: 'radial-gradient(circle, rgba(6,182,212,0.13) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <p style={{ color: '#22d3ee', fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 14px' }}>Get Started Today</p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(32px, 5vw, 48px)', color: '#fff', margin: '0 0 16px', lineHeight: 1.2 }}>
            Ready to begin<br /><em style={{ color: '#67e8f9' }}>your recovery?</em>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 15.5, lineHeight: 1.7, marginBottom: 36 }}>
            Book your appointment today and experience professional physiotherapy in the comfort of your own home. No GP referral needed.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <button style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#06b6d4', color: '#fff', fontWeight: 700,
              border: 'none', borderRadius: 12, padding: '14px 28px', fontSize: 15,
              cursor: 'pointer', boxShadow: '0 8px 24px rgba(6,182,212,0.3)',
              transition: 'background 0.15s, transform 0.15s'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#22d3ee'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#06b6d4'; e.currentTarget.style.transform = 'none'; }}
            >
              📅 Book Your Appointment
            </button>
            <button style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.08)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.18)', borderRadius: 12,
              padding: '14px 28px', fontSize: 15, cursor: 'pointer',
              transition: 'background 0.15s'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            >
              📞 1300 433 233
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

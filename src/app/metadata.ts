import type { Metadata } from 'next'

const BASE_URL = 'https://www.physiotohome.com'

export const homeMetadata: Metadata = {
  title: 'In-Home Physiotherapy Across Tasmania — Physio to Home',
  description: 'Physio to Home delivers professional physiotherapy to your door across Tasmania. AHPRA registered, no GP referral needed, same-week appointments. Call 1300 433 233.',
  alternates: { canonical: BASE_URL },
  openGraph: {
    title: 'In-Home Physiotherapy Across Tasmania — Physio to Home',
    description: 'Professional physiotherapy delivered to your door. No waiting rooms, no travel. Serving all of Tasmania.',
    url: BASE_URL,
    images: [{ url: '/images/og-home.jpg', width: 1200, height: 630, alt: 'Physio to Home — In-Home Physiotherapy Tasmania' }],
  },
}

export const servicesMetadata: Metadata = {
  title: 'Physiotherapy Services — In-Home Care Across Tasmania',
  description: 'Comprehensive in-home physiotherapy services across Tasmania including musculoskeletal pain, post-surgery rehab, falls prevention, neurological rehab, and aged care. No GP referral required.',
  alternates: { canonical: `${BASE_URL}/services` },
  openGraph: {
    title: 'Physiotherapy Services — In-Home Care Across Tasmania',
    description: 'Musculoskeletal pain, post-surgery rehab, falls prevention, neurological rehab and more — all delivered to your home across Tasmania.',
    url: `${BASE_URL}/services`,
  },
}

export const bookingMetadata: Metadata = {
  title: 'Book an Appointment — In-Home Physiotherapy Tasmania',
  description: 'Book your in-home physiotherapy appointment with Physio to Home. Same-week appointments available across Tasmania. NDIS, DVA, Medicare and private health accepted.',
  alternates: { canonical: `${BASE_URL}/booking` },
  openGraph: {
    title: 'Book an Appointment — Physio to Home Tasmania',
    description: 'Same-week appointments available. We come to you anywhere in Tasmania.',
    url: `${BASE_URL}/booking`,
  },
}

export const contactMetadata: Metadata = {
  title: 'Contact Us — Physio to Home Tasmania',
  description: 'Get in touch with Physio to Home. Call 1300 433 233 or send us a message. In-home physiotherapy across Tasmania — we\'re happy to discuss your needs.',
  alternates: { canonical: `${BASE_URL}/contact` },
  openGraph: {
    title: 'Contact Physio to Home — Tasmania',
    description: 'Call 1300 433 233 or send a message. In-home physiotherapy across Tasmania.',
    url: `${BASE_URL}/contact`,
  },
}

export const teamMetadata: Metadata = {
  title: 'Our Team — Experienced Physiotherapists, Physio to Home',
  description: 'Meet the Physio to Home team. AHPRA registered physiotherapists with 15+ years of experience in musculoskeletal, neurological, orthopaedic, and aged care physiotherapy across Tasmania.',
  alternates: { canonical: `${BASE_URL}/team` },
  openGraph: {
    title: 'Our Team — Physio to Home Tasmania',
    description: 'AHPRA registered physiotherapists with 15+ years experience delivering in-home care across Tasmania.',
    url: `${BASE_URL}/team`,
  },
}

export const blogMetadata: Metadata = {
  title: 'Physiotherapy Blog — Health & Wellness Insights',
  description: 'Expert physiotherapy articles, recovery tips, and health guides from the Physio to Home team. Covering back pain, falls prevention, post-surgery recovery, aged care and more.',
  alternates: { canonical: `${BASE_URL}/blog` },
  openGraph: {
    title: 'Physiotherapy Blog — Physio to Home',
    description: 'Expert physiotherapy articles and health guides from Tasmania\'s in-home physio specialists.',
    url: `${BASE_URL}/blog`,
  },
}

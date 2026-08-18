import type { Metadata } from 'next'

const BASE_URL = 'https://www.physiotohome.com'

/* -------------------------------------------------------------------------- */
/* Homepage                                                                    */
/* -------------------------------------------------------------------------- */

export const homeMetadata: Metadata = {
  title: 'Home Physiotherapy Tasmania — In-Home Care Statewide',

  description:
    'Physio to Home provides professional in-home physiotherapy across Tasmania. AHPRA-registered physiotherapists deliver personalised care for back, neck and joint pain, rehabilitation, mobility, falls prevention and neurological conditions. Call 1300 433 233.',

  alternates: {
    canonical: BASE_URL,
  },

  openGraph: {
    title: 'Home Physiotherapy Tasmania — In-Home Care Statewide',

    description:
      'Professional physiotherapy delivered to your home anywhere in Tasmania. Personalised care from AHPRA-registered physiotherapists, with same-week appointments available.',

    url: BASE_URL,

    images: [
      {
        url: '/images/og-home.jpg',
        width: 1200,
        height: 630,
        alt: 'Physio to Home — In-Home Physiotherapy Across Tasmania',
      },
    ],
  },
}

/* -------------------------------------------------------------------------- */
/* Services                                                                    */
/* -------------------------------------------------------------------------- */

export const servicesMetadata: Metadata = {
  title: 'Physiotherapy Services Across Tasmania — Home Visits',

  description:
    'Explore in-home physiotherapy services across Tasmania, including back, neck and joint pain, post-surgery rehabilitation, falls prevention, neurological rehabilitation, aged care and chronic pain management.',

  alternates: {
    canonical: `${BASE_URL}/services`,
  },

  openGraph: {
    title: 'Physiotherapy Services Across Tasmania — Home Visits',

    description:
      'Back, neck and joint pain, post-surgery rehabilitation, falls prevention, neurological rehabilitation, aged care and chronic pain care delivered in your home across Tasmania.',

    url: `${BASE_URL}/services`,
  },
}

/* -------------------------------------------------------------------------- */
/* Booking                                                                     */
/* -------------------------------------------------------------------------- */

export const bookingMetadata: Metadata = {
  title: 'Book an Appointment — Home Physiotherapy Tasmania',

  description:
    'Book an in-home physiotherapy appointment with Physio to Home. We provide physiotherapy across Tasmania, with same-week appointments available. NDIS, DVA, Medicare and private clients welcome.',

  alternates: {
    canonical: `${BASE_URL}/booking`,
  },

  openGraph: {
    title: 'Book an Appointment — Physio to Home Tasmania',

    description:
      'Book your home physiotherapy appointment with Physio to Home. Same-week appointments are available across Tasmania.',

    url: `${BASE_URL}/booking`,
  },
}

/* -------------------------------------------------------------------------- */
/* Contact                                                                     */
/* -------------------------------------------------------------------------- */

export const contactMetadata: Metadata = {
  title: 'Contact Physio to Home — Physiotherapy Across Tasmania',

  description:
    'Contact Physio to Home to discuss your physiotherapy needs or arrange a home visit. Call 1300 433 233 or send us a message. We provide in-home physiotherapy across Tasmania.',

  alternates: {
    canonical: `${BASE_URL}/contact`,
  },

  openGraph: {
    title: 'Contact Physio to Home — Tasmania',

    description:
      'Call 1300 433 233 or send us a message to discuss your physiotherapy needs. Home physiotherapy available across Tasmania.',

    url: `${BASE_URL}/contact`,
  },
}

/* -------------------------------------------------------------------------- */
/* Team                                                                        */
/* -------------------------------------------------------------------------- */

export const teamMetadata: Metadata = {
  title: 'Our Physiotherapists — AHPRA-Registered Team Tasmania',

  description:
    'Meet the Physio to Home team of AHPRA-registered physiotherapists providing personalised in-home care across Tasmania. Our clinicians have experience across musculoskeletal, neurological, orthopaedic, rehabilitation and aged care physiotherapy.',

  alternates: {
    canonical: `${BASE_URL}/team`,
  },

  openGraph: {
    title: 'Our Physiotherapists — Physio to Home Tasmania',

    description:
      'Meet our AHPRA-registered physiotherapists providing experienced, personalised home physiotherapy across Tasmania.',

    url: `${BASE_URL}/team`,
  },
}

/* -------------------------------------------------------------------------- */
/* Blog                                                                        */
/* -------------------------------------------------------------------------- */

export const blogMetadata: Metadata = {
  title: 'Physiotherapy Blog — Advice, Recovery & Health Guides',

  description:
    'Read physiotherapy advice and practical health guides from the Physio to Home team. Learn about back pain, neck pain, joint pain, falls prevention, rehabilitation, aged care, neurological conditions and more.',

  alternates: {
    canonical: `${BASE_URL}/blog`,
  },

  openGraph: {
    title: 'Physiotherapy Blog — Physio to Home',

    description:
      'Practical physiotherapy advice and health guides covering pain, rehabilitation, mobility, falls prevention, aged care and neurological conditions.',

    url: `${BASE_URL}/blog`,
  },
}

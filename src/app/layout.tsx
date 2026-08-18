import type { Metadata } from 'next'
import Script from 'next/script'
import { Suspense } from 'react'
import {
  Playfair_Display,
  Bricolage_Grotesque,
  Instrument_Sans,
} from 'next/font/google'

import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Toaster } from '@/components/ui/toaster'
import GAPageViewTracker from '@/components/GAPageViewTracker'

/* -------------------------------------------------------------------------- */
/* Fonts                                                                      */
/* -------------------------------------------------------------------------- */

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-playfair',
})

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-bricolage',
})

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-instrument-sans',
})

/* -------------------------------------------------------------------------- */
/* Site configuration                                                         */
/* -------------------------------------------------------------------------- */

const BASE_URL = 'https://www.physiotohome.com'
const GA_ID = 'G-78YHHCX8JE'
const PB_URL = 'https://physio-pb.fly.dev'

/* -------------------------------------------------------------------------- */
/* Aggregate rating                                                           */
/*                                                                            */
/* Only adds AggregateRating when real featured testimonials with ratings     */
/* are available. This avoids inventing review/rating numbers in schema.      */
/* -------------------------------------------------------------------------- */

async function getAggregateRating() {
  try {
    const res = await fetch(
      `${PB_URL}/api/collections/testimonials/records?perPage=200&filter=${encodeURIComponent(
        'featured = true'
      )}&fields=rating`,
      {
        next: {
          revalidate: 3600,
        },
      }
    )

    if (!res.ok) return null

    const data = await res.json()

    const ratings: number[] = (data.items ?? [])
      .map((item: { rating?: number }) => item.rating)
      .filter(
        (rating: unknown): rating is number =>
          typeof rating === 'number' && rating > 0
      )

    if (ratings.length === 0) return null

    const average =
      ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length

    return {
      '@type': 'AggregateRating',
      ratingValue: Number(average.toFixed(1)),
      reviewCount: ratings.length,
    }
  } catch {
    return null
  }
}

/* -------------------------------------------------------------------------- */
/* Metadata                                                                   */
/* -------------------------------------------------------------------------- */

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: 'Physio to Home — In-Home Physiotherapy Across Tasmania',
    template: '%s | Physio to Home',
  },

  description:
    'Physio to Home provides professional in-home physiotherapy across Tasmania. Our AHPRA-registered physiotherapists deliver personalised care for pain, rehabilitation, mobility, falls prevention and neurological conditions in the comfort of your home.',

  keywords: [
    'home physiotherapy Tasmania',
    'in-home physiotherapy Tasmania',
    'mobile physiotherapy Tasmania',
    'physiotherapist Tasmania',
    'physiotherapy at home Tasmania',
  ],

  authors: [
    {
      name: 'Physio to Home',
      url: BASE_URL,
    },
  ],

  creator: 'Physio to Home',
  publisher: 'Physio to Home',

  alternates: {
    canonical: BASE_URL,
  },

  openGraph: {
    siteName: 'Physio to Home',
    type: 'website',
    locale: 'en_AU',
    url: BASE_URL,
    title: 'Physio to Home — In-Home Physiotherapy Across Tasmania',
    description:
      'Professional in-home physiotherapy across Tasmania from AHPRA-registered physiotherapists. Personalised care for pain, rehabilitation, mobility and neurological conditions in your home.',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Physio to Home — In-Home Physiotherapy Across Tasmania',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Physio to Home — In-Home Physiotherapy Across Tasmania',
    description:
      'Professional in-home physiotherapy across Tasmania from AHPRA-registered physiotherapists.',
    images: ['/images/og-default.jpg'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

/* -------------------------------------------------------------------------- */
/* Structured data                                                            */
/* -------------------------------------------------------------------------- */

const TASMANIA = {
  '@type': 'State',
  name: 'Tasmania',
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',

  name: 'Physio to Home',

  description:
    'Physio to Home provides professional in-home physiotherapy across Tasmania, with AHPRA-registered physiotherapists delivering personalised care in clients’ homes, aged care facilities and other suitable locations.',

  url: BASE_URL,

  telephone: '1300433233',

  email: 'info@physiotohome.com',

  image: `${BASE_URL}/images/logo.png`,

  priceRange: '$$',

  medicalSpecialty: 'Physiotherapy',

  /* ---------------------------------------------------------------------- */
  /* Service area                                                            */
  /*                                                                        */
  /* Tasmania is the overarching service area. Specific locations are       */
  /* retained to support the actual geographic coverage described on site.  */
  /* ---------------------------------------------------------------------- */

  areaServed: [
    TASMANIA,

    /* Northern Tasmania */
    {
      '@type': 'City',
      name: 'Launceston',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Longford',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Deloraine',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'George Town',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Scottsdale',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Exeter',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Beaconsfield',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Perth',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Evandale',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Hadspen',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Legana',
      containedInPlace: TASMANIA,
    },

    /* North West Tasmania */
    {
      '@type': 'City',
      name: 'Devonport',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Burnie',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Ulverstone',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Wynyard',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Penguin',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Somerset',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Smithton',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Sheffield',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Latrobe',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Port Sorell',
      containedInPlace: TASMANIA,
    },

    /* Hobart & Southern Tasmania */
    {
      '@type': 'City',
      name: 'Hobart',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Sandy Bay',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Glenorchy',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Moonah',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'New Town',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Kingston',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Huonville',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Sorell',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Richmond',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Clarence',
      containedInPlace: TASMANIA,
    },
    {
      '@type': 'City',
      name: 'Rosny Park',
      containedInPlace: TASMANIA,
    },
  ],

  /* ---------------------------------------------------------------------- */
  /* Actual business address                                                */
  /*                                                                        */
  /* Keep this if it is your genuine business address. This does NOT mean   */
  /* that your service area is restricted to Launceston.                    */
  /* ---------------------------------------------------------------------- */

  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Launceston',
    addressRegion: 'TAS',
    postalCode: '7248',
    addressCountry: 'AU',
  },

  geo: {
    '@type': 'GeoCoordinates',
    latitude: -41.4332,
    longitude: 147.1441,
  },

  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],
      opens: '09:00',
      closes: '17:00',
    },
  ],

  sameAs: [
    'https://www.facebook.com/profile.php?id=61565914211504',
    'https://www.linkedin.com/company/physio-to-home/',
  ],
}

/* -------------------------------------------------------------------------- */
/* Root layout                                                                */
/* -------------------------------------------------------------------------- */

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const aggregateRating = await getAggregateRating()

  const businessSchema = aggregateRating
    ? {
        ...structuredData,
        aggregateRating,
      }
    : structuredData

  return (
    <html
      lang="en-AU"
      className={`${playfair.variable} ${bricolage.variable} ${instrumentSans.variable}`}
    >
      <head>
        {/* Microsoft Bing Webmaster Tools */}
        <meta
          name="msvalidate.01"
          content="EB4FA79F25221C5C5EA86027899A0790"
        />

        {/* Schema.org MedicalBusiness structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(businessSchema),
          }}
        />
      </head>

      <body className="flex min-h-screen flex-col">
        {/* ---------------------------------------------------------------- */}
        {/* Google Analytics 4                                               */}
        {/* ---------------------------------------------------------------- */}

        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />

        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];

            function gtag() {
              dataLayer.push(arguments);
            }

            gtag('js', new Date());

            gtag('config', '${GA_ID}');
          `}
        </Script>

        <Suspense fallback={null}>
          <GAPageViewTracker />
        </Suspense>

        {/* ---------------------------------------------------------------- */}
        {/* Site                                                               */}
        {/* ---------------------------------------------------------------- */}

        <Header />

        <main className="flex-grow">
          {children}
        </main>

        <Footer />

        <Toaster />
      </body>
    </html>
  )
}

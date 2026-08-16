import type { Metadata } from 'next'
import Script from 'next/script'
import { Suspense } from 'react'
import { Playfair_Display, Bricolage_Grotesque, Instrument_Sans } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Toaster } from '@/components/ui/toaster'
import GAPageViewTracker from '@/components/GAPageViewTracker'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-playfair',
})

// New homepage look (Qwen redesign) — display + body pair used by
// .font-display / .font-body in globals.css. Loaded via next/font
// rather than a <link> tag so they're self-hosted and don't block
// render, matching how Playfair is already handled above.
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

const BASE_URL = 'https://www.physiotohome.com'
const GA_ID = 'G-78YHHCX8JE'
const PB_URL = 'https://physio-pb.fly.dev'

// Computes AggregateRating from the same testimonials shown on-page (featured = true),
// so the schema never claims a rating count that isn't actually visible to visitors.
// Returns null (schema omits aggregateRating entirely) rather than a placeholder if
// the fetch fails or no rated reviews exist yet.
async function getAggregateRating() {
  try {
    const res = await fetch(
      `${PB_URL}/api/collections/testimonials/records?perPage=200&filter=${encodeURIComponent('featured = true')}&fields=rating`,
      { next: { revalidate: 3600 } } // re-check hourly rather than refetching on every request
    )
    if (!res.ok) return null

    const data = await res.json()
    const ratings: number[] = (data.items ?? [])
      .map((item: { rating?: number }) => item.rating)
      .filter((r: unknown): r is number => typeof r === 'number' && r > 0)

    if (ratings.length === 0) return null

    const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length

    return {
      '@type': 'AggregateRating',
      ratingValue: Number(average.toFixed(1)),
      reviewCount: ratings.length,
    }
  } catch {
    return null
  }
}

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Physio to Home — In-Home Physiotherapy Across Tasmania',
    template: '%s | Physio to Home',
  },
  description: 'Professional in-home physiotherapy across Tasmania, based in Launceston. AHPRA registered, no GP referral needed, same-week appointments available.',
  openGraph: {
    siteName: 'Physio to Home',
    type: 'website',
    locale: 'en_AU',
    url: BASE_URL,
    images: [{ url: '/images/og-default.jpg', width: 1200, height: 630, alt: 'Physio to Home — In-Home Physiotherapy Across Tasmania' }],
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

const TAS = { '@type': 'State', name: 'Tasmania' }

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  name: 'Physio to Home',
  description: 'AHPRA registered physiotherapist delivering expert in-home physiotherapy across Tasmania — including Launceston, Hobart, and the North West Coast.',
  url: BASE_URL,
  telephone: '1300433233',
  email: 'info@physiotohome.com',
  image: `${BASE_URL}/images/logo.png`,
  priceRange: '$$',
  areaServed: [
    // Launceston & North
    { '@type': 'City', name: 'Launceston', containedInPlace: TAS },
    { '@type': 'City', name: 'Newnham', containedInPlace: TAS },
    { '@type': 'City', name: 'Prospect', containedInPlace: TAS },
    { '@type': 'City', name: 'Kings Meadows', containedInPlace: TAS },
    { '@type': 'City', name: 'Riverside', containedInPlace: TAS },
    { '@type': 'City', name: 'Ravenswood', containedInPlace: TAS },
    { '@type': 'City', name: 'Mowbray', containedInPlace: TAS },
    { '@type': 'City', name: 'Youngtown', containedInPlace: TAS },
    { '@type': 'City', name: 'Summerhill', containedInPlace: TAS },
    { '@type': 'City', name: 'St Leonards', containedInPlace: TAS },
    { '@type': 'City', name: 'Longford', containedInPlace: TAS },
    { '@type': 'City', name: 'Deloraine', containedInPlace: TAS },
    { '@type': 'City', name: 'George Town', containedInPlace: TAS },
    { '@type': 'City', name: 'Scottsdale', containedInPlace: TAS },
    { '@type': 'City', name: 'Exeter', containedInPlace: TAS },
    { '@type': 'City', name: 'Beaconsfield', containedInPlace: TAS },
    { '@type': 'City', name: 'Perth', containedInPlace: TAS },
    { '@type': 'City', name: 'Evandale', containedInPlace: TAS },
    { '@type': 'City', name: 'Hadspen', containedInPlace: TAS },
    { '@type': 'City', name: 'Legana', containedInPlace: TAS },
    // North West Coast
    { '@type': 'City', name: 'Devonport', containedInPlace: TAS },
    { '@type': 'City', name: 'Burnie', containedInPlace: TAS },
    { '@type': 'City', name: 'Ulverstone', containedInPlace: TAS },
    { '@type': 'City', name: 'Wynyard', containedInPlace: TAS },
    { '@type': 'City', name: 'Penguin', containedInPlace: TAS },
    { '@type': 'City', name: 'Somerset', containedInPlace: TAS },
    { '@type': 'City', name: 'Smithton', containedInPlace: TAS },
    { '@type': 'City', name: 'Sheffield', containedInPlace: TAS },
    { '@type': 'City', name: 'Latrobe', containedInPlace: TAS },
    { '@type': 'City', name: 'Port Sorell', containedInPlace: TAS },
    // Hobart & South
    { '@type': 'City', name: 'Hobart', containedInPlace: TAS },
    { '@type': 'City', name: 'Sandy Bay', containedInPlace: TAS },
    { '@type': 'City', name: 'Glenorchy', containedInPlace: TAS },
    { '@type': 'City', name: 'Moonah', containedInPlace: TAS },
    { '@type': 'City', name: 'New Town', containedInPlace: TAS },
    { '@type': 'City', name: 'Kingston', containedInPlace: TAS },
    { '@type': 'City', name: 'Huonville', containedInPlace: TAS },
    { '@type': 'City', name: 'Sorell', containedInPlace: TAS },
    { '@type': 'City', name: 'Richmond', containedInPlace: TAS },
    { '@type': 'City', name: 'Clarence', containedInPlace: TAS },
    { '@type': 'City', name: 'Rosny Park', containedInPlace: TAS },
  ],
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
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], opens: '09:00', closes: '17:00' },
  ],
  medicalSpecialty: 'Physiotherapy',
  hasMap: 'https://maps.google.com/?q=Launceston+Tasmania',
  sameAs: [
    'https://www.facebook.com/profile.php?id=61565914211504',
    'https://www.linkedin.com/company/physio-to-home/',
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const aggregateRating = await getAggregateRating()
  const businessSchema = aggregateRating
    ? { ...structuredData, aggregateRating }
    : structuredData

  return (
    <html lang="en" className={`${playfair.variable} ${bricolage.variable} ${instrumentSans.variable}`}>
      <head>
        <meta name="msvalidate.01" content="EB4FA79F25221C5C5EA86027899A0790" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
        />
      </head>
      <body className="flex flex-col min-h-screen">
        {/* Google tag (gtag.js) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
        <Suspense fallback={null}>
          <GAPageViewTracker />
        </Suspense>

        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  )
}

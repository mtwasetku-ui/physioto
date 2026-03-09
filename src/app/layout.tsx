import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Toaster } from '@/components/ui/toaster'

const BASE_URL = 'https://www.physiotohome.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Physio to Home — In-Home Physiotherapy Across Tasmania',
    template: '%s | Physio to Home',
  },
  description: 'Professional in-home physiotherapy across Tasmania. AHPRA registered, no GP referral needed, same-week appointments available.',
  openGraph: {
    siteName: 'Physio to Home',
    type: 'website',
    locale: 'en_AU',
    url: BASE_URL,
    images: [{ url: '/images/og-default.jpg', width: 1200, height: 630, alt: 'Physio to Home — In-Home Physiotherapy Tasmania' }],
  },
  twitter: {
    card: 'summary_large_image',
  },
  alternates: {
    canonical: BASE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  name: 'Physio to Home',
  description: 'Professional in-home physiotherapy across Tasmania. AHPRA registered physiotherapist with 15+ years experience.',
  url: BASE_URL,
  telephone: '1300433233',
  email: 'info@physiotohome.com',
  image: `${BASE_URL}/images/logo.png`,
  priceRange: '$$',
  areaServed: {
    '@type': 'State',
    name: 'Tasmania',
    containedInPlace: {
      '@type': 'Country',
      name: 'Australia',
    },
  },
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
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '08:00', closes: '18:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '09:00', closes: '14:00' },
  ],
  medicalSpecialty: 'Physiotherapy',
  hasMap: 'https://maps.google.com/?q=Launceston+Tasmania',
  sameAs: [
    'https://www.facebook.com/physiotohome',
    'https://www.instagram.com/physiotohome',
    'https://www.linkedin.com/company/physiotohome',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  )
}

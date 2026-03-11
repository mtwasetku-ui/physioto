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
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '08:00', closes: '18:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '09:00', closes: '14:00' },
  ],
  medicalSpecialty: 'Physiotherapy',
  hasMap: 'https://maps.google.com/?q=Launceston+Tasmania',
  sameAs: [
    'https://www.facebook.com/profile.php?id=61565914211504',
    'https://www.linkedin.com/company/physio-to-home/',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="msvalidate.01" content="EB4FA79F25221C5C5EA86027899A0790" />
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

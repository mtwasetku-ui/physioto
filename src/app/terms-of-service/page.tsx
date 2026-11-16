import type { Metadata } from 'next'
import TermsOfServiceClient from './TermsOfServiceClient'

export const metadata: Metadata = {
  title: 'Terms of Service — Physio to Home',
  description: 'Read the Physio to Home Terms of Service. Understand your rights and obligations when using our in-home physiotherapy services across Tasmania.',
  alternates: { canonical: 'https://www.physiotohome.com/terms-of-service' },
  openGraph: {
    title: 'Terms of Service — Physio to Home',
    description: 'Read the terms that apply to using the Physio to Home website and physiotherapy services.',
    url: 'https://www.physiotohome.com/terms-of-service',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function TermsOfServicePage() {
  return <TermsOfServiceClient />
}

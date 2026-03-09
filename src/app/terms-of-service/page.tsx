import type { Metadata } from 'next'
import TermsOfServiceClient from './TermsOfServiceClient'

export const metadata: Metadata = {
  title: 'Terms of Service — Physio to Home',
  description: 'Read the Physio to Home Terms of Service. Understand your rights and obligations when using our in-home physiotherapy services across Tasmania.',
  alternates: { canonical: 'https://www.physiotohome.com/terms-of-service' },
  robots: { index: true, follow: true },
}

export default function TermsOfServicePage() {
  return <TermsOfServiceClient />
}

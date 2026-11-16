import type { Metadata } from 'next'
import PrivacyPolicyClient from './PrivacyPolicyClient'

export const metadata: Metadata = {
  title: 'Privacy Policy — Physio to Home',
  description: 'Read the Physio to Home Privacy Policy. Learn how we collect, use, and protect your personal information in accordance with the Australian Privacy Act 1988.',
  alternates: { canonical: 'https://www.physiotohome.com/privacy-policy' },
  openGraph: {
    title: 'Privacy Policy — Physio to Home',
    description: 'Learn how Physio to Home collects, uses and protects personal information.',
    url: 'https://www.physiotohome.com/privacy-policy',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />
}

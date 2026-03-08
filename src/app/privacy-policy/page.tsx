import type { Metadata } from 'next'
import PrivacyPolicyClient from './PrivacyPolicyClient'

export const metadata: Metadata = {
  title: 'Privacy Policy — Physio to Home',
  description: 'Read the Physio to Home Privacy Policy. Learn how we collect, use, and protect your personal information in accordance with the Australian Privacy Act 1988.',
  alternates: { canonical: 'https://www.physiotohome.com.au/privacy-policy' },
  robots: { index: true, follow: true },
}

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />
}

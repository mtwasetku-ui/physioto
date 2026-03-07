import type { Metadata } from 'next'
import { contactMetadata } from '@/app/metadata'
import ContactClient from './ContactClient'

export const metadata: Metadata = contactMetadata

export default function ContactPage() {
  return <ContactClient />
}

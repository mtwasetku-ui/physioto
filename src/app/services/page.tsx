import type { Metadata } from 'next'
import { servicesMetadata } from '@/app/metadata'
import ServicesClient from './ServicesClient'

export const metadata: Metadata = servicesMetadata

export default function ServicesPage() {
  return <ServicesClient />
}

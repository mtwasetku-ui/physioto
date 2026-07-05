import type { Metadata } from 'next'
import { homeMetadata } from '@/app/metadata'
import HomeClient from './HomeClient'

export const metadata: Metadata = homeMetadata

export default function HomePage() {
  return <HomeClient />
}

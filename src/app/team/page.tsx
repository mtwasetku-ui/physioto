import type { Metadata } from 'next'
import { teamMetadata } from '@/app/metadata'
import TeamClient from './TeamClient'

export const metadata: Metadata = teamMetadata

export default function TeamPage() {
  return <TeamClient />
}

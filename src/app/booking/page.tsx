import type { Metadata } from 'next'
import { bookingMetadata } from '@/app/metadata'
import BookingClient from './BookingClient'

export const metadata: Metadata = bookingMetadata

export default function BookingPage() {
  return <BookingClient />
}

import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'
import { authOptions } from '@/lib/auth'
import { getPatientInfo, getNextAppointment } from '@/lib/cliniko'
import PatientDetailClient from './PatientDetailClient'

export const dynamic = 'force-dynamic'

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email as string
  if (!email) redirect('/portal/login')

  const [patient, nextAppointment] = await Promise.all([
    getPatientInfo(params.id),
    getNextAppointment(params.id).catch(() => null),
  ])

  const isAdmin = email.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase()

  return (
    // PatientDetailClient reads ?appointmentId= via useSearchParams (see
    // the "Add treatment note" link from the calendar) — that hook wants
    // a Suspense boundary around it.
    <Suspense fallback={null}>
      <PatientDetailClient
        patientId={params.id}
        patient={patient}
        nextAppointment={nextAppointment}
        authorEmail={email}
        isAdmin={isAdmin}
      />
    </Suspense>
  )
}

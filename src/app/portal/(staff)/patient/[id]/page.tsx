import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { isPatientAssignedToEmail } from '@/lib/db'
import { getPatientInfo, getNextAppointment } from '@/lib/cliniko'
import PatientDetailClient from './PatientDetailClient'

export const dynamic = 'force-dynamic'

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email as string
  if (!email) redirect('/portal/login')

  // Assignment is checked server-side on every load — this is the actual
  // access gate for full patient history, not just a UI convenience.
  const assigned = await isPatientAssignedToEmail(email, params.id)
  if (!assigned) notFound()

  const [patient, nextAppointment] = await Promise.all([
    getPatientInfo(params.id),
    getNextAppointment(params.id).catch(() => null),
  ])

  const isAdmin = email.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase()

  return (
    <PatientDetailClient
      patientId={params.id}
      patient={patient}
      nextAppointment={nextAppointment}
      authorEmail={email}
      isAdmin={isAdmin}
    />
  )
}


import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import PatientSearch from '@/components/portal/PatientSearch'
import MyPatientsList from '@/components/portal/MyPatientsList'
import { authOptions } from '@/lib/auth'
import { listAssignmentsForEmail } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function PortalHomePage() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) redirect('/portal/login')

  const rawAssignments = await listAssignmentsForEmail(email)
  // Reshape to generic field names before this reaches the client — the
  // raw rows carry cliniko_patient_id, which would otherwise ship to the
  // browser as-is via the RSC payload (Final Agreement §4: practitioner-
  // facing surfaces, including anything visible in devtools, never name
  // the backend system).
  const assignments = (rawAssignments as any[]).map((a) => ({
    id: a.id,
    patientId: a.cliniko_patient_id,
    patientLabel: a.patient_label,
  }))

  const count = assignments.length

  return (
    <div className="max-w-3xl">
      <h1 className="serif text-3xl text-foreground">My patients</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        {count === 0 ? 'No patients assigned yet' : `${count} ${count === 1 ? 'patient' : 'patients'} assigned to you`}
      </p>

      <PatientSearch />

      <MyPatientsList assignments={assignments} />
    </div>
  )
}


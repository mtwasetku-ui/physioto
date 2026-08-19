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

  const assignments = await listAssignmentsForEmail(email)

  return (
    <div>
      <h1 className="serif text-2xl text-foreground font-semibold mb-1">My patients</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Patients assigned to you. Open one to view their details, write treatment notes, view
        attachments and book visits.
      </p>

      <MyPatientsList assignments={assignments as any} />

      <h2 className="serif text-lg text-foreground font-semibold mb-1">Find a patient</h2>
      <p className="text-muted-foreground text-sm mb-4">
        Search by name to open any patient&apos;s record — for example a new referral that hasn&apos;t
        been assigned to you yet. Booking a visit for them adds them to your patient list above.
      </p>

      <PatientSearch />
    </div>
  )
}

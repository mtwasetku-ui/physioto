import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User, ChevronRight } from 'lucide-react'
import PatientSearch from '@/components/portal/PatientSearch'
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

      {assignments.length === 0 ? (
        <div className="bg-secondary/40 border border-border rounded-lg p-5 text-sm text-muted-foreground mb-10">
          No patients are assigned to you yet. Ask Micheal to assign one, or use the search below to
          open a patient directly.
        </div>
      ) : (
        <div className="mb-10 bg-white border border-border rounded-lg divide-y divide-border overflow-hidden">
          {assignments.map((a: any) => (
            <Link
              key={a.id}
              href={`/portal/patient/${a.cliniko_patient_id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="font-medium text-foreground">{a.patient_label || 'Unnamed patient'}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}

      <h2 className="serif text-lg text-foreground font-semibold mb-1">Find a patient</h2>
      <p className="text-muted-foreground text-sm mb-4">
        Search by name to open any patient&apos;s record — for example a new referral that hasn&apos;t
        been assigned to you yet.
      </p>

      <PatientSearch />
    </div>
  )
}

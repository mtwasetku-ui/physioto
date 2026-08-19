import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import PatientSearch from '@/components/portal/PatientSearch'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function PortalHomePage() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) redirect('/portal/login')

  return (
    <div>
      <h1 className="serif text-2xl text-foreground font-semibold mb-1">Find a patient</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Search for any patient in Cliniko and open their portal record.
      </p>

      <PatientSearch />

      <div className="bg-secondary/40 border border-border rounded-lg p-5 text-sm text-muted-foreground">
        <strong className="text-foreground">No assignment needed.</strong> Once you find the patient,
        you can view their details, write treatment notes, view attachments and book visits.
      </div>
    </div>
  )
}

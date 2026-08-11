import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { ChevronRight, User } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { listAssignmentsForEmail } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function PortalHomePage() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email as string
  const assignments = await listAssignmentsForEmail(email)

  return (
    <div>
      <h1 className="serif text-2xl text-foreground font-semibold mb-1">Your patients</h1>
      <p className="text-muted-foreground text-sm mb-6">Signed in as {email}</p>

      {assignments.length === 0 ? (
        <div className="bg-white border border-border rounded-lg p-8 text-center text-muted-foreground">
          You don&apos;t have any assigned patients yet. Contact Micheal to be assigned.
        </div>
      ) : (
        <div className="bg-white border border-border rounded-lg divide-y divide-border">
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
                <span className="font-medium text-foreground">
                  {a.patient_label || `Patient ${a.cliniko_patient_id}`}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

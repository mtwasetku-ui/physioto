import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { ChevronRight, User, Clock } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { listAssignmentsForEmail } from '@/lib/db'
import { getNextAppointment } from '@/lib/cliniko'

export const dynamic = 'force-dynamic'

function isToday(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

export default async function PortalHomePage() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email as string
  const assignments = await listAssignmentsForEmail(email)

  // One Cliniko call per assigned patient — fine at the scale a single
  // contractor physio's patient list runs at (a handful to a few dozen).
  // Would need batching if that ever grows into the hundreds.
  const withNextVisit = await Promise.all(
    assignments.map(async (a: any) => ({
      ...a,
      nextAppointment: await getNextAppointment(a.cliniko_patient_id).catch(() => null),
    }))
  )

  const byTime = (a: any, b: any) =>
    new Date(a.nextAppointment.starts_at).getTime() - new Date(b.nextAppointment.starts_at).getTime()

  const todays = withNextVisit
    .filter((a) => a.nextAppointment && isToday(a.nextAppointment.starts_at))
    .sort(byTime)

  const rest = withNextVisit
    .filter((a) => !(a.nextAppointment && isToday(a.nextAppointment.starts_at)))
    .sort((a, b) => {
      if (a.nextAppointment && b.nextAppointment) return byTime(a, b)
      if (a.nextAppointment) return -1
      if (b.nextAppointment) return 1
      return (a.patient_label || '').localeCompare(b.patient_label || '')
    })

  return (
    <div>
      <h1 className="serif text-2xl text-foreground font-semibold mb-1">Your patients</h1>
      <p className="text-muted-foreground text-sm mb-6">Signed in as {email}</p>

      {assignments.length === 0 ? (
        <div className="bg-white border border-border rounded-lg p-8 text-center text-muted-foreground">
          You don&apos;t have any assigned patients yet. Contact Micheal to be assigned.
        </div>
      ) : (
        <>
          {todays.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Today&apos;s visits
              </h2>
              <PatientList assignments={todays} />
            </div>
          )}

          <div>
            {todays.length > 0 && (
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                All patients
              </h2>
            )}
            <PatientList assignments={rest} />
          </div>
        </>
      )}
    </div>
  )
}

function PatientList({ assignments }: { assignments: any[] }) {
  return (
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
          <div className="flex items-center gap-3">
            {a.nextAppointment && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {new Date(a.nextAppointment.starts_at).toLocaleString('en-AU', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>
      ))}
    </div>
  )
}

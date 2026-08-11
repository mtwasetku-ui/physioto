import { listAllowedEmails, listAllAssignments } from '@/lib/db'
import AdminClient from './AdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [emails, assignments] = await Promise.all([listAllowedEmails(), listAllAssignments()])
  return <AdminClient initialEmails={emails as any} initialAssignments={assignments as any} />
}

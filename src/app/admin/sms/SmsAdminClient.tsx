import { listOpenSmsRequests, listRecentlyClosedSmsRequests } from '@/lib/db'
import SmsAdminClient from './SmsAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminSmsPage() {
  const [open, closed] = await Promise.all([listOpenSmsRequests(), listRecentlyClosedSmsRequests()])
  return <SmsAdminClient initialOpen={open as any} initialClosed={closed as any} />
}

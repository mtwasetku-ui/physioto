import DiaryClient from './DiaryClient'
import DashboardBanner from '@/components/portal/DashboardBanner'

export const dynamic = 'force-dynamic'

export default function DiaryPage() {
  return (
    <>
      <DashboardBanner />
      <DiaryClient />
    </>
  )
}

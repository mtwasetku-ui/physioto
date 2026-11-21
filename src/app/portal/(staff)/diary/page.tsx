import DiaryClient from './DiaryClient'
import LatestAnnouncement from '@/components/portal/LatestAnnouncement'

export const dynamic = 'force-dynamic'

export default function DiaryPage() {
  return (
    <>
      <LatestAnnouncement />
      <DiaryClient />
    </>
  )
}

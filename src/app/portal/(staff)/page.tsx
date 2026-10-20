import { redirect } from 'next/navigation'

// The portal's landing page is the calendar. The patient list lives at
// /portal/patients. Auth is enforced by middleware before this runs, so a
// plain redirect is enough (login, the logo link and the post-password-change
// redirect all land here and end up on the calendar).
export default function PortalHomePage() {
  redirect('/portal/diary')
}

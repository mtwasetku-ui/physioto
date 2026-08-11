'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export default function PortalSignOutButton() {
  return (
    <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/portal/login' })}>
      Sign out
    </Button>
  )
}

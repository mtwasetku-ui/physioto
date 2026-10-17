'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PortalSignOutButton({ className }: { className?: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={() => signOut({ callbackUrl: '/portal/login' })}
    >
      <LogOut className="mr-2 h-4 w-4" aria-hidden />
      Sign out
    </Button>
  )
}


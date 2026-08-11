'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/portal'
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    const res = await signIn('email', { email, callbackUrl, redirect: false })
    if (res?.error) {
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image src="/images/logo.png" alt="Physio to Home" width={56} height={56} />
          <h1 className="serif text-2xl text-primary font-semibold mt-4">Staff Portal</h1>
          <p className="text-muted-foreground text-sm mt-1 text-center">
            Sign in with your work email to log treatment notes
          </p>
        </div>

        {status === 'sent' ? (
          <div className="bg-secondary border border-border rounded-lg p-6 text-center">
            <p className="text-secondary-foreground font-medium">Check your email</p>
            <p className="text-muted-foreground text-sm mt-2">
              We sent a sign-in link to <span className="font-medium">{email}</span>. It expires in 15 minutes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-border rounded-lg p-6 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-foreground block mb-1.5">
                Work email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@physiotohome.com"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            {status === 'error' && (
              <p className="text-destructive text-sm">
                That email isn&apos;t on the staff list yet. Contact Micheal to be added.
              </p>
            )}
            <Button type="submit" className="w-full" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending link…' : 'Send sign-in link'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

function LoginFormFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image src="/images/logo.png" alt="Physio to Home" width={56} height={56} />
          <h1 className="serif text-2xl text-primary font-semibold mt-4">Staff Portal</h1>
        </div>
      </div>
    </div>
  )
}

export default function PortalLoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  )
}

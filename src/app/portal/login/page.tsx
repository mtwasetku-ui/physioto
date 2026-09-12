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
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    const res = await signIn('credentials', { email, password, callbackUrl, redirect: false })
    if (res?.error) {
      setStatus('error')
      return
    }
    if (res?.url) {
      window.location.href = res.url
      return
    }
    setStatus('idle')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image src="/images/logo.png" alt="Physio to Home" width={56} height={56} />
          <h1 className="serif text-2xl text-primary font-semibold mt-4">Staff Portal</h1>
          <p className="text-muted-foreground text-sm mt-1 text-center">
            Sign in with your work email and password to log treatment notes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-border rounded-lg p-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-foreground block mb-1.5">
              Work email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@physiotohome.com"
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-foreground block mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          {status === 'error' && (
            <p className="text-destructive text-sm">
              That email/password combination isn&apos;t recognised. Contact Micheal if you need access or a
              password reset.
            </p>
          )}
          <Button type="submit" className="w-full" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
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

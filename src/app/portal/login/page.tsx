'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

// Two panels on desktop (brand on the left, form on the right); on a phone
// the brand panel collapses to a slim band above the form.
function LoginShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr] lg:grid-cols-[5fr_6fr] lg:grid-rows-1">
      <div className="bg-[var(--portal-ink)] px-6 py-5 text-white lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt=""
            width={96}
            height={96}
            className="h-10 w-10 object-contain lg:h-24 lg:w-24"
            priority
          />
          <span className="font-display text-base font-semibold lg:hidden">Physio to Home</span>
        </div>
        <p className="font-display hidden max-w-sm text-4xl font-semibold leading-[1.15] tracking-tight lg:block">
          Your patients, treatment notes and calendar.
        </p>
      </div>

      <div className="flex items-start justify-center bg-white px-6 pb-16 pt-10 lg:items-center lg:py-14">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}

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

  const fieldClass =
    'h-12 w-full rounded-md border border-input bg-white px-3 text-base placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'

  return (
    <LoginShell>
      <h1 className="serif text-3xl text-foreground">Staff portal</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in with your work email and password.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
            Work email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@physiotohome.com"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
          />
        </div>

        {status === 'error' && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            That email and password don&apos;t match. Check them and try again, or contact Micheal if you need
            access or a password reset.
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </LoginShell>
  )
}

function LoginFormFallback() {
  return (
    <LoginShell>
      <h1 className="serif text-3xl text-foreground">Staff portal</h1>
    </LoginShell>
  )
}

export default function PortalLoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  )
}


'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

function AccountForm() {
  const searchParams = useSearchParams()
  const forced = searchParams.get('forced') === '1'

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setStatus('error')
      setError("New password and confirmation don't match")
      return
    }

    setStatus('submitting')
    try {
      const res = await fetch('/api/portal/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus('error')
        setError(data?.error || 'Failed to change password')
        return
      }
      setStatus('success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      if (forced) {
        // The temp password has now been rotated (see the API route,
        // which clears must_change_password on success) — safe to leave
        // this page. A hard navigation rather than router.push so the
        // next request re-runs middleware with the now-cleared flag,
        // instead of relying on stale client-side router state.
        window.location.href = '/portal'
      }
    } catch {
      setStatus('error')
      setError('Network error — please try again')
    }
  }

  return (
    <div className="max-w-sm">
      <h1 className="serif text-2xl text-primary font-semibold mb-1">Change password</h1>
      <p className="text-muted-foreground text-sm mb-6">Update the password you use to sign in to the Staff Portal.</p>

      {forced && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-900">
          You're signing in with a temporary password. Please set your own before continuing.
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-border rounded-lg p-6 space-y-4">
        <div>
          <label htmlFor="currentPassword" className="text-sm font-medium text-foreground block mb-1.5">
            Current password
          </label>
          <input
            id="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {forced && (
            <p className="text-xs text-muted-foreground mt-1">
              This is the temporary password from Micheal's email.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="newPassword" className="text-sm font-medium text-foreground block mb-1.5">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground mt-1">At least 8 characters.</p>
        </div>
        <div>
          <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground block mb-1.5">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {status === 'error' && error && <p className="text-destructive text-sm">{error}</p>}
        {status === 'success' && !forced && <p className="text-emerald-700 text-sm">Password updated.</p>}

        <Button type="submit" className="w-full" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="max-w-sm" />}>
      <AccountForm />
    </Suspense>
  )
}

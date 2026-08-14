'use client'

import { useEffect, useRef, useState } from 'react'
import { Trash2, Plus, Search, Mail, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AllowedEmail {
  id: number
  email: string
  display_name: string | null
  created_at: string
}
interface Assignment {
  id: number
  email: string
  cliniko_patient_id: string
  patient_label: string | null
  created_at: string
}
interface PatientResult {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string | null
}

export default function AdminClient({
  initialEmails,
  initialAssignments,
}: {
  initialEmails: AllowedEmail[]
  initialAssignments: Assignment[]
}) {
  const [emails, setEmails] = useState(initialEmails)
  const [assignments, setAssignments] = useState(initialAssignments)

  const [newEmail, setNewEmail] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')
  const [assignEmail, setAssignEmail] = useState('')

  // Per-address invite status, keyed by email — 'sending' | 'sent' | error string.
  const [inviteStatus, setInviteStatus] = useState<Record<string, 'sending' | 'sent' | string>>({})

  async function sendInvite(email: string, displayName?: string | null) {
    setInviteStatus((s) => ({ ...s, [email]: 'sending' }))
    try {
      const res = await fetch('/api/admin/emails/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName: displayName || undefined }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setInviteStatus((s) => ({ ...s, [email]: body?.error || 'Failed to send' }))
        return
      }
      setInviteStatus((s) => ({ ...s, [email]: 'sent' }))
    } catch {
      setInviteStatus((s) => ({ ...s, [email]: 'Failed to send' }))
    }
  }

  // Patient search — replaces typing a raw Cliniko patient ID by hand.
  const [patientQuery, setPatientQuery] = useState('')
  const [patientResults, setPatientResults] = useState<PatientResult[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (selectedPatient) return // don't re-search once a patient's picked
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (patientQuery.trim().length < 2) {
      setPatientResults(null)
      return
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/admin/patients/search?q=${encodeURIComponent(patientQuery)}`)
        const data = await res.json()
        setPatientResults(data.patients || [])
      } catch {
        setPatientResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [patientQuery, selectedPatient])

  async function addEmail() {
    if (!newEmail) return
    const res = await fetch('/api/admin/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, displayName: newDisplayName || undefined }),
    })
    if (res.ok) {
      const { email } = await res.json()
      setEmails((e) => [email, ...e.filter((x) => x.email !== email.email)])
      setNewEmail('')
      setNewDisplayName('')
      sendInvite(email.email, email.display_name)
    }
  }

  async function removeEmail(email: string) {
    if (!confirm(`Remove ${email}? They will lose portal access and any patient assignments.`)) return
    const res = await fetch('/api/admin/emails', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (res.ok) {
      setEmails((e) => e.filter((x) => x.email !== email))
      setAssignments((a) => a.filter((x) => x.email !== email))
    }
  }

  const [manualPatientId, setManualPatientId] = useState('')

  async function addAssignment() {
    if (!assignEmail) return
    const manualId = manualPatientId.trim()
    if (!selectedPatient && !manualId) return

    const res = await fetch('/api/admin/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: assignEmail,
        clinikoPatientId: selectedPatient ? selectedPatient.id : manualId,
        patientLabel: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : undefined,
      }),
    })
    if (res.ok) {
      const { assignment } = await res.json()
      setAssignments((a) => [assignment, ...a.filter((x) => x.id !== assignment.id)])
      setSelectedPatient(null)
      setPatientQuery('')
      setPatientResults(null)
      setManualPatientId('')
    }
  }

  async function removeAssignment(id: number) {
    const res = await fetch('/api/admin/assignments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setAssignments((a) => a.filter((x) => x.id !== id))
  }

  return (
    <div className="space-y-10">
      {/* Allowed emails */}
      <section>
        <h2 className="serif text-xl text-foreground font-semibold mb-1">Staff allowed to sign in</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Only these emails can request a magic sign-in link. Adding someone here does not give them access to any
          patient — that&apos;s controlled separately below.
        </p>

        <div className="bg-white border border-border rounded-lg p-4 flex flex-col sm:flex-row gap-2 mb-4">
          <input
            placeholder="physio@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm"
          />
          <input
            placeholder="Display name (optional)"
            value={newDisplayName}
            onChange={(e) => setNewDisplayName(e.target.value)}
            className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm"
          />
          <Button onClick={addEmail}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        <div className="bg-white border border-border rounded-lg divide-y divide-border">
          {emails.length === 0 && <div className="p-4 text-sm text-muted-foreground">No staff added yet.</div>}
          {emails.map((e) => {
            const status = inviteStatus[e.email]
            return (
              <div key={e.email} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-foreground">{e.email}</div>
                  {e.display_name && <div className="text-xs text-muted-foreground">{e.display_name}</div>}
                  {status === 'sending' && <div className="text-xs text-muted-foreground mt-0.5">Sending invite…</div>}
                  {status === 'sent' && (
                    <div className="text-xs text-emerald-700 mt-0.5 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Invite sent
                    </div>
                  )}
                  {status && status !== 'sending' && status !== 'sent' && (
                    <div className="text-xs text-destructive mt-0.5">{status}</div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => sendInvite(e.email, e.display_name)}
                    disabled={status === 'sending'}
                    className="text-xs text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {status === 'sent' ? 'Resend' : 'Send invite'}
                  </button>
                  <button onClick={() => removeEmail(e.email)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Patient assignments */}
      <section>
        <h2 className="serif text-xl text-foreground font-semibold mb-1">Patient assignments</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Which Cliniko patient(s) each physio can see full history for, write notes on, and manage attachments for.
        </p>

        <div className="bg-white border border-border rounded-lg p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={assignEmail}
              onChange={(e) => setAssignEmail(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Select staff…</option>
              {emails.map((e) => (
                <option key={e.email} value={e.email}>
                  {e.display_name || e.email}
                </option>
              ))}
            </select>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search patients by name…"
                value={selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : patientQuery}
                onChange={(e) => {
                  setSelectedPatient(null)
                  setPatientQuery(e.target.value)
                }}
                className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm"
              />
              {!selectedPatient && (patientResults || searching) && patientQuery.trim().length >= 2 && (
                <div className="absolute z-10 top-11 left-0 right-0 bg-white border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {searching && <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>}
                  {!searching && patientResults?.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No matching patients in Cliniko.</div>
                  )}
                  {!searching &&
                    patientResults?.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatient(p)
                          setPatientResults(null)
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 border-b border-border last:border-b-0"
                      >
                        <div className="font-medium text-foreground">
                          {p.firstName} {p.lastName}
                        </div>
                        {p.dateOfBirth && (
                          <div className="text-xs text-muted-foreground">DOB {p.dateOfBirth}</div>
                        )}
                      </button>
                    ))}
                </div>
              )}
            </div>

            <Button onClick={addAssignment} disabled={!assignEmail || (!selectedPatient && !manualPatientId.trim())}>
              <Plus className="h-4 w-4 mr-1" /> Assign
            </Button>
          </div>
          {selectedPatient && (
            <p className="text-xs text-muted-foreground mt-2">
              Cliniko ID {selectedPatient.id} — clear the search box to pick someone else.
            </p>
          )}

          {!selectedPatient && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">or enter a Cliniko patient ID directly:</span>
              <input
                placeholder="e.g. 1234567"
                value={manualPatientId}
                onChange={(e) => setManualPatientId(e.target.value)}
                className="h-8 w-32 px-2 rounded-md border border-input bg-background text-xs"
              />
            </div>
          )}
        </div>

        <div className="bg-white border border-border rounded-lg divide-y divide-border">
          {assignments.length === 0 && <div className="p-4 text-sm text-muted-foreground">No assignments yet.</div>}
          {assignments.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm font-medium text-foreground">
                  {a.patient_label || `Patient ${a.cliniko_patient_id}`}
                  <span className="text-muted-foreground font-normal"> → {a.email}</span>
                </div>
                <div className="text-xs text-muted-foreground">Cliniko ID: {a.cliniko_patient_id}</div>
              </div>
              <button onClick={() => removeAssignment(a.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

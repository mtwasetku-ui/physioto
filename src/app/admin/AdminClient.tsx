'use client'

import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
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
  const [assignPatientId, setAssignPatientId] = useState('')
  const [assignLabel, setAssignLabel] = useState('')

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

  async function addAssignment() {
    if (!assignEmail || !assignPatientId) return
    const res = await fetch('/api/admin/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: assignEmail, clinikoPatientId: assignPatientId, patientLabel: assignLabel || undefined }),
    })
    if (res.ok) {
      const { assignment } = await res.json()
      setAssignments((a) => [assignment, ...a.filter((x) => x.id !== assignment.id)])
      setAssignPatientId('')
      setAssignLabel('')
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
          {emails.map((e) => (
            <div key={e.email} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm font-medium text-foreground">{e.email}</div>
                {e.display_name && <div className="text-xs text-muted-foreground">{e.display_name}</div>}
              </div>
              <button onClick={() => removeEmail(e.email)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Patient assignments */}
      <section>
        <h2 className="serif text-xl text-foreground font-semibold mb-1">Patient assignments</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Which Cliniko patient(s) each physio can see full history for, write notes on, and manage attachments for.
        </p>

        <div className="bg-white border border-border rounded-lg p-4 flex flex-col sm:flex-row gap-2 mb-4">
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
          <input
            placeholder="Cliniko patient ID"
            value={assignPatientId}
            onChange={(e) => setAssignPatientId(e.target.value)}
            className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm"
          />
          <input
            placeholder="Patient name (optional, display only)"
            value={assignLabel}
            onChange={(e) => setAssignLabel(e.target.value)}
            className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm"
          />
          <Button onClick={addAssignment}>
            <Plus className="h-4 w-4 mr-1" /> Assign
          </Button>
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

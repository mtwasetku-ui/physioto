'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { User, ChevronRight, X, Loader2 } from 'lucide-react'

type Assignment = {
  id: number
  cliniko_patient_id: string
  patient_label: string | null
}

export default function MyPatientsList({ assignments }: { assignments: Assignment[] }) {
  const router = useRouter()
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function remove(a: Assignment) {
    const label = a.patient_label || 'this patient'
    if (!confirm(`Remove ${label} from your patient list? You can re-add them by booking a visit again.`)) return

    setRemovingId(a.id)
    setError(null)
    try {
      const res = await fetch('/api/portal/assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinikoPatientId: a.cliniko_patient_id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Could not remove patient')
      }
      router.refresh()
    } catch (e: any) {
      setError(e?.message || 'Could not remove patient')
      setRemovingId(null)
    }
  }

  if (assignments.length === 0) {
    return (
      <div className="bg-secondary/40 border border-border rounded-lg p-5 text-sm text-muted-foreground mb-10">
        No patients are assigned to you yet. Ask Micheal to assign one, book a visit for a patient
        you find below, or use the search below to open a patient directly.
      </div>
    )
  }

  return (
    <div className="mb-10">
      {error && <p className="text-destructive text-sm mb-2">{error}</p>}
      <div className="bg-white border border-border rounded-lg divide-y divide-border overflow-hidden">
        {assignments.map((a) => (
          <div key={a.id} className="flex items-center justify-between px-5 py-4 hover:bg-secondary/50 transition-colors">
            <Link href={`/portal/patient/${a.cliniko_patient_id}`} className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="font-medium text-foreground truncate">{a.patient_label || 'Unnamed patient'}</div>
            </Link>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => remove(a)}
                disabled={removingId === a.id}
                aria-label={`Remove ${a.patient_label || 'patient'} from your list`}
                className="p-2 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                {removingId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              </button>
              <Link href={`/portal/patient/${a.cliniko_patient_id}`} aria-hidden className="p-2">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

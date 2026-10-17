'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, X, Loader2 } from 'lucide-react'
import PatientAvatar from '@/components/portal/PatientAvatar'

type Assignment = {
  id: number
  patientId: string
  patientLabel: string | null
}

export default function MyPatientsList({ assignments }: { assignments: Assignment[] }) {
  const router = useRouter()
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function remove(a: Assignment) {
    const label = a.patientLabel || 'this patient'
    if (!confirm(`Remove ${label} from your patient list? You can re-add them by booking a visit again.`)) return

    setRemovingId(a.id)
    setError(null)
    try {
      const res = await fetch('/api/portal/assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: a.patientId }),
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
      <div className="rounded-lg border border-dashed border-input bg-white/60 p-6 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">No patients assigned yet</p>
        <p className="mt-1">
          Find a patient above and book a visit to add them to your list, or ask Micheal to assign one.
        </p>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-white">
        {assignments.map((a) => {
          const label = a.patientLabel || 'Unnamed patient'
          return (
            <li key={a.id} className="flex items-stretch transition-colors hover:bg-secondary/40">
              <Link
                href={`/portal/patient/${a.patientId}`}
                className="flex min-h-[64px] min-w-0 flex-1 items-center gap-3 px-4 py-3"
              >
                <PatientAvatar label={label} />
                <span className="line-clamp-2 min-w-0 flex-1 break-words font-medium leading-snug text-foreground">{label}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
              <button
                type="button"
                onClick={() => remove(a)}
                disabled={removingId === a.id}
                aria-label={`Remove ${a.patientLabel || 'patient'} from your list`}
                className="flex w-12 shrink-0 items-center justify-center border-l border-border text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                {removingId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}


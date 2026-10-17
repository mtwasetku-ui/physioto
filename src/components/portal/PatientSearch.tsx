'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, ChevronRight, Loader2 } from 'lucide-react'
import PatientAvatar from '@/components/portal/PatientAvatar'

type Patient = {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string | null
}

export default function PatientSearch() {
  const [query, setQuery] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setPatients([])
      setLoading(false)
      setError(null)
      return
    }

    const id = ++requestId.current
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/portal/patients/search?q=${encodeURIComponent(term)}`)
        const data = await res.json()
        if (id !== requestId.current) return
        if (!res.ok) throw new Error(data?.error || 'Search failed')
        setPatients(data.patients || [])
      } catch (e: any) {
        if (id === requestId.current) {
          setPatients([])
          setError(e?.message || 'Could not search patients')
        }
      } finally {
        if (id === requestId.current) setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className="mb-8">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="text"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Find a patient by first or last name"
          placeholder="Find any patient by name"
          className="h-14 w-full rounded-lg border border-input bg-white pl-12 pr-11 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          autoComplete="off"
        />
        {loading && (
          <Loader2
            className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-label="Searching"
          />
        )}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Includes patients not assigned to you. Booking a visit adds them to your list.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {query.trim().length >= 2 && !loading && !error && (
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          {patients.length === 0 ? (
            <li className="px-5 py-4 text-sm text-muted-foreground">
              No patients match &ldquo;{query.trim()}&rdquo;. Try a different spelling or just the last name.
            </li>
          ) : (
            patients.map((patient) => {
              const fullName = `${patient.firstName} ${patient.lastName}`
              return (
                <li key={patient.id}>
                  <Link
                    href={`/portal/patient/${patient.id}`}
                    className="flex min-h-[60px] items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/60"
                  >
                    <PatientAvatar label={fullName} />
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 break-words font-medium leading-snug text-foreground">{fullName}</div>
                      {patient.dateOfBirth && (
                        <div className="text-xs text-muted-foreground">
                          Born {new Date(patient.dateOfBirth).toLocaleDateString('en-AU')}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}


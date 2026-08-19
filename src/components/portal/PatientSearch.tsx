'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, User, ChevronRight, Loader2 } from 'lucide-react'

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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search patient by first or last name…"
          className="w-full h-12 pl-10 pr-10 rounded-lg border border-input bg-white text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {error && <p className="text-destructive text-sm mt-2">{error}</p>}

      {query.trim().length >= 2 && !loading && !error && (
        <div className="mt-2 bg-white border border-border rounded-lg divide-y divide-border overflow-hidden">
          {patients.length === 0 ? (
            <div className="px-5 py-4 text-sm text-muted-foreground">No patients found.</div>
          ) : (
            patients.map((patient) => (
              <Link
                key={patient.id}
                href={`/portal/patient/${patient.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">
                      {patient.firstName} {patient.lastName}
                    </div>
                    {patient.dateOfBirth && (
                      <div className="text-xs text-muted-foreground">
                        DOB: {new Date(patient.dateOfBirth).toLocaleDateString('en-AU')}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-2">
        Search Cliniko directly — no patient assignment is required.
      </p>
    </div>
  )
}

// ── Travel blocks ────────────────────────────────────────────────
//
// Local-only diary markers (see schema.sql) — never touch Cliniko. Every
// function here is scoped by email so a physio can only see/move/delete
// their own travel time, mirroring the assignment-based scoping used for
// appointments elsewhere in this file.

export interface TravelBlockRow {
  id: string
  email: string
  starts_at: string
  ends_at: string
  label: string
  linked_appointment_id: string | null
  created_at: string
  updated_at: string
}

export async function listTravelBlocksForEmailInRange(
  email: string,
  fromISO: string,
  toISO: string
): Promise<TravelBlockRow[]> {
  const rows = await sql`
    select * from travel_blocks
    where email = ${email.toLowerCase()} and starts_at < ${toISO} and ends_at > ${fromISO}
    order by starts_at asc
  `
  return rows as TravelBlockRow[]
}

export async function createTravelBlock(params: {
  email: string
  startsAt: string
  endsAt: string
  label?: string
  linkedAppointmentId?: string | null
}): Promise<TravelBlockRow> {
  const rows = await sql`
    insert into travel_blocks (email, starts_at, ends_at, label, linked_appointment_id)
    values (
      ${params.email.toLowerCase()},
      ${params.startsAt},
      ${params.endsAt},
      ${params.label?.trim() || 'Travel'},
      ${params.linkedAppointmentId ?? null}
    )
    returning *, ${PG_IDENTITY_FRAGMENT}
  `
  console.log(`[db:createTravelBlock] ${dbIdentity()} email=${params.email.toLowerCase()} affected=${rows.length} id=${rows[0]?.id} pg=[${formatPgIdentity(rows[0])}]`)
  if (rows.length === 0) {
    throw new Error(`createTravelBlock: insert affected 0 rows for ${params.email} (db=${dbIdentity()})`)
  }
  return stripPgIdentity(rows[0]) as TravelBlockRow
}

// Ownership is enforced with `where email = ...` on the update/delete
// itself (not a separate select-then-check) — a travel block belonging to
// someone else simply doesn't match and the update affects 0 rows, which
// the caller reports as a 404 rather than distinguishing "not found" from
// "not yours" (no reason to leak the difference).
export async function updateTravelBlock(
  id: string,
  email: string,
  params: { startsAt?: string; endsAt?: string; label?: string }
): Promise<TravelBlockRow | null> {
  const rows = await sql`
    update travel_blocks
    set
      starts_at = coalesce(${params.startsAt ?? null}, starts_at),
      ends_at = coalesce(${params.endsAt ?? null}, ends_at),
      label = coalesce(${params.label?.trim() || null}, label),
      updated_at = now()
    where id = ${id} and email = ${email.toLowerCase()}
    returning *
  `
  return (rows[0] as TravelBlockRow | undefined) ?? null
}

export async function deleteTravelBlock(id: string, email: string): Promise<boolean> {
  const rows = await sql`
    delete from travel_blocks
    where id = ${id} and email = ${email.toLowerCase()}
    returning id
  `
  return rows.length > 0
}

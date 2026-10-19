// Tiny browser-side GET de-duper. Several panels on the patient page ask for
// the exact same URL at the same moment (and some effects re-run as state
// settles). Within a few seconds they now share ONE network request instead
// of each hitting the server — and therefore the practice system — again.
//
// Call clearCachedJson() after anything that changes the data (e.g. saving a
// note) so the next read is fresh.

const store = new Map<string, { at: number; p: Promise<any> }>()

export function cachedJson(url: string, ttlMs = 8000): Promise<any> {
  const hit = store.get(url)
  if (hit && Date.now() - hit.at < ttlMs) return hit.p
  const p = fetch(url).then(async (r) => {
    const data = await r.json()
    if (!r.ok) store.delete(url) // never keep an error response around
    return data
  })
  p.catch(() => store.delete(url))
  store.set(url, { at: Date.now(), p })
  return p
}

export function clearCachedJson(urlPrefix = '') {
  for (const key of Array.from(store.keys())) {
    if (key.startsWith(urlPrefix)) store.delete(key)
  }
}

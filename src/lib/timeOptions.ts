// 7:00am–7:00pm in 15-minute increments, e.g. "05:00" -> "5:00 AM".
// Manual-entry only (no Cliniko available_times lookup — that endpoint
// 404s whenever a type isn't individually enabled for online bookings on
// this specific business, which isn't worth chasing per-type in Cliniko's
// settings just to populate a slot picker).
export const TIME_OPTIONS: { value: string; label: string }[] = (() => {
  const opts: { value: string; label: string }[] = []
  for (let minutes = 7 * 60; minutes <= 19 * 60; minutes += 15) {
    const h24 = Math.floor(minutes / 60)
    const m = minutes % 60
    const value = `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12
    const period = h24 < 12 ? 'AM' : 'PM'
    opts.push({ value, label: `${h12}:${String(m).padStart(2, '0')} ${period}` })
  }
  return opts
})()

// Same rule middleware.ts and the other admin routes use: the signed-in
// email must equal ADMIN_EMAIL. Used by the dashboard code; never trust a
// client-side flag for this — always re-check on the server.
export function isAdminEmail(email: string | null | undefined): boolean {
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase()
  return !!email && !!adminEmail && email.toLowerCase() === adminEmail
}

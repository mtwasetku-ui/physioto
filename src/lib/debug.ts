// Diagnostic logging that is OFF by default. Set DEBUG_LOGS=1 in the Vercel
// environment variables to turn it on temporarily (e.g. when chasing a
// database or email delivery problem), then remove it again. These lines can
// include staff emails and Cliniko patient IDs, so they should not be
// written to runtime logs all the time.
export function debugLog(...args: unknown[]) {
  if (process.env.DEBUG_LOGS === '1') console.log(...args)
}

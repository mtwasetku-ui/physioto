import { createTransport } from 'nodemailer'

// Separate from the magic-link sender in lib/auth.ts (NextAuth owns that
// one's lifecycle) but reuses the exact same Zoho SMTP env vars, so there's
// only one set of credentials to manage. Used for anything that isn't a
// NextAuth verification email — right now, just the staff invite email.
function transport() {
  return createTransport({
    host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com.au',
    port: Number(process.env.ZOHO_SMTP_PORT || 465),
    secure: true,
    auth: {
      user: process.env.ZOHO_SMTP_USER,
      pass: process.env.ZOHO_SMTP_PASSWORD,
    },
  })
}

export async function sendMail(params: { to: string; subject: string; text: string; html: string }) {
  const from = process.env.ZOHO_SMTP_FROM || process.env.ZOHO_SMTP_USER
  // Same TEMP DEBUG pattern as lib/auth.ts's magic-link sender — log
  // exactly what Zoho hands back so a delivery failure shows up in Vercel's
  // runtime logs instead of just "nothing arrived". Safe to remove once
  // delivery is confirmed reliably working.
  console.log('[invite-mail] sending', { host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com.au', from, to: params.to })
  const result = await transport().sendMail({ to: params.to, from, subject: params.subject, text: params.text, html: params.html })
  console.log('[invite-mail] send result', {
    accepted: result.accepted,
    rejected: result.rejected,
    pending: result.pending,
    response: result.response,
    messageId: result.messageId,
  })
  const failed = result.rejected.concat(result.pending).filter(Boolean)
  if (failed.length) {
    throw new Error(`Email (${failed.join(', ')}) could not be sent`)
  }
  return result
}

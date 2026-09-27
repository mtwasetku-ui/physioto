// src/app/api/booking/route.ts
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendMail } from "@/lib/mail";

export async function POST(req: Request) {
  const { name, email, phone, service, preferredDate, preferredTime, notes, honeypot } = await req.json();

  // Honeypot: real visitors never fill this hidden field, so a
  // non-empty value means a bot. Pretend success and drop it silently.
  if (honeypot) return NextResponse.json({ ok: true });

  if (!name || !email || !phone || !service) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await sql`
    insert into booking_requests (name, email, phone, service, preferred_date, preferred_time, notes)
    values (${name}, ${email}, ${phone}, ${service}, ${preferredDate ?? null}, ${preferredTime ?? null}, ${notes ?? null})
  `;

  const text = `New booking request from the website

Name: ${name}
Phone: ${phone}
Email: ${email}
Service: ${service}
Preferred date: ${preferredDate || 'Not specified'}
Preferred time: ${preferredTime || 'Not specified'}

Notes:
${notes || '(none)'}`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #12241D; max-width: 560px;">
      <h2 style="color: #0E2C22; margin-bottom: 4px;">New booking request</h2>
      <p style="color: #666; margin-top: 0;">Submitted via the Physio to Home booking page</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; width: 130px;">Name</td>
          <td style="padding: 6px 0;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold;">Phone</td>
          <td style="padding: 6px 0;"><a href="tel:${phone}">${phone}</a></td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold;">Email</td>
          <td style="padding: 6px 0;"><a href="mailto:${email}">${email}</a></td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold;">Service</td>
          <td style="padding: 6px 0;">${service}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold;">Preferred date</td>
          <td style="padding: 6px 0;">${preferredDate || 'Not specified'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold;">Preferred time</td>
          <td style="padding: 6px 0;">${preferredTime || 'Not specified'}</td>
        </tr>
      </table>
      <p style="font-weight: bold; margin-bottom: 4px;">Notes</p>
      <p style="white-space: pre-wrap; background: #F2EFE4; padding: 12px 16px; border-radius: 8px;">${notes || '(none)'}</p>
    </div>
  `;

  await sendMail({
    to: "info@physiotohome.com",
    replyTo: email,
    subject: `New Booking Request — ${name}`,
    text,
    html,
  });

  return NextResponse.json({ ok: true });
}

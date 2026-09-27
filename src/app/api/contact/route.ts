// src/app/api/contact/route.ts
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendMail } from "@/lib/mail";

export async function POST(req: Request) {
  const { name, email, phone, message, honeypot } = await req.json();

  // Honeypot: real visitors never fill this hidden field, so a
  // non-empty value means a bot. Pretend success and drop it silently.
  if (honeypot) return NextResponse.json({ ok: true });

  if (!name || !email || !phone || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await sql`
    insert into contact_submissions (name, email, phone, message)
    values (${name}, ${email}, ${phone}, ${message})
  `;

  await sendMail({
    to: "info@physiotohome.com",
    subject: `New enquiry from ${name}`,
    text: `${name}\n${email}\n${phone}\n\n${message}`,
    html: `<p><strong>${name}</strong><br>${email}<br>${phone}</p><p>${message}</p>`,
  });

  return NextResponse.json({ ok: true });
}

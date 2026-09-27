// src/app/api/contact/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { name, email, phone, message, honeypot } = await req.json();

  if (honeypot) return NextResponse.json({ ok: true });

  if (!name || !email || !phone || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await db.query(
    `INSERT INTO contact_submissions (name, email, phone, message) VALUES ($1, $2, $3, $4)`,
    [name, email, phone, message]
  );

  await resend.emails.send({
    from: "Website <noreply@physiotohome.com>",
    to: "you@physiotohome.com",
    subject: `New enquiry from ${name}`,
    text: `${name}\n${email}\n${phone}\n\n${message}`,
  });

  return NextResponse.json({ ok: true });
}

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

  const text = `New enquiry from the website contact form

Name: ${name}
Phone: ${phone}
Email: ${email}

Message:
${message}`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #12241D; max-width: 560px;">
      <h2 style="color: #0E2C22; margin-bottom: 4px;">New website enquiry</h2>
      <p style="color: #666; margin-top: 0;">Submitted via the Physio to Home contact form</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; width: 90px;">Name</td>
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
      </table>
      <p style="font-weight: bold; margin-bottom: 4px;">Message</p>
      <p style="white-space: pre-wrap; background: #F2EFE4; padding: 12px 16px; border-radius: 8px;">${message}</p>
    </div>
  `;

  await sendMail({
    to: "info@physiotohome.com",
    replyTo: email,
    subject: `New enquiry from ${name}`,
    text,
    html,
  });

  return NextResponse.json({ ok: true });
}

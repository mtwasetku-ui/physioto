"use client";

const LAST_UPDATED = "8 March 2026";
const COMPANY = "Physio to Home";
const EMAIL = "info@physiotohome.com";
const PHONE = "1300 433 233";
const STATE = "Tasmania";

const sections = [
  {
    id: "overview",
    title: "1. Overview",
    content: `${COMPANY} ("we", "us", "our") provides in-home physiotherapy services across ${STATE}. This Privacy Policy explains how we collect, use, store, and disclose personal information — including health information — when you visit our website (physiotohome.com), make a booking, or receive treatment from us.

We are bound by the Australian Privacy Principles (APPs) contained in the Privacy Act 1988 (Cth), and by the additional protections that apply to health information as "sensitive information" under that Act.

By using our website or engaging our services, you agree to the collection and use of information as described in this Policy.`,
  },
  {
    id: "information-we-collect",
    title: "2. Information We Collect",
    content: `**Personal information you provide directly:** name, date of birth, address, phone number, email address, emergency contact details, and payment or billing information.

**Health information:** medical history, current symptoms, diagnoses, medications, referral letters, treatment notes, progress records, and other clinical information reasonably needed to assess and treat you. This is "sensitive information" under the Privacy Act and receives a higher standard of protection.

**Funding and referral information:** details needed to process claims or referrals through Medicare, DVA, NDIS, My Aged Care, WorkCover, or your private health insurer, including relevant plan or membership numbers.

**Website usage information:** pages visited, general location, device and browser type, and how you arrived at our site, collected automatically through analytics (see "Cookies & Analytics" below).

**Enquiry and booking information:** anything you submit through our contact or booking forms, including the details of your enquiry.`,
  },
  {
    id: "how-we-use",
    title: "3. How We Use Your Information",
    content: `We use the information we collect to:

- Assess, plan, and deliver physiotherapy treatment
- Schedule and manage appointments, and contact you about your bookings
- Process payments and claims with Medicare, DVA, NDIS, My Aged Care, WorkCover, and private health insurers
- Communicate with other healthcare providers involved in your care, with your consent, where clinically appropriate
- Respond to enquiries submitted through our website
- Meet our legal, clinical record-keeping, and professional (AHPRA) obligations
- Improve our website and services, including through de-identified analytics

We do not use your health information for direct marketing without your separate consent, and we do not sell your personal information to third parties.`,
  },
  {
    id: "disclosure",
    title: "4. Who We Share Information With",
    content: `We only disclose personal and health information where it is necessary to provide your care or run our practice, or where we are required to by law. This may include:

**Funding bodies:** Medicare, DVA, NDIS, My Aged Care, WorkCover, and private health insurers, for the purpose of processing claims and rebates on your behalf.

**Other healthcare providers:** your GP or specialists, with your consent, where continuity of care requires it.

**Service providers:** our practice management, scheduling, and secure clinical record-keeping systems, payment processors, and analytics providers, who are contractually required to protect your information and only use it to provide services to us.

**Regulators and authorities:** AHPRA, courts, or government agencies, where required or authorised by law.

We do not disclose your health information to any other party without your consent, except as described above or where required by law.`,
  },
  {
    id: "consent",
    title: "5. Consent",
    content: `By booking or receiving treatment, you consent to us collecting and using your health information as described in this Policy for the purpose of providing physiotherapy care and processing any associated funding claims.

You may withdraw consent, or ask us to limit how your information is used, at any time — for example, by asking us not to contact a particular healthcare provider. This may affect our ability to provide certain aspects of your care, and we will explain any such impact where relevant.`,
  },
  {
    id: "storage-security",
    title: "6. Data Storage & Security",
    content: `Your clinical records and personal information are stored in secure, access-controlled systems. Access is limited to staff who need the information to provide your care or administer our services.

We take reasonable technical and organisational steps to protect your information against misuse, interference, loss, unauthorised access, modification, or disclosure — including secure hosting, restricted staff access, and the use of reputable third-party providers for practice management and clinical records.

No method of electronic storage or transmission is completely secure. While we work to protect your information, we cannot guarantee absolute security.`,
  },
  {
    id: "retention",
    title: "7. Data Retention",
    content: `We retain clinical records for the period required by Tasmanian health records law and AHPRA professional obligations — generally at least seven years from the date of your last treatment, or longer for records relating to a minor.

Other personal information, such as booking or enquiry details for people who did not become clients, is retained only as long as reasonably necessary for the purpose it was collected, and is then securely deleted or de-identified.`,
  },
  {
    id: "cookies-analytics",
    title: "8. Cookies & Analytics",
    content: `Our website uses Google Analytics to understand how visitors use our site, in an aggregated and largely de-identified form. Google Analytics uses cookies and similar technologies to collect information such as pages visited, time on site, and general location.

You can control or disable cookies through your browser settings. Doing so may affect some website functionality but will not affect your ability to contact us or book an appointment by phone.

We do not use cookies to serve targeted advertising.`,
  },
  {
    id: "access-correction",
    title: "9. Access & Correction",
    content: `You have the right to request access to the personal and health information we hold about you, and to ask us to correct it if it is inaccurate, out of date, or incomplete.

To make a request, contact us using the details below. We will respond within a reasonable timeframe, generally within 30 days. We may need to verify your identity before releasing clinical information, and in limited circumstances permitted by law, we may need to withhold or redact certain information.

There is no charge to request access to your information, though reasonable costs may apply to providing copies of extensive records.`,
  },
  {
    id: "complaints",
    title: "10. Complaints",
    content: `If you believe we have breached your privacy or mishandled your personal information, please contact us first so we can investigate and try to resolve the issue:

**Email:** ${EMAIL}
**Phone:** ${PHONE}

We will acknowledge your complaint within 5 business days and aim to resolve it within 30 days.

If you are not satisfied with our response, you can lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at oaic.gov.au, or with the Tasmanian Health Complaints Commissioner on 1800 001 170.`,
  },
  {
    id: "changes",
    title: "11. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. The "last updated" date at the top of this page shows when it was last revised. Continued use of our website or services after changes are posted constitutes acceptance of the updated Policy.`,
  },
  {
    id: "contact",
    title: "12. Contact Us",
    content: `If you have any questions about this Privacy Policy or how we handle your information, please contact us:

**Email:** ${EMAIL}
**Phone:** ${PHONE}

This Policy is governed by the laws of ${STATE}, Australia.`,
  },
];

function Section({ section }: { section: typeof sections[0] }) {
  const formatContent = (text: string) => {
    return text.split("\n\n").map((para, i) => {
      if (para.startsWith("- ")) {
        const items = para.split("\n").filter(l => l.startsWith("- "));
        return (
          <ul key={i} style={{ margin: "0 0 16px", paddingLeft: 20 }}>
            {items.map((item, j) => (
              <li key={j} style={{ color: "#475569", fontSize: 15, lineHeight: 1.75, marginBottom: 6 }}
                dangerouslySetInnerHTML={{ __html: item.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            ))}
          </ul>
        );
      }
      return (
        <p key={i} style={{ color: "#475569", fontSize: 15, lineHeight: 1.75, margin: "0 0 16px" }}
          dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1e293b">$1</strong>') }} />
      );
    });
  };

  return (
    <div id={section.id} style={{ marginBottom: 48, scrollMarginTop: 100 }}>
      <h2 style={{
        fontFamily: "var(--font-playfair), Georgia, serif",
        fontSize: 22, fontWeight: 600, color: "#0f172a",
        margin: "0 0 16px", paddingBottom: 10,
        borderBottom: "1px solid #e2e8f0"
      }}>
        {section.title}
      </h2>
      {formatContent(section.content)}
    </div>
  );
}

export default function PrivacyPolicyClient() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
      {/* Hero */}
      <div style={{ background: "#0f172a", padding: "80px 24px 56px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <p style={{ color: "#22d3ee", fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 14px" }}>
            Legal
          </p>
          <h1 style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: "clamp(34px, 5vw, 48px)", color: "#fff",
            margin: "0 0 14px", lineHeight: 1.15
          }}>
            Privacy Policy
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 15, margin: 0 }}>
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "56px 24px 80px" }}>

        {/* Quick nav */}
        <div style={{
          background: "#fff", borderRadius: 16, padding: "24px 28px",
          border: "1px solid #e2e8f0", marginBottom: 48,
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
        }}>
          <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Contents
          </p>
          <ol style={{ margin: 0, padding: "0 0 0 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px" }}>
            {sections.map(s => (
              <li key={s.id}>
                <a href={`#${s.id}`} style={{ color: "#0891b2", fontSize: 13.5, textDecoration: "none", fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
                  {s.title.replace(/^\d+\.\s/, "")}
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* Sections */}
        {sections.map(s => <Section key={s.id} section={s} />)}

        {/* Footer note */}
        <div style={{
          background: "#f1f5f9", borderRadius: 12, padding: "20px 24px",
          borderLeft: "4px solid #0891b2", marginTop: 16
        }}>
          <p style={{ margin: 0, color: "#475569", fontSize: 13.5, lineHeight: 1.65 }}>
            <strong style={{ color: "#0f172a" }}>Note:</strong> This Privacy Policy is provided for general informational purposes. For advice specific to your situation, please consult a qualified Australian legal professional.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

const LAST_UPDATED = "8 March 2026";
const COMPANY = "Physio to Home";
const ABN = ""; // Add your ABN here
const EMAIL = "info@physiotohome.com";
const PHONE = "1300 433 233";
const ADDRESS = "Launceston, Tasmania, Australia";

const sections = [
  {
    id: "introduction",
    title: "1. Introduction",
    content: `${COMPANY} ("we", "us", "our") is committed to protecting your personal information in accordance with the Australian Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).

This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you visit our website (physiotohome.com) or use our physiotherapy services. Please read it carefully.

By using our website or services, you consent to the practices described in this policy.`,
  },
  {
    id: "collection",
    title: "2. Information We Collect",
    content: `We collect personal information that is necessary to provide our physiotherapy services and operate our website. This may include:

**Contact information** — name, email address, phone number, and home address (required to arrange home visits).

**Health information** — medical history, current conditions, medications, and details relevant to your physiotherapy treatment. This is sensitive information under the Privacy Act and is handled with the highest level of care.

**Appointment and billing information** — booking details, Medicare, DVA, NDIS, or private health insurance numbers as applicable.

**Website usage data** — IP address, browser type, pages visited, and time spent on pages, collected automatically via cookies and analytics tools (see Section 5).

We collect this information directly from you — via our website contact forms, booking system, phone calls, or in person during consultations — or in some cases from referring health professionals with your consent.`,
  },
  {
    id: "use",
    title: "3. How We Use Your Information",
    content: `We use your personal information only for the purposes for which it was collected, including:

- Providing, managing, and improving our physiotherapy services
- Scheduling and confirming appointments
- Processing payments and insurance claims (Medicare, DVA, NDIS, private health)
- Communicating with you about your care, including follow-up and appointment reminders
- Complying with our legal and professional obligations as AHPRA-registered practitioners
- Improving our website and understanding how visitors use it
- Responding to enquiries and feedback

We will not use your information for unrelated purposes without first seeking your consent.`,
  },
  {
    id: "disclosure",
    title: "4. Disclosure to Third Parties",
    content: `We do not sell, rent, or trade your personal information. We may share your information with third parties only in the following circumstances:

**Referring and treating health professionals** — with your consent, we may share clinical information with your GP, specialist, or other treating practitioners to coordinate your care.

**Funding bodies** — Medicare, DVA, NDIS, My Aged Care, or your private health insurer, as required to process claims on your behalf.

**Service providers** — trusted third-party providers who assist us in operating our business (e.g. booking software, cloud storage, email platforms). These providers are contractually required to handle your data securely and only for the purposes we specify.

**Legal requirements** — we may disclose your information if required by law, a court order, or to protect the rights and safety of our clients, staff, or the public.

All third parties we engage are required to comply with applicable Australian privacy laws.`,
  },
  {
    id: "cookies",
    title: "5. Cookies & Website Analytics",
    content: `Our website uses cookies — small text files stored on your device — to enhance your browsing experience and help us understand how our site is used.

**Types of cookies we use:**

- **Essential cookies** — necessary for the website to function (e.g. session management, form security). These cannot be disabled.
- **Analytics cookies** — we use Google Analytics to collect anonymous data about site traffic and usage patterns. This helps us improve our content and user experience. No personally identifiable information is included.
- **Preference cookies** — remember your settings and preferences across visits.

**Your choices:** You can control or disable cookies through your browser settings at any time. Note that disabling certain cookies may affect the functionality of our website.

We do not use cookies for advertising or sell cookie data to third parties.`,
  },
  {
    id: "security",
    title: "6. Data Security",
    content: `We take the security of your personal information seriously and implement reasonable technical and organisational measures to protect it from unauthorised access, misuse, loss, or disclosure.

Measures include secure HTTPS encryption on our website, access controls limiting who can view sensitive information, and using reputable, security-certified third-party platforms for data storage and communication.

Health records are retained in accordance with our obligations under the Health Records Act and AHPRA guidelines. Despite our best efforts, no data transmission over the internet is completely secure — if you have concerns, please contact us directly.`,
  },
  {
    id: "rights",
    title: "7. Your Rights — Access & Correction",
    content: `Under the Australian Privacy Act, you have the right to:

**Access** — request a copy of the personal information we hold about you. We will respond within 30 days. In some circumstances a fee may apply to cover our reasonable costs.

**Correction** — request that we correct any personal information that is inaccurate, out of date, incomplete, or misleading. We will act on reasonable correction requests promptly.

**Deletion** — in certain circumstances, you may request that we delete your personal information. Note that we are required to retain health records for a minimum period under applicable law, so not all deletion requests can be fulfilled.

**Withdrawal of consent** — where we rely on your consent to process information, you may withdraw that consent at any time, though this will not affect processing already carried out.

To exercise any of these rights, please contact us using the details in Section 9.`,
  },
  {
    id: "retention",
    title: "8. Data Retention",
    content: `We retain your personal information for as long as necessary to fulfil the purposes for which it was collected, including meeting legal, accounting, and professional obligations.

Health records are retained for a minimum of 7 years from the date of last treatment for adults, or until the age of 25 for patients who were minors at the time of treatment, in line with Australian health record requirements.

Non-clinical information (e.g. marketing preferences, general enquiry data) is retained for a shorter period and deleted when no longer needed.`,
  },
  {
    id: "complaints",
    title: "9. Complaints & Contact",
    content: `If you have a concern about how we have handled your personal information, please contact us first so we can try to resolve it:

**Email:** ${EMAIL}
**Phone:** ${PHONE}
**Mail:** ${COMPANY}, ${ADDRESS}

We will acknowledge your complaint within 5 business days and aim to resolve it within 30 days.

If you are not satisfied with our response, you may lodge a complaint with the **Office of the Australian Information Commissioner (OAIC)**:

- Website: www.oaic.gov.au
- Phone: 1300 363 992
- Mail: GPO Box 5218, Sydney NSW 2001`,
  },
  {
    id: "changes",
    title: "10. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices or legal obligations. When we do, we will update the "Last updated" date at the top of this page.

We encourage you to review this policy periodically. Continued use of our website or services after any changes constitutes your acceptance of the updated policy.`,
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
        fontFamily: "'Playfair Display', Georgia, serif",
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
            fontFamily: "'Playfair Display', Georgia, serif",
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
            <strong style={{ color: "#0f172a" }}>Note:</strong> This policy is provided for general information purposes. For specific legal advice regarding your privacy rights, please consult a qualified Australian privacy law professional.
          </p>
        </div>
      </div>
    </div>
  );
}

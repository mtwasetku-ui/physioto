"use client";

const LAST_UPDATED = "8 March 2026";
const COMPANY = "Physio to Home";
const EMAIL = "info@physiotohome.com";
const PHONE = "1300 433 233";
const STATE = "Tasmania";

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: `By accessing our website (physiotohome.com) or booking and receiving physiotherapy services from ${COMPANY}, you agree to be bound by these Terms of Service ("Terms").

If you do not agree to these Terms, please do not use our website or services. We reserve the right to update these Terms at any time — continued use after changes are posted constitutes acceptance.

These Terms are governed by the laws of ${STATE}, Australia.`,
  },
  {
    id: "services",
    title: "2. Our Services",
    content: `${COMPANY} provides in-home physiotherapy services delivered by AHPRA-registered physiotherapists across Tasmania.

Our services include (but are not limited to) musculoskeletal physiotherapy, post-surgery rehabilitation, falls prevention, neurological rehabilitation, aged care physiotherapy, and chronic pain management — as described on our website.

**Service availability:** Services are subject to practitioner availability and geographic coverage. We reserve the right to decline, modify, or discontinue services at our reasonable discretion.

**Professional standards:** All treatment is provided in accordance with Physiotherapy Board of Australia standards and AHPRA requirements. Nothing in these Terms limits our professional obligations to you as a patient.`,
  },
  {
    id: "bookings",
    title: "3. Appointments & Cancellations",
    content: `**Booking:** Appointments can be made via our website, phone, or email. A booking is confirmed once you receive written or verbal confirmation from us.

**Cancellation policy:** We require at least 24 hours notice to cancel or reschedule an appointment. Cancellations made with less than 24 hours notice, or failure to be present at the scheduled time ("no-show"), may attract a cancellation fee.

**Late arrivals:** If you are unable to be ready at the scheduled appointment time, please notify us as soon as possible. We will do our best to accommodate you, but shortened appointment times may still be charged at the full rate.

**Our right to cancel:** We reserve the right to cancel or reschedule appointments due to practitioner illness, emergency, or circumstances beyond our control. We will provide as much notice as possible and will not charge a cancellation fee in such cases.`,
  },
  {
    id: "fees",
    title: "4. Fees & Payment",
    content: `**Fees:** Our current fee schedule is available on request. Fees may vary depending on the type of service, duration, and applicable funding arrangements.

**Payment:** Payment is due at the time of service unless a prior billing arrangement has been made. We accept payment via EFTPOS, credit card, bank transfer, and Medicare/DVA/NDIS/private health insurance claims where applicable.

**Funding bodies:** We process claims on your behalf for Medicare (Chronic Disease Management Plans), DVA, NDIS, My Aged Care, and registered private health insurers. It is your responsibility to ensure you hold valid entitlements and to provide accurate information. Any gap payments remain your responsibility.

**Debt collection:** Unpaid accounts may be referred to a debt collection agency. You will be responsible for any reasonable costs incurred in recovering outstanding amounts.`,
  },
  {
    id: "health",
    title: "5. Health Information & Consent",
    content: `**Informed consent:** By proceeding with treatment, you consent to the physiotherapy assessment and treatment proposed by your practitioner. You have the right to ask questions, seek a second opinion, and withdraw consent at any time.

**Accuracy of information:** You agree to provide accurate and complete health information to your treating physiotherapist. Withholding relevant medical information may affect the safety and effectiveness of your treatment. ${COMPANY} accepts no liability for adverse outcomes resulting from inaccurate or incomplete information provided by you.

**Emergency situations:** In the event of a medical emergency during a home visit, our physiotherapist will take reasonable steps to ensure your safety, including calling emergency services. You consent to this.

**Referral:** If your condition requires care beyond physiotherapy, your practitioner may recommend referral to another health professional. Acting on such recommendations is your choice.`,
  },
  {
    id: "liability",
    title: "6. Limitation of Liability",
    content: `To the maximum extent permitted by Australian law:

**No guarantee of outcomes:** Physiotherapy outcomes vary between individuals. We do not guarantee specific results from treatment. Our obligation is to provide services with reasonable care and skill.

**Limitation of damages:** Our liability to you for any loss or damage arising from our services or website is limited to the fees paid by you for the specific service giving rise to the claim, or the minimum amount permitted by law.

**Excluded losses:** We are not liable for any indirect, consequential, special, or incidental losses, including loss of income or opportunity, even if we have been advised of the possibility of such losses.

**Consumer guarantees:** Nothing in these Terms excludes, restricts, or modifies any consumer guarantee, right, or remedy you have under the Australian Consumer Law (Schedule 2 of the Competition and Consumer Act 2010) that cannot be excluded.`,
  },
  {
    id: "website",
    title: "7. Website Use",
    content: `**General information only:** Content on our website is provided for general informational purposes and does not constitute medical advice. Always consult a qualified health professional for advice specific to your condition.

**Accuracy:** We endeavour to keep website content accurate and up to date, but make no warranties about its completeness, accuracy, or suitability for any particular purpose.

**Intellectual property:** All content on this website — including text, images, logos, and design — is the property of ${COMPANY} or its licensors and is protected by Australian copyright law. You may not reproduce, distribute, or use our content without prior written permission.

**Links:** Our website may contain links to third-party websites. We are not responsible for the content or privacy practices of those sites.

**Prohibited use:** You must not use our website in any way that is unlawful, harmful, or that interferes with its normal operation.`,
  },
  {
    id: "privacy",
    title: "8. Privacy",
    content: `Your use of our services and website is also governed by our Privacy Policy, which is incorporated into these Terms by reference.

Our Privacy Policy explains how we collect, use, store, and disclose your personal and health information in accordance with the Australian Privacy Act 1988 (Cth).

You can read the full Privacy Policy at physiotohome.com/privacy-policy.`,
  },
  {
    id: "disputes",
    title: "9. Disputes",
    content: `If you have a complaint about our services, please contact us in the first instance so we can attempt to resolve it:

**Email:** ${EMAIL}
**Phone:** ${PHONE}

We will acknowledge complaints within 5 business days and aim to resolve them within 30 days.

If we are unable to resolve a dispute, you may refer it to:
- **AHPRA** (for concerns about professional conduct): ahpra.gov.au
- **Health Complaints Commissioner Tasmania**: 1800 001 170
- **Consumer Affairs Tasmania**: 1300 654 499

These Terms are governed by the laws of ${STATE}, Australia. Any legal proceedings must be brought in the courts of ${STATE}.`,
  },
  {
    id: "general",
    title: "10. General",
    content: `**Severability:** If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions continue in full force.

**Waiver:** Failure to enforce any provision of these Terms does not constitute a waiver of our right to enforce it in the future.

**Entire agreement:** These Terms, together with our Privacy Policy and any written service agreements, constitute the entire agreement between you and ${COMPANY} regarding your use of our website and services.

**Contact:** For any questions about these Terms, contact us at ${EMAIL} or ${PHONE}.`,
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

export default function TermsOfServiceClient() {
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
            Terms of Service
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
            <strong style={{ color: "#0f172a" }}>Note:</strong> These Terms are provided for general informational purposes. For legal advice specific to your situation, please consult a qualified Australian legal professional.
          </p>
        </div>
      </div>
    </div>
  );
}

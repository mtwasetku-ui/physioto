"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Phone,
  CheckCircle2,
  ArrowRight,
  Home,
  HeartHandshake,
  Activity,
  ShieldCheck,
  MapPin,
  Users,
  ClipboardCheck,
} from "lucide-react";

/*
 * ============================================================
 * PHYSIO TO HOME — SERVICES PAGE
 * ============================================================
 *
 * SEO / conversion structure:
 *
 * 1. Tasmania-wide home physiotherapy hero
 * 2. What we can help with
 * 3. Main physiotherapy services
 * 4. Why home physiotherapy
 * 5. What happens during a home visit
 * 6. Who can benefit
 * 7. Funding & payment options
 * 8. Physiotherapy across Tasmania
 * 9. Meet the team
 * 10. FAQ
 * 11. Final booking CTA
 *
 * Existing blog URLs are retained where they already exist.
 * As dedicated service pages are created, CONDITION_LINKS can
 * be changed from /blog/... to /services/....
 */

/* ============================================================
   CONDITION → EXISTING CONTENT LINKS
   ============================================================ */

const CONDITION_LINKS: Record<string, string | null> = {
  /* Back, neck & joint pain */
  "Lower back pain": "lower-back-pain-home-treatment",
  "Neck pain & stiffness": "neck-pain-cervicogenic-headache-home-physiotherapy",
  "Shoulder impingement": "rotator-cuff-shoulder-rehabilitation",
  "Frozen shoulder": "frozen-shoulder-adhesive-capsulitis-home-physiotherapy",
  "Hip pain": "hip-osteoarthritis-home-physiotherapy",
  "Knee pain": "knee-osteoarthritis-home-physiotherapy",
  Sciatica: "sciatica-lumbar-radiculopathy-home-physiotherapy",
  "Plantar fasciitis & heel pain":
    "plantar-fasciitis-heel-pain-home-physiotherapy",
  "Tennis & golfer's elbow":
    "tennis-elbow-golfers-elbow-home-physiotherapy",
  "Sports injuries": null,

  /* Post surgery */
  "Hip replacement": "post-surgery-hip-replacement",
  "Knee replacement": "post-surgery-knee-replacement",
  "Rotator cuff repair": "rotator-cuff-shoulder-rehabilitation",
  "Spinal surgery": null,
  "Fracture recovery": "hip-fracture-rehabilitation-home-physiotherapy",
  "ACL reconstruction": null,

  /* Falls */
  "Balance impairment": "how-to-improve-balance-at-home-older-adults",
  "Dizziness & vertigo": "falls-prevention-dizziness",
  "Recurrent falls": "falls-prevention-home-physiotherapy",
  "Fear of falling": "falls-risk-ageing-parents-family-guide",
  "Parkinson's disease": "parkinsons-disease-home-physiotherapy",
  "Post-stroke balance issues": "stroke-rehabilitation-home-physiotherapy",

  /* Neurological */
  "Stroke recovery": "stroke-rehabilitation-home-physiotherapy",
  "Multiple sclerosis": "multiple-sclerosis-home-physiotherapy",
  "Acquired brain injury": null,
  "Cervicogenic dizziness":
    "cervicogenic-dizziness-misdiagnosed-clinical-overview",
  "Peripheral neuropathy": null,

  /* Aged care */
  "Mobility decline": "how-to-improve-balance-at-home-older-adults",
  Osteoporosis: "osteoporosis-bone-health-home-physiotherapy",
  Osteoarthritis: "osteoarthritis-home-physiotherapy",
  "General deconditioning":
    "post-covid-fatigue-deconditioning-home-physiotherapy",
  "Aged care assessments": "my-aged-care-home-physiotherapy-funding",
  "Home exercise programs": "benefits-of-home-physiotherapy",

  /* Chronic pain */
  Fibromyalgia: null,
  "Chronic lower back pain": "lower-back-pain-home-treatment",
  "Complex regional pain": null,
  "Persistent joint pain": "how-to-exercise-safely-with-arthritis",
  "Post-COVID fatigue":
    "post-covid-fatigue-deconditioning-home-physiotherapy",
  "Pain sensitisation": "chronic-pain-home-physiotherapy",
};

/* ============================================================
   MAIN SERVICES
   ============================================================ */

const services = [
  {
    id: "back-neck-joint-pain",
    name: "Back, Neck & Joint Pain",
    photo:
      "image/blog/neck-pain-cervicogenic-headache-home-physiotherapy.jpg",
    eyebrow: "Musculoskeletal Physiotherapy",
    summary:
      "Personalised physiotherapy for back, neck, shoulder, hip, knee and other joint pain — delivered in your home.",
    detail:
      "We assess and treat a wide range of musculoskeletal conditions, from recent injuries and everyday aches to persistent pain. Your physiotherapist considers how your symptoms affect your movement, daily activities and goals, then develops a treatment plan that fits your home and lifestyle.",
    conditions: [
      "Lower back pain",
      "Neck pain & stiffness",
      "Shoulder impingement",
      "Frozen shoulder",
      "Hip pain",
      "Knee pain",
      "Sciatica",
      "Plantar fasciitis & heel pain",
      "Tennis & golfer's elbow",
      "Sports injuries",
    ],
    href: "/blog/lower-back-pain-home-treatment",
  },

  {
    id: "post-surgery",
    name: "Post-Surgery Rehabilitation",
    photo: "image/blog/post-surgery-knee-replacement.jpg",
    eyebrow: "Recovery & Rehabilitation",
    summary:
      "Supportive rehabilitation after surgery, helping you rebuild strength, mobility and confidence at home.",
    detail:
      "Recovering after surgery can make travelling to a clinic difficult. Home physiotherapy allows your rehabilitation to happen in the environment where you actually need to move and function. Your physiotherapist can progressively work on mobility, strength, walking, confidence and everyday activities.",
    conditions: [
      "Hip replacement",
      "Knee replacement",
      "Rotator cuff repair",
      "Spinal surgery",
      "Fracture recovery",
      "ACL reconstruction",
    ],
    href: "/blog/post-surgery-knee-replacement",
  },

  {
    id: "falls-prevention",
    name: "Falls Prevention & Balance",
    photo: "image/blog/falls-prevention-dizziness.jpg",
    eyebrow: "Balance & Mobility",
    summary:
      "Balance, strength, walking and falls-risk assessment in the environment where you live.",
    detail:
      "Falls can affect confidence and independence. A home-based assessment allows your physiotherapist to consider balance, strength, walking, dizziness and functional mobility in your everyday environment. We can then develop a practical program aimed at improving safety, confidence and independence.",
    conditions: [
      "Balance impairment",
      "Dizziness & vertigo",
      "Cervicogenic dizziness",
      "Recurrent falls",
      "Fear of falling",
      "Parkinson's disease",
      "Post-stroke balance issues",
    ],
    href: "/blog/falls-prevention-home-physiotherapy",
  },

  {
    id: "neurological",
    name: "Neurological Physiotherapy",
    photo: "image/blog/stroke-rehabilitation-home-physiotherapy.jpg",
    eyebrow: "Neurological Rehabilitation",
    summary:
      "Home-based rehabilitation for neurological conditions affecting movement, strength, balance and independence.",
    detail:
      "Neurological rehabilitation often benefits from consistency and functional practice. Providing physiotherapy at home allows treatment to focus on the movements and activities that matter in your everyday life. Treatment is tailored to your abilities, goals and stage of recovery.",
    conditions: [
      "Stroke recovery",
      "Parkinson's disease",
      "Multiple sclerosis",
      "Acquired brain injury",
      "Peripheral neuropathy",
    ],
    href: "/blog/stroke-rehabilitation-home-physiotherapy",
  },

  {
    id: "aged-care",
    name: "Aged Care, Mobility & Independence",
    photo: "image/blog/parkinsons-disease-home-physiotherapy.jpg",
    eyebrow: "Aged Care Physiotherapy",
    summary:
      "Physiotherapy focused on maintaining strength, mobility, confidence and independence at home.",
    detail:
      "Our physiotherapists support older adults who want to remain active and independent at home. We can address mobility decline, strength, balance, pain, deconditioning and functional difficulties while developing practical exercises that fit into everyday routines.",
    conditions: [
      "Mobility decline",
      "Osteoporosis",
      "Osteoarthritis",
      "General deconditioning",
      "Aged care assessments",
      "Home exercise programs",
    ],
    href: "/blog/benefits-of-home-physiotherapy",
  },

  {
    id: "chronic-pain",
    name: "Chronic Pain Management",
    photo: "image/blog/chronic-pain-rural-tasmania.jpg",
    eyebrow: "Persistent Pain",
    summary:
      "Individualised physiotherapy for persistent pain, with a focus on movement, confidence, education and practical self-management.",
    detail:
      "Persistent pain can affect movement, confidence and everyday life. We use an individualised approach that may include graded exercise, education, movement strategies, hands-on treatment where appropriate and practical self-management strategies.",
    conditions: [
      "Fibromyalgia",
      "Chronic lower back pain",
      "Complex regional pain",
      "Persistent joint pain",
      "Post-COVID fatigue",
      "Pain sensitisation",
    ],
    href: "/blog/chronic-pain-home-physiotherapy",
  },
];

/* ============================================================
   FUNDING
   ============================================================ */

const fundingOptions = [
  {
    icon: "💳",
    label: "Private Health Insurance",
    desc: "On-the-spot rebates with HICAPS where applicable",
    slug: "private-health-insurance-home-physiotherapy",
  },
  {
    icon: "♿",
    label: "NDIS",
    desc: "Self-managed and plan-managed participants",
    slug: "ndis-home-physiotherapy-funding",
  },
  {
    icon: "🎖️",
    label: "DVA",
    desc: "Department of Veterans' Affairs clients",
    slug: "dva-physiotherapy-tasmania",
  },
  {
    icon: "🏥",
    label: "Medicare",
    desc: "Eligible Medicare arrangements",
    slug: "medicare-gp-management-plan-physiotherapy-funding",
  },
  {
    icon: "🤝",
    label: "My Aged Care",
    desc: "Applicable aged-care funding pathways",
    slug: "my-aged-care-home-physiotherapy-funding",
  },
  {
    icon: "💰",
    label: "Private Pay",
    desc: "Direct private appointments",
    slug: null,
  },
];

/* ============================================================
   FAQ
   ============================================================ */

const faqs = [
  {
    question: "Do you provide physiotherapy at home?",
    answer:
      "Yes. Physio to Home is a mobile physiotherapy service. Our physiotherapists travel to clients in their homes and other appropriate community settings.",
  },
  {
    question: "What areas of Tasmania do you service?",
    answer:
      "Physio to Home provides mobile physiotherapy across Tasmania. Contact us with your town or location and we can confirm availability for your area.",
  },
  {
    question: "Do I need a GP referral to see a physiotherapist?",
    answer:
      "Private clients can generally book directly without a GP referral. Some funding pathways, including certain Medicare, DVA or NDIS arrangements, may have their own requirements. We can help you understand what applies to your situation.",
  },
  {
    question: "Can I use my NDIS plan?",
    answer:
      "Yes. Physio to Home provides mobile physiotherapy for eligible self-managed and plan-managed NDIS participants. As an unregistered provider, we cannot provide services to agency-managed participants.",
  },
  {
    question: "Do you provide DVA physiotherapy?",
    answer:
      "Yes. We provide physiotherapy services for eligible Department of Veterans' Affairs clients, subject to the applicable referral and funding requirements.",
  },
  {
    question: "Can I use My Aged Care funding?",
    answer:
      "Physiotherapy may be available through applicable My Aged Care, CHSP or other aged-care funding arrangements for eligible clients. Contact us to discuss your funding pathway.",
  },
  {
    question: "Can you help after hospital discharge?",
    answer:
      "Yes. Home physiotherapy can support people transitioning home after surgery, hospitalisation, fractures, joint replacement or periods of reduced mobility and deconditioning.",
  },
  {
    question: "Can you help with falls and balance problems?",
    answer:
      "Yes. We can assess balance, strength, walking and functional mobility and develop an individualised falls-prevention and mobility program.",
  },
  {
    question: "Do you treat neurological conditions at home?",
    answer:
      "Yes. We provide home-based neurological physiotherapy for conditions including stroke, Parkinson's disease, multiple sclerosis and other neurological presentations.",
  },
  {
    question: "How soon can I get an appointment?",
    answer:
      "We aim to offer same-week appointments where availability allows. Contact us with your location and preferred timing and we'll let you know the earliest suitable appointment.",
  },
  {
    question: "Do you visit apartments and retirement villages?",
    answer:
      "Yes. Home visits can be provided in houses, units, apartments, retirement villages and other appropriate residential settings.",
  },
  {
    question: "What should I wear for a physiotherapy appointment?",
    answer:
      "Comfortable clothing that allows you to move easily is generally best. Your physiotherapist can let you know if anything specific is needed for your appointment.",
  },
];

/* ============================================================
   ICONS / SMALL COMPONENTS
   ============================================================ */

function CheckCircle({ size = 14 }: { size?: number }) {
  return (
    <CheckCircle2
      size={size}
      strokeWidth={2.5}
      style={{ color: "#4E9B72", flexShrink: 0 }}
    />
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.2s",
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        maxWidth: 760,
        margin: "0 auto 48px",
      }}
    >
      <div
        style={{
          width: 52,
          height: 4,
          background: "#FF5638",
          borderRadius: 4,
          margin: "0 auto 20px",
        }}
      />

      <p
        style={{
          margin: "0 0 10px",
          color: "#4E9B72",
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {eyebrow}
      </p>

      <h2
        style={{
          fontFamily:
            "var(--font-bricolage), 'Trebuchet MS', sans-serif",
          fontSize: "clamp(30px, 4.5vw, 44px)",
          lineHeight: 1.15,
          color: "#0A231B",
          margin: 0,
        }}
      >
        {title}
      </h2>

      {description && (
        <p
          style={{
            color: "#475569",
            fontSize: 17,
            lineHeight: 1.7,
            margin: "16px auto 0",
            maxWidth: 650,
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        background: "#FF5638",
        color: "#fff",
        fontWeight: 700,
        borderRadius: 12,
        padding: "15px 26px",
        fontSize: 16,
        textDecoration: "none",
        boxShadow: "0 8px 24px rgba(255,86,56,0.25)",
        transition: "transform 0.2s, background 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#E8482B";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#FF5638";
        e.currentTarget.style.transform = "none";
      }}
    >
      {children}
    </Link>
  );
}

function ConditionItem({ label }: { label: string }) {
  const slug = CONDITION_LINKS[label];

  return (
    <li
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 7,
        fontSize: 14.5,
        color: "#475569",
        lineHeight: 1.45,
      }}
    >
      <CheckCircle size={14} />

      {slug ? (
        <Link
          href={`/blog/${slug}`}
          style={{
            color: "#2E6B4A",
            textDecoration: "none",
            fontWeight: 600,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#FF5638";
            e.currentTarget.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#2E6B4A";
            e.currentTarget.style.textDecoration = "none";
          }}
        >
          {label}
        </Link>
      ) : (
        <span>{label}</span>
      )}
    </li>
  );
}

/* ============================================================
   SERVICE CARD
   ============================================================ */

function ServiceCard({
  service,
}: {
  service: (typeof services)[number];
}) {
  const [open, setOpen] = useState(false);

  return (
    <article
      style={{
        borderRadius: 20,
        overflow: "hidden",
        border: "1px solid #DCE6DF",
        background: "#fff",
        boxShadow: "0 2px 8px rgba(10,35,27,0.06)",
        transition: "box-shadow 0.2s, transform 0.2s",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          "0 12px 30px rgba(10,35,27,0.12)";
        e.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow =
          "0 2px 8px rgba(10,35,27,0.06)";
        e.currentTarget.style.transform = "none";
      }}
    >
      <div
        style={{
          position: "relative",
          height: 265,
          overflow: "hidden",
        }}
      >
        <Image
          src={`/${service.photo}`}
          alt={`${service.name} home physiotherapy`}
          fill
          sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 550px"
          style={{ objectFit: "cover" }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(10,35,27,0.92) 0%, rgba(10,35,27,0.55) 55%, rgba(10,35,27,0.08) 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 22,
            right: 22,
            bottom: 20,
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              color: "#FFC53D",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {service.eyebrow}
          </p>

          <h3
            style={{
              margin: 0,
              color: "#fff",
              fontFamily:
                "var(--font-bricolage), 'Trebuchet MS', sans-serif",
              fontSize: 26,
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            {service.name}
          </h3>
        </div>
      </div>

      <div
        style={{
          padding: "22px 24px 24px",
          background: "#fff",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <p
          style={{
            margin: "0 0 18px",
            color: "#475569",
            fontSize: 15.5,
            lineHeight: 1.7,
          }}
        >
          {service.summary}
        </p>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: "#E7F2E7",
            border: "1px solid #C8DDCF",
            borderRadius: 999,
            padding: "5px 11px",
            fontSize: 12,
            fontWeight: 700,
            color: "#2E6B4A",
            marginBottom: 17,
            alignSelf: "flex-start",
          }}
        >
          <Home size={13} />
          Home-based physiotherapy
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#FF5638",
            fontWeight: 700,
            fontSize: 15.5,
            padding: 0,
            textAlign: "left",
            alignSelf: "flex-start",
          }}
        >
          {open ? "Show less" : "Learn more"}
          <ChevronDown open={open} />
        </button>

        {open && (
          <div
            style={{
              marginTop: 18,
              borderTop: "1px solid #E2E8F0",
              paddingTop: 18,
            }}
          >
            <p
              style={{
                margin: "0 0 18px",
                color: "#475569",
                fontSize: 15,
                lineHeight: 1.7,
              }}
            >
              {service.detail}
            </p>

            <p
              style={{
                margin: "0 0 11px",
                fontSize: 12,
                fontWeight: 800,
                color: "#FF5638",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Conditions we can help with
            </p>

            <ul
              style={{
                margin: 0,
                padding: 0,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px 12px",
                listStyle: "none",
              }}
            >
              {service.conditions.map((condition) => (
                <ConditionItem
                  key={condition}
                  label={condition}
                />
              ))}
            </ul>

            <div style={{ marginTop: 20 }}>
              <Link
                href={service.href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  color: "#2E6B4A",
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                Read related information
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

/* ============================================================
   FAQ
   ============================================================ */

function FaqItem({
  faq,
  open,
  onToggle,
}: {
  faq: { question: string; answer: string };
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        borderBottom: "1px solid #DCE6DF",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "21px 4px",
          textAlign: "left",
          color: "#0A231B",
          font: "inherit",
        }}
      >
        <span
          style={{
            fontSize: 17,
            fontWeight: 700,
            lineHeight: 1.4,
          }}
        >
          {faq.question}
        </span>

        <span
          style={{
            color: "#FF5638",
            flexShrink: 0,
          }}
        >
          <ChevronDown open={open} />
        </span>
      </button>

      {open && (
        <p
          style={{
            margin: "0 0 21px",
            padding: "0 4px",
            color: "#475569",
            fontSize: 15.5,
            lineHeight: 1.75,
          }}
        >
          {faq.answer}
        </p>
      )}
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */

export default function ServicesPage() {
  const [visible, setVisible] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);

    return () => clearTimeout(timer);
  }, []);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #FBF8F1, #fff)",
        fontFamily:
          "var(--font-instrument-sans), system-ui, sans-serif",
        color: "#0A231B",
      }}
    >
      <style>{`
        .pth-dots-bg {
          background-image:
            radial-gradient(
              circle,
              rgba(255,255,255,0.07) 1px,
              transparent 1px
            );
          background-size: 24px 24px;
        }

        .pth-card-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 28px;
        }

        .pth-three-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
        }

        .pth-funding-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .pth-region-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .pth-fade {
          opacity: 0;
          transform: translateY(20px);
          transition:
            opacity 0.65s ease,
            transform 0.65s ease;
        }

        .pth-fade.in {
          opacity: 1;
          transform: none;
        }

        @media (max-width: 900px) {
          .pth-three-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .pth-region-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .pth-card-grid,
          .pth-three-grid,
          .pth-funding-grid,
          .pth-region-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .pth-condition-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* ======================================================
          HERO
      ====================================================== */}

      <section
        className="pth-dots-bg"
        style={{
          background:
            "linear-gradient(135deg, #0E2C22, #0A231B)",
          padding: "88px 24px 82px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -90,
            right: -50,
            width: 400,
            height: 400,
            background:
              "radial-gradient(circle, rgba(255,86,56,0.18) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: -120,
            left: -100,
            width: 350,
            height: 350,
            background:
              "radial-gradient(circle, rgba(78,155,114,0.16) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: 850,
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
          }}
        >
          <p
            style={{
              color: "#FFC53D",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              margin: "0 0 18px",
            }}
          >
            Mobile Physiotherapy Across Tasmania
          </p>

          <h1
            style={{
              fontFamily:
                "var(--font-bricolage), 'Trebuchet MS', sans-serif",
              fontSize: "clamp(40px, 6.5vw, 62px)",
              color: "#fff",
              margin: "0 0 22px",
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
            }}
          >
            Home Physiotherapy
            <br />
            <em
              style={{
                color: "#FFC53D",
                fontStyle: "italic",
              }}
            >
              Services Across Tasmania
            </em>
          </h1>

          <p
            style={{
              color: "#D7E0DB",
              fontSize: 19,
              lineHeight: 1.75,
              maxWidth: 700,
              margin: "0 auto 30px",
            }}
          >
            Professional physiotherapy delivered to you at home.
            Our physiotherapists provide personalised assessment,
            treatment and rehabilitation for pain, injury, surgery
            recovery, neurological conditions, falls, mobility
            problems and persistent conditions.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 12,
              marginBottom: 28,
            }}
          >
            <PrimaryButton href="/booking">
              <Calendar size={18} />
              Book a Home Visit
            </PrimaryButton>

            <a
              href="tel:1300433233"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "15px 26px",
                fontSize: 16,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <Phone size={18} />
              1300 433 233
            </a>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 9,
            }}
          >
            {[
              "No GP Referral Required",
              "AHPRA Registered",
              "Same-Week Appointments",
              "NDIS Welcome",
            ].map((badge) => (
              <span
                key={badge}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  background: "rgba(255,255,255,0.07)",
                  border:
                    "1px solid rgba(255,255,255,0.13)",
                  borderRadius: 999,
                  padding: "7px 13px",
                  fontSize: 13,
                  color: "#F2EFE4",
                  fontWeight: 600,
                }}
              >
                <CheckCircle size={13} />
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          WHO WE HELP
      ====================================================== */}

      <section
        style={{
          maxWidth: 1150,
          margin: "0 auto",
          padding: "82px 24px 78px",
        }}
      >
        <div className={`pth-fade ${visible ? "in" : ""}`}>
          <SectionHeading
            eyebrow="Conditions We Treat"
            title="What can our physiotherapists help with?"
            description="We provide home-based physiotherapy for a wide range of conditions affecting pain, movement, strength, balance and independence."
          />
        </div>

        <div className="pth-three-grid">
          {[
            {
              icon: <Activity size={24} />,
              title: "Back, Neck & Joint Problems",
              text: "Back pain, sciatica, neck pain, shoulder problems, hip and knee pain, arthritis and other musculoskeletal conditions.",
              href: "#back-neck-joint-pain",
            },
            {
              icon: <HeartHandshake size={24} />,
              title: "Recovery & Rehabilitation",
              text: "Support following surgery, fractures, joint replacement, injury, hospitalisation and periods of reduced mobility.",
              href: "#post-surgery",
            },
            {
              icon: <ShieldCheck size={24} />,
              title: "Falls & Balance",
              text: "Assessment and rehabilitation for balance problems, recurrent falls, dizziness, weakness and mobility difficulties.",
              href: "#falls-prevention",
            },
            {
              icon: <Activity size={24} />,
              title: "Neurological Conditions",
              text: "Home-based physiotherapy for stroke, Parkinson's disease, multiple sclerosis and other neurological conditions.",
              href: "#neurological",
            },
            {
              icon: <Home size={24} />,
              title: "Aged Care & Mobility",
              text: "Helping older adults maintain strength, mobility, confidence and independence at home.",
              href: "#aged-care",
            },
            {
              icon: <HeartHandshake size={24} />,
              title: "Persistent Pain",
              text: "Individualised care for chronic and persistent pain, with a focus on movement, education and self-management.",
              href: "#chronic-pain",
            },
          ].map((item, index) => (
            <a
              key={item.title}
              href={item.href}
              className={`pth-fade ${visible ? "in" : ""}`}
              style={{
                transitionDelay: `${index * 0.05}s`,
                display: "block",
                background: "#fff",
                border: "1px solid #DCE6DF",
                borderRadius: 18,
                padding: "24px",
                textDecoration: "none",
                boxShadow:
                  "0 2px 8px rgba(10,35,27,0.04)",
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  background: "#E7F2E7",
                  color: "#2E6B4A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                {item.icon}
              </div>

              <h3
                style={{
                  margin: "0 0 9px",
                  color: "#0A231B",
                  fontSize: 19,
                  lineHeight: 1.3,
                }}
              >
                {item.title}
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#64748B",
                  fontSize: 14.5,
                  lineHeight: 1.65,
                }}
              >
                {item.text}
              </p>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 15,
                  color: "#FF5638",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Explore
                <ArrowRight size={15} />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* ======================================================
          SERVICES
      ====================================================== */}

      <section
        style={{
          background: "#F2EFE4",
          borderTop: "1px solid #E8E2D5",
          borderBottom: "1px solid #E8E2D5",
          padding: "84px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1150,
            margin: "0 auto",
          }}
        >
          <div className={`pth-fade ${visible ? "in" : ""}`}>
            <SectionHeading
              eyebrow="Our Services"
              title="Personalised physiotherapy at home"
              description="Every person is different. Your physiotherapist will assess your needs and develop a treatment plan around your condition, goals and everyday life."
            />
          </div>

          <div className="pth-card-grid">
            {services.map((service, index) => (
              <div
                key={service.id}
                id={service.id}
                className={`pth-fade ${visible ? "in" : ""}`}
                style={{
                  transitionDelay: `${index * 0.07}s`,
                  scrollMarginTop: 100,
                }}
              >
                <ServiceCard service={service} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          WHY HOME PHYSIOTHERAPY
      ====================================================== */}

      <section
        style={{
          maxWidth: 1150,
          margin: "0 auto",
          padding: "86px 24px",
        }}
      >
        <div className={`pth-fade ${visible ? "in" : ""}`}>
          <SectionHeading
            eyebrow="Why Home Physiotherapy?"
            title="Care in the environment where you live"
            description="Home physiotherapy isn't simply physiotherapy delivered somewhere else. Your home can provide valuable information about how you move, function and manage everyday activities."
          />
        </div>

        <div className="pth-three-grid">
          {[
            {
              icon: <Home size={25} />,
              title: "No travel required",
              text: "Your physiotherapist comes to you, reducing the need for transport, parking and travel to a traditional clinic.",
            },
            {
              icon: <Activity size={25} />,
              title: "Real-world assessment",
              text: "Your physiotherapist can consider how your condition affects movement and everyday activities in your own environment.",
            },
            {
              icon: <HeartHandshake size={25} />,
              title: "Personalised treatment",
              text: "Treatment is designed around your symptoms, goals, lifestyle and level of function.",
            },
            {
              icon: <ShieldCheck size={25} />,
              title: "Support for mobility difficulties",
              text: "Home visits can be particularly useful for older adults and people who find travelling difficult.",
            },
            {
              icon: <ClipboardCheck size={25} />,
              title: "Practical rehabilitation",
              text: "Exercises and strategies can be adapted to the space, equipment and routines you actually use.",
            },
            {
              icon: <Users size={25} />,
              title: "Family-friendly care",
              text: "Where appropriate, family members or carers can be involved in understanding the treatment plan and supporting progress.",
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className={`pth-fade ${visible ? "in" : ""}`}
              style={{
                transitionDelay: `${index * 0.05}s`,
                border: "1px solid #DCE6DF",
                borderRadius: 18,
                padding: "25px",
                background: "#fff",
              }}
            >
              <div
                style={{
                  color: "#4E9B72",
                  marginBottom: 15,
                }}
              >
                {item.icon}
              </div>

              <h3
                style={{
                  margin: "0 0 9px",
                  color: "#0A231B",
                  fontSize: 19,
                }}
              >
                {item.title}
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#64748B",
                  fontSize: 14.5,
                  lineHeight: 1.7,
                }}
              >
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================
          HOW IT WORKS
      ====================================================== */}

      <section
        style={{
          background: "#E7F2E7",
          padding: "84px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1050,
            margin: "0 auto",
          }}
        >
          <SectionHeading
            eyebrow="Your First Visit"
            title="What happens during a home physiotherapy visit?"
            description="We keep the process straightforward and focused on what you want to achieve."
          />

          <div className="pth-three-grid">
            {[
              {
                number: "01",
                title: "We talk about your goals",
                text: "We discuss your symptoms, history, daily activities and what you would like to improve.",
              },
              {
                number: "02",
                title: "We assess your movement",
                text: "Your physiotherapist assesses relevant movement, strength, mobility, balance and functional limitations.",
              },
              {
                number: "03",
                title: "We explain what we find",
                text: "We'll explain your assessment findings and discuss appropriate treatment options with you.",
              },
              {
                number: "04",
                title: "We begin treatment",
                text: "Treatment may include exercise therapy, mobility work, education and hands-on techniques where clinically appropriate.",
              },
              {
                number: "05",
                title: "You receive a plan",
                text: "Where appropriate, we'll provide exercises and practical strategies to continue between appointments.",
              },
              {
                number: "06",
                title: "We monitor your progress",
                text: "Your plan can be adjusted as your strength, mobility, confidence and goals change.",
              },
            ].map((step) => (
              <div
                key={step.number}
                style={{
                  background: "#fff",
                  borderRadius: 18,
                  padding: "25px",
                  border: "1px solid #C8DDCF",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: "#0A231B",
                    color: "#FFC53D",
                    fontWeight: 800,
                    fontSize: 13,
                    marginBottom: 17,
                  }}
                >
                  {step.number}
                </span>

                <h3
                  style={{
                    margin: "0 0 9px",
                    color: "#0A231B",
                    fontSize: 18,
                  }}
                >
                  {step.title}
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: "#64748B",
                    fontSize: 14.5,
                    lineHeight: 1.7,
                  }}
                >
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          WHO BENEFITS
      ====================================================== */}

      <section
        style={{
          maxWidth: 1050,
          margin: "0 auto",
          padding: "84px 24px",
        }}
      >
        <SectionHeading
          eyebrow="Who We Help"
          title="Who can benefit from home physiotherapy?"
          description="Home physiotherapy can be a practical option for people at many different stages of recovery, rehabilitation and mobility."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {[
            "Older adults",
            "People recovering from surgery",
            "People with reduced mobility",
            "People experiencing falls",
            "People with neurological conditions",
            "People recovering from injury",
            "People living with persistent pain",
            "People who find travelling difficult",
            "NDIS participants",
            "Eligible DVA clients",
            "People requiring rehabilitation at home",
            "People who prefer the convenience of home care",
          ].map((item) => (
            <div
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 16px",
                background: "#fff",
                border: "1px solid #DCE6DF",
                borderRadius: 12,
                color: "#334155",
                fontSize: 14.5,
                lineHeight: 1.4,
              }}
            >
              <CheckCircle size={16} />
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================
          FUNDING
      ====================================================== */}

      <section
        style={{
          background: "#F2EFE4",
          borderTop: "1px solid #E8E2D5",
          borderBottom: "1px solid #E8E2D5",
          padding: "84px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1150,
            margin: "0 auto",
          }}
        >
          <SectionHeading
            eyebrow="Funding & Payment"
            title="Ways to access physiotherapy"
            description="We support a range of funding and payment pathways. If you're unsure which option applies to you, contact our team."
          />

          <div className="pth-funding-grid">
            {fundingOptions.map((option) => {
              const cardStyle: React.CSSProperties = {
                display: "block",
                background: "#fff",
                borderRadius: 18,
                padding: "26px 20px",
                textAlign: "center",
                border: "1px solid #DCE6DF",
                boxShadow:
                  "0 2px 7px rgba(10,35,27,0.04)",
                textDecoration: "none",
                transition:
                  "box-shadow 0.2s, transform 0.2s",
              };

              const content = (
                <>
                  <div
                    style={{
                      fontSize: 32,
                      marginBottom: 11,
                    }}
                  >
                    {option.icon}
                  </div>

                  <p
                    style={{
                      margin: "0 0 6px",
                      fontWeight: 700,
                      color: "#0A231B",
                      fontSize: 15,
                    }}
                  >
                    {option.label}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      color: "#64748B",
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    {option.desc}
                  </p>

                  {option.slug && (
                    <p
                      style={{
                        margin: "11px 0 0",
                        color: "#FF5638",
                        fontSize: 12.5,
                        fontWeight: 700,
                      }}
                    >
                      Learn more →
                    </p>
                  )}
                </>
              );

              return option.slug ? (
                <Link
                  key={option.label}
                  href={`/blog/${option.slug}`}
                  style={cardStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 10px 25px rgba(255,86,56,0.12)";
                    e.currentTarget.style.transform =
                      "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 2px 7px rgba(10,35,27,0.04)";
                    e.currentTarget.style.transform =
                      "none";
                  }}
                >
                  {content}
                </Link>
              ) : (
                <div key={option.label} style={cardStyle}>
                  {content}
                </div>
              );
            })}
          </div>

          <div
            style={{
              maxWidth: 700,
              margin: "28px auto 0",
              padding: "17px 20px",
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #DCE6DF",
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#475569",
                fontSize: 14.5,
                lineHeight: 1.65,
              }}
            >
              Funding eligibility and requirements can vary.
              Contact us if you're unsure how your physiotherapy
              appointments can be funded.
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================
          TASMANIA
      ====================================================== */}

      <section
        style={{
          maxWidth: 1150,
          margin: "0 auto",
          padding: "86px 24px",
        }}
      >
        <SectionHeading
          eyebrow="Tasmania-Wide Service"
          title="Mobile physiotherapy across Tasmania"
          description="Physio to Home brings physiotherapy to you rather than requiring you to travel to a traditional clinic."
        />

        <div className="pth-region-grid">
          {[
            {
              title: "Southern Tasmania",
              text: "Mobile physiotherapy for clients across Hobart and surrounding communities, subject to appointment availability.",
            },
            {
              title: "Northern Tasmania",
              text: "Home physiotherapy for clients across Launceston and surrounding northern communities.",
            },
            {
              title: "North West Tasmania",
              text: "Home-based physiotherapy for clients across the North West and surrounding communities.",
            },
            {
              title: "Regional Tasmania",
              text: "We aim to make home-based physiotherapy accessible to clients in regional and rural Tasmanian communities where our service is available.",
            },
            {
              title: "Your Home",
              text: "Whether you live in a house, unit, apartment, retirement village or another appropriate residential setting, we can discuss your needs.",
            },
            {
              title: "Not Sure?",
              text: "If you don't see your town or area listed, contact us with your location and we'll confirm whether we can provide a visit.",
            },
          ].map((region) => (
            <div
              key={region.title}
              style={{
                background: "#fff",
                border: "1px solid #DCE6DF",
                borderRadius: 18,
                padding: "25px",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#E7F2E7",
                  color: "#2E6B4A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 15,
                }}
              >
                <MapPin size={22} />
              </div>

              <h3
                style={{
                  margin: "0 0 9px",
                  color: "#0A231B",
                  fontSize: 19,
                }}
              >
                {region.title}
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#64748B",
                  fontSize: 14.5,
                  lineHeight: 1.7,
                }}
              >
                {region.text}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            margin: "30px auto 0",
            maxWidth: 750,
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#475569",
              fontSize: 15,
              lineHeight: 1.7,
            }}
          >
            <strong style={{ color: "#0A231B" }}>
              Don't see your location?
            </strong>{" "}
            Contact our team with your town or suburb and we'll
            confirm availability for your area.
          </p>
        </div>
      </section>

      {/* ======================================================
          TEAM / TRUST
      ====================================================== */}

      <section
        style={{
          background: "#0A231B",
          padding: "78px 24px",
          color: "#fff",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              color: "#FFC53D",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Your Physiotherapy Team
          </p>

          <h2
            style={{
              fontFamily:
                "var(--font-bricolage), 'Trebuchet MS', sans-serif",
              fontSize: "clamp(31px, 5vw, 45px)",
              lineHeight: 1.15,
              margin: "0 0 17px",
            }}
          >
            Experienced physiotherapists who come to you
          </h2>

          <p
            style={{
              margin: "0 auto 28px",
              maxWidth: 700,
              color: "#D7E0DB",
              fontSize: 16.5,
              lineHeight: 1.75,
            }}
          >
            Our team provides personalised physiotherapy across
            musculoskeletal care, orthopaedic rehabilitation,
            neurological physiotherapy, falls prevention, aged
            care and community-based rehabilitation.
          </p>

          <Link
            href="/team"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "#fff",
              background: "rgba(255,255,255,0.08)",
              border:
                "1px solid rgba(255,255,255,0.18)",
              borderRadius: 12,
              padding: "13px 21px",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Meet Our Physiotherapists
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ======================================================
          FAQ
      ====================================================== */}

      <section
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: "86px 24px",
        }}
      >
        <SectionHeading
          eyebrow="Frequently Asked Questions"
          title="Questions about home physiotherapy"
          description="Here are some of the questions people commonly ask before booking a home visit."
        />

        <div>
          {faqs.map((faq, index) => (
            <FaqItem
              key={faq.question}
              faq={faq}
              open={openFaq === index}
              onToggle={() =>
                setOpenFaq(
                  openFaq === index ? null : index
                )
              }
            />
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />

      {/* ======================================================
          FINAL CTA
      ====================================================== */}

      <section
        className="pth-dots-bg"
        style={{
          background:
            "linear-gradient(135deg, #0E2C22, #0A231B)",
          padding: "88px 24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -70,
            right: -30,
            width: 320,
            height: 320,
            background:
              "radial-gradient(circle, rgba(255,86,56,0.18) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
          }}
        >
          <p
            style={{
              color: "#FFC53D",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              margin: "0 0 16px",
            }}
          >
            Get Started
          </p>

          <h2
            style={{
              fontFamily:
                "var(--font-bricolage), 'Trebuchet MS', sans-serif",
              fontSize: "clamp(35px, 5.5vw, 52px)",
              color: "#fff",
              margin: "0 0 18px",
              lineHeight: 1.18,
            }}
          >
            Need a physiotherapist
            <br />
            <em
              style={{
                color: "#FFC53D",
                fontStyle: "italic",
              }}
            >
              at home?
            </em>
          </h2>

          <p
            style={{
              color: "#D7E0DB",
              fontSize: 18,
              lineHeight: 1.7,
              maxWidth: 610,
              margin: "0 auto 34px",
            }}
          >
            Our physiotherapists come to you. Book a home
            physiotherapy appointment or contact our team to
            discuss your needs and location.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              justifyContent: "center",
            }}
          >
            <PrimaryButton href="/booking">
              <Calendar size={18} />
              Book a Home Visit
            </PrimaryButton>

            <a
              href="tel:1300433233"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                border:
                  "1px solid rgba(255,255,255,0.18)",
                borderRadius: 12,
                padding: "15px 27px",
                fontSize: 16,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <Phone size={18} />
              1300 433 233
            </a>
          </div>

          <p
            style={{
              margin: "22px 0 0",
              color: "#AFC0B7",
              fontSize: 13.5,
            }}
          >
            Not sure which service is right for you? Contact us
            and we'll help you work out the best next step.
          </p>
        </div>
      </section>
    </div>
  );
}

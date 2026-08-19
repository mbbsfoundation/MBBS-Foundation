import type { Metadata } from "next";
import Link from "next/link";
import NeetSubNav from "@/components/neet-to-mbbs/NeetSubNav";
import PrevNextNav from "@/components/neet-to-mbbs/PrevNextNav";
import ShareSection from "@/components/neet-to-mbbs/ShareSection";
import VerificationNotice from "@/components/neet-to-mbbs/VerificationNotice";

export const metadata: Metadata = {
  title: "NEET Counselling 2026: Process, Choice Filling, AIQ vs State Quota & Allotment Rules",
  description:
    "Complete NEET UG 2026 counselling guide: MCC 15% All India Quota vs 85% State Quota, choice locking rules, seat allotment rounds, security deposits, and document verification.",
  alternates: {
    canonical: "https://mbbsfoundation.com/neet-to-mbbs/counselling",
  },
  keywords: [
    "NEET counselling guide 2026",
    "MCC AIQ 15 percent counselling process",
    "State quota 85 percent medical counselling",
    "NEET choice filling strategy 2026",
    "Seat allotment round 1 round 2 mop up rules",
    "Documents required for NEET counselling verification",
    "Rural service bond rules state wise",
    "NEET counselling mistakes to avoid",
    "Security deposit refund MCC counselling",
    "MBBS admission choice ordering",
  ],
  openGraph: {
    title: "NEET Counselling 2026: Process, Choice Filling, AIQ vs State Quota & Allotment Rules",
    description:
      "Complete NEET UG 2026 counselling guide: MCC 15% All India Quota vs 85% State Quota, choice locking rules, seat allotment rounds, security deposits, and document verification.",
    url: "https://mbbsfoundation.com/neet-to-mbbs/counselling",
    siteName: "MBBS Foundation",
    locale: "en_IN",
    type: "article",
    images: [
      {
        url: "https://mbbsfoundation.com/images/neet-to-mbbs/toolkit-preview.png",
        width: 1200,
        height: 630,
        alt: "NEET Counselling 2026 Complete Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NEET Counselling 2026: Process, Choice Filling & Seat Allotment Guide",
    description:
      "Step-by-step roadmap for MCC AIQ and State counselling: choice filling strategy, seat allotment, and document checklists.",
    images: ["https://mbbsfoundation.com/images/neet-to-mbbs/toolkit-preview.png"],
  },
};

const COUNSELLING_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "NEET Counselling 2026: Process, Choice Filling, AIQ vs State Quota & Allotment Rules",
      description:
        "Understand NEET counselling registration, AIQ vs state quota, choice filling rules, seat allotment rounds, and document verification for MBBS admissions.",
      author: {
        "@type": "Person",
        name: "Dr. Lokesh Tiwari",
        url: "https://mbbsfoundation.com/about",
      },
      publisher: {
        "@type": "Organization",
        name: "Ayurvigyan Foundation",
        url: "https://mbbsfoundation.com",
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": "https://mbbsfoundation.com/neet-to-mbbs/counselling",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is the difference between AIQ (15%) and State Quota (85%) in NEET counselling?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "All India Quota (AIQ) covers 15% of seats in all government medical colleges across India and is conducted by the Medical Counselling Committee (MCC). It is open to all NEET-qualified candidates regardless of domicile. State Quota covers the remaining 85% of government seats plus 100% of state private college seats, conducted by state authorities based on state domicile rules.",
          },
        },
        {
          "@type": "Question",
          name: "How should I sequence my medical college choices during NEET counselling?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Always list colleges in your true order of genuine preference (highest desired college at #1), not based on where you think your rank might land. The counselling algorithm will evaluate your choices from top to bottom and assign you the highest choice for which your rank qualifies.",
          },
        },
        {
          "@type": "Question",
          name: "What documents are required during physical reporting after NEET seat allotment?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Key documents include: NEET UG Admit Card & Scorecard/Rank Letter, Class 10th & 12th Marksheets & Passing Certificates, Seat Allotment Letter, Category/Caste Certificate (if applicable), Domicile Certificate, Government Photo ID (Aadhaar/Passport), Passport-size photographs (matching NEET application), and Medical Fitness Certificate.",
          },
        },
        {
          "@type": "Question",
          name: "Can I participate in both AIQ and State counselling simultaneously?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, you can register and participate in both MCC AIQ counselling and your respective state counselling simultaneously. However, once you finalize and join a seat in later rounds according to MCC rules, data sharing prevents holding multiple seats simultaneously.",
          },
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://mbbsfoundation.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "NEET to MBBS 2026",
          item: "https://mbbsfoundation.com/neet-to-mbbs",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "NEET Counselling Guide",
          item: "https://mbbsfoundation.com/neet-to-mbbs/counselling",
        },
      ],
    },
  ],
};

// 9-Step Roadmap Data
const ROADMAP_STEPS = [
  {
    number: "01",
    title: "Know Your Counselling Options",
    summary:
      "Determine which counselling streams you are eligible for: All India Quota (15% open to all), your Home State 85% quota, or open private/deemed university quotas across states.",
  },
  {
    number: "02",
    title: "Register & Pay Security Deposit",
    summary:
      "Register on the respective portal (MCC for AIQ/Central/Deemed, or your State authority portal), submit your details, and pay the non-refundable registration fee plus refundable security deposit.",
  },
  {
    number: "03",
    title: "Research Colleges Thoroughly",
    summary:
      "Never fill choices based on hearsay. Evaluate colleges on recognition status, patient flow, total fees, hospital bed count, internal PG quota, and rural service bonds.",
  },
  {
    number: "04",
    title: "Fill Your Preferred Choices",
    summary:
      "Add colleges in your strict order of personal preference from top to bottom. Add as many viable choices as allowed—there is usually no penalty for filling more choices.",
  },
  {
    number: "05",
    title: "Review & Lock Choices",
    summary:
      "Carefully verify your sequence before the deadline. While most portals auto-lock saved choices upon closing, locking them manually and downloading a saved copy is the safest practice.",
  },
  {
    number: "06",
    title: "Check Seat Allotment Result",
    summary:
      "The counselling system processes merit ranks and choices to publish the seat allotment result. If allotted, download your provisional allotment letter.",
  },
  {
    number: "07",
    title: "Report & Complete Formalities",
    summary:
      "Report physically to the allotted college or designated reporting center with original documents, complete verification, and pay tuition fees within the notified time window.",
  },
  {
    number: "08",
    title: "Consider Upgrades or Further Rounds",
    summary:
      "If you wish to seek a higher-preference seat, submit your willingness for upgrade in subsequent rounds (Round 2, Round 3/Mop-Up) as permitted by current counselling rules.",
  },
  {
    number: "09",
    title: "Admission Confirmed",
    summary:
      "Once your admission is locked and college reporting is finalized, your journey as an MBBS student officially begins.",
  },
];

// Document Checklist
const DOCUMENT_CATEGORIES = [
  {
    category: "NEET Credentials",
    items: [
      "NEET UG Admit Card",
      "NEET UG Scorecard / Official Rank Card",
      "Counselling Registration Form & Fee Payment Slip",
      "Provisional Seat Allotment Letter (issued after round)",
    ],
  },
  {
    category: "Academic Records",
    items: [
      "Class 10 Certificate & Marksheet (Date of Birth verification)",
      "Class 12 Marksheet & Passing Certificate",
      "School Leaving / Transfer Certificate (TC)",
      "Migration Certificate (if switching boards/universities)",
    ],
  },
  {
    category: "Identity & Photographs",
    items: [
      "Government Photo ID (Aadhaar Card / Passport / Voter ID)",
      "8–10 Passport-size photographs (same as uploaded in NEET form)",
      "Postcard-size photograph (if required by specific state bulletin)",
    ],
  },
  {
    category: "Reservation & Domicile (if applicable)",
    items: [
      "State Domicile / Residence Certificate",
      "Category Certificate (SC / ST / OBC-NCL / EWS in designated central/state format)",
      "Disability Certificate (PwD) from MCC/NMC designated disability screening centers",
      "Minority / Armed Forces / Special Quota verification certificate",
    ],
  },
];

// Common Mistakes
const COMMON_MISTAKES = [
  {
    title: "Missing Strict Deadlines",
    desc: "Counselling schedules for registration, choice locking, and reporting are time-bound. A missed cutoff date cannot be extended.",
  },
  {
    title: "Relying on Social Media Rumors",
    desc: "Cutoffs, seat matrices, and eligibility rules change yearly. Always refer directly to the official counselling brochure rather than informal forums.",
  },
  {
    title: "Inverted Choice Filling",
    desc: "Filling colleges based on 'what rank I have' rather than 'which college I genuinely prefer'. Allotment software tests your top choices first.",
  },
  {
    title: "Looking Only at Base Tuition Fees",
    desc: "Ignoring recurring hostel, mess, examination, caution deposit, and library charges which can significantly increase the actual annual expenditure.",
  },
  {
    title: "Overlooking State Service Bonds",
    desc: "Some states mandate 1 to 5 years of compulsory rural service with financial exit penalties ranging from ₹10 Lakhs to ₹50 Lakhs.",
  },
  {
    title: "Not Reading Specific Round Exit Rules",
    desc: "Free exit rules, security deposit forfeiture conditions, and eligibility for subsequent rounds differ between Round 1, Round 2, and Round 3.",
  },
];

// FAQs Data
const FAQS = [
  {
    question: "Can I participate in both All India Quota (MCC) and State Counselling at the same time?",
    answer:
      "Yes. Most eligible candidates participate in both AIQ (15%) and their respective State Quota (85%) counselling simultaneously. However, once you accept and join a seat in later rounds, rules may prevent you from holding multiple seats or participating in other counselling processes.",
  },
  {
    question: "What is the difference between choice filling and choice locking?",
    answer:
      "Choice filling is the process of selecting and ordering colleges in your account. Choice locking is the final submission step. If you do not lock choices manually before the deadline, most portals automatically lock the last saved choices when the window closes.",
  },
  {
    question: "Does placing a top college at #1 reduce my chances of getting my safe choices lower down?",
    answer:
      "No. The allotment algorithm checks your preference list sequentially from Choice #1 downwards. If you do not qualify for Choice #1, it immediately checks Choice #2, then Choice #3, without any negative impact on your merit standing for lower choices.",
  },
  {
    question: "How does the seat upgrade option work between rounds?",
    answer:
      "When allotted a seat in Round 1, you can report to the college, complete provisional admission formalities, and submit your willingness for 'Upgrade' in Round 2. If a higher-preference seat is allotted in Round 2, your Round 1 seat is automatically vacated. If no higher seat is allotted, your Round 1 seat remains intact.",
  },
  {
    question: "What happens if I get allotted a seat in Round 1 and choose not to join?",
    answer:
      "In MCC AIQ Round 1, there is usually a 'Free Exit' provision, meaning you can choose not to join without forfeiting your refundable security deposit. However, rules vary by state and round, so always confirm the exact round-specific clause in the active official brochure.",
  },
  {
    question: "What is a Stray Vacancy round and who can participate?",
    answer:
      "The Stray Vacancy round is conducted after the Mop-Up / Round 3 to fill any remaining unallotted seats. Candidates who do not hold any seat in previous rounds and are not debarred are typically eligible.",
  },
  {
    question: "Where can I verify authentic, up-to-date counselling notices?",
    answer:
      "For All India Quota, Central Universities, and Deemed Universities, check the official MCC portal (mcc.nic.in). For state quotas, check your official state medical admission portal (e.g., KEA, DME MP, UP DGME, WBMCC, etc.). For college recognition status, verify on the NMC portal (nmc.org.in).",
  },
];

const FAQ_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function NeetCounsellingGuidePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(COUNSELLING_STRUCTURED_DATA) }}
      />
      <NeetSubNav />

      {/* ========================================================================= */}
      {/* 1. HEADER & BREADCRUMB */}
      {/* ========================================================================= */}
      <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50/80 via-white to-white px-4 pt-8 pb-12 sm:px-6 sm:pt-12 sm:pb-16">
        <div className="mx-auto max-w-4xl">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link
              href="/neet-to-mbbs"
              className="text-red-700 hover:text-red-800 transition underline underline-offset-2"
            >
              NEET to MBBS 2026
            </Link>
            <span aria-hidden="true">→</span>
            <span className="text-slate-700 font-bold">Counselling Guide</span>
          </nav>

          {/* Eyebrow */}
          <div className="mt-6 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-800">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
              Stage 1 • Core Guide
            </span>
            <span className="text-xs font-medium text-slate-500">
              Educational & Independent
            </span>
          </div>

          {/* Heading */}
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl leading-tight">
            NEET Counselling Made Simple
          </h1>

          {/* Subheading */}
          <p className="mt-4 text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed font-normal">
            A clear step-by-step guide to understanding registration, choice filling, seat allotment, reporting and the counselling journey after NEET.
          </p>

          {/* Regulatory Disclaimer Notice */}
          <div className="mt-8 rounded-2xl bg-amber-50/80 border border-amber-200/90 p-4 sm:p-5 flex items-start gap-3.5 text-xs sm:text-sm text-amber-950 shadow-xs">
            <span className="text-lg shrink-0 mt-0.5" aria-hidden="true">
              ⚖️
            </span>
            <p className="leading-relaxed">
              <strong className="font-bold">Important Notice: </strong>
              Counselling schedules, eligibility rules, security deposit policies, and seat matrices vary across authorities and rounds. Always verify all decisions against the latest official bulletins published by MCC, NMC, and your state counselling authority.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. WHAT IS NEET COUNSELLING? */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              What Is NEET Counselling?
            </h2>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-700">
              Qualifying NEET provides you with an All India Rank and a scorecard, but it does <strong>not automatically assign you an MBBS seat</strong>. To secure admission in any medical college across India, eligible candidates must register for and participate in the official centralized counselling process.
            </p>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-700">
              Counselling is the statutory mechanism where seats are allotted strictly based on <strong>NEET merit rank, category reservations, college preferences submitted by candidates, and seat availability</strong> across successive rounds.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. WHICH COUNSELLING APPLIES TO ME? */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
            Counselling Streams
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            Which Counselling Applies to Me?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Medical admissions in India are broadly divided into two distinct administrative streams. Depending on your eligibility, you may participate in one or both.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* Card 1: All India Counselling */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-block rounded-lg bg-sky-100 text-sky-900 font-bold text-xs px-3 py-1">
                    Central Authority • MCC
                  </span>
                  <span className="text-xs font-semibold text-slate-400">15% AIQ & Central</span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  All India Quota (AIQ) Counselling
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Conducted by the <strong>Medical Counselling Committee (MCC / DGHS)</strong>. Open to all eligible NEET-qualified students across India without domicile restrictions.
                </p>

                <ul className="mt-4 space-y-2 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-sky-600 font-bold">•</span>
                    <span>15% seats in all Government Medical Colleges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sky-600 font-bold">•</span>
                    <span>100% seats in AIIMS, JIPMER, and Central Universities (BHU, AMU, DU)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sky-600 font-bold">•</span>
                    <span>100% seats in Deemed Universities & ESIC quota</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <a
                  href="https://mcc.nic.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-800 underline underline-offset-2"
                >
                  Official MCC Portal (mcc.nic.in) ↗
                </a>
              </div>
            </div>

            {/* Card 2: State Counselling */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-block rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs px-3 py-1">
                    State Authorities
                  </span>
                  <span className="text-xs font-semibold text-slate-400">85% State Quota</span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  State Quota & Private Counselling
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Conducted by respective <strong>State / UT Admission Authorities</strong> (e.g., KEA Karnataka, DME MP, UP DGME, CET Cell Maharashtra, etc.).
                </p>

                <ul className="mt-4 space-y-2 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>85% seats in State Government Medical Colleges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>100% seats in State Private Medical Colleges & State Universities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>Governed by state-specific domicile, schooling, and reservation rules</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
                Verify portal link with your state DME / CET authority bulletin.
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs sm:text-sm text-slate-600">
            💡 <strong>Pro Tip:</strong> Eligible candidates often register for both AIQ and their home state counselling to maintain maximum flexibility, as each operates on its own schedule.
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. THE COUNSELLING JOURNEY (9-STEP ROADMAP) */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-slate-50/50 border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
            Step-by-Step Flow
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            The Counselling Journey
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            While specific round rules vary, every centralized counselling process follows these nine sequential milestones:
          </p>

          <div className="mt-8 space-y-3.5">
            {ROADMAP_STEPS.map((step) => (
              <div
                key={step.number}
                className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs flex items-start gap-4 transition hover:border-slate-300"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 font-mono text-xs sm:text-sm font-bold text-white">
                  {step.number}
                </span>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                    {step.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. IMPORTANT CHOICE-FILLING PRINCIPLE */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border-2 border-red-100 bg-gradient-to-br from-red-50/50 via-white to-slate-50 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
              Golden Rule of Choice Filling
            </p>

            <blockquote className="mt-4 text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-snug">
              &ldquo;Your preference order and your probability of getting a college are not the same thing.&rdquo;
            </blockquote>

            <div className="mt-4 space-y-3 text-sm sm:text-base text-slate-700 leading-relaxed">
              <p>
                Many students mistakenly avoid putting top-tier medical colleges at the top of their list because they feel their rank is &quot;too low&quot; for them.
              </p>
              <p>
                The allotment software operates in a strictly hierarchical order: it checks your Choice #1 first. If your rank does not secure Choice #1, it immediately tests Choice #2, then Choice #3, and so forth. <strong>Putting an ambitious college at #1 does not reduce your chances of getting your #5 choice</strong> if the earlier choices are unavailable.
              </p>
              <p>
                Therefore, choices should <strong>always be ordered by genuine preference</strong>—from the college you most want to attend down to your safety options.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-xs font-semibold text-slate-600">
                Next Step in Your Decision Process:
              </span>
              <Link
                href="/neet-to-mbbs/choosing-a-medical-college"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
              >
                Learn How to Choose a Medical College →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. BEFORE YOU FILL YOUR CHOICES */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-slate-50/40 border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
            Pre-Submission Checklist
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            Before You Fill Your Choices
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Ensure you have investigated each institution on your shortlist against these nine fundamental criteria before locking:
          </p>

          <div className="mt-8 grid gap-3.5 sm:grid-cols-2 md:grid-cols-3">
            {[
              { title: "NMC Recognition Status", desc: "Verify current permitted/recognized seat intake on the NMC website." },
              { title: "Total Real Cost", desc: "Check tuition, hostel, mess, exam, and hidden development fees." },
              { title: "Hostel & Facilities", desc: "Verify hostel compulsion, room sharing, safety, and living amenities." },
              { title: "Mandatory Service Bond", desc: "Confirm rural service years and penalty amounts for premature exit." },
              { title: "Location & Language", desc: "Consider connectivity and local dialect needed for clinical patient history." },
              { title: "Hospital Patient Footfall", desc: "Examine teaching hospital bed count and daily OPD clinical exposure." },
              { title: "Family Financial Plan", desc: "Ensure multi-year tuition continuity without unexpected strain." },
              { title: "Side-by-Side Comparison", desc: "Objectively compare shortlisted options rather than trusting rumors." },
              { title: "Latest Round Brochure", desc: "Read the active round notice for free-exit and forfeiture rules." },
            ].map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <span className="text-emerald-600">✓</span>
                  <span>{item.title}</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. KEEP YOUR DOCUMENTS READY */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
            Verification Readiness
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            Keep Your Documents Ready
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            During physical reporting and document verification, authorities require original documents along with multiple self-attested photocopies.
          </p>

          <p className="mt-2 text-xs font-semibold text-slate-500">
            Commonly required documents may include:
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {DOCUMENT_CATEGORIES.map((cat, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 shadow-xs">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 border-b border-slate-200/80 pb-2">
                  {cat.category}
                </h3>
                <ul className="mt-3 space-y-2 text-xs sm:text-sm text-slate-700">
                  {cat.items.map((doc, docIdx) => (
                    <li key={docIdx} className="flex items-start gap-2">
                      <span className="text-slate-400 font-bold shrink-0">📄</span>
                      <span className="leading-normal">{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-amber-50 p-4 border border-amber-200/70 text-xs text-amber-950">
            <p>
              ⚠️ <strong>Authority Rule:</strong> The active official information bulletin released by MCC or your state counselling board serves as the final authority.
            </p>
            <Link
              href="/neet-to-mbbs/toolkit#documents-checklist"
              className="inline-flex items-center gap-1.5 font-bold text-red-700 hover:text-red-800 underline shrink-0"
            >
              <span>🖨️</span> Open Printable Checklist →
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. COMMON MISTAKES TO AVOID */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-slate-50/50 border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
            Caution Points
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            Common Mistakes to Avoid
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Every year, eligible students lose preferred seats due to preventable procedural errors. Keep these cautions in mind:
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COMMON_MISTAKES.map((mistake, idx) => (
              <div key={idx} className="rounded-xl border border-red-100 bg-white p-5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-red-700 text-sm font-bold">⚠️</span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {mistake.title}
                  </h3>
                </div>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {mistake.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
            Clear Answers
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Key procedural questions explained with clarity:
          </p>

          <div className="mt-8 space-y-4">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-slate-50/40 p-5 sm:p-6 transition hover:border-slate-300"
              >
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {faq.question}
                </h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. OFFICIAL RESOURCES (VERIFY BEFORE YOU ACT) */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-slate-50/60 border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
            Official Channels
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            Verify Before You Act
          </h2>
          <p className="mt-2 text-base font-semibold text-slate-800">
            Understand here. Verify officially.
          </p>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Always rely solely on authentic government and regulatory bodies for notifications, seat allotment results, and deadlines:
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                All India Counselling
              </p>
              <h3 className="mt-1 text-sm font-bold text-slate-900">
                MCC (DGHS)
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Official portal for 15% AIQ, AIIMS, JIPMER, Central & Deemed universities.
              </p>
              <a
                href="https://mcc.nic.in"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-xs font-bold text-red-700 hover:text-red-800 underline underline-offset-2"
              >
                mcc.nic.in ↗
              </a>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Medical College Recognition
              </p>
              <h3 className="mt-1 text-sm font-bold text-slate-900">
                NMC India
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                National Medical Commission official directory of recognized medical colleges.
              </p>
              <a
                href="https://www.nmc.org.in"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-xs font-bold text-red-700 hover:text-red-800 underline underline-offset-2"
              >
                nmc.org.in ↗
              </a>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                NEET Examination Portal
              </p>
              <h3 className="mt-1 text-sm font-bold text-slate-900">
                NTA NEET UG
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                National Testing Agency official portal for scorecards and official press releases.
              </p>
              <a
                href="https://exams.nta.ac.in/NEET/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-xs font-bold text-red-700 hover:text-red-800 underline underline-offset-2"
              >
                exams.nta.ac.in/NEET ↗
              </a>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/60 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
            <span>
              <strong>State-specific notices:</strong> Access via your respective State DME / CET authority portal.
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Last verified: 2026 | Official source: MCC & NMC Guidelines
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. NEXT STEP: WHICH COLLEGE SHOULD YOU CHOOSE? */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-950 p-8 sm:p-10 text-white shadow-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
              The Next Big Decision
            </p>

            <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Counselling Tells You How to Submit Choices. The Harder Question Is: Which College Should You Choose?
            </h2>

            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              A high rank gives you choices, but clarity determines your career. Before you lock your preferences, learn how to evaluate clinical exposure, hospital bed counts, service bonds, genuine fees, and personal priorities.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/neet-to-mbbs/choosing-a-medical-college"
                className="inline-flex items-center rounded-xl bg-white px-6 py-3 text-xs sm:text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-100 transition"
              >
                Next: Learn How to Choose a Medical College →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. SHARING SECTION */}
      {/* ========================================================================= */}
      <ShareSection
        eyebrow="Help Another Aspirant"
        heading="Know Someone Going Through NEET Counselling?"
        subheading="Share this step-by-step counselling guide with friends or family navigating admissions."
        sharePath="/neet-to-mbbs/counselling"
        whatsappMessage="Going through NEET counselling? This guide explains registration, choice filling, allotment, reporting and common counselling mistakes in a simple way. Sharing in case it helps: [URL]"
      />

      {/* ========================================================================= */}
      {/* 13. PREV / NEXT NAVIGATION */}
      {/* ========================================================================= */}
      <PrevNextNav
        next={{
          title: "How to Choose the Right Medical College",
          href: "/neet-to-mbbs/choosing-a-medical-college",
          label: "Next Step 02",
        }}
      />
    </main>
  );
}

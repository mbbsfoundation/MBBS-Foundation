import type { Metadata } from "next";
import Link from "next/link";
import NeetSubNav from "@/components/neet-to-mbbs/NeetSubNav";
import PrevNextNav from "@/components/neet-to-mbbs/PrevNextNav";
import ShareSection from "@/components/neet-to-mbbs/ShareSection";
import VerificationNotice from "@/components/neet-to-mbbs/VerificationNotice";

export const metadata: Metadata = {
  title: "How to Choose the Right Medical College After NEET: 10-Factor Evaluation Matrix",
  description:
    "Compare medical colleges objectively after NEET rank. Evaluate patient load, clinical OPD, service bond penalties, internal PG quotas, hidden fees, and NMC recognition.",
  alternates: {
    canonical: "https://mbbsfoundation.com/neet-to-mbbs/choosing-a-medical-college",
  },
  keywords: [
    "How to choose medical college after NEET",
    "Medical college comparison framework India",
    "Patient load and OPD in medical colleges",
    "Rural service bond penalty list state wise",
    "Internal PG quota in medical colleges IP quota",
    "Old vs new AIIMS comparison",
    "Government vs private deemed medical college comparison",
    "NMC recognition verification checklist",
    "MBBS total 5.5 year cost calculator",
    "Medical college selection strategy NEET 2026",
  ],
  openGraph: {
    title: "How to Choose the Right Medical College After NEET: 10-Factor Evaluation Matrix",
    description:
      "Compare medical colleges objectively after NEET rank. Evaluate patient load, clinical OPD, service bond penalties, internal PG quotas, hidden fees, and NMC recognition.",
    url: "https://mbbsfoundation.com/neet-to-mbbs/choosing-a-medical-college",
    siteName: "MBBS Foundation",
    locale: "en_IN",
    type: "article",
    images: [
      {
        url: "https://mbbsfoundation.com/images/neet-to-mbbs/toolkit-preview.png",
        width: 1200,
        height: 630,
        alt: "How to Choose a Medical College After NEET",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Choose the Right Medical College After NEET: 10-Factor Evaluation Matrix",
    description:
      "A practical decision framework to evaluate MBBS colleges on clinical exposure, hospital patient load, total cost, bond obligations, and personal priorities.",
    images: ["https://mbbsfoundation.com/images/neet-to-mbbs/toolkit-preview.png"],
  },
};

const COLLEGE_CHOICE_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "How to Choose the Right Medical College After NEET: 10-Factor Evaluation Matrix",
      description:
        "Compare medical colleges after NEET using clinical patient exposure, 5.5-year real cost, service bonds, teaching hospital quality, hostel, and personal priorities.",
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
        "@id": "https://mbbsfoundation.com/neet-to-mbbs/choosing-a-medical-college",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Why is teaching hospital patient load more important than campus infrastructure?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Medicine is an apprenticeship learned at the patient's bedside. A college with older buildings but 2,000+ daily OPD patients and full inpatient wards will produce a far more competent doctor than a luxury campus with an empty hospital where students rarely examine real clinical cases.",
          },
        },
        {
          "@type": "Question",
          name: "How do internal PG quotas (institutional preference) influence medical college choice?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Certain institutions like Delhi University (MAMC, UCMS, LHMC), IP University (VMMC, ABVIMS), BHU, AMU, and CMC Vellore offer institutional preference/quota for postgraduate (MD/MS) seats to their own MBBS graduates. This provides a significant advantage during NEET PG / INI-CET admissions.",
          },
        },
        {
          "@type": "Question",
          name: "What should I look for in service bond policies before finalizing a college?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Check the exact duration of mandatory rural service (ranging from 0 to 5 years depending on state), the financial penalty for non-compliance (ranging from ₹5 Lakhs to ₹50 Lakhs+), and whether you are permitted to pursue immediate PG training before serving the bond.",
          },
        },
        {
          "@type": "Question",
          name: "How can I verify if a medical college is officially recognized by the NMC?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Always cross-verify the college name, approved seat capacity, and current recognition status directly on the official National Medical Commission (NMC) website (nmc.org.in) under the 'Information Desk > List of Colleges Teaching MBBS' section.",
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
          name: "Choosing a Medical College",
          item: "https://mbbsfoundation.com/neet-to-mbbs/choosing-a-medical-college",
        },
      ],
    },
  ],
};

// 8 Factors in Decision Framework
const DECISION_FACTORS = [
  {
    number: "01",
    title: "Recognition & Academic Status",
    description:
      "Check the institution's official status on the National Medical Commission (NMC) portal. Confirm whether the MBBS intake is fully recognized or permitted under initial Letter of Permission (LOP), and verify its affiliating university.",
    keyCheck: "NMC recognition directory & university affiliation",
    icon: "🏛️",
  },
  {
    number: "02",
    title: "Teaching Hospital & Clinical Exposure",
    description:
      "Medicine is learned at the bedside. Look at the attached teaching hospital, its daily Outpatient (OPD) and Inpatient (IPD) footfall, emergency services, and patient diversity across clinical departments.",
    keyCheck: "Active patient diversity & hands-on clinical postings",
    icon: "🏥",
  },
  {
    number: "03",
    title: "Academic Ecosystem & PG Seats",
    description:
      "Institutions with established postgraduate (MD/MS/DNB) programmes generally possess greater faculty stability, specialized clinical units, active academic seminars, and opportunities for undergraduate research.",
    keyCheck: "Faculty availability, PG departments & academic culture",
    icon: "📚",
  },
  {
    number: "04",
    title: "Total Real Cost of MBBS",
    description:
      "Look far beyond base tuition. Calculate the comprehensive 5.5-year expenditure including mandatory hostel charges, mess fees, examination fees, caution deposits, books, instruments, and travel costs.",
    keyCheck: "All-inclusive multi-year financial sustainability",
    icon: "💳",
  },
  {
    number: "05",
    title: "Service Bond & Exit Obligations",
    description:
      "Several states enforce mandatory rural or government service bonds (ranging from 1 to 5 years) with financial exit penalties of ₹5 Lakhs to ₹50 Lakhs. Verify current bond rules through official state notifications.",
    keyCheck: "Mandatory service duration & financial penalty clauses",
    icon: "📜",
  },
  {
    number: "06",
    title: "Hostel, Campus & Living Conditions",
    description:
      "Medical education requires intense focus. Evaluate campus safety, hostel availability, room occupancy, mess food quality, 24/7 library and reading room facilities, and student well-being support.",
    keyCheck: "Safe accommodation, hygiene, food & study spaces",
    icon: "🏡",
  },
  {
    number: "07",
    title: "Location, Language & Connectivity",
    description:
      "Consider travel connectivity from your home, climate, and the local regional language needed to take clinical histories from patients. Being closer or farther from home is a personal trade-off with distinct advantages.",
    keyCheck: "Travel ease, patient communication language & climate",
    icon: "📍",
  },
  {
    number: "08",
    title: "Your Personal Priorities",
    description:
      "Every student has distinct priorities: some prioritize minimal fees, others prioritize clinical case volume, PG internal quota, or proximity to family. Align your choice with your personal values.",
    keyCheck: "What matters most to you and your family",
    icon: "🎯",
  },
];

// Sample Comparison Matrix Data
const COMPARISON_ROWS = [
  {
    factor: "NMC Recognition Status",
    collegeA: "Recognized (Old Established)",
    collegeB: "Recognized (State GMC)",
    collegeC: "Permitted (Newer Private)",
  },
  {
    factor: "Total Real Cost (5.5 Years)",
    collegeA: "Very Low (₹50k - ₹2L total)",
    collegeB: "Low (₹2L - ₹6L total)",
    collegeC: "High (₹60L - ₹1 Cr+ total)",
  },
  {
    factor: "Service Bond / Penalty",
    collegeA: "None / Central Rules",
    collegeB: "2 Years / ₹20 Lakhs",
    collegeC: "No State Bond",
  },
  {
    factor: "Teaching Hospital OPD",
    collegeA: "2,500+ Patients / Day",
    collegeB: "1,800+ Patients / Day",
    collegeC: "800 - 1,200 Patients / Day",
  },
  {
    factor: "Clinical Case Diversity",
    collegeA: "Tertiary Referral Cases",
    collegeB: "Broad General & Trauma",
    collegeC: "Regional General Cases",
  },
  {
    factor: "Academic Ecosystem / PG",
    collegeA: "Extensive MD/MS & Super-specialty",
    collegeB: "Key Clinical PG Departments",
    collegeC: "Limited / Developing PG",
  },
  {
    factor: "Hostel & Living Space",
    collegeA: "Basic / Functional",
    collegeB: "Standard Govt Hostel",
    collegeC: "Modern / Air-Conditioned",
  },
  {
    factor: "Travel & Connectivity",
    collegeA: "Major Metro / Direct Flights",
    collegeB: "District HQ / Train Connected",
    collegeC: "Suburban / Highway Access",
  },
];

// 10 Thoughtful Questions
const TEN_QUESTIONS = [
  "Is the MBBS program and its seat intake currently verified on the NMC portal?",
  "What will the complete 5.5-year course realistically cost my family including all living and hostel fees?",
  "What specific service bond or penalty currently applies in that state or institution?",
  "What is the actual patient footfall and case variety in the attached teaching hospital?",
  "Is suitable hostel accommodation guaranteed for all undergraduate years?",
  "What is the academic culture, faculty availability, and postgraduate environment like?",
  "How straightforward is travel between the college and my hometown in emergencies?",
  "Am I willing and ready to learn the local dialect required for patient history taking?",
  "What do current students say about clinical postings—and which claims have I verified myself?",
  "If offered both College A and College B today without rank constraints, which would I genuinely prefer?",
];

// Red Flags Checklist
const RED_FLAGS = [
  "Fee structure is vague, with unclear mentions of 'other mandatory charges' or future hikes.",
  "Service bond details are based only on student hearsay rather than official state gazette notifications.",
  "NMC recognition or renewal status is ambiguous or under active compliance scrutiny.",
  "Hostel and mess claims on social media contradict the accounts of current students.",
  "You are ranking a college high solely because a coaching brochure or influencer praised it.",
  "The institution has been added to your choice list without knowing its exact geographical location.",
  "Your family has not evaluated the cumulative multi-year financial commitment.",
  "You are ranking a college higher purely because last year's cutoff was higher.",
];

export default function ChoosingMedicalCollegePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(COLLEGE_CHOICE_STRUCTURED_DATA) }}
      />
      <NeetSubNav />

      {/* ========================================================================= */}
      {/* 1. HEADER & BREADCRUMB */}
      {/* ========================================================================= */}
      <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50/80 via-white to-white px-4 pt-8 pb-12 sm:px-6 sm:pt-12 sm:pb-16">
        <div className="mx-auto max-w-4xl">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <Link
              href="/neet-to-mbbs"
              className="text-red-700 hover:text-red-800 transition underline underline-offset-2"
            >
              NEET to MBBS 2026
            </Link>
            <span aria-hidden="true">→</span>
            <span className="text-slate-700 font-bold">Choosing a Medical College</span>
          </nav>

          {/* Eyebrow */}
          <div className="mt-6 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-800">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
              Stage 2 • Decision Framework
            </span>
            <span className="text-xs font-medium text-slate-500">
              Unbiased & Objective
            </span>
          </div>

          {/* Heading */}
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl leading-tight">
            How to Choose the Right Medical College
          </h1>

          {/* Subheading */}
          <p className="mt-4 text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed font-normal">
            Look beyond the college name. Compare the factors that will shape your education, clinical exposure, finances and life for the next several years.
          </p>

          {/* Verification Disclaimer */}
          <div className="mt-8 rounded-2xl bg-amber-50/80 border border-amber-200/90 p-4 sm:p-5 flex items-start gap-3.5 text-xs sm:text-sm text-amber-950 shadow-xs">
            <span className="text-lg shrink-0 mt-0.5" aria-hidden="true">
              ⚖️
            </span>
            <p className="leading-relaxed">
              <strong className="font-bold">Important Notice: </strong>
              Institutional data, annual fee structures, NMC recognition status, and state service bond clauses may be revised by authorities. Always verify critical facts through official regulatory portals before locking your final preferences.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. START WITH ONE IMPORTANT IDEA */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border-2 border-red-100 bg-gradient-to-br from-red-50/40 via-white to-slate-50 p-6 sm:p-8 md:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
              The Guiding Principle
            </p>

            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              There Is No Single &ldquo;Best&rdquo; Medical College for Everyone
            </h2>

            <blockquote className="mt-4 text-lg sm:text-xl font-bold text-slate-900 leading-snug border-l-4 border-red-700 pl-4 py-1">
              Don&apos;t ask only: &ldquo;Which college is better?&rdquo; <br className="hidden sm:inline" />
              Ask: &ldquo;Which college is better for <span className="text-red-700 underline underline-offset-4">me</span>?&rdquo;
            </blockquote>

            <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-700">
              Students and families often rank colleges based purely on perceived brand prestige or previous year cutoffs. But an institution that is ideal for one student may not be the right choice for another with different financial considerations, geographical constraints, or clinical goals.
            </p>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-700">
              The right choice depends on the <strong>overall balance of clinical quality, financial viability, living environment, service obligations, and personal comfort</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. THE 8-FACTOR MEDICAL COLLEGE DECISION FRAMEWORK */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-slate-50/50 border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
              Core Framework
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
              The 8-Factor Decision Framework
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Use these eight objective pillars to evaluate and compare every medical college on your potential list:
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {DECISION_FACTORS.map((factor) => (
              <div
                key={factor.number}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between transition-all duration-200 hover:border-slate-300 hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 font-mono text-xs font-bold text-white">
                      {factor.number}
                    </span>
                    <span className="text-xl" aria-hidden="true">
                      {factor.icon}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-slate-900">
                    {factor.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {factor.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="text-emerald-700">🔍 Check:</span>
                  <span className="text-slate-600">{factor.keyCheck}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Framework Summary Quote */}
          <div className="mt-10 rounded-2xl bg-white border border-slate-200/90 p-6 text-center shadow-xs">
            <p className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              &ldquo;A good decision is not the college with the most impressive single feature. It is the college whose overall combination works best for you.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FACTS VS IMPRESSIONS */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
            Objectivity Check
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            Useful Facts vs Impressions
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Separate verifiable institutional data from subjective online opinions:
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* Useful Facts */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-6">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                  ✓
                </span>
                <h3 className="text-base sm:text-lg font-bold text-emerald-950">
                  Useful Facts to Verify
                </h3>
              </div>

              <ul className="mt-4 space-y-2.5 text-xs sm:text-sm text-emerald-950">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span>Official NMC recognition & approved intake</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span>Verified total fee structure & hidden charges</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span>Applicable rural bond years & financial penalty</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span>Attached teaching hospital bed occupancy & OPD flow</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span>Guaranteed hostel availability & safety</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span>Travel connectivity & distance from hometown</span>
                </li>
              </ul>
            </div>

            {/* Impressions to Treat Carefully */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-6">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-600 text-white font-bold text-xs">
                  ⚠️
                </span>
                <h3 className="text-base sm:text-lg font-bold text-amber-950">
                  Impressions to Treat Carefully
                </h3>
              </div>

              <ul className="mt-4 space-y-2.5 text-xs sm:text-sm text-amber-950">
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">•</span>
                  <span>&ldquo;Everyone in coaching says this college is top&rdquo;</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">•</span>
                  <span>Social media reels and lifestyle promo videos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">•</span>
                  <span>A single isolated viral positive or negative review</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">•</span>
                  <span>Photos of campus lawns without hospital data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">•</span>
                  <span>Treating previous year cutoff as an educational score</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-bold">•</span>
                  <span>Hearsay from informal counselling WhatsApp groups</span>
                </li>
              </ul>
            </div>
          </div>

          <p className="mt-5 text-center text-xs sm:text-sm font-semibold text-slate-700">
            💡 <strong>Takeaway:</strong> Use peer experiences for perspective—but verify important facts independently.
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PREVIOUS CUTOFF IS NOT A QUALITY SCORE */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-slate-50/50 border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
              Cutoff Myth Busting
            </p>
            <h2 className="mt-2 text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">
              A Higher Cutoff Does Not Automatically Mean a Better College for You
            </h2>
            <div className="mt-4 space-y-3 text-xs sm:text-sm leading-relaxed text-slate-700">
              <p>
                Previous year cutoffs reflect <strong>historical candidate preference and geographic convenience</strong> from past admission seasons—not an absolute measurement of academic teaching quality or clinical mentorship.
              </p>
              <p>
                For instance, a newer medical college located adjacent to a metro city may close at a higher rank simply due to urban location appeal, while an older, established government medical college in a non-metro district with three times higher patient volume and rich clinical heritage might close at a lower rank.
              </p>
              <p>
                Understand past cutoffs to identify realistic scenarios, but choose your college based on the education, clinical environment, and life you want.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CREATE YOUR SHORTLIST & SAMPLE COMPARISON */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
            Systematic Comparison
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            Compare Before You Decide
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Rather than feeling overwhelmed by hundreds of options, narrow your realistic choices down to a manageable shortlist (5–7 colleges) and evaluate them side-by-side:
          </p>

          {/* Responsive Comparison Table (Desktop View) */}
          <div className="mt-8 hidden sm:block overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="py-3.5 px-4 font-semibold">Evaluation Factor</th>
                  <th className="py-3.5 px-4 font-semibold">College A (e.g. Central/AIIMS)</th>
                  <th className="py-3.5 px-4 font-semibold">College B (e.g. State GMC)</th>
                  <th className="py-3.5 px-4 font-semibold">College C (e.g. Private/Deemed)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="py-3 px-4 font-bold text-slate-900">{row.factor}</td>
                    <td className="py-3 px-4">{row.collegeA}</td>
                    <td className="py-3 px-4">{row.collegeB}</td>
                    <td className="py-3 px-4">{row.collegeC}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View */}
          <div className="mt-6 sm:hidden space-y-3">
            {COMPARISON_ROWS.map((row, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-1.5 text-xs">
                <p className="font-bold text-slate-900">{row.factor}</p>
                <div className="pt-1.5 space-y-1 text-slate-600">
                  <p><strong className="text-slate-800">College A:</strong> {row.collegeA}</p>
                  <p><strong className="text-slate-800">College B:</strong> {row.collegeB}</p>
                  <p><strong className="text-slate-800">College C:</strong> {row.collegeC}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-slate-500 text-center">
            * This comparison framework is illustrative. Customize it with your shortlisted institutions.
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. QUESTIONS WORTH ASKING BEFORE FINALIZING */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-slate-50/50 border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
            Critical Review
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            10 Questions Worth Asking Before Finalizing
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Run each shortlisted college through these 10 practical questions:
          </p>

          <div className="mt-8 space-y-3">
            {TEN_QUESTIONS.map((q, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-start gap-3.5 transition hover:border-slate-300"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-800 font-bold text-xs">
                  {idx + 1}
                </span>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                  {q}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. STUDENT AND PARENT PERSPECTIVES */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
              Shared Decision
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
              Make the Decision Together
            </h2>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="space-y-2 text-xs sm:text-sm text-slate-700">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <span>🎓</span> For Students
                </h3>
                <p className="leading-relaxed">
                  Focus on where you can study with focus, learn real medicine at the bedside, and adapt to the living environment. Do not choose solely for campus bragging rights.
                </p>
              </div>

              <div className="space-y-2 text-xs sm:text-sm text-slate-700">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <span>👨‍👩‍👧</span> For Parents
                </h3>
                <p className="leading-relaxed">
                  Evaluate financial sustainability across all 5.5 years, student safety, travel accessibility, and respect your child&apos;s genuine preference and adaptability.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-200 text-center">
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                &ldquo;The strongest choice is usually one the student understands and the family can realistically support.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. RED FLAGS BEFORE YOU LOCK A CHOICE */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-slate-50/50 border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
            Pause & Verify
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            Red Flags Before You Lock a Choice
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Pause and double-check before submitting your preference list if you notice any of these warning signs:
          </p>

          <div className="mt-8 grid gap-3.5 sm:grid-cols-2">
            {RED_FLAGS.map((flag, idx) => (
              <div key={idx} className="rounded-xl border border-red-200/80 bg-white p-4 shadow-2xs flex items-start gap-3">
                <span className="text-red-700 text-sm font-bold shrink-0 mt-0.5">⚠️</span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {flag}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. OFFICIAL VERIFICATION */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
            Official Channels
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            Verify the Facts That Matter
          </h2>
          <p className="mt-2 text-sm sm:text-base font-semibold text-slate-800">
            Understand and compare here. Verify critical facts officially.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900">NMC Directory</h3>
              <p className="mt-1 text-xs text-slate-600">
                Official recognized status and approved undergraduate seat matrix.
              </p>
              <a
                href="https://www.nmc.org.in"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-xs font-bold text-red-700 hover:text-red-800 underline"
              >
                nmc.org.in ↗
              </a>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900">Official College Portals</h3>
              <p className="mt-1 text-xs text-slate-600">
                Check official prospectus for detailed hostel, hospital, and fees breakdown.
              </p>
              <span className="mt-3 inline-block text-xs font-medium text-slate-500">
                Direct College Websites
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900">State DME Portals</h3>
              <p className="mt-1 text-xs text-slate-600">
                Official state service bond circulars and fee regulation orders.
              </p>
              <span className="mt-3 inline-block text-xs font-medium text-slate-500">
                State Counselling Authorities
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11 & 12. BRIDGES: COUNSELLING, TOOLKIT, AND PARENTS */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-slate-50/60">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Card A: Toolkit Bridge */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
              Structured Comparison
            </p>
            <h2 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">
              Ready to Compare Your Shortlist?
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              Use a structured worksheet to compare colleges on the same factors before finalizing your preferences.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <Link
                href="/neet-to-mbbs/toolkit#college-comparison"
                className="inline-flex items-center rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
              >
                Get the Free College Comparison Worksheet →
              </Link>
            </div>
          </div>

          {/* Card B: Parent Pathway Bridge */}
          <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 sm:p-8 text-white shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <span className="inline-block rounded-lg bg-amber-400 text-slate-950 font-bold text-[11px] px-2.5 py-0.5 uppercase tracking-wider">
                  For Parents & Mentors
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Choosing Together as a Family?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                  Understand how to evaluate financial sustainability, campus security, bond obligations, and guide your child through counselling.
                </p>
              </div>

              <div className="shrink-0">
                <Link
                  href="/neet-to-mbbs/parents"
                  className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-slate-900 shadow-sm hover:bg-slate-100 transition"
                >
                  Read the Parent Guide →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 13. SHARING SECTION */}
      {/* ========================================================================= */}
      <ShareSection
        eyebrow="Help Another Aspirant"
        heading="Comparing Medical Colleges With Friends?"
        subheading="Share this practical decision framework with friends and family evaluating medical colleges."
        sharePath="/neet-to-mbbs/choosing-a-medical-college"
        whatsappMessage="Choosing between medical colleges after NEET? This guide gives a practical framework to compare fees, bond, teaching hospital, clinical exposure, academics, hostel, location and personal priorities: [URL]"
      />

      {/* ========================================================================= */}
      {/* 14. PREV / NEXT NAVIGATION */}
      {/* ========================================================================= */}
      <PrevNextNav
        prev={{
          title: "NEET Counselling Made Simple",
          href: "/neet-to-mbbs/counselling",
          label: "Previous Step 01",
        }}
        next={{
          title: "Free NEET to MBBS Toolkit & Worksheets",
          href: "/neet-to-mbbs/toolkit",
          label: "Next Free Tool",
        }}
        parallel={{
          title: "A Parent's Guide to the Journey from NEET to MBBS",
          href: "/neet-to-mbbs/parents",
          label: "Parent Guide",
        }}
      />
    </main>
  );
}

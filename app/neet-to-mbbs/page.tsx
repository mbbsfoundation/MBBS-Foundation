import type { Metadata } from "next";
import Link from "next/link";
import NeetSubNav from "@/components/neet-to-mbbs/NeetSubNav";
import ShareSection from "@/components/neet-to-mbbs/ShareSection";

export const metadata: Metadata = {
  title: "NEET to MBBS 2026: Complete Counselling, College Choice & 1st Year MBBS Guide",
  description:
    "Authoritative NEET UG 2026 roadmap for students & parents: MCC AIQ 15% vs state counselling, 3-college comparison tool, rural bonds, admission documents, and 1st-year MBBS readiness.",
  alternates: {
    canonical: "https://mbbsfoundation.com/neet-to-mbbs",
  },
  keywords: [
    "NEET to MBBS 2026",
    "NEET UG counselling guide 2026",
    "MCC AIQ counselling choice filling",
    "How to choose medical college after NEET",
    "Medical college comparison tool India",
    "MBBS admission documents checklist",
    "First year MBBS preparation guide",
    "NEET rank wise medical college selection",
    "Government vs private medical college fees bond",
    "Future doctor challenge quiz",
    "Dr Lokesh Tiwari MBBS guide",
  ],
  openGraph: {
    title: "NEET to MBBS 2026: Complete Counselling, College Choice & 1st Year MBBS Guide",
    description:
      "Authoritative NEET UG 2026 roadmap for students & parents: MCC AIQ 15% vs state counselling, 3-college comparison tool, rural bonds, admission documents, and 1st-year MBBS readiness.",
    url: "https://mbbsfoundation.com/neet-to-mbbs",
    siteName: "MBBS Foundation",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://mbbsfoundation.com/images/neet-to-mbbs/toolkit-preview.png",
        width: 1200,
        height: 630,
        alt: "NEET to MBBS 2026 Educational Roadmap & Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NEET to MBBS 2026: Complete Counselling & Medical College Guide",
    description:
      "Free step-by-step roadmap for NEET-qualified students & parents: counselling, choice filling, college comparisons, and MBBS prep.",
    images: ["https://mbbsfoundation.com/images/neet-to-mbbs/toolkit-preview.png"],
  },
};

const HUB_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "NEET to MBBS 2026: Complete Counselling, College Choice & 1st Year MBBS Guide",
  url: "https://mbbsfoundation.com/neet-to-mbbs",
  description:
    "Authoritative NEET UG 2026 roadmap for students & parents: MCC AIQ 15% vs state counselling, 3-college comparison tool, rural bonds, admission documents, and 1st-year MBBS readiness.",
  publisher: {
    "@type": "Organization",
    name: "Ayurvigyan Foundation",
    url: "https://mbbsfoundation.com",
  },
  breadcrumb: {
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
    ],
  },
};

// Pathway Cards Data
interface PathwayItem {
  id: string;
  title: string;
  microcopy: string;
  targetRoute: string;
  badge: string;
  isLive?: boolean;
  isPrimary?: boolean;
}

const PRIMARY_PATHWAYS: PathwayItem[] = [
  {
    id: "counselling",
    title: "Going for counselling?",
    microcopy: "Understand the process, rounds, choices and important decisions.",
    targetRoute: "/neet-to-mbbs/counselling",
    badge: "Stage 1 • Detailed Guide",
    isLive: true,
    isPrimary: true,
  },
  {
    id: "choosing-college",
    title: "Choosing a medical college?",
    microcopy: "Learn what really matters before deciding between your options.",
    targetRoute: "/neet-to-mbbs/choosing-a-medical-college",
    badge: "Stage 2 • Selection Guide",
    isLive: true,
    isPrimary: true,
  },
  {
    id: "after-admission",
    title: "Got your MBBS seat?",
    microcopy: "Prepare for the transition from NEET aspirant to medical student.",
    targetRoute: "/neet-to-mbbs/after-admission",
    badge: "Stage 4 • Transition Guide",
    isLive: true,
    isPrimary: true,
  },
];

const PARENT_PATHWAY: PathwayItem = {
  id: "parents",
  title: "Parent of a future doctor?",
  microcopy:
    "Guidance for helping your child make an informed choice and prepare for medical college.",
  targetRoute: "/neet-to-mbbs/parents",
  badge: "Parent Resource",
  isLive: true,
};

// Five-Stage Journey Data
interface JourneyStage {
  step: string;
  title: string;
  description: string;
  futureRoute?: string;
  statusText: string;
  isLive?: boolean;
}

const JOURNEY_STAGES: JourneyStage[] = [
  {
    step: "01",
    title: "Understand Counselling",
    description:
      "Learn how registration, choice filling, allotment and counselling rounds work across All India Quota and State counselling.",
    futureRoute: "/neet-to-mbbs/counselling",
    statusText: "Read Complete Guide →",
    isLive: true,
  },
  {
    step: "02",
    title: "Choose Your Medical College",
    description:
      "Know what really matters before deciding between your college options—from clinical patient exposure and internal PG quotas to bond conditions and real costs.",
    futureRoute: "/neet-to-mbbs/choosing-a-medical-college",
    statusText: "Read Decision Guide →",
    isLive: true,
  },
  {
    step: "03",
    title: "Get Your Seat",
    description:
      "Understand the transition from seat allotment and document verification to reporting and confirming your admission.",
    statusText: "Process Milestone",
  },
  {
    step: "04",
    title: "Prepare for MBBS",
    description:
      "Know what to expect before your first day in medical college—academics, anatomy dissections, clinical culture, and hostel life.",
    futureRoute: "/neet-to-mbbs/after-admission",
    statusText: "Read Preparation Guide →",
    isLive: true,
  },
  {
    step: "05",
    title: "Start Becoming a Doctor",
    description:
      "Begin developing the skills, attitudes, compassion, ethics, and professional mindset that medicine demands from Day One.",
    statusText: "Foundation & Clinical Practice",
  },
];

const TRUST_PILLARS = [
  {
    title: "Independent Guidance",
    subtitle: "Objective, student-first clarity without commercial bias",
    icon: "⚖️",
  },
  {
    title: "Student & Parent Focused",
    subtitle: "Designed to address real anxieties and practical decisions",
    icon: "🤝",
  },
  {
    title: "Official Sources Linked",
    subtitle: "Aligned with MCC, NMC, and official counselling frameworks",
    icon: "🏛️",
  },
  {
    title: "Free Resources",
    subtitle: "Accessible checklists and frameworks for every aspirant",
    icon: "📖",
  },
];

export default function NeetToMbbsMasterHubPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HUB_STRUCTURED_DATA) }}
      />
      <NeetSubNav />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative border-b border-slate-100 bg-gradient-to-b from-slate-50/80 via-white to-white px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
        <div className="mx-auto max-w-5xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200/80 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-800">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
              NEET to MBBS 2026
            </span>
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
              • From counselling to your first day in medical college
            </span>
          </div>

          {/* Headline */}
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl leading-[1.12]">
            NEET Qualified? <br className="hidden sm:inline" />
            <span className="text-slate-900">Your Medical Journey Starts Here.</span>
          </h1>

          {/* Supporting Copy */}
          <p className="mt-5 max-w-3xl text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed font-normal">
            Understand counselling, choose your medical college wisely, prepare for MBBS, and take your first steps into the profession.
          </p>

          {/* Primary Pathway Actions (3 Student Cards) */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRIMARY_PATHWAYS.map((pathway) => {
              const CardContent = (
                <>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-block rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                          pathway.isLive
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {pathway.badge}
                      </span>
                      <span
                        className={`text-xs font-medium transition ${
                          pathway.isLive
                            ? "text-red-700 font-bold group-hover:translate-x-0.5"
                            : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      >
                        {pathway.isLive ? "Explore Guide →" : "Coming Soon →"}
                      </span>
                    </div>

                    <h2 className="mt-3.5 text-lg sm:text-xl font-bold text-slate-900 group-hover:text-red-700 transition">
                      {pathway.title}
                    </h2>

                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {pathway.microcopy}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="text-slate-500">Destination:</span>
                    <span className="font-mono text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                      {pathway.targetRoute.replace("/neet-to-mbbs", "")}
                    </span>
                  </div>
                </>
              );

              return pathway.isLive ? (
                <Link
                  key={pathway.id}
                  href={pathway.targetRoute}
                  className="group relative flex flex-col justify-between rounded-2xl border-2 border-red-200/80 bg-white p-5 sm:p-6 shadow-sm transition-all duration-200 hover:border-red-500 hover:shadow-md"
                >
                  {CardContent}
                </Link>
              ) : (
                <div
                  key={pathway.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm transition-all duration-200 hover:border-slate-400/80 hover:shadow-md"
                >
                  {CardContent}
                </div>
              );
            })}
          </div>

          {/* Distinct Parent Pathway Card */}
          <Link
            href={PARENT_PATHWAY.targetRoute}
            className="mt-4 block rounded-2xl border-2 border-amber-200/80 bg-gradient-to-r from-amber-50/70 via-white to-slate-50 p-5 sm:p-6 transition-all duration-200 hover:border-amber-400 hover:shadow-md group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-block rounded-lg bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                    {PARENT_PATHWAY.badge}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    For Parents & Guardians
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-amber-900 transition">
                  {PARENT_PATHWAY.title}
                </h2>
                <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                  {PARENT_PATHWAY.microcopy}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs group-hover:bg-slate-800 transition">
                  Explore Parent Guide →
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. TRUST STRIP & CREDIBILITY BAR */}
      {/* ========================================================================= */}
      <section aria-label="Credibility and trust standards" className="border-b border-slate-200/80 bg-slate-50/60 py-8 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 sm:gap-6">
            {TRUST_PILLARS.map((pillar, index) => (
              <div key={index} className="flex flex-col space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base" aria-hidden="true">{pillar.icon}</span>
                  <p className="text-sm font-bold text-slate-900 tracking-tight">
                    {pillar.title}
                  </p>
                </div>
                <p className="text-xs text-slate-500 leading-normal pl-6">
                  {pillar.subtitle}
                </p>
              </div>
            ))}
          </div>

          {/* 3. GUIDANCE DISCLAIMER */}
          <div className="mt-6 pt-5 border-t border-slate-200/60">
            <div className="rounded-xl bg-white border border-slate-200/90 p-4 sm:p-4.5 flex items-start gap-3 text-xs leading-relaxed text-slate-600 shadow-xs">
              <span className="text-base shrink-0 mt-0.5" aria-hidden="true">
                ℹ️
              </span>
              <p>
                <strong className="font-semibold text-slate-800">Important Note: </strong>
                Counselling schedules, eligibility rules and seat information may change. Always verify critical decisions through MCC, state counselling authorities, NMC and the respective institution.
              </p>
            </div>
          </div>

          {/* 3B. FREE TOOLKIT CALLOUT */}
          <div className="mt-4 rounded-2xl border border-red-200/80 bg-gradient-to-r from-red-50/70 via-white to-slate-50 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-block rounded-lg bg-red-700 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Toolkit
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Printable Checklists & Worksheets
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                NEET to MBBS Preparation Toolkit & College Comparator
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                Get our printable Counselling Checklist, 3-College Comparison Worksheet, Admission Documents Checklist, and First Day MBBS Guide.
              </p>
            </div>

            <Link
              href="/neet-to-mbbs/toolkit"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition shrink-0"
            >
              Open Toolkit →
            </Link>
          </div>

          {/* 3C. FUTURE DOCTOR CHALLENGE CALLOUT */}
          <div className="mt-4 rounded-2xl border border-slate-900 bg-slate-950 text-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-block rounded-lg bg-red-600 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Interactive Challenge
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  10 Questions • ~4 Minutes • Instant Feedback
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Take the Future Doctor Challenge
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                Test your knowledge of medical education, clinical ethics, applied human biology, and lifesaving CPR awareness.
              </p>
            </div>

            <Link
              href="/neet-to-mbbs/readiness-quiz"
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-slate-950 shadow-xs hover:bg-slate-100 transition shrink-0"
            >
              Start Challenge →
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. JOURNEY GATEWAY: WHERE ARE YOU IN YOUR JOURNEY? */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="mx-auto max-w-5xl">
          {/* Section Header */}
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
              The Medical Roadmap
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
              Where Are You in Your Journey?
            </h2>
            <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
              Start where you are. We&apos;ll help you understand what comes next.
            </p>
          </div>

          {/* Five-Stage Journey Progression */}
          <div className="mt-10 space-y-4">
            {JOURNEY_STAGES.map((stage) => {
              const StageInner = (
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Step Number Badge */}
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold text-white shadow-xs ${
                        stage.isLive ? "bg-red-700" : "bg-slate-900"
                      }`}
                    >
                      {stage.step}
                    </span>

                    {/* Content */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-red-700 transition">
                          {stage.title}
                        </h3>
                        {stage.futureRoute && (
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                            {stage.futureRoute}
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed text-slate-600 max-w-3xl">
                        {stage.description}
                      </p>
                    </div>
                  </div>

                  {/* Status & Future Link Anchor */}
                  <div className="md:text-right shrink-0 pt-1 pl-15 md:pl-0">
                    <span
                      className={`inline-block text-xs font-semibold rounded-lg px-3 py-1.5 transition ${
                        stage.isLive
                          ? "bg-red-50 text-red-800 border border-red-200 font-bold group-hover:bg-red-100"
                          : "bg-slate-100/90 text-slate-500 border border-slate-200/70"
                      }`}
                    >
                      {stage.statusText}
                    </span>
                  </div>
                </div>
              );

              return stage.isLive && stage.futureRoute ? (
                <Link
                  key={stage.step}
                  href={stage.futureRoute}
                  className="group block relative rounded-2xl border-2 border-red-200/80 bg-white hover:border-red-400 p-5 sm:p-6 shadow-xs transition-all duration-200 hover:shadow-md"
                >
                  {StageInner}
                </Link>
              ) : (
                <div
                  key={stage.step}
                  className="group relative rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 p-5 sm:p-6 transition-all duration-200"
                >
                  {StageInner}
                </div>
              );
            })}
          </div>

          {/* CPR GATEWAY CARD (Restrained Lower Section) */}
          <div className="mt-8 rounded-3xl border border-rose-200/80 bg-gradient-to-r from-rose-50/70 via-white to-slate-50 p-6 sm:p-8 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="inline-block rounded-lg bg-rose-100 text-rose-900 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Lifesaving Skills
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Start With a Lifesaving Skill
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Before your first clinical posting, begin learning how to respond when someone&apos;s life may depend on early action. Complete the CPR eSanjeevani learning pathway and assessment to earn the programme&apos;s applicable certificate, where eligible.
              </p>
            </div>

            <Link
              href="/cprday#cpr-esanjeevani"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-700 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-rose-800 transition shrink-0"
            >
              <span>Explore CPR eSanjeevani</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SHARING SECTION */}
      {/* ========================================================================= */}
      <ShareSection
        eyebrow="Help Another Aspirant"
        heading="Know Someone Starting Their MBBS Journey?"
        subheading="Share NEET to MBBS 2026 with a student or parent who may find it useful."
        sharePath="/neet-to-mbbs"
        whatsappMessage="Going through NEET counselling or preparing for MBBS? I found this free NEET-to-MBBS guidance hub useful. It covers counselling, choosing a medical college, free checklists and preparing for medical college: [URL]"
      />
    </main>
  );
}

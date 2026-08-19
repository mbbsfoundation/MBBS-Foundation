import type { Metadata } from "next";
import Link from "next/link";
import ToolkitViewer from "@/components/neet-to-mbbs/ToolkitViewer";
import NeetSubNav from "@/components/neet-to-mbbs/NeetSubNav";
import PrevNextNav from "@/components/neet-to-mbbs/PrevNextNav";

export const metadata: Metadata = {
  title: "NEET Qualified? Choose Your Medical College Wisely.",
  description:
    "Free counselling checklists, an interactive 3-college comparison tool, admission document checklist and MBBS preparation resources for students and parents.",
  alternates: {
    canonical: "https://mbbsfoundation.com/neet-to-mbbs/toolkit",
  },
  keywords: [
    "NEET Qualified medical college selection",
    "Free NEET counselling checklist",
    "Medical college comparison tool",
    "MBBS admission documents list",
    "First year MBBS preparation checklist",
    "Printable NEET tools",
  ],
  openGraph: {
    title: "NEET Qualified? Choose Your Medical College Wisely.",
    description:
      "Free counselling checklists, an interactive 3-college comparison tool, admission document checklist and MBBS preparation resources for students and parents.",
    url: "https://mbbsfoundation.com/neet-to-mbbs/toolkit",
    siteName: "MBBS Foundation",
    images: [
      {
        url: "https://mbbsfoundation.com/images/neet-to-mbbs/toolkit-preview.png",
        width: 1200,
        height: 630,
        alt: "NEET to MBBS 2026 Free Educational Toolkit - Medical College Comparison & Counselling Checklists",
      },
    ],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "NEET Qualified? Choose Your Medical College Wisely.",
    description:
      "Free counselling checklists, an interactive 3-college comparison tool, admission document checklist and MBBS preparation resources for students and parents.",
    images: ["https://mbbsfoundation.com/images/neet-to-mbbs/toolkit-preview.png"],
  },
};

const TOOLKIT_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "NEET Medical College Comparison Tool & Decision Matrix",
      applicationCategory: "EducationalApplication",
      operatingSystem: "All",
      browserRequirements: "Requires JavaScript",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
      },
      description:
        "Interactive 3-college decision matrix for NEET-qualified students and parents. Compare patient load, clinical OPD, service bonds, 5.5-year total costs, and generate a printable single-page A4 PDF report.",
      url: "https://mbbsfoundation.com/neet-to-mbbs/toolkit",
      provider: {
        "@type": "Organization",
        name: "Ayurvigyan Foundation",
        url: "https://mbbsfoundation.com",
      },
    },
    {
      "@type": "LearningResource",
      name: "NEET Counselling Checklists & Medical College Decision Worksheets",
      description:
        "Free printable worksheets and verified checklists covering NEET counselling choice filling, admission document verification, and first-year MBBS preparation.",
      educationalLevel: "Undergraduate / Medical School",
      learningResourceType: "Checklist, Decision Matrix, Worksheet",
      inLanguage: "en-IN",
      isAccessibleForFree: true,
      url: "https://mbbsfoundation.com/neet-to-mbbs/toolkit",
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
          name: "Free Toolkit & College Comparator",
          item: "https://mbbsfoundation.com/neet-to-mbbs/toolkit",
        },
      ],
    },
  ],
};

export default function NeetToolkitPage() {
  return (
    <main className="min-h-screen print:min-h-0 bg-white text-slate-900 print:m-0 print:p-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(TOOLKIT_STRUCTURED_DATA) }}
      />
      <NeetSubNav />

      {/* ========================================================================= */}
      {/* 1. HEADER & BREADCRUMB */}
      {/* ========================================================================= */}
      <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50/80 via-white to-white px-4 pt-8 pb-12 sm:px-6 sm:pt-12 sm:pb-16 print:hidden">
        <div className="mx-auto max-w-5xl">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <Link
              href="/neet-to-mbbs"
              className="text-red-700 hover:text-red-800 transition underline underline-offset-2"
            >
              NEET to MBBS 2026
            </Link>
            <span aria-hidden="true">→</span>
            <span className="text-slate-700 font-bold">Free Toolkit</span>
          </nav>

          {/* Eyebrow */}
          <div className="mt-6 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-800">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
              Free Resources • No Sign-Up Required
            </span>
            <span className="text-xs font-medium text-slate-500">
              100% Free & Printable
            </span>
          </div>

          {/* Heading */}
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl leading-tight">
            Free NEET to MBBS Toolkit
          </h1>

          {/* Subheading */}
          <p className="mt-4 max-w-3xl text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed font-normal">
            Practical checklists and worksheets to help you move from counselling and college selection to medical college with fewer last-minute surprises.
          </p>

          {/* Quick Sub-Navigation Bar */}
          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="text-slate-400">Related Guides:</span>
            <Link
              href="/neet-to-mbbs/counselling"
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 hover:bg-slate-200 transition"
            >
              📋 Counselling Guide
            </Link>
            <Link
              href="/neet-to-mbbs/choosing-a-medical-college"
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 hover:bg-slate-200 transition"
            >
              🏥 College Selection Guide
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. TOOLKIT VIEWER INTERACTIVE & PRINTABLE COMPONENT */}
      {/* ========================================================================= */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 bg-slate-50/40 print:bg-white print:p-0 print:m-0">
        <div className="mx-auto max-w-5xl print:max-w-none print:m-0 print:p-0">
          <ToolkitViewer />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PREV / NEXT NAVIGATION */}
      {/* ========================================================================= */}
      <PrevNextNav
        prev={{
          title: "How to Choose the Right Medical College",
          href: "/neet-to-mbbs/choosing-a-medical-college",
          label: "Previous Step 02",
        }}
        next={{
          title: "Got Your MBBS Seat? How to Prepare for Medical College",
          href: "/neet-to-mbbs/after-admission",
          label: "Next Step 04",
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

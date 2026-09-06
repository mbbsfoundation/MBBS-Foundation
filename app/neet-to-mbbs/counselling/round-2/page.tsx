import type { Metadata } from "next";
import Link from "next/link";
import NeetSubNav from "@/components/neet-to-mbbs/NeetSubNav";
import MccRound2DecisionCentre from "@/components/neet-to-mbbs/MccRound2DecisionCentre";
import { MCC_ROUND_2_DATA } from "@/lib/counselling/mccRound2Data";

export const metadata: Metadata = {
  title: "MCC Round 2 Decision Centre — NEET UG 2026",
  description:
    "Official MCC Round 2 updates explained with practical tools to help students evaluate vacancies, upgrades and medical-college choices.",
  alternates: {
    canonical: "https://mbbsfoundation.com/neet-to-mbbs/counselling/round-2",
  },
  keywords: [
    "MCC Round 2 2026",
    "NEET UG Round 2 counselling 2026",
    "MCC Round 2 vacancies",
    "MCC newly added seats",
    "MCC virtual vacancy",
    "MCC clear vacancy",
    "medical college upgrade decision",
    "NEET Round 2 choice filling strategy",
    "MBBS upgrade comparison",
  ],
  openGraph: {
    title: "MCC Round 2 Decision Centre — NEET UG 2026",
    description:
      "Official MCC Round 2 updates explained with practical tools to help students evaluate vacancies, upgrades and medical-college choices.",
    url: "https://mbbsfoundation.com/neet-to-mbbs/counselling/round-2",
    siteName: "MBBS Foundation",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://mbbsfoundation.com/images/og-neet-planner-2026-custom.png?v=2",
        width: 1200,
        height: 630,
        alt: "MCC Round 2 Decision Centre — NEET UG 2026 | MBBS Foundation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MCC Round 2 Decision Centre — NEET UG 2026",
    description:
      "Official MCC Round 2 updates explained with practical tools to help students evaluate vacancies, upgrades and medical-college choices.",
    images: ["https://mbbsfoundation.com/images/og-neet-planner-2026-custom.png?v=2"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      name: "MCC Round 2 Decision Centre — NEET UG 2026",
      url: "https://mbbsfoundation.com/neet-to-mbbs/counselling/round-2",
      description:
        "Educational decision-support centre explaining official MCC Round 2 updates, newly added seats, clear vs virtual vacancies, and college upgrade strategies.",
      publisher: {
        "@type": "Organization",
        name: "Ayurvigyan Foundation",
        url: "https://mbbsfoundation.com",
      },
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
          name: "NEET to MBBS",
          item: "https://mbbsfoundation.com/neet-to-mbbs",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Counselling",
          item: "https://mbbsfoundation.com/neet-to-mbbs/counselling",
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "MCC Round 2 Decision Centre",
          item: "https://mbbsfoundation.com/neet-to-mbbs/counselling/round-2",
        },
      ],
    },
  ],
};

export default function MccRound2Page() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Sub Navigation */}
      <NeetSubNav />

      {/* Main Content Container */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-5 sm:pt-7">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/neet-to-mbbs" className="hover:text-slate-900 transition">
            NEET to MBBS
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/neet-to-mbbs/counselling" className="hover:text-slate-900 transition">
            Counselling
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-slate-900 font-bold">MCC Round 2 Decision Centre</span>
        </nav>

        {/* Core Decision Centre View */}
        <MccRound2DecisionCentre dataset={MCC_ROUND_2_DATA} />
      </div>
    </main>
  );
}

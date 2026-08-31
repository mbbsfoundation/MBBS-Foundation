import type { Metadata } from "next";
import Link from "next/link";
import NeetSubNav from "@/components/neet-to-mbbs/NeetSubNav";
import Round2Planner from "@/components/neet-to-mbbs/Round2Planner";

export const metadata: Metadata = {
  title: "NEET UG 2026 Counselling Planner | MCC Round-1 AIR & Medical College Explorer",
  description:
    "Explore NEET UG 2026 MCC Round-1 allotments, medical-college AIR patterns, MBBS seats and category-wise evidence. Search by AIR, state or medical college and plan counselling choices using official-source data.",
  alternates: {
    canonical: "https://mbbsfoundation.com/neet-to-mbbs/counselling/round-2-planner",
  },
  keywords: [
    "NEET UG 2026 counselling",
    "NEET counselling planner 2026",
    "MCC counselling 2026",
    "MCC Round 1 result analysis",
    "NEET 2026 medical college AIR",
    "NEET 2026 medical college cutoff",
    "medical college closing rank 2026",
    "MBBS seats 2026",
    "government medical colleges 2026",
    "AIIMS NEET rank 2026",
    "deemed medical colleges 2026",
    "state medical colleges 2026",
  ],
  openGraph: {
    title: "NEET-UG 2026: Where Do YOU Stand?",
    description:
      "Enter your AIR and explore medical colleges, Round-1 AIR patterns, seats and category-wise evidence using MCC NEET-UG 2026 and NMC official-source data.",
    url: "https://mbbsfoundation.com/neet-to-mbbs/counselling/round-2-planner",
    siteName: "MBBS Foundation",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://mbbsfoundation.com/images/og-neet-planner-2026.png",
        width: 1200,
        height: 630,
        alt: "NEET-UG 2026: Where Do YOU Stand? | MBBS Foundation Counselling Planner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NEET-UG 2026: Where Do YOU Stand?",
    description:
      "Enter your AIR and explore medical colleges, Round-1 AIR patterns, seats and category-wise evidence using MCC NEET-UG 2026 and NMC official-source data.",
    images: ["https://mbbsfoundation.com/images/og-neet-planner-2026.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "name": "MBBS Foundation",
      "url": "https://mbbsfoundation.com",
    },
    {
      "@type": "WebPage",
      "name": "NEET UG 2026 Counselling Planner & Medical College Explorer",
      "url": "https://mbbsfoundation.com/neet-to-mbbs/counselling/round-2-planner",
      "description":
        "Deterministic decision-support tool for NEET-UG 2026 counselling using official MCC Round-1 allotments and 2026 MBBS seat capacities.",
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://mbbsfoundation.com",
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "NEET to MBBS",
          "item": "https://mbbsfoundation.com/neet-to-mbbs",
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Counselling",
          "item": "https://mbbsfoundation.com/neet-to-mbbs/counselling",
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "NEET Counselling Planner",
          "item": "https://mbbsfoundation.com/neet-to-mbbs/counselling/round-2-planner",
        },
      ],
    },
  ],
};

export default function Round2PlannerPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Sub Navigation */}
      <NeetSubNav />

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/neet-to-mbbs" className="hover:text-slate-900 transition">
            NEET to MBBS
          </Link>
          <span>/</span>
          <Link href="/neet-to-mbbs/counselling" className="hover:text-slate-900 transition">
            Counselling
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">NEET Counselling Planner</span>
        </nav>

        {/* Interactive Planner Component */}
        <Round2Planner />
      </main>
    </div>
  );
}

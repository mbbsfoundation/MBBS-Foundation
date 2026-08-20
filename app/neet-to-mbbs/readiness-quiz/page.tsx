import type { Metadata } from "next";
import Link from "next/link";
import NeetSubNav from "@/components/neet-to-mbbs/NeetSubNav";
import PrevNextNav from "@/components/neet-to-mbbs/PrevNextNav";
import FutureDoctorChallenge from "@/components/neet-to-mbbs/FutureDoctorChallenge";

export const metadata: Metadata = {
  title: "Future Doctor Challenge: Test Your Medical World Readiness | NEET to MBBS 2026",
  description:
    "Test how much you know about clinical realities, medical ethics, patient consent, and life inside an Indian hospital. 10 randomized real-world questions with complete answer key.",
  alternates: {
    canonical: "https://mbbsfoundation.com/neet-to-mbbs/readiness-quiz",
  },
  keywords: [
    "Future doctor challenge quiz",
    "Medical student readiness test India",
    "NEET qualified readiness quiz",
    "Clinical ethics quiz medical students",
    "Indian hospital reality test for MBBS aspirants",
    "CPR awareness quiz for future doctors",
    "First year MBBS transition quiz",
  ],
  openGraph: {
    title: "Future Doctor Challenge: Test Your Medical World Readiness | NEET to MBBS 2026",
    description:
      "NEET tested your science. Now test how much you know about the medical world you are about to enter—10 randomized questions across 4 clinical and ethical domains.",
    url: "https://mbbsfoundation.com/neet-to-mbbs/readiness-quiz",
    siteName: "MBBS Foundation",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://mbbsfoundation.com/images/neet-to-mbbs/toolkit-preview.png",
        width: 1200,
        height: 630,
        alt: "Future Doctor Challenge Quiz",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Future Doctor Challenge: Test Your Medical World Readiness",
    description:
      "10 randomized questions on clinical ethics, patient care, CPR, and medical realities for NEET-qualified students.",
    images: ["https://mbbsfoundation.com/images/neet-to-mbbs/toolkit-preview.png"],
  },
};

const QUIZ_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Quiz",
      name: "Future Doctor Challenge | NEET to MBBS 2026",
      description:
        "10 randomized real-world challenge questions for aspiring doctors testing clinical ethics, emergency CPR response, patient privacy, and hospital realities.",
      educationalLevel: "Medical School Entry / Pre-MBBS",
      learningResourceType: "Interactive Assessment",
      isAccessibleForFree: true,
      inLanguage: "en-IN",
      url: "https://mbbsfoundation.com/neet-to-mbbs/readiness-quiz",
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
          name: "NEET to MBBS 2026",
          item: "https://mbbsfoundation.com/neet-to-mbbs",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Future Doctor Challenge",
          item: "https://mbbsfoundation.com/neet-to-mbbs/readiness-quiz",
        },
      ],
    },
  ],
};

export default function NeetReadinessQuizPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(QUIZ_STRUCTURED_DATA) }}
      />
      <NeetSubNav />

      {/* ========================================================================= */}
      {/* 1. BREADCRUMB STRIP */}
      {/* ========================================================================= */}
      <section className="border-b border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <Link
              href="/neet-to-mbbs"
              className="text-red-700 hover:text-red-800 transition underline underline-offset-2"
            >
              NEET to MBBS 2026
            </Link>
            <span aria-hidden="true">→</span>
            <span className="text-slate-700 font-bold">Future Doctor Challenge</span>
          </nav>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE QUIZ CONTAINER */}
      {/* ========================================================================= */}
      <section className="py-10 sm:py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <FutureDoctorChallenge />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PREV / NEXT NAVIGATION */}
      {/* ========================================================================= */}
      <PrevNextNav
        prev={{
          title: "Got Your MBBS Seat? How to Prepare for Medical College",
          href: "/neet-to-mbbs/after-admission",
          label: "MBBS Prep Guide",
        }}
        next={{
          title: "NEET to MBBS Toolkit & Worksheets",
          href: "/neet-to-mbbs/toolkit",
          label: "Toolkit",
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

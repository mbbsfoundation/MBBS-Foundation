import React, { Suspense } from "react";
import { Metadata } from "next";
import ReviveModuleInterface from "./ReviveModuleInterface";

export const metadata: Metadata = {
  title: {
    absolute: "REVIVE | CPR & Choking Relief — MBBS Foundation",
  },
  description:
    "Explore REVIVE, Module 7 of the MBBS Foundation Online Learning Programme. Learn CPR and choking relief through educational slides, instructional videos and an online assessment, with a verifiable Module Completion Certificate.",
  alternates: {
    canonical: "https://mbbsfoundation.com/mbbs-foundation/learn/modules/revive",
  },
  openGraph: {
    title: "REVIVE | CPR & Choking Relief — MBBS Foundation",
    description:
      "Explore REVIVE, Module 7 of the MBBS Foundation Online Learning Programme. Learn CPR and choking relief through educational slides, instructional videos and an online assessment, with a verifiable Module Completion Certificate.",
    url: "https://mbbsfoundation.com/mbbs-foundation/learn/modules/revive",
    siteName: "MBBS Foundation",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://mbbsfoundation.com/sections/8_revive.png",
        width: 1000,
        height: 1400,
        alt: "REVIVE | CPR & Choking Relief — MBBS Foundation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "REVIVE | CPR & Choking Relief — MBBS Foundation",
    description:
      "Explore REVIVE, Module 7 of the MBBS Foundation Online Learning Programme. Learn CPR and choking relief through educational slides, instructional videos and an online assessment, with a verifiable Module Completion Certificate.",
    images: ["https://mbbsfoundation.com/sections/8_revive.png"],
  },
};

export default function ReviveModulePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-500 text-sm font-medium">
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 border-2 border-teal-700 border-t-transparent rounded-full animate-spin"></span>
            <span>Loading Module 7: REVIVE...</span>
          </div>
        </div>
      }
    >
      <ReviveModuleInterface />
    </Suspense>
  );
}

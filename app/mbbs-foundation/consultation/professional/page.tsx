"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ConsultationSubNav from "@/components/mbbs-foundation/consultation/ConsultationSubNav";
import ProfessionalSurveyForm from "@/components/mbbs-foundation/consultation/ProfessionalSurveyForm";
import { ConsultationSource } from "@/lib/mbbs-foundation/consultationTypes";
import { SURVEY_INTRODUCTIONS, SURVEY_METADATA } from "@/lib/mbbs-foundation/professionalSurveyConfig";

function ProfessionalConsultationContent() {
  const searchParams = useSearchParams();
  const rawSource = searchParams.get("source")?.toLowerCase() || "";

  let source: ConsultationSource = "direct";
  if (rawSource === "faculty") source = "faculty";
  else if (rawSource === "cpr") source = "cpr";

  const intro = SURVEY_INTRODUCTIONS[source] || SURVEY_INTRODUCTIONS.direct;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Sub Navigation Bar */}
      <ConsultationSubNav />

      {/* Header Section */}
      <section className="bg-white border-b border-slate-200/80 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-200/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-red-800">
              <span>🩺</span> {intro.badge}
            </div>

            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              ⏱️ Estimated time: <strong>5–7 minutes</strong>
            </span>
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            MBBS FOUNDATION
          </h1>

          <p className="mt-1 text-xl sm:text-2xl font-bold text-red-800">
            National Professional Consultation
          </p>

          <p className="mt-2 text-sm sm:text-base font-medium text-slate-700">
            Preparing Students for the Transition into MBBS and Medical Training
          </p>

          <p className="mt-3 text-xs sm:text-sm text-slate-500">
            Facilitated by <strong>Ayurvigyan Health Academy India Foundation (AHA India)</strong>
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Source-Aware Introductory Framing Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm space-y-5">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              {intro.badge}
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
              {intro.heading}
            </h2>

            <p className="text-sm sm:text-base font-bold text-slate-800">
              {intro.lead}
            </p>

            {intro.paragraphs.map((p, idx) => (
              <p key={idx} className="text-sm sm:text-base text-slate-700 leading-relaxed">
                {p}
              </p>
            ))}

            <div className="pt-2">
              <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 border-l-4 border-red-700 p-3 rounded-r-lg leading-relaxed">
                {intro.note}
              </p>
            </div>
          </div>
        </section>

        {/* Professional Consultation Survey Engine (V2 Locked) */}
        <ProfessionalSurveyForm initialSource={source} />

        {/* Footer Navigation Back Link */}
        <div className="pt-4 flex items-center justify-between text-xs text-slate-500">
          <Link
            href="/mbbs-foundation/consultation"
            className="font-bold text-red-700 hover:text-red-900 transition inline-flex items-center gap-1"
          >
            ← Back to Consultation Overview
          </Link>

          <span>Ayurvigyan Health Academy India Foundation</span>
        </div>
      </main>
    </div>
  );
}

export default function ProfessionalConsultationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-slate-500 font-semibold text-sm">
          Loading consultation module...
        </div>
      }
    >
      <ProfessionalConsultationContent />
    </Suspense>
  );
}

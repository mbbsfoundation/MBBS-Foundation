"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ConsultationSubNav from "@/components/mbbs-foundation/consultation/ConsultationSubNav";
import StudentVoiceSurveyForm from "@/components/mbbs-foundation/consultation/StudentVoiceSurveyForm";
import {
  STUDENT_SURVEY_METADATA,
  STUDENT_SURVEY_INTRO,
} from "@/lib/mbbs-foundation/studentVoiceSurveyConfig";

function StudentVoiceContent() {
  const searchParams = useSearchParams();
  const rawSource = searchParams.get("source")?.toLowerCase() || "student";

  let source = "student";
  if (["faculty", "cpr", "student", "direct"].includes(rawSource)) {
    source = rawSource;
  } else {
    source = "direct";
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Sub Navigation Bar */}
      <ConsultationSubNav />

      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200/80 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-900">
              <span>🎓</span> Student &amp; Intern Voice Track
            </div>

            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              ⏱️ Estimated completion time: <strong>{STUDENT_SURVEY_METADATA.estimatedTime}</strong>
            </span>
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            {STUDENT_SURVEY_METADATA.publicTitle}
          </h1>

          <p className="mt-2 text-base sm:text-lg font-bold text-red-800">
            {STUDENT_SURVEY_METADATA.subtitle}
          </p>

          <p className="mt-2 text-sm sm:text-base font-semibold text-slate-700">
            {STUDENT_SURVEY_METADATA.supportingLine}
          </p>

          <div className="mt-4 inline-block rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2 text-xs font-medium text-slate-600">
            💡 {STUDENT_SURVEY_METADATA.helperNote}
          </div>
        </div>
      </section>

      {/* Main Form Content */}
      <main className="flex-1 mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Intro Framing Card */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
            <span>🗣️</span> Your Experience Can Guide the Next Generation
          </h2>
          {STUDENT_SURVEY_INTRO.paragraphs.map((p, idx) => (
            <p key={idx} className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {p}
            </p>
          ))}
        </section>

        {/* Survey Form */}
        <StudentVoiceSurveyForm source={source} />
      </main>
    </div>
  );
}

export default function StudentVoicePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
          <div className="text-sm font-semibold text-slate-600 animate-pulse">
            Loading Student Voice Survey...
          </div>
        </div>
      }
    >
      <StudentVoiceContent />
    </Suspense>
  );
}

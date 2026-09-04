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
  const rawSource = searchParams.get("source")?.toLowerCase() || "direct";

  let source = "direct";
  if (["faculty", "cpr", "student", "direct"].includes(rawSource)) {
    source = rawSource;
  } else {
    source = "direct";
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Sub Navigation Bar */}
      <ConsultationSubNav />

      {/* Hero Header Section */}
      <section className="bg-white border-b border-slate-200/80 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-900">
              <span>🎓</span> MBBS Foundation • Student Voice
            </div>

            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              ⏱️ Estimated completion time: <strong>{STUDENT_SURVEY_METADATA.estimatedTime}</strong>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            {STUDENT_SURVEY_METADATA.publicTitle}
          </h1>

          <p className="text-base sm:text-lg font-bold text-red-800">
            {STUDENT_SURVEY_METADATA.subtitle}
          </p>

          <p className="text-sm sm:text-base font-semibold text-slate-700">
            {STUDENT_SURVEY_METADATA.supportingLine}
          </p>

          <div className="pt-2">
            <div className="inline-block rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2 text-xs font-medium text-slate-600">
              💡 {STUDENT_SURVEY_METADATA.helperNote}
            </div>
          </div>
        </div>
      </section>

      {/* Main Form Content */}
      <main className="flex-1 mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Intro Framing Card */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
            <span>🗣️</span> A Consultation with Current MBBS Students &amp; Interns
          </h2>
          {STUDENT_SURVEY_INTRO.paragraphs.map((p, idx) => (
            <p key={idx} className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {p}
            </p>
          ))}
        </section>

        {/* Locked 7-Section Survey Form */}
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
            Loading Student Voice Consultation...
          </div>
        </div>
      }
    >
      <StudentVoiceContent />
    </Suspense>
  );
}

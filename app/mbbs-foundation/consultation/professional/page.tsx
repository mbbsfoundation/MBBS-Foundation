"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ConsultationSubNav from "@/components/mbbs-foundation/consultation/ConsultationSubNav";
import ProfessionalSurveyForm from "@/components/mbbs-foundation/consultation/ProfessionalSurveyForm";
import { ConsultationSource } from "@/lib/mbbs-foundation/consultationTypes";

function ProfessionalConsultationContent() {
  const searchParams = useSearchParams();
  const rawSource = searchParams.get("source")?.toLowerCase() || "";

  let source: ConsultationSource = "direct";
  if (rawSource === "faculty") source = "faculty";
  else if (rawSource === "cpr") source = "cpr";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Sub Navigation Bar */}
      <ConsultationSubNav />

      {/* Header Section */}
      <section className="bg-white border-b border-slate-200/80 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-200/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-red-800">
              <span>🩺</span> Professional Consultation Track
            </div>

            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              ⏱️ Estimated completion time: <strong>4–5 minutes</strong>
            </span>
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Preparing Students for the Journey into Medicine
          </h1>

          <p className="mt-2 text-base sm:text-lg font-bold text-red-800">
            National Professional Consultation for the MBBS Foundation Initiative
          </p>

          <p className="mt-3 text-xs sm:text-sm text-slate-600">
            Facilitated by <strong>Ayurvigyan Health Academy India Foundation (AHA India)</strong>
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Source-Aware Introductory Framing Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm space-y-5">
          {source === "faculty" && (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                Faculty &amp; Medical Educators Consultation
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
                What should we prepare students for when they enter medical college?
              </h2>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Clearing NEET marks the beginning of a much larger transition—from school and entrance-examination preparation to learning medicine, interacting with patients, developing professional values, acquiring practical skills and gradually developing the identity of a doctor.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                The <strong>MBBS Foundation initiative</strong>, facilitated by <strong>Ayurvigyan Health Academy India Foundation (AHA India)</strong>, is developing a structured <strong>MBBS Foundation Workshop and supporting learning resources</strong> for students entering medical college.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                <strong>MBBS Foundation: Your First Book of Medicine</strong> will serve as the principal reference resource, supplemented by faculty-contributed scenarios, discussions, activities, videos and interactive learning material.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                We invite medical teachers, clinicians and medical educators to help identify the most important gaps, suggest how these should be addressed, and—if interested—contribute to building this initiative.
              </p>

              <div className="pt-2">
                <p className="text-sm sm:text-base font-bold text-red-800 bg-red-50/70 border-l-4 border-red-700 p-3 rounded-r-lg">
                  Your experience can help shape a better beginning for future doctors.
                </p>
              </div>
            </div>
          )}

          {source === "cpr" && (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[11px] font-bold text-teal-900 uppercase tracking-wider">
                CPR Network &amp; Educators Perspective
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
                From Building CPR-Ready Communities to Preparing Future Doctors
              </h2>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Through CPR training and community awareness initiatives, doctors, Course Coordinators, CPR Champions and healthcare professionals have already contributed their time and expertise towards developing lifesaving skills in society.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                We now invite this network to contribute to a broader educational mission.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                The <strong>MBBS Foundation initiative</strong>, facilitated by <strong>Ayurvigyan Health Academy India Foundation (AHA India)</strong>, aims to help students make the transition from clearing NEET and entering medical college to beginning the journey of becoming skilled, thoughtful, compassionate and responsible doctors.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                The initiative is developing an <strong>MBBS Foundation Workshop and supporting learning resources</strong>, with <strong>MBBS Foundation: Your First Book of Medicine</strong> as the principal reference resource.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Your experience as a doctor, teacher, trainer, coordinator, mentor or healthcare professional can contribute far beyond CPR.
              </p>

              <div className="pt-2">
                <p className="text-sm sm:text-base font-bold text-teal-900 bg-teal-50/70 border-l-4 border-teal-700 p-3 rounded-r-lg">
                  We invite you to share your perspective—and, if interested, help us build this initiative for the next generation of doctors.
                </p>
              </div>
            </div>
          )}

          {source === "direct" && (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                National Medical Faculty &amp; Clinicians Consultation
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
                What should we prepare students for when they enter medical college?
              </h2>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Clearing NEET marks the beginning of a profound transition—from rote examination preparation to learning medicine, interacting with patients, acquiring foundational clinical sensibilities, and developing professional values.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                The <strong>MBBS Foundation initiative</strong>, facilitated by <strong>Ayurvigyan Health Academy India Foundation (AHA India)</strong>, is establishing a structured <strong>MBBS Foundation Workshop and supporting learning resources</strong> for students entering medical college.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                With <strong>MBBS Foundation: Your First Book of Medicine</strong> as the principal reference resource, this collaborative brings together medical teachers, clinicians, Foundation Course coordinators, and healthcare mentors.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                We invite medical professionals across disciplines to share observations, identify curricular transition gaps, and guide this national effort.
              </p>

              <div className="pt-2">
                <p className="text-sm sm:text-base font-bold text-red-800 bg-red-50/70 border-l-4 border-red-700 p-3 rounded-r-lg">
                  Your experience can help shape a better beginning for future doctors.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Professional Consultation Survey Engine (Prompt 4 UI) */}
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

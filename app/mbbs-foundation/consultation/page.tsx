import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import ConsultationSubNav from "@/components/mbbs-foundation/consultation/ConsultationSubNav";

export const metadata: Metadata = {
  title: "MBBS Foundation Consultation & Collaborative | AHA India",
  description:
    "A national consultation and co-creation initiative to help strengthen the transition from entering medical college to beginning the journey of becoming a doctor.",
};

export default function ConsultationHubPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Sub Navigation Bar */}
      <ConsultationSubNav />

      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200/80 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-200/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-red-800">
            <span>🏛️</span> National Consultation &amp; Co-Creation Initiative
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            MBBS Foundation Consultation &amp; Collaborative
          </h1>

          <p className="mt-4 text-lg sm:text-xl font-medium text-slate-800 leading-relaxed max-w-4xl">
            A national consultation and co-creation initiative to help strengthen the transition from entering medical college to beginning the journey of becoming a doctor.
          </p>

          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
            Medical faculty, clinicians, CPR educators, senior medical students and interns are being invited to share their experience and help shape the MBBS Foundation Workshop and supporting learning resources for incoming MBBS students.
          </p>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
            <span className="h-2 w-2 rounded-full bg-red-700"></span>
            <span>Facilitated by <strong>Ayurvigyan Health Academy India Foundation</strong></span>
          </div>
        </div>
      </section>

      {/* Consultation Tracks Section */}
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
            Consultation Tracks &amp; Participation Streams
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Choose your area of engagement to contribute your insights to the national framework.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 — Professional Consultation (OPEN) */}
          <div className="rounded-2xl border-2 border-red-700/80 bg-white p-6 sm:p-7 shadow-md flex flex-col justify-between hover:shadow-lg transition-all duration-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full pointer-events-none -z-0"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-0.5 text-xs font-black uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                  Open
                </span>
                <span className="text-xl">🩺</span>
              </div>

              <h3 className="text-xl font-black text-slate-950 tracking-tight">
                Professional Consultation
              </h3>

              <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                For medical faculty, clinicians, medical educators, Foundation Course faculty, CPR Course Coordinators, CPR Champions and other professionals contributing to medical education and student development.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 relative z-10">
              <Link
                href="/mbbs-foundation/consultation/professional"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-700 via-red-800 to-slate-900 px-4 py-3 text-xs sm:text-sm font-black text-white shadow-sm hover:from-red-800 hover:to-black transition cursor-pointer"
              >
                <span>Start Professional Consultation</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Card 2 — Student & Intern Voice (OPEN) */}
          <div className="rounded-2xl border-2 border-blue-700/80 bg-white p-6 sm:p-7 shadow-md flex flex-col justify-between hover:shadow-lg transition-all duration-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full pointer-events-none -z-0"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-0.5 text-xs font-black uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                  Open
                </span>
                <span className="text-xl">🎓</span>
              </div>

              <h3 className="text-xl font-black text-slate-950 tracking-tight">
                Student &amp; Intern Voice
              </h3>

              <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                A retrospective consultation for current medical students and interns to identify what they wish they had known when they entered MBBS and how they may contribute to future students.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 relative z-10">
              <Link
                href="/mbbs-foundation/consultation/student-voice"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 px-4 py-3 text-xs sm:text-sm font-black text-white shadow-sm hover:from-blue-800 hover:to-black transition cursor-pointer"
              >
                <span>Start Student &amp; Intern Voice Survey</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Card 3 — MBBS Entry Readiness Check (COMING SOON) */}
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 sm:p-7 shadow-xs flex flex-col justify-between opacity-90">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
                  Coming Soon
                </span>
                <span className="text-xl">🧭</span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                MBBS Entry Readiness Check
              </h3>

              <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                A readiness and self-reflection tool for newly admitted and first-year MBBS students to understand their transition needs and identify helpful learning resources.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <button
                type="button"
                disabled
                className="w-full inline-flex items-center justify-center rounded-xl bg-slate-100 border border-slate-200 px-4 py-3 text-xs sm:text-sm font-semibold text-slate-400 cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>

        {/* Informational Context Box */}
        <section className="mt-12 rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-red-800">
            About the MBBS Foundation Initiative
          </h3>
          <p className="mt-2 text-sm text-slate-700 leading-relaxed">
            MBBS Foundation is an educational collaborative dedicated to helping students develop early clinical curiosity, core communication sensibilities, professional mindset, and ethical commitment as they enter medical college.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
            <strong>Principal Reference Resource:</strong> <em>MBBS Foundation: Your First Book of Medicine</em> serves as the foundational curriculum companion, complemented by clinical scenarios, faculty discussions, and practical skills workshops.
          </div>
        </section>
      </main>
    </div>
  );
}

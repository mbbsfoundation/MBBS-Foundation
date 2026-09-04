import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import ConsultationSubNav from "@/components/mbbs-foundation/consultation/ConsultationSubNav";

export const metadata: Metadata = {
  title: "MBBS Foundation • National Consultation | AHA India",
  description:
    "Help Shape How Future Doctors Begin Their Journey. National Professional Consultation and Student Voice initiatives by MBBS Foundation.",
};

const PROFESSIONAL_TARGETS = [
  "Medical faculty",
  "Clinicians",
  "Medical educators",
  "Foundation Course faculty",
  "MEU members",
  "Residents",
  "CPR educators and trainers",
  "Academic leaders",
];

export default function ConsultationHubPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Sub Navigation Bar */}
      <ConsultationSubNav />

      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200/80 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-200/80 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-red-800">
            <span>🏛️</span> MBBS FOUNDATION • National Consultation
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            Help Shape How Future Doctors Begin Their Journey
          </h1>

          <div className="mt-5 space-y-3 text-base sm:text-lg text-slate-700 leading-relaxed max-w-4xl font-medium">
            <p>
              The transition into medical college is experienced differently by students, teachers and clinicians.
            </p>
            <p>
              MBBS Foundation is bringing these perspectives together to understand what students need when they enter MBBS and how practical guidance can complement formal medical education.
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-600">
            <span className="h-2 w-2 rounded-full bg-red-700"></span>
            <span>Facilitated by <strong>Ayurvigyan Health Academy India Foundation</strong></span>
          </div>
        </div>
      </section>

      {/* Two Differentiated Pathways Section */}
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* -------------------------------------------------------- */}
          {/* CARD 1: FOR MEDICAL PROFESSIONALS                        */}
          {/* -------------------------------------------------------- */}
          <div className="rounded-3xl border-2 border-red-700/80 bg-white p-6 sm:p-8 shadow-md flex flex-col justify-between hover:shadow-xl transition-all duration-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full pointer-events-none -z-0"></div>

            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-900 border border-red-200 px-3 py-1 text-xs font-black uppercase tracking-wider">
                  <span>🩺</span> FOR MEDICAL PROFESSIONALS
                </span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  ⏱️ Approx. 5–7 minutes
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                  Professional Consultation
                </h2>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-red-800">
                  Faculty, Clinicians &amp; Medical Educators
                </p>
              </div>

              {/* Target Audience / "For" List */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-2">
                <p className="text-xs font-black uppercase tracking-wider text-slate-700">
                  For:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PROFESSIONAL_TARGETS.map((target) => (
                    <span
                      key={target}
                      className="inline-block rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs"
                    >
                      {target}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Share your experience of the transition into MBBS, identify areas where students need greater preparation and help shape practical approaches for the MBBS Foundation initiative.
              </p>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100 relative z-10">
              <Link
                href="/mbbs-foundation/consultation/professional"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-700 via-red-800 to-slate-900 px-5 py-3.5 text-xs sm:text-sm font-black text-white shadow-md hover:from-red-800 hover:to-black transition cursor-pointer"
              >
                <span>CONTRIBUTE AS A MEDICAL PROFESSIONAL</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* CARD 2: FOR MBBS STUDENTS & INTERNS                      */}
          {/* -------------------------------------------------------- */}
          <div className="rounded-3xl border-2 border-blue-700/80 bg-white p-6 sm:p-8 shadow-md flex flex-col justify-between hover:shadow-xl transition-all duration-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full pointer-events-none -z-0"></div>

            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 px-3 py-1 text-xs font-black uppercase tracking-wider">
                  <span>🎓</span> FOR MBBS STUDENTS &amp; INTERNS
                </span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  ⏱️ Approx. 3–4 minutes
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                  Student Voice
                </h2>
                <p className="mt-1 text-sm font-bold text-blue-900">
                  What I Wish I Knew Before Starting MBBS
                </p>
              </div>

              <div className="rounded-2xl bg-blue-50/60 border border-blue-200/70 p-4 space-y-1.5">
                <p className="text-xs font-black uppercase tracking-wider text-blue-950">
                  For:
                </p>
                <p className="text-xs sm:text-sm font-semibold text-slate-800">
                  Current MBBS students (1st to Final Year) and Medical Interns
                </p>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Tell us what medical college was actually like when you entered — what surprised you, what was harder than expected and what you wish someone had told you beforehand.
              </p>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100 relative z-10">
              <Link
                href="/mbbs-foundation/consultation/student-voice"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 px-5 py-3.5 text-xs sm:text-sm font-black text-white shadow-md hover:from-blue-800 hover:to-black transition cursor-pointer"
              >
                <span>SHARE YOUR STUDENT VOICE</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Subtle Credibility Line */}
        <section className="rounded-2xl bg-slate-100/90 border border-slate-200/90 p-5 sm:p-6 text-center">
          <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed max-w-3xl mx-auto">
            Professional perspectives and student experiences will be analysed together to identify important gaps in the transition into medical education and guide development of the MBBS Foundation initiative.
          </p>
        </section>
      </main>
    </div>
  );
}


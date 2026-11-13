import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { getAssessedModules } from "@/lib/mbbs-foundation/sectionsConfig";

export const metadata: Metadata = {
  title: "Online Learning Programme | MBBS Foundation",
  description:
    "A structured, self-paced online curriculum based on 'MBBS Foundation: Your First Book of Medicine', aligned with the NMC competency-based medical education framework for MBBS students.",
};

export default function LearnLandingPage() {
  const assessedModules = getAssessedModules();

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. TOP NAVBAR / HEADER                                             */}
      {/* ------------------------------------------------------------------ */}
      <header className="border-b border-slate-200/80 bg-white sticky top-0 z-30 shadow-2xs">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 group-hover:text-red-700 transition">
              MBBS Foundation
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-600">
              Learning Portal
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/mbbs-foundation/learn/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 text-xs sm:text-sm transition shadow-2xs"
            >
              <span>Learner Sign In / Register</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 2. MINIMALIST HERO SECTION                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-white border-b border-slate-200/80 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-200 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-red-800">
            <span>🩺</span> Competency-Based Medical Education
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            MBBS Foundation Online Learning Programme
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
            A structured, self-paced learning programme based on &apos;MBBS Foundation: Your First Book of Medicine&apos;, aligned with the National Medical Commission&apos;s competency-based medical education framework and recommendations for MBBS students. Explore foundational knowledge, clinical skills, professionalism, and the human side of medicine.
          </p>

          {/* Small, dignified introductory orientation link */}
          <div className="pt-2">
            <Link
              href="/mbbs-foundation/learn/threshold"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-red-700 underline underline-offset-4 transition"
            >
              <span>Introductory Orientation: Threshold</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. THE 14 ASSESSED MODULES (COMPACT PASTEL DIRECTORY)              */}
      {/* ------------------------------------------------------------------ */}
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Curriculum Modules
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              14 sequential modules covering clinical science, professional skills, and medical practice.
            </p>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            14 Modules • Locked Order
          </span>
        </div>

        {/* Responsive Grid of Uniform Compact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {assessedModules.map((module) => {
            const isPilot = module.status === "pilot";

            if (isPilot) {
              // Active Pilot Card (Module 7: REVIVE)
              return (
                <Link
                  key={module.slug}
                  href={`/mbbs-foundation/learn/modules/${module.slug}`}
                  className="group relative rounded-2xl border-2 border-teal-500 bg-white p-5 shadow-sm hover:shadow-md hover:border-teal-600 hover:-translate-y-0.5 transition-all duration-150 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                        Module {String(module.id).padStart(2, "0")}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                        Available Now
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-950 group-hover:text-teal-700 transition">
                        {module.title}
                      </h3>
                      <p className="text-xs font-medium text-teal-900/80 mt-1 line-clamp-2">
                        {module.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-teal-100 flex items-center justify-between text-xs font-bold text-teal-700 group-hover:text-teal-900 transition">
                    <span>Start Module</span>
                    <span>&rarr;</span>
                  </div>
                </Link>
              );
            }

            // Inactive Module Cards (Pastel Compact Cards)
            const pastelStyles = [
              { bg: "bg-sky-50/60", border: "border-sky-200/80", badge: "text-sky-900 bg-sky-100/70 border-sky-200" },
              { bg: "bg-emerald-50/50", border: "border-emerald-200/80", badge: "text-emerald-900 bg-emerald-100/70 border-emerald-200" },
              { bg: "bg-purple-50/50", border: "border-purple-200/80", badge: "text-purple-900 bg-purple-100/70 border-purple-200" },
              { bg: "bg-amber-50/50", border: "border-amber-200/80", badge: "text-amber-900 bg-amber-100/70 border-amber-200" },
              { bg: "bg-rose-50/50", border: "border-rose-200/80", badge: "text-rose-900 bg-rose-100/70 border-rose-200" },
              { bg: "bg-indigo-50/50", border: "border-indigo-200/80", badge: "text-indigo-900 bg-indigo-100/70 border-indigo-200" },
            ];
            const currentStyle = pastelStyles[(module.id - 1) % pastelStyles.length];

            return (
              <div
                key={module.slug}
                className={`rounded-2xl border ${currentStyle.border} ${currentStyle.bg} p-5 flex flex-col justify-between opacity-90 select-none`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 bg-white/80 px-2.5 py-1 rounded-md border border-slate-200">
                      Module {String(module.id).padStart(2, "0")}
                    </span>
                    <span className="rounded-full bg-slate-200/80 text-slate-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                      Coming Soon
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {module.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {module.subtitle}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200/60 text-right">
                  <span className="text-[11px] font-semibold text-slate-400">
                    Curriculum in Preparation
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* 4. CLEAN FOOTER                                                    */}
      {/* ------------------------------------------------------------------ */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-5xl space-y-2">
          <p>
            &copy; {new Date().getFullYear()} MBBS Foundation &bull; Ayurvigyan Health Academy India Foundation. All rights reserved.
          </p>
          <p className="text-slate-400">
            Aligned with the National Medical Commission (NMC) Competency-Based Medical Education guidelines.
          </p>
        </div>
      </footer>
    </div>
  );
}

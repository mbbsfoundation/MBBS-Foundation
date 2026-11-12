import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import {
  PROGRAMME_METADATA,
  getOrientationSection,
  getAssessedModules,
} from "@/lib/mbbs-foundation/sectionsConfig";

export const metadata: Metadata = {
  title: "MBBS Foundation Online Learning Programme | Ayurvigyan Foundation",
  description:
    "A structured, self-paced online curriculum based on 'MBBS Foundation: Your First Book of Medicine'. 1 introductory orientation plus 14 independently assessed learning modules.",
};

export default function LearnLandingPage() {
  const orientation = getOrientationSection();
  const assessedModules = getAssessedModules();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. TOP ANNOUNCEMENT BANNER                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-gradient-to-r from-red-800 via-rose-700 to-purple-900 px-4 py-2 text-center text-xs sm:text-sm font-medium text-white shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-center gap-2 flex-wrap">
          <span className="rounded bg-white/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-100 border border-white/20">
            Phase 2 Architecture Shell
          </span>
          <span>
            MBBS Foundation Online Learning Programme • 1 Orientation + 14 Assessed Modules
          </span>
          <span className="hidden md:inline">•</span>
          <span className="text-amber-200 font-semibold">
            First Pilot: Module 7 (REVIVE)
          </span>
          <span className="hidden lg:inline">•</span>
          <Link
            href="/mbbs-foundation/learn/register"
            className="rounded bg-white/20 hover:bg-white/30 px-2.5 py-0.5 text-xs font-bold text-white transition-colors underline ml-1"
          >
            Learner Sign In / Register &rarr;
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. PROGRAMME HERO SECTION                                          */}
      {/* ------------------------------------------------------------------ */}
      <header className="border-b border-slate-200 bg-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-red-800">
              <span>🩺</span> MBBS FOUNDATION • ONLINE CURRICULUM
            </span>
            <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
              Free Registration &amp; Learning
            </span>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
              Passing Threshold: 70%
            </span>
          </div>

          <h1 className="mt-5 text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-950 leading-tight">
            MBBS Foundation <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-red-700 via-rose-600 to-purple-700 bg-clip-text text-transparent">
              Online Learning Programme
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-xl font-medium text-slate-600 max-w-3xl leading-relaxed">
            A structured, self-paced academic curriculum based on the authoritative textbook{" "}
            <em className="text-slate-900 font-semibold">
              &ldquo;{PROGRAMME_METADATA.bookTitle}&rdquo;
            </em>{" "}
            by {PROGRAMME_METADATA.author}. Built for MBBS students, interns, resident doctors,
            medical faculty, and healthcare professionals.
          </p>

          {/* Primary Action Buttons: Register / Learner Login */}
          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Link
              href="/mbbs-foundation/learn/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-700 via-rose-700 to-red-800 hover:from-red-800 hover:to-rose-800 text-white font-bold px-6 py-3.5 shadow-md hover:shadow-lg transition-all text-sm sm:text-base focus:ring-4 focus:ring-red-200"
            >
              <span>🎓</span> Register / Learner Login &rarr;
            </Link>
            <Link
              href="/mbbs-foundation/learn/threshold"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 px-5 py-3.5 text-sm sm:text-base font-semibold text-slate-800 transition-colors"
            >
              Passing Policy &amp; Certificate Rules
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6 border-t border-slate-100">
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 text-center">
              <div className="text-2xl sm:text-3xl font-black text-slate-900">1</div>
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                Introductory Orientation
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 text-center">
              <div className="text-2xl sm:text-3xl font-black text-red-700">14</div>
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                Assessed Modules
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 text-center">
              <div className="text-2xl sm:text-3xl font-black text-purple-700">70%</div>
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                Pass Mark (3 Attempts)
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 text-center">
              <div className="text-2xl sm:text-3xl font-black text-emerald-700">2-Tier</div>
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                Module &amp; Final Cert
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 3. FUTURE LEARNING PATHWAY EXPLANATION                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-white border-b border-slate-200/80 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-red-700">
              Standardized Learning Journey
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              How Each Assessed Module Works
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600">
              All 14 assessed modules share a unified, rigorous 5-step learning architecture
              designed to build practical knowledge and clinical readiness.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {PROGRAMME_METADATA.learningPathway.map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black text-slate-700 uppercase tracking-wider">
                      Step 0{item.step}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-slate-100/80 border border-slate-200 p-4 text-xs sm:text-sm text-slate-700 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base">ℹ️</span>
              <span>
                <strong>Learning Pathway:</strong> Presentation Slides &rarr; Educational Videos &rarr; Structured Reading &rarr; MCQ Assessment &rarr; Verifiable Certificate
              </span>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Provisional Assessment: 10–15 MCQs • 3 Permitted Attempts
            </span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. INTRODUCTORY ORIENTATION: THRESHOLD                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">
                Orientation Entry Point
              </p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-0.5">
                Introductory Orientation
              </h2>
            </div>
            <span className="rounded-full bg-red-100 text-red-800 border border-red-200 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              Non-Assessed
            </span>
          </div>

          <div className="rounded-3xl border-2 border-red-200 bg-white p-6 sm:p-8 shadow-sm hover:border-red-300 transition flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-48 shrink-0">
              <div className="relative aspect-[3/4] w-full max-w-[200px] mx-auto rounded-2xl overflow-hidden border border-red-200 bg-red-50 shadow-inner">
                <img
                  src={orientation.image}
                  alt="Threshold Orientation Section"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="rounded-lg bg-red-100 text-red-900 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider">
                  Section 01 of Handbook
                </span>
                <span className="rounded-lg bg-slate-100 text-slate-700 px-2.5 py-0.5 text-xs font-semibold">
                  Orientation Gateway
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-950">
                  {orientation.title}
                </h3>
                <p className="text-sm font-semibold text-red-700 mt-0.5">
                  {orientation.subtitle}
                </p>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                {orientation.description}
              </p>

              {/* Crucial locked constraint callout */}
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 font-medium">
                <strong>Important Note:</strong> Threshold is an introductory orientation to medical education. It does not generate an individual module certificate and is <em>not</em> counted among the 14 assessed modules required for the final programme credential.
              </div>

              <div className="pt-2">
                <Link
                  href="/mbbs-foundation/learn/threshold"
                  className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-red-800 transition"
                >
                  <span>Explore Threshold Orientation</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. THE 14 ASSESSED MODULES (LOCKED ORDER)                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 border-t border-slate-200/80 bg-slate-50">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">
                Core Curriculum (Order Locked)
              </p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 mt-0.5">
                The 14 Assessed Learning Modules
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
              Each module requires 70% passing score on its scenario assessment to earn its individual certificate.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {assessedModules.map((module) => {
              const isPilot = module.status === "pilot";

              if (isPilot) {
                // REVIVE: First Pilot Module (Active internal link)
                return (
                  <div
                    key={module.slug}
                    className="group relative rounded-3xl border-2 border-teal-500 bg-white p-5 shadow-md hover:shadow-xl hover:-translate-y-1 transition duration-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top status indicator */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 text-teal-950 border border-teal-300 px-3 py-1 text-xs font-black uppercase tracking-wider animate-pulse">
                          <span>🚀</span> FIRST PILOT MODULE
                        </span>
                        <span className="text-xs font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          Module {module.id}
                        </span>
                      </div>

                      {/* Image Thumbnail */}
                      <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-teal-200 bg-teal-50 mb-4">
                        <img
                          src={module.image}
                          alt={module.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-teal-950/40 via-transparent to-transparent"></div>
                        <span className="absolute bottom-2.5 left-2.5 rounded-lg bg-teal-900/90 text-white px-2 py-0.5 text-[10px] font-bold">
                          Resuscitation Science
                        </span>
                      </div>

                      {/* Title & Subtitle */}
                      <h3 className="text-xl font-black text-slate-950 group-hover:text-teal-700 transition">
                        {module.title}
                      </h3>
                      <p className="text-xs font-bold text-teal-800 mt-0.5">
                        {module.subtitle}
                      </p>

                      <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                        {module.description}
                      </p>

                      {/* Learning Highlights */}
                      <div className="mt-3.5 space-y-1 border-t border-teal-100 pt-3 text-[11px] text-slate-600">
                        {module.learningHighlights.slice(0, 2).map((h, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="text-teal-600 font-bold">•</span>
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action link to REVIVE entry page */}
                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <Link
                        href="/mbbs-foundation/learn/modules/revive"
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-sm hover:bg-teal-800 transition"
                      >
                        <span>View REVIVE Pilot Overview</span>
                        <span>&rarr;</span>
                      </Link>
                    </div>
                  </div>
                );
              }

              // All other 13 modules: Disabled, Coming Soon cards
              return (
                <div
                  key={module.slug}
                  className={`rounded-3xl border ${module.theme.border} bg-white/80 p-5 shadow-2xs opacity-95 flex flex-col justify-between`}
                >
                  <div>
                    {/* Top status indicator */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                        <span>🔒</span> COMING SOON
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        Module {module.id} of 14
                      </span>
                    </div>

                    {/* Image Thumbnail */}
                    <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 mb-3.5 opacity-90">
                      <img
                        src={module.image}
                        alt={module.title}
                        className="h-full w-full object-cover grayscale-25"
                      />
                    </div>

                    {/* Title & Subtitle */}
                    <h3 className="text-lg font-bold text-slate-900">
                      {module.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      {module.subtitle}
                    </p>

                    <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {module.description}
                    </p>
                  </div>

                  {/* Disabled status banner */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100">
                    <div className="w-full rounded-xl bg-slate-100/90 py-2 text-center text-xs font-semibold text-slate-500 cursor-not-allowed select-none">
                      Curriculum in Preparation
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 6. TWO-LEVEL CERTIFICATION EXPLANATION                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-white border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">
              Credentials &amp; Recognition
            </p>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 mt-1">
              Two-Tier Certification Framework
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Certificates feature unique identifiers, cryptographic verification tokens, and public verification records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Level A: Individual Module Certificate */}
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl">📜</span>
                <span className="rounded-full bg-slate-200 text-slate-800 text-[11px] font-black uppercase tracking-wider px-3 py-1">
                  Level A Credential
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Individual Module Certificate
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Issued upon passing any of the 14 assessed modules
                </p>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Awarded after completing slides, video, reading, and scoring &ge; 70% on the MCQ assessment.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Downloadable as high-resolution PDF and shareable digital credential.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Unique module certificate identifier with dedicated public verification route.</span>
                </li>
              </ul>
            </div>

            {/* Level B: Final MBBS Foundation Programme Certificate */}
            <div className="rounded-3xl border-2 border-red-700/80 bg-gradient-to-br from-red-50/50 via-white to-white p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl">🏆</span>
                <span className="rounded-full bg-red-100 text-red-900 border border-red-200 text-[11px] font-black uppercase tracking-wider px-3 py-1">
                  Level B • Programme Master Credential
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Final MBBS Foundation Programme Certificate
                </h3>
                <p className="text-xs text-red-700 font-semibold mt-0.5">
                  Issued upon successful completion of all 14 assessed modules
                </p>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-700 font-bold">★</span>
                  <span>Recognizes completion of the comprehensive 14-module foundational medical curriculum.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-700 font-bold">★</span>
                  <span>Issued under the authoritative seal of Ayurvigyan Health Academy India Foundation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-700 font-bold">★</span>
                  <span>Threshold orientation provides foundational context but is not counted towards the 14 assessed modules.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 7. FOOTER NOTE                                                     */}
      {/* ------------------------------------------------------------------ */}
      <footer className="border-t border-slate-200 bg-slate-100 py-8 px-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-5xl space-y-2">
          <p>
            &copy; {new Date().getFullYear()} MBBS Foundation • Ayurvigyan Health Academy India Foundation. All rights reserved.
          </p>
          <p>
            Based on the handbook <em>&ldquo;MBBS Foundation: Your First Book of Medicine&rdquo;</em> by Dr. Lokesh Tiwari.
          </p>
        </div>
      </footer>
    </div>
  );
}

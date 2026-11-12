import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import {
  PROGRAMME_METADATA,
  getOrientationSection,
} from "@/lib/mbbs-foundation/sectionsConfig";

export const metadata: Metadata = {
  title: "Threshold: Introductory Orientation | MBBS Foundation",
  description:
    "An introductory orientation to the MBBS Foundation Online Learning Programme. Setting the stage for the 14 assessed modules.",
};

export default function ThresholdOrientationPage() {
  const orientation = getOrientationSection();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. TOP NAV / BREADCRUMB BAR                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="mx-auto max-w-5xl flex items-center justify-between text-xs sm:text-sm">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-slate-500">
            <Link
              href="/mbbs-foundation/learn"
              className="font-bold text-red-700 hover:text-red-900 transition flex items-center gap-1"
            >
              <span>&larr;</span>
              <span>Online Learning Programme</span>
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-800">Threshold (Orientation)</span>
          </nav>

          <span className="rounded-full bg-red-100 text-red-800 border border-red-200 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            Non-Assessed Orientation
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. HEADER BANNER                                                   */}
      {/* ------------------------------------------------------------------ */}
      <header className="border-b border-slate-200 bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-red-100 text-red-900 px-2.5 py-1 text-xs font-black uppercase tracking-wider">
              Section 01 of Handbook
            </span>
            <span className="rounded-md bg-slate-100 text-slate-700 px-2.5 py-1 text-xs font-semibold">
              Gateway to Medicine
            </span>
          </div>

          <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight text-slate-950">
            Threshold: <span className="text-red-700">Introductory Orientation</span>
          </h1>

          <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-3xl leading-relaxed">
            Welcome to the entry point of the MBBS Foundation Online Learning Programme.
            Threshold invites you to pause at the boundary between pre-medical life and the lifelong identity of a physician.
          </p>

          {/* Locked Status Banner */}
          <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs sm:text-sm text-amber-950">
            <div className="flex items-start gap-2.5">
              <span className="text-lg">⚠️</span>
              <div>
                <strong>Orientation Status Note:</strong> This is an introductory orientation and is <em>not an assessed module</em>.
                It does not generate an individual module certificate and is <em>not counted</em> among the 14 assessed modules required for the final programme certificate.
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 3. MAIN CONTENT AREA                                               */}
      {/* ------------------------------------------------------------------ */}
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* Objectives Section */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Orientation Objectives
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Threshold prepares you to navigate the subsequent 14 assessed modules with academic clarity, emotional grounding, and professional purpose.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
              <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🌱</span> Crossing the Boundary
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Appreciating the profound shift from competitive exam preparation to the service of human healing and patient trust.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
              <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🧭</span> Navigating the Curriculum
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Understanding the 14-module sequence (from Inception through Continuum) and how to pace your learning journey.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
              <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🧠</span> Habits of a Lifelong Scholar
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Developing active recall, spaced repetition, concept synthesis, and clinical curiosity early in training.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
              <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🛡️</span> Resilience &amp; Well-being
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Setting sustainable boundaries, peer support systems, and proactive strategies against medical training fatigue.
              </p>
            </div>
          </div>
        </div>

        {/* Section Illustration Card */}
        <div className="rounded-3xl border border-red-200 bg-gradient-to-r from-red-50/80 via-white to-red-50/40 p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="w-40 sm:w-48 shrink-0">
            <img
              src={orientation.image}
              alt="Threshold Cover Illustration"
              className="w-full rounded-2xl shadow-sm border border-red-200"
            />
          </div>
          <div className="space-y-3 text-center md:text-left">
            <span className="rounded-full bg-red-100 text-red-900 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              Handbook Chapter Anchor
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Your First Threshold in Medicine
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              &ldquo;As you step into medical college from school, this book invites you to pause and learn at this threshold. It is a crossing-over: into responsibility, into compassion and into the lifelong identity of being a doctor.&rdquo;
            </p>
            <p className="text-xs font-bold text-red-700">
              — Dr. Lokesh Tiwari, &ldquo;{PROGRAMME_METADATA.bookTitle}&rdquo;
            </p>
          </div>
        </div>

        {/* Clearly Marked Placeholders for Future Content */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Orientation Learning Components
            </h2>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Content Pipeline
            </span>
          </div>

          {/* Placeholder 1: Slides */}
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center space-y-2">
            <div className="text-3xl">🖥️</div>
            <div className="text-sm font-bold text-slate-800">
              [Orientation Presentation Slides — Under Preparation]
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Interactive slide deck covering the transition into MBBS, foundational expectations, and programme navigation will be loaded here.
            </p>
          </div>

          {/* Placeholder 2: Video */}
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center space-y-2">
            <div className="text-3xl">🎥</div>
            <div className="text-sm font-bold text-slate-800">
              [Welcome &amp; Orientation Video — Under Preparation]
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Dr. Lokesh Tiwari&apos;s video message welcoming new medical students and introducing the MBBS Foundation philosophy will be embedded here.
            </p>
          </div>

          {/* Placeholder 3: Reading */}
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center space-y-2">
            <div className="text-3xl">📖</div>
            <div className="text-sm font-bold text-slate-800">
              [Foundational Reading Excerpt — Under Preparation]
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Selected introductory passages and reflective exercises from Section 1 will be displayed here in structured readable format.
            </p>
          </div>
        </div>

        {/* Next Step Call to Action */}
        <div className="rounded-3xl border border-teal-300 bg-teal-50/70 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 text-teal-900 px-3 py-1 text-xs font-bold uppercase tracking-wider mb-2">
              <span>🚀</span> Active Development
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              Ready to explore the first assessed module?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Module 7 (REVIVE) is currently under active pilot development.
            </p>
          </div>

          <Link
            href="/mbbs-foundation/learn/modules/revive"
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-800 transition"
          >
            <span>Explore Pilot: Module 7 — REVIVE</span>
            <span>&rarr;</span>
          </Link>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-100 py-6 px-4 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} MBBS Foundation • Ayurvigyan Health Academy India Foundation</p>
      </footer>
    </div>
  );
}

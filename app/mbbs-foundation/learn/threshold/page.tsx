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
    "An introductory orientation to the MBBS Foundation Online Learning Programme setting foundational context for medical students.",
};

export default function ThresholdOrientationPage() {
  const orientation = getOrientationSection();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. TOP NAV / BREADCRUMB BAR                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="mx-auto max-w-4xl flex items-center justify-between text-xs sm:text-sm">
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

          <span className="rounded-full bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            Orientation Guide
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. HEADER BANNER                                                   */}
      {/* ------------------------------------------------------------------ */}
      <header className="border-b border-slate-200 bg-white py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-red-100 text-red-900 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider">
              Orientation
            </span>
            <span className="rounded-md bg-slate-100 text-slate-700 px-2.5 py-0.5 text-xs font-semibold">
              Gateway to Medicine
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
            Threshold: <span className="text-red-700">Introductory Orientation</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            Threshold invites medical students to pause at the boundary between pre-medical life and the lifelong identity of a physician, establishing academic clarity and professional purpose.
          </p>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 3. MAIN CONTENT AREA                                               */}
      {/* ------------------------------------------------------------------ */}
      <main className="flex-1 mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Objectives Section */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-4">
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            Orientation Foundations
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>🌱</span> Crossing the Boundary
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Appreciating the profound shift from competitive entrance exams to the service of human healing and patient trust.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>🧭</span> Navigating the Curriculum
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Understanding the 14-module sequence (from Inception through Continuum) and building steady clinical habits.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>🧠</span> Habits of a Lifelong Scholar
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Developing active recall, spaced repetition, concept synthesis, and clinical curiosity early in training.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>⚖️</span> Ethics &amp; Compassion
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Recognizing that medical professionalism and empathy are foundational competencies, not optional attributes.
              </p>
            </div>
          </div>
        </div>

        {/* Action: Proceed to Active Pilot */}
        <div className="rounded-3xl border border-teal-300 bg-teal-50/70 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 text-teal-950 border border-teal-300 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
              Available Module
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              Module 7: REVIVE
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Cardiopulmonary Resuscitation (CPR) &amp; Relief of Choking is available now.
            </p>
          </div>

          <Link
            href="/mbbs-foundation/learn/modules/revive"
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-800 transition"
          >
            <span>Start Module 7: REVIVE</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-100 py-6 px-4 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} MBBS Foundation &bull; Ayurvigyan Health Academy India Foundation</p>
      </footer>
    </div>
  );
}

"use client";

import { useState } from "react";

const revivePages = [
  {
    id: "page-1",
    title: "Chapter 53 Excerpt — Page 1",
    subtitle: "Resuscitation Principles & Emergency Protocols",
    src: "/cprday/revive-excerpts/Chapter 53a.png",
  },
  {
    id: "page-2",
    title: "Chapter 53 Excerpt — Page 2",
    subtitle: "Algorithmic Approach to Cardiac Arrest",
    src: "/cprday/revive-excerpts/Chapter 53b.png",
  },
  {
    id: "page-3",
    title: "Chapter 53 Excerpt — Page 3",
    subtitle: "High-Quality CPR & Team Dynamics",
    src: "/cprday/revive-excerpts/Chapter 53c.png",
  },
  {
    id: "page-4",
    title: "Chapter 53 Excerpt — Page 4",
    subtitle: "Post-Resuscitation Care & Pearls",
    src: "/cprday/revive-excerpts/Chapter 53d.png",
  },
];

export default function ReviveSectionPreview() {
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setSelectedPageIndex(index);
  };

  const closeLightbox = () => {
    setSelectedPageIndex(null);
  };

  const nextPicture = () => {
    if (selectedPageIndex === null) return;
    setSelectedPageIndex((selectedPageIndex + 1) % revivePages.length);
  };

  const prevPicture = () => {
    if (selectedPageIndex === null) return;
    setSelectedPageIndex(
      (selectedPageIndex - 1 + revivePages.length) % revivePages.length
    );
  };

  return (
    <section id="revive-section" className="scroll-mt-24 bg-gradient-to-b from-purple-50/70 via-rose-50/40 to-sky-50/60 py-16 px-4 sm:px-6 text-slate-900 border-y border-purple-200/80 relative overflow-hidden">
      {/* Background Subtle Accent Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-purple-200/30 blur-[100px] pointer-events-none rounded-full"></div>

      <div className="mx-auto max-w-5xl relative z-10">
        {/* Header */}
        <div className="text-center">
          <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.25em] text-purple-800 bg-purple-100/90 border border-purple-300 inline-block px-3.5 sm:px-4 py-1.5 rounded-full shadow-sm">
            📚 Recommended Medical Reading Excerpt
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl text-slate-900">
            Master Resuscitation: The <span className="bg-gradient-to-r from-red-700 via-rose-600 to-purple-700 bg-clip-text text-transparent">&quot;Revive&quot;</span> Chapter
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base sm:text-lg text-slate-700 leading-relaxed">
            An educational excerpt from the clinical handbook <strong className="text-slate-900 font-bold">&ldquo;MBBS Foundation: Your First Book of Medicine&rdquo;</strong> — dedicated to CPR protocols, clinical decision-making, and emergency resuscitation science.
          </p>
        </div>

        {/* 4 Page Screenshots Grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {revivePages.map((page, idx) => (
            <div
              key={page.id}
              onClick={() => openLightbox(idx)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-purple-200/90 bg-white p-3.5 shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:border-purple-400 hover:shadow-xl flex flex-col justify-between"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-slate-50 border border-slate-200">
                <img
                  src={page.src}
                  alt={page.title}
                  className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                />

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-end justify-center p-4">
                  <span className="rounded-xl bg-purple-700 px-3.5 py-2 text-xs font-bold text-white shadow-lg flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Click to Read Full Page
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Core Educational Highlights */}
        <div className="mt-12 rounded-2xl border border-purple-200/80 bg-white/90 p-6 sm:p-8 shadow-sm backdrop-blur">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span>✨</span> What You Will Discover in the Revive Chapter:
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3 text-xs sm:text-sm text-slate-700">
            <div className="rounded-xl bg-purple-50/60 p-4 border border-purple-200/70">
              <span className="text-base">🫀</span> <strong className="text-slate-900 block mt-1">CPR & Resuscitation Science</strong>
              Clear, structured algorithms for adult and pediatric cardiac emergencies.
            </div>
            <div className="rounded-xl bg-sky-50/60 p-4 border border-sky-200/70">
              <span className="text-base">🩺</span> <strong className="text-slate-900 block mt-1">Clinical Decision Making</strong>
              Real-world ER insights, high-quality chest compression dynamics, and leadership.
            </div>
            <div className="rounded-xl bg-rose-50/60 p-4 border border-rose-200/70">
              <span className="text-base">🎓</span> <strong className="text-slate-900 block mt-1">For Doctors & Caregivers</strong>
              Bridging the gap between basic CPR training and comprehensive patient care.
            </div>
          </div>
        </div>

        {/* Soft Organic Purchase CTA Box */}
        <div className="mt-10 rounded-2xl sm:rounded-3xl border border-purple-300/80 bg-gradient-to-r from-purple-100/90 via-sky-50 to-rose-50 p-6 sm:p-8 text-center shadow-xl">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
            Want to Explore the Full 15-Section Handbook?
          </h3>
          <p className="mt-2 text-sm sm:text-base text-slate-700 max-w-2xl mx-auto">
            &ldquo;MBBS Foundation: Your First Book of Medicine&rdquo; covers ethics, emergency resuscitation, CPR, soft skills, and the hidden curriculum of medicine.
          </p>

          <div className="mt-6 flex items-center justify-center">
            <a
              href="/book"
              className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 px-8 py-3.5 text-sm sm:text-base font-bold text-white shadow-lg hover:from-purple-800 hover:to-indigo-800 transition text-center"
            >
              📖 Explore Table of Contents & Sample Pages →
            </a>
          </div>
        </div>
      </div>

      {/* Full-Screen Lightbox Modal */}
      {selectedPageIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 rounded-full bg-slate-800/80 p-3 text-slate-300 hover:bg-slate-700 hover:text-white transition z-50"
            aria-label="Close modal"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous Button */}
          <button
            type="button"
            onClick={prevPicture}
            className="absolute left-2 sm:left-6 rounded-full bg-slate-800/80 p-3 text-slate-300 hover:bg-slate-700 hover:text-white transition z-50"
            aria-label="Previous page"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Main Image Container */}
          <div className="max-h-[90vh] max-w-4xl overflow-auto rounded-2xl bg-white border border-purple-200 p-2 sm:p-4 text-center shadow-2xl">
            <img
              src={revivePages[selectedPageIndex].src}
              alt={revivePages[selectedPageIndex].title}
              className="max-h-[75vh] w-auto mx-auto object-contain rounded-lg shadow-md"
            />
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={nextPicture}
            className="absolute right-2 sm:right-6 rounded-full bg-slate-800/80 p-3 text-slate-300 hover:bg-slate-700 hover:text-white transition z-50"
            aria-label="Next page"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}

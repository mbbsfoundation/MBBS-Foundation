"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  REVIVE_MODULE_META,
  REVIVE_VIDEOS,
  REVIVE_READING_SECTIONS,
} from "@/lib/mbbs-foundation/reviveModuleData";
import RevivePdfSlideViewer from "./RevivePdfSlideViewer";
import ReviveAssessmentInterface from "./ReviveAssessmentInterface";
import { formatConciseMedicalCollegeName } from "@/lib/mbbs-foundation/collegeFormat";

type SectionTab = "overview" | "slides" | "videos" | "reading" | "assessment" | "certificate";

interface LearnerProfile {
  id: string;
  fullName: string;
  email: string;
  mobileNumber?: string;
  learnerCategory?: string;
  institutionName?: string;
}

const STORAGE_KEY = "mbbsf_revive_progress_v1";

export default function ReviveModuleInterface() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial slide param (e.g. from registration redirect ?slide=21)
  const slideParam = searchParams.get("slide");
  const initialSlideNumber = slideParam ? Math.max(1, parseInt(slideParam, 10) || 1) : 1;

  // Active section tab (defaults to slides for presentation-first experience)
  const requestedSection = searchParams.get("section") as SectionTab;
  const defaultSection: SectionTab =
    requestedSection &&
    ["overview", "slides", "videos", "reading", "assessment", "certificate"].includes(requestedSection)
      ? requestedSection
      : "slides";
  const [activeSection, setActiveSection] = useState<SectionTab>(defaultSection);

  // Authentication state
  const [authLoading, setAuthLoading] = useState(true);
  const [learner, setLearner] = useState<LearnerProfile | null>(null);
  const [issuedCert, setIssuedCert] = useState<{
    certificateId: string;
    learnerName: string;
    medicalCollege: string;
    moduleTitle: string;
    issuedAt: string;
  } | null>(null);

  // Guest preview registration invitation modal state
  const [showGuestInvite, setShowGuestInvite] = useState<boolean>(false);

  // Close modal on Escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && showGuestInvite) {
        setShowGuestInvite(false);
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showGuestInvite]);

  // Video state
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Reading state
  const [readingSectionId, setReadingSectionId] = useState<string>(REVIVE_READING_SECTIONS[0].id);
  const [readingFontSize, setReadingFontSize] = useState<"normal" | "large">("normal");

  // Progress tracking state
  const [completedSections, setCompletedSections] = useState<{
    slides: boolean;
    videos: boolean;
    reading: boolean;
    assessment: boolean;
  }>({
    slides: false,
    videos: false,
    reading: false,
    assessment: false,
  });

  // 1. Fetch authenticated learner session
  useEffect(() => {
    let isMounted = true;
    async function checkLearnerSession() {
      try {
        const res = await fetch("/api/mbbs-foundation/learn/auth/me", {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated && data.user) {
            setLearner({
              id: data.user.id,
              fullName: data.user.fullName || data.profile?.fullName || "Learner",
              email: data.user.email,
              mobileNumber: data.user.mobileNumber,
              learnerCategory: data.profile?.learnerCategory,
              institutionName:
                data.profile?.college?.collegeName ||
                data.profile?.institutionName ||
                "Medical College",
            });

            // Fetch live certificate status
            try {
              const certRes = await fetch("/api/mbbs-foundation/learn/certificate/revive");
              if (certRes.ok) {
                const certData = await certRes.json();
                if (isMounted && certData.success && certData.hasCertificate) {
                  setIssuedCert(certData.certificate);
                }
              }
            } catch {
              // Ignore certificate fetch error
            }
          }
        }
      } catch (err) {
        console.warn("Learner session verification error:", err);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    }

    checkLearnerSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load saved progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setCompletedSections({
            slides: Boolean(parsed.slides),
            videos: Boolean(parsed.videos),
            reading: Boolean(parsed.reading),
            assessment: Boolean(parsed.assessment),
          });
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  // Save progress changes
  const markSectionCompleted = useCallback(
    (sectionKey: "slides" | "videos" | "reading" | "assessment") => {
      setCompletedSections((prev) => {
        const updated = { ...prev, [sectionKey]: true };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Ignore write errors
        }
        return updated;
      });
    },
    []
  );

  // Navigate to section
  const navigateToSection = (tab: SectionTab) => {
    setActiveSection(tab);
    const params = new URLSearchParams(window.location.search);
    params.set("section", tab);
    router.replace(`/mbbs-foundation/learn/modules/revive?${params.toString()}`, {
      scroll: false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. COMPACT PAGE HEADER                                             */}
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-3">
          {/* Breadcrumb & Title */}
          <div className="flex flex-col">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
              <Link
                href="/mbbs-foundation"
                className="text-slate-600 hover:text-slate-900 transition font-medium"
              >
                MBBS Foundation
              </Link>
              <span>/</span>
              <Link
                href="/mbbs-foundation/learn"
                className="text-slate-600 hover:text-slate-900 transition font-medium"
              >
                Learning
              </Link>
              <span>/</span>
              <span className="font-bold text-slate-900">REVIVE</span>
            </nav>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mt-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">
                REVIVE
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-medium">
                Resuscitation Principles &amp; Emergency CPR
              </p>
            </div>
          </div>

          {/* Authentication Badge / Header Register Action */}
          <div className="flex items-center gap-2">
            {authLoading ? (
              <span className="text-sm text-slate-400">Loading...</span>
            ) : learner ? (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-sm font-bold shadow-2xs">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="truncate max-w-[180px] sm:max-w-[240px]">
                    {learner.fullName}
                  </span>
                </span>
                <Link
                  href="/api/mbbs-foundation/learn/auth/logout"
                  onClick={async (e) => {
                    e.preventDefault();
                    await fetch("/api/mbbs-foundation/learn/auth/logout", { method: "POST" });
                    setLearner(null);
                    router.refresh();
                  }}
                  className="text-xs sm:text-sm text-slate-500 hover:text-red-700 font-bold underline underline-offset-2"
                >
                  Sign Out
                </Link>
              </div>
            ) : (
              <Link
                href="/mbbs-foundation/learn/register?redirect=/mbbs-foundation/learn/modules/revive"
                className="inline-flex items-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm sm:text-base font-bold transition shadow-xs"
              >
                <span>Sign In / Register Free</span>
                <span>&rarr;</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 2. SEQUENTIAL LEARNING PATHWAY NAVIGATION BAR                      */}
      {/* ------------------------------------------------------------------ */}
      <nav
        aria-label="Module Pathway"
        className="sticky top-[69px] sm:top-[77px] z-30 bg-white border-b border-slate-200 shadow-2xs overflow-x-auto"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 sm:py-2.5 min-w-max gap-2 text-sm sm:text-base">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {/* Step 1: Slides */}
              <button
                onClick={() => navigateToSection("slides")}
                className={`flex items-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-bold transition-all ${
                  activeSection === "slides"
                    ? "bg-teal-700 text-white shadow-xs"
                    : completedSections.slides
                    ? "bg-teal-50 text-teal-900 border border-teal-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>1. Slides</span>
                {completedSections.slides && <span className="text-xs text-teal-700 ml-1 font-extrabold">✓</span>}
              </button>

              {/* Step 2: Videos */}
              <button
                onClick={() => navigateToSection("videos")}
                className={`flex items-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-bold transition-all ${
                  activeSection === "videos"
                    ? "bg-teal-700 text-white shadow-xs"
                    : completedSections.videos
                    ? "bg-teal-50 text-teal-900 border border-teal-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>2. Videos</span>
                {completedSections.videos && <span className="text-xs text-teal-700 ml-1 font-extrabold">✓</span>}
              </button>

              {/* Step 3: Assessment */}
              <button
                onClick={() => navigateToSection("assessment")}
                className={`flex items-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-bold transition-all ${
                  activeSection === "assessment"
                    ? "bg-teal-700 text-white shadow-xs"
                    : completedSections.assessment
                    ? "bg-teal-50 text-teal-900 border border-teal-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>3. Assessment</span>
                {completedSections.assessment && <span className="text-xs text-teal-700 ml-1 font-extrabold">✓</span>}
              </button>

              {/* Step 4: Certificate */}
              <button
                onClick={() => navigateToSection("certificate")}
                className={`flex items-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-bold transition-all ${
                  activeSection === "certificate"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                <span>4. Certificate</span>
              </button>
            </div>

            {/* Tab: Overview (Optional Tab) */}
            <button
              onClick={() => navigateToSection("overview")}
              className={`flex items-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all ${
                activeSection === "overview"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <span>Curriculum Overview</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* 3. MAIN CONTENT DISPLAY (TAB SWITCHED)                             */}
      {/* ------------------------------------------------------------------ */}
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-6">
        
        {/* ================================================================ */}
        {/* TAB 0: OVERVIEW & CURRICULUM ARCHITECTURE                        */}
        {/* ================================================================ */}
        {activeSection === "overview" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Learning Objectives */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-teal-700">
                  Curriculum Competencies
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  Learning Objectives for Module 7: REVIVE
                </h2>
                <p className="text-sm sm:text-base text-slate-600 mt-1.5 font-normal">
                  Upon completing this module, learners should be able to:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {REVIVE_MODULE_META.objectives.map((obj, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-teal-50/50 border border-teal-100"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-200 text-teal-950 font-bold text-sm">
                      0{i + 1}
                    </span>
                    <p className="text-sm sm:text-base font-medium text-slate-800 leading-relaxed">
                      {obj}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Masterclass Curriculum Themes (Relocated from Slides) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-teal-700">
                  Masterclass Curriculum
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  Core Clinical Themes in This Presentation
                </h3>
                <p className="text-sm sm:text-base text-slate-600 mt-1.5 font-normal">
                  Structured learning topics covered across the presentation slides:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs sm:text-sm font-bold text-teal-800 uppercase tracking-wider">Module A</div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 mt-1">Transition &amp; Medical Ethics</div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                    Hippocratic foundations, professional commitment, and the clinical transition from student to life-saving practitioner.
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs sm:text-sm font-bold text-teal-800 uppercase tracking-wider">Module B</div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 mt-1">Resuscitation Physiology</div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                    Coronary and cerebral perfusion pressure dynamics, acute ischemia timeline, and the biological urgency of CPR.
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs sm:text-sm font-bold text-teal-800 uppercase tracking-wider">Module C</div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 mt-1">High-Quality CPR Metrics</div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                    Rate: 100–120 bpm, Depth: 5–6 cm (adult), complete chest recoil, and minimizing interruptions in compressions.
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs sm:text-sm font-bold text-teal-800 uppercase tracking-wider">Module D</div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 mt-1">Automated External Defibrillators</div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                    AED workflow, pad placement, rhythm analysis (VF/VT vs. Asystole/PEA), and rescuer safety clearance protocols.
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs sm:text-sm font-bold text-teal-800 uppercase tracking-wider">Module E</div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 mt-1">The 4 Hs &amp; 4 Ts Framework</div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                    Systematic identification and management of reversible etiologies of cardiac arrest during advanced life support.
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs sm:text-sm font-bold text-teal-800 uppercase tracking-wider">Module F</div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 mt-1">Team Dynamics &amp; Leadership</div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                    Closed-loop communication, designated team leader roles, compressor rotation every 2 minutes, and debriefing.
                  </p>
                </div>
              </div>

              {/* Start Module Action */}
              <div className="pt-4 text-center">
                <button
                  onClick={() => navigateToSection("slides")}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold px-8 py-3.5 sm:py-4 text-sm sm:text-base shadow-sm transition"
                >
                  <span>Open Presentation Slides</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 1: PRESENTATION SLIDES (DOMINANT VISUAL ELEMENT)             */}
        {/* ================================================================ */}
        {activeSection === "slides" && (
          <div className="space-y-4 animate-fadeIn">
            {authLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-2xs">
                <div className="h-8 w-8 border-3 border-teal-500/20 border-t-teal-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500 font-semibold">Verifying learner access permissions...</p>
              </div>
            ) : learner ? (
              <div className="space-y-4">
                {/* PDF.js Single-Slide Presentation Canvas Viewer (Authenticated 53 Slides) */}
                <RevivePdfSlideViewer
                  pdfUrl={REVIVE_MODULE_META.presentationPdfUrl}
                  initialSlide={initialSlideNumber}
                  maxAllowedSlides={53}
                  isGuestPreview={false}
                />

                {/* Bottom navigation for enrolled learner */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <span className="text-sm sm:text-base text-slate-600 font-medium">
                    Enrolled learner &bull; All 53 slides available
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      markSectionCompleted("slides");
                      navigateToSection("videos");
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-3 text-sm sm:text-base shadow-xs transition"
                  >
                    <span>Proceed to 2. Videos</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* PDF.js Single-Slide Presentation Canvas Viewer (Guest Preview 20 Slides) */}
                <RevivePdfSlideViewer
                  pdfUrl={REVIVE_MODULE_META.previewPdfUrl}
                  initialSlide={Math.min(initialSlideNumber, 20)}
                  maxAllowedSlides={20}
                  isGuestPreview={true}
                  onPreviewLimitReached={() => setShowGuestInvite(true)}
                />

                {/* Bottom link for guests */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <span className="text-sm sm:text-base text-slate-600 font-medium">
                    Guest preview (slides 1–20)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowGuestInvite(true)}
                    className="text-sm sm:text-base font-bold text-teal-800 hover:text-teal-900 underline underline-offset-4"
                  >
                    Register Free to Unlock All 53 Slides &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 2: EDUCATIONAL VIDEOS                                        */}
        {/* ================================================================ */}
        {activeSection === "videos" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Section Header */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-black uppercase tracking-wider text-teal-700">
                Learning Pathway &bull; Step 2 of 5
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                Instructional Resuscitation Demonstrations
              </h2>
            </div>

            {/* Check Authentication State */}
            {authLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="h-9 w-9 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-semibold text-slate-600">
                  Checking learner session...
                </p>
              </div>
            ) : !learner ? (
              /* Unauthenticated Guest Invitation (No Player Rendered) */
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm text-center max-w-2xl mx-auto space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs font-black uppercase tracking-wider">
                  <span>🔒</span>
                  <span>Free Registration Required</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Register Free to Watch Resuscitation Videos
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
                    Clinical video demonstrations are accessible free for medical students and healthcare professionals. Sign in or create your free account to unlock the 3-video sequence and continue learning.
                  </p>
                </div>

                {/* 3-Video Sequence Overview (Locked Preview) */}
                <div className="space-y-2 text-left bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-2">
                    Included Video Demonstrations (3 Parts):
                  </span>
                  {REVIVE_VIDEOS.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 py-1.5 border-b border-slate-200/60 last:border-0"
                    >
                      <span className="font-extrabold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md text-xs shrink-0">
                        Video {v.id}
                      </span>
                      <span className="font-medium truncate">{v.title}</span>
                      <span className="text-slate-400 ml-auto text-xs shrink-0">🔒</span>
                    </div>
                  ))}
                </div>

                {/* Registration CTA Actions */}
                <div className="space-y-3 pt-2">
                  <Link
                    href={`/mbbs-foundation/learn/register?redirect=${encodeURIComponent(
                      "/mbbs-foundation/learn/modules/revive?section=videos"
                    )}`}
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-black text-base sm:text-lg shadow-md hover:shadow-lg transition"
                  >
                    <span>Register Free to Watch Videos</span>
                    <span>&rarr;</span>
                  </Link>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs sm:text-sm pt-2">
                    <Link
                      href={`/mbbs-foundation/learn/register?redirect=${encodeURIComponent(
                        "/mbbs-foundation/learn/modules/revive?section=videos"
                      )}`}
                      className="font-bold text-teal-800 hover:text-teal-900 underline underline-offset-4"
                    >
                      Already Registered? Sign In &rarr;
                    </Link>
                    <span className="text-slate-300 hidden sm:inline">&bull;</span>
                    <button
                      type="button"
                      onClick={() => navigateToSection("slides")}
                      className="text-slate-500 hover:text-slate-800 font-semibold transition"
                    >
                      &larr; Back to 1. Slides
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Authenticated Learner: 16:9 Prominent Video Player + Playlist */
              <div className="space-y-6">
                {(() => {
                  const currentVideo =
                    REVIVE_VIDEOS[currentVideoIndex] || REVIVE_VIDEOS[0];

                  return (
                    <div className="rounded-3xl border border-slate-300 bg-white overflow-hidden shadow-md">
                      {/* Top Bar for Active Video */}
                      <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-teal-600 text-white text-xs font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                            Video {currentVideo.id} of {REVIVE_VIDEOS.length}
                          </span>
                          <span className="text-xs sm:text-sm text-slate-300 font-bold">
                            REVIVE Instructional Demonstration
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          Part {currentVideoIndex + 1} of {REVIVE_VIDEOS.length}
                        </span>
                      </div>

                      {/* Prominent 16:9 Video Player (youtube-nocookie.com) */}
                      <div className="relative aspect-video w-full bg-black">
                        <iframe
                          key={currentVideo.youtubeId}
                          src={`https://www.youtube-nocookie.com/embed/${currentVideo.youtubeId}?rel=0&modestbranding=1`}
                          title={currentVideo.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="absolute inset-0 h-full w-full border-0"
                        />
                      </div>

                      {/* Active Video Header & Navigation Controls */}
                      <div className="p-4 sm:p-6 space-y-4">
                        <div>
                          <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                            {currentVideo.title}
                          </h3>
                        </div>

                        {/* Previous Video and Next Video Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentVideoIndex((prev) => Math.max(0, prev - 1))
                            }
                            disabled={currentVideoIndex <= 0}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-bold bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition border border-slate-700 shadow-xs"
                          >
                            <span>&larr; Previous Video</span>
                          </button>

                          <span className="text-xs sm:text-sm font-bold text-slate-500">
                            Video {currentVideoIndex + 1} of {REVIVE_VIDEOS.length}
                          </span>

                          {currentVideoIndex < REVIVE_VIDEOS.length - 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setCurrentVideoIndex((prev) =>
                                  Math.min(REVIVE_VIDEOS.length - 1, prev + 1)
                                )
                              }
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-bold bg-teal-600 hover:bg-teal-500 text-white transition border border-teal-500/50 shadow-xs"
                            >
                              <span>Next Video &rarr;</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                markSectionCompleted("videos");
                                navigateToSection("reading");
                              }}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-md transition"
                            >
                              <span>Proceed to 3. Reading &rarr;</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Compact Numbered Playlist Below Player */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Video Playlist ({REVIVE_VIDEOS.length} Demonstrations)
                    </span>
                    <span className="text-xs text-slate-400">
                      Click to switch video
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {REVIVE_VIDEOS.map((v, idx) => {
                      const isActive = currentVideoIndex === idx;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setCurrentVideoIndex(idx)}
                          className={`text-left rounded-2xl p-4 border transition-all ${
                            isActive
                              ? "bg-teal-50 border-teal-500 ring-2 ring-teal-500/20 shadow-xs"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`text-xs font-black uppercase px-2 py-0.5 rounded-md ${
                                isActive
                                  ? "bg-teal-700 text-white"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              Video {v.id}
                            </span>
                            {isActive && (
                              <span className="text-xs font-bold text-teal-700 flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                                Now Playing
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-xs sm:text-sm leading-snug line-clamp-2 ${
                              isActive
                                ? "font-black text-teal-950"
                                : "font-bold text-slate-800"
                            }`}
                          >
                            {v.title}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Practical Training Notice */}
                <div className="rounded-2xl bg-slate-100 border border-slate-200 p-4 text-xs text-slate-600">
                  <div className="font-bold text-slate-800 mb-1">
                    ⚠️ Practical Training Notice
                  </div>
                  <p className="leading-relaxed">
                    Online video demonstrations illustrate procedural principles only. In accordance with the disclaimer, online viewing does not certify practical CPR/BLS/ALS competence.
                  </p>
                </div>

                {/* Bottom Transition Action */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => navigateToSection("slides")}
                    className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition"
                  >
                    &larr; Back to 1. Slides
                  </button>

                  <button
                    onClick={() => {
                      markSectionCompleted("videos");
                      navigateToSection("assessment");
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-3 text-xs sm:text-sm shadow-xs transition"
                  >
                    <span>Proceed to 3. Assessment &rarr;</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 3: STRUCTURED READING                                        */}
        {/* ================================================================ */}
        {activeSection === "reading" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-teal-700">
                  Section 3 of 4 • Handbook Excerpts
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                  Chapter 53: Clinical Resuscitation Science Text
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-slate-500">Text Size:</span>
                <button
                  onClick={() => setReadingFontSize("normal")}
                  className={`px-2.5 py-1 rounded-md border ${
                    readingFontSize === "normal"
                      ? "bg-teal-700 text-white border-teal-700 font-bold"
                      : "bg-white text-slate-700 border-slate-300"
                  }`}
                >
                  Standard
                </button>
                <button
                  onClick={() => setReadingFontSize("large")}
                  className={`px-2.5 py-1 rounded-md border ${
                    readingFontSize === "large"
                      ? "bg-teal-700 text-white border-teal-700 font-bold"
                      : "bg-white text-slate-700 border-slate-300"
                  }`}
                >
                  Large (18px)
                </button>
              </div>
            </div>

            {/* Reading Layout: Subsections Sidebar + Text Pane */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar: 5 Reading Parts */}
              <div className="space-y-2 lg:col-span-1">
                <div className="rounded-2xl bg-white border border-slate-200 p-3 shadow-2xs space-y-1">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-2 py-1">
                    Reading Sections
                  </div>
                  {REVIVE_READING_SECTIONS.map((sec, idx) => (
                    <button
                      key={sec.id}
                      onClick={() => setReadingSectionId(sec.id)}
                      className={`w-full text-left rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                        readingSectionId === sec.id
                          ? "bg-teal-700 text-white font-bold shadow-xs"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="text-[10px] opacity-75 uppercase">Part {idx + 1}</div>
                      <div className="truncate font-semibold">{sec.title.replace(/^Part \d+: /, "")}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Reading Pane */}
              <div className="lg:col-span-3">
                {(() => {
                  const section =
                    REVIVE_READING_SECTIONS.find((s) => s.id === readingSectionId) ||
                    REVIVE_READING_SECTIONS[0];
                  return (
                    <article className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-2xs space-y-6">
                      <header className="border-b border-slate-100 pb-4">
                        <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                          Handbook Section 8 • Chapter 53
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                          {section.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 italic font-serif">
                          &ldquo;{section.summary}&rdquo;
                        </p>
                      </header>

                      {/* Paragraphs */}
                      <div
                        className={`space-y-4 text-slate-700 leading-relaxed font-serif ${
                          readingFontSize === "large" ? "text-lg sm:text-xl" : "text-sm sm:text-base"
                        }`}
                      >
                        {section.paragraphs.map((para, pIdx) => (
                          <p key={pIdx}>{para}</p>
                        ))}
                      </div>

                      {/* Placeholder Notes Callout */}
                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 mt-6 font-sans">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                          <span>📋</span>
                          <span>Textbook Integration Notes</span>
                        </div>
                        <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600 font-medium">
                          {section.placeholderNotes.map((note, noteIdx) => (
                            <li key={noteIdx} className="flex items-start gap-2">
                              <span className="text-slate-400 font-bold">•</span>
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </article>
                  );
                })()}
              </div>
            </div>

            {/* Bottom Transition Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <button
                onClick={() => navigateToSection("videos")}
                className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition"
              >
                &larr; Back to 2. Videos
              </button>

              <button
                onClick={() => {
                  markSectionCompleted("reading");
                  navigateToSection("assessment");
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-3 text-xs sm:text-sm shadow-xs transition"
              >
                <span>Proceed to 3. Assessment &rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 3: MCQ ASSESSMENT (PHASE 6A ASSESSMENT SHELL)                */}
        {/* ================================================================ */}
        {activeSection === "assessment" && (
          <ReviveAssessmentInterface
            learner={learner}
            onNavigateToCertificate={() => {
              markSectionCompleted("assessment");
              navigateToSection("certificate");
            }}
            onNavigateToVideos={() => navigateToSection("videos")}
          />
        )}

        {/* ================================================================ */}
        {/* TAB 4: CERTIFICATE PREVIEW (LOCKED)                              */}
        {/* ================================================================ */}
        {activeSection === "certificate" && (
          <div className="space-y-8 animate-fadeIn max-w-3xl mx-auto">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Step 4 of 4 • Verifiable Academic Certificate
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                    Module 7: REVIVE Completion Certificate
                  </h2>
                </div>
                {issuedCert ? (
                  <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1 text-xs font-bold flex items-center gap-1.5 w-fit">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Official Issued Credential
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1 text-xs font-bold flex items-center gap-1.5 w-fit">
                    <span>🔒</span> Locked Pending Assessment
                  </span>
                )}
              </div>

              {/* Certificate Canvas — Minimalist BMJ-Inspired Design (Single-Page A4 Proportion) */}
              <div className="relative rounded-2xl border border-slate-300 bg-[#fdfdfc] p-6 sm:p-10 text-center space-y-5 shadow-sm overflow-hidden text-slate-900 font-sans">
                {/* Subtle Inner Hairline Border (BMJ Style) */}
                <div className="absolute inset-2 sm:inset-3 border border-slate-200 pointer-events-none rounded-xl" />

                {/* Dedicated Central Watermark (MBBS Foundation Watermark ~5% opacity) */}
                <img
                  src="/MBBS%20Foundation%20watermark.png"
                  alt=""
                  aria-hidden="true"
                  className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-80 md:w-[380px] opacity-[0.05] pointer-events-none select-none object-contain z-0"
                />

                {/* ========================================================== */}
                {/* UPPER ~80%: MAIN MBBS FOUNDATION DIGITAL COMPLETION CERTIFICATE */}
                {/* ========================================================== */}

                {/* Symmetrical Three-Column Header Row */}
                <div className="relative z-10 flex items-center justify-between gap-4 pb-2 border-b border-slate-100 sm:border-0 sm:pb-0">
                  {/* LEFT: Official MBBS Foundation horizontal logo */}
                  <div className="shrink-0 w-32 sm:w-40 md:w-44 flex items-center justify-start">
                    <img
                      src="/MBBS%20Foundation%20Logo.png"
                      alt="MBBS Foundation"
                      className="w-full h-auto max-h-10 sm:max-h-12 object-contain"
                    />
                  </div>

                  {/* CENTRE: Institutional Branding (2 Lines) */}
                  <div className="text-center space-y-0.5 flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-slate-800">
                      MBBS FOUNDATION
                    </div>
                    <div className="text-[10px] sm:text-xs font-semibold tracking-[0.15em] uppercase text-slate-500">
                      ONLINE LEARNING PROGRAMME
                    </div>
                  </div>

                  {/* RIGHT: Combined IAP ALS–BLS Logo */}
                  <div className="shrink-0 w-24 sm:w-28 md:w-32 flex items-center justify-end">
                    <img
                      src="/IAP%20ALS%20BLS%20Logo.jpg"
                      alt="Indian Academy of Pediatrics & IAP ALS–BLS Group"
                      className="w-full h-auto max-h-10 sm:max-h-12 object-contain"
                    />
                  </div>
                </div>

                {/* Full-Width Centered Title (Below Header Row) */}
                <div className="relative z-10 text-center pt-2 sm:pt-3">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif font-black text-slate-950 tracking-tight">
                    Certificate of Module Completion
                  </h3>
                </div>

                {/* Recipient & Medical College */}
                <div className="py-1 space-y-1 relative z-10 max-w-xl mx-auto">
                  <p className="text-xs sm:text-sm text-slate-500 font-serif italic">
                    This is to certify that
                  </p>
                  <p className="text-2xl sm:text-3xl font-serif font-bold text-slate-950 tracking-normal border-b border-slate-200 pb-2">
                    {issuedCert?.learnerName || learner?.fullName || "Dr. / Med. Student (Verified Learner)"}
                  </p>
                  {/* Medical College immediately below learner's name */}
                  <p className="text-sm sm:text-base font-semibold text-slate-800 pt-1">
                    from {formatConciseMedicalCollegeName(issuedCert?.medicalCollege || learner?.institutionName || "Medical College")}
                  </p>
                  <p className="text-sm sm:text-base font-bold text-slate-900 pt-2.5">
                    has successfully completed Module 7 — REVIVE
                  </p>
                  <p className="text-base sm:text-lg font-bold text-teal-900 pt-0.5">
                    Cardiopulmonary Resuscitation (CPR) and Relief of Choking
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 font-serif italic pt-1.5 leading-relaxed">
                    through online educational presentations from the MBBS Foundation Series, instructional videos by the IAP ALS–BLS Group, and successful completion of the module&apos;s online knowledge assessment.
                  </p>
                </div>

                {/* Coloured Module Progress Strip (14 Modules Single Row) */}
                <div className="relative z-10 py-1">
                  <div className="flex items-center justify-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
                    {Array.from({ length: 14 }, (_, i) => i + 1).map((m) => {
                      const isCompletedRevive = m === 7;
                      const pastels = [
                        "bg-sky-50 border-sky-200 text-slate-500",
                        "bg-emerald-50/60 border-emerald-200 text-slate-500",
                        "bg-purple-50/70 border-purple-200 text-slate-500",
                        "bg-amber-50/70 border-amber-200 text-slate-500",
                      ];
                      const neutralStyle = pastels[(m - 1) % pastels.length];

                      if (isCompletedRevive) {
                        return (
                          <div
                            key={m}
                            className="flex items-center justify-center gap-0.5 w-6 sm:w-7 h-5 sm:h-6 rounded-md bg-emerald-100 border border-emerald-600 text-emerald-800 font-bold text-[10px] sm:text-xs shadow-2xs"
                            title="Module 7: REVIVE — Completed"
                          >
                            <span className="text-[9px] sm:text-[10px] leading-none">✓</span>
                            <span>7</span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={m}
                          className={`flex items-center justify-center w-6 sm:w-7 h-5 sm:h-6 rounded-md border font-medium text-[10px] sm:text-xs ${neutralStyle}`}
                          title={`Module ${m}`}
                        >
                          {m}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] sm:text-xs font-semibold text-teal-800/80 mt-1 tracking-tight">
                    Module 7 of 14 — REVIVE completed
                  </p>
                </div>

                {/* Approved Revised Disclaimer */}
                <div className="relative z-10 py-0.5">
                  <p className="text-xs text-slate-500 italic font-serif max-w-lg mx-auto">
                    &ldquo;This certificate recognizes completion of the REVIVE module&apos;s online learning and knowledge assessment.&rdquo;
                  </p>
                </div>

                {/* QR Code, Certificate ID & Institutional Attribution (Strictly ABOVE Endorsement Area) */}
                <div className="relative z-10 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-5 text-left">
                  {/* Left: QR Code & Unique ID */}
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs shrink-0">
                      <svg
                        className="w-14 h-14 sm:w-16 sm:h-16"
                        viewBox="0 0 29 29"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-label="Verification QR Code"
                      >
                        <rect width="29" height="29" fill="#ffffff" />
                        <path d="M0 0h7v7H0zM1 1v5h5V1zM2 2h3v3H2z" fill="#0f172a" />
                        <path d="M22 0h7v7h-7zM23 1v5h5V1zM24 2h3v3h-3z" fill="#0f172a" />
                        <path d="M0 22h7v7H0zM1 23v5h5v-5zM2 24h3v3H2z" fill="#0f172a" />
                        <path d="M8 6h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zm2 0h1v1h-1zm2 0h1v1h-1zm2 0h1v1h-1zm2 0h1v1h-1zM6 8h1v1H6zm0 2h1v1H6zm0 2h1v1H6zm0 2h1v1H6zm0 2h1v1H6zm0 2h1v1H6zm0 2h1v1H6z" fill="#0f172a" />
                        <path d="M18 18h5v5h-5zM19 19v3h3v-3zM20 20h1v1h-1z" fill="#0f172a" />
                        <path d="M9 1h2v1H9zm4 1h1v2h-1zm2 0h2v1h-2zm-6 2h1v1H9zm3 0h1v2h-1zm3 1h2v1h-2zm-7 3h2v1H8zm4 0h1v1h-1zm3 0h2v1h-2zm3 0h1v1h-1zm-9 2h2v1H9zm4 0h1v1h-1zm3 0h1v1h-1zm2 0h1v2h-1zm-8 2h1v2H10zm4 0h2v1h-2zm-5 2h2v1H9zm4 0h1v1h-1zm3 0h2v1h-2zm3 0h1v1h-1zm-8 2h1v1h-1zm4 0h2v1h-2zm-6 2h1v1H8zm4 0h1v1h-1zm3 0h2v1h-2zm-6 2h2v1H8zm3 0h1v1h-1zm3 0h1v1h-1zm2 0h1v1h-1zm-7 2h1v1H9zm3 0h2v1h-2zm4 0h2v1h-2z" fill="#0f172a" />
                      </svg>
                    </div>

                    <div className="space-y-0.5 text-xs">
                      <div className="font-mono text-[11px] font-bold text-slate-800 tracking-wider">
                        {issuedCert ? `ID: ${issuedCert.certificateId}` : "ID: MBBSF-REV-YYYY-XXXXXXXX"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {issuedCert ? "Official Cryptographic Credential" : "Sample Identifier Preview"}
                      </div>
                      <div className="text-[10px] text-teal-800 font-medium">
                        mbbsfoundation.com/verify
                      </div>
                    </div>
                  </div>

                  {/* Right: Institutional Attribution (Item 4: Above Endorsement Area) */}
                  <div className="text-center sm:text-right space-y-0.5">
                    <div className="text-xs sm:text-sm font-bold tracking-wider text-slate-950 uppercase">
                      MBBS FOUNDATION
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-600 font-medium">
                      An initiative of Ayurvigyan Health Academy India Foundation
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-700 font-semibold">
                      In association with the IAP ALS–BLS Group
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Official Electronic Credential &bull; Cryptographically Verifiable
                    </div>
                  </div>
                </div>

                {/* ========================================================== */}
                {/* LOWER ~20%: INSTITUTIONAL CPR AWARENESS PRACTICE SESSION */}
                {/* ========================================================== */}
                <div className="relative z-10 rounded-xl border border-slate-300 bg-slate-50/70 p-4 sm:p-5 text-left space-y-3">
                  <div className="border-b border-slate-200 pb-2 text-center">
                    <span className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-900 uppercase">
                      INSTITUTIONAL CPR AWARENESS PRACTICE SESSION
                    </span>
                  </div>

                  <p className="text-[11px] sm:text-xs text-slate-600 font-serif italic text-center leading-relaxed">
                    This section may be completed by trained and authorized medical college faculty following a supervised hands-on CPR Awareness Session.
                  </p>

                  {/* Endorsement Fields Grid */}
                  <div className="space-y-3 pt-1 text-xs">
                    {/* Row 1 — Two Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                      <div className="space-y-1">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 block">
                          Student Enrollment No.:
                        </span>
                        <div className="h-6 border-b border-dashed border-slate-400" />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 block">
                          Supervising Faculty Name &amp; Designation:
                        </span>
                        <div className="h-6 border-b border-dashed border-slate-400" />
                      </div>
                    </div>

                    {/* Row 2 — Three Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                      <div className="sm:col-span-4 space-y-1">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 block">
                          Hands-on Session Date:
                        </span>
                        <div className="h-6 flex items-end text-slate-400 text-xs border-b border-dashed border-slate-400 pb-0.5">
                          DD / MM / 202___
                        </div>
                      </div>

                      <div className="sm:col-span-5 space-y-1">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 block">
                          Faculty Signature:
                        </span>
                        <div className="h-6 border-b border-dashed border-slate-400" />
                      </div>

                      <div className="sm:col-span-3 space-y-1">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 block text-center">
                          INSTITUTIONAL STAMP
                        </span>
                        <div className="border border-slate-300 rounded-lg h-9 bg-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Area: Live Issued vs. Locked Preview */}
              {issuedCert ? (
                <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-left text-xs text-emerald-900 leading-relaxed">
                      <strong className="font-bold block text-sm text-emerald-950">
                        🎓 Official Credential Issued
                      </strong>
                      Your certificate is permanently registered in the MBBS Foundation database.
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                      <a
                        href="/api/mbbs-foundation/learn/certificate/revive/pdf?download=1"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold px-4 py-2.5 text-xs shadow-xs transition"
                      >
                        <span>Download PDF (A4 Landscape)</span>
                        <span>&darr;</span>
                      </a>
                      <Link
                        href={`/mbbs-foundation/learn/verify/${issuedCert.certificateId}`}
                        target="_blank"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-900 font-semibold px-3 py-2.5 text-xs transition"
                      >
                        <span>Public Verification</span>
                        <span>&nearr;</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-left leading-relaxed">
                    <strong className="font-bold block text-sm text-amber-950">
                      Assessment Required for Official Certificate
                    </strong>
                    Achieve at least 70% (14/20) on Section 3: Assessment to activate permanent issuance and download your official credential.
                  </div>
                  <button
                    onClick={() => navigateToSection("assessment")}
                    className="shrink-0 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold px-4 py-2 text-xs transition shadow-2xs"
                  >
                    Take Assessment &rarr;
                  </button>
                </div>
              )}
            </div>

            {/* Back to Assessment */}
            <div className="text-center pt-2">
              <button
                onClick={() => navigateToSection("assessment")}
                className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition underline underline-offset-4"
              >
                &larr; Back to 3. Assessment
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* WELCOMING REGISTRATION INVITATION MODAL (Refined Sizing & Typography)*/}
        {/* ==================================================================== */}
        {showGuestInvite && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-invite-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 lg:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-fadeIn"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowGuestInvite(false);
              }
            }}
          >
            {/* Modal Container: 30-40% wider on desktop (max-w-2xl / max-w-[720px]) */}
            <div className="relative w-full max-w-2xl lg:max-w-[720px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white px-6 sm:px-8 py-5 sm:py-6 relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowGuestInvite(false)}
                  className="absolute top-4 right-4 sm:top-5 sm:right-5 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center text-base sm:text-lg transition"
                  aria-label="Close dialog"
                >
                  ✕
                </button>

                <span className="rounded-full bg-teal-400/20 text-teal-300 border border-teal-400/30 px-3 py-1 text-xs font-black uppercase tracking-wider inline-block">
                  Free Learner Registration
                </span>

                {/* Heading: Increased by 50-70% */}
                <h2
                  id="guest-invite-title"
                  className="text-xl sm:text-2xl lg:text-[27px] font-black text-white mt-2.5 sm:mt-3 leading-snug"
                >
                  You&apos;ve taken the first step. Continue learning to save lives.
                </h2>

                {/* Description: Increased by 60-80% */}
                <p className="text-sm sm:text-base text-slate-200 mt-2 leading-relaxed">
                  You&apos;ve explored the first 20 slides of REVIVE. Free registration unlocks the complete 53 slides, videos, reading compendium, and upcoming certification.
                </p>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-7 space-y-4 overflow-y-auto flex-1">
                {/* 5-Step Learning Pathway Chips (Enlarged labels and readability) */}
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-teal-50 border border-teal-200">
                    <span className="font-extrabold text-teal-950 text-xs sm:text-sm block">Slides</span>
                    <span className="text-[11px] sm:text-xs text-teal-700 font-semibold block mt-0.5">1–53</span>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-teal-50 border border-teal-200">
                    <span className="font-extrabold text-teal-950 text-xs sm:text-sm block">Videos</span>
                    <span className="text-[11px] sm:text-xs text-teal-700 font-semibold block mt-0.5">Demos</span>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-teal-50 border border-teal-200">
                    <span className="font-extrabold text-teal-950 text-xs sm:text-sm block">Reading</span>
                    <span className="text-[11px] sm:text-xs text-teal-700 font-semibold block mt-0.5">Ch. 53</span>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-dashed border-amber-300">
                    <span className="font-extrabold text-amber-950 text-xs sm:text-sm block">Exam</span>
                    <span className="text-[11px] sm:text-xs text-amber-700 font-semibold block mt-0.5">Soon</span>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-dashed border-amber-300">
                    <span className="font-extrabold text-amber-950 text-xs sm:text-sm block">Certificate</span>
                    <span className="text-[11px] sm:text-xs text-amber-700 font-semibold block mt-0.5">Soon</span>
                  </div>
                </div>

                {/* Sample Certificate Preview (Enlarged Proportionally, Labeled SAMPLE) */}
                <div className="relative rounded-2xl border-2 border-dashed border-amber-400 bg-gradient-to-r from-amber-50/70 via-white to-teal-50/40 p-3.5 sm:p-4 text-center overflow-hidden shadow-xs">
                  <div className="absolute -right-9 top-4 rotate-45 bg-red-600 text-white font-black text-[9px] sm:text-[10px] tracking-wider uppercase py-0.5 px-10 select-none pointer-events-none shadow-xs">
                    SAMPLE
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    MBBS Foundation &bull; Certificate Preview
                  </div>
                  <div className="text-sm sm:text-base font-serif font-black text-slate-900 mt-0.5">
                    Certificate of Module Completion
                  </div>
                  <div className="text-xs sm:text-sm text-teal-900 font-bold mt-0.5">
                    Module 7: REVIVE &bull; Resuscitation Principles &amp; Emergency CPR
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-400 mt-1 font-mono">
                    SAMPLE PREVIEW ONLY &bull; NO CERTIFICATE ID ISSUED
                  </div>
                </div>

                {/* Free Registration Assurance */}
                <p className="text-xs sm:text-sm text-slate-600 text-center font-medium">
                  ✓ Free registration for medical students &amp; doctors. No fee or payment card required.
                </p>

                {/* Actions */}
                <div className="space-y-2.5 pt-1">
                  <Link
                    href={`/mbbs-foundation/learn/register?redirect=${encodeURIComponent(
                      "/mbbs-foundation/learn/modules/revive?section=slides&slide=21"
                    )}`}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-black px-6 py-3.5 sm:py-4 text-base sm:text-lg shadow-md hover:shadow-lg transition"
                  >
                    <span>Continue Learning — Register Free</span>
                    <span>&rarr;</span>
                  </Link>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                    <Link
                      href={`/mbbs-foundation/learn/register?redirect=${encodeURIComponent(
                        "/mbbs-foundation/learn/modules/revive?section=slides&slide=21"
                      )}`}
                      className="font-bold text-teal-800 hover:text-teal-900 underline underline-offset-4 text-sm sm:text-base"
                    >
                      Already Registered? Sign In &rarr;
                    </Link>

                    <button
                      type="button"
                      onClick={() => setShowGuestInvite(false)}
                      className="text-xs sm:text-sm text-slate-500 hover:text-slate-800 font-semibold transition"
                    >
                      &larr; Dismiss &amp; Review Slides 1–20
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ------------------------------------------------------------------ */}
      {/* 4. FOOTER (Clinical Disclaimer Removed from REVIVE View)          */}
      {/* ------------------------------------------------------------------ */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500 mt-auto">
        <div className="mx-auto max-w-4xl space-y-1.5">
          <p className="font-semibold text-slate-700 text-xs sm:text-sm">
            MBBS Foundation &bull; Ayurvigyan Health Academy India Foundation
          </p>
          <p className="text-xs text-slate-400">
            Based on &ldquo;{REVIVE_MODULE_META.bookTitle}&rdquo; by {REVIVE_MODULE_META.author}.
          </p>
        </div>
      </footer>
    </div>
  );
}

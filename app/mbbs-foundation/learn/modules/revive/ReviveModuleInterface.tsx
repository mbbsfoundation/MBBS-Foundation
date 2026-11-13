"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  REVIVE_MODULE_META,
  REVIVE_VIDEOS,
} from "@/lib/mbbs-foundation/reviveModuleData";
import RevivePdfSlideViewer from "./RevivePdfSlideViewer";
import ReviveAssessmentInterface from "./ReviveAssessmentInterface";
import ShareReviveControl from "./ShareReviveControl";
import { formatConciseMedicalCollegeName } from "@/lib/mbbs-foundation/collegeFormat";
import { QrCode } from "@/lib/mbbs-foundation/qr";

type SectionTab = "slides" | "videos" | "assessment" | "certificate";

interface LearnerProfile {
  id: string;
  fullName: string;
  email: string;
  mobileNumber?: string;
  learnerCategory?: string;
  institutionName?: string;
}

interface IssuedCertificateState {
  certificateId: string;
  learnerName: string;
  medicalCollege: string;
  moduleTitle?: string;
  issuedAt?: string;
  score?: number;
  percentage?: number;
  disclaimer?: string;
}

const STORAGE_KEY = "mbbsf_revive_progress_v2";

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
    ["slides", "videos", "assessment", "certificate"].includes(requestedSection)
      ? requestedSection
      : "slides";
  const [activeSection, setActiveSection] = useState<SectionTab>(defaultSection);

  // Authentication state
  const [authLoading, setAuthLoading] = useState(true);
  const [learner, setLearner] = useState<LearnerProfile | null>(null);
  const [issuedCert, setIssuedCert] = useState<IssuedCertificateState | null>(null);

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

  // Progress tracking state (REVIVE has exactly 4 sequential steps)
  const [completedSections, setCompletedSections] = useState<{
    slides: boolean;
    videos: boolean;
    assessment: boolean;
  }>({
    slides: false,
    videos: false,
    assessment: false,
  });

  // Fetch live certificate status helper
  const fetchCertificate = useCallback(async () => {
    try {
      const certRes = await fetch("/api/mbbs-foundation/learn/certificate/revive", {
        headers: { "Cache-Control": "no-cache" },
      });
      if (certRes.ok) {
        const certData = await certRes.json();
        if (certData.success && certData.hasCertificate && certData.certificate) {
          setIssuedCert(certData.certificate);
          setCompletedSections((prev) => ({
            ...prev,
            slides: true,
            videos: true,
            assessment: true,
          }));
          return certData.certificate;
        }
      }
    } catch (err) {
      console.warn("Certificate fetch error:", err);
    }
    return null;
  }, []);

  // 1. Fetch authenticated learner session & existing certificate
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
            await fetchCertificate();
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
  }, [fetchCertificate]);

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
    (sectionKey: "slides" | "videos" | "assessment") => {
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
    if (tab === "certificate") {
      fetchCertificate();
    }
    const params = new URLSearchParams(window.location.search);
    params.set("section", tab);
    router.replace(`/mbbs-foundation/learn/modules/revive?${params.toString()}`, {
      scroll: false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Precompute dynamic QR code SVG for issued certificate
  const verificationUrl = issuedCert?.certificateId
    ? `https://mbbsfoundation.com/mbbs-foundation/learn/verify/${issuedCert.certificateId}`
    : "";
  let qrSvg = "";
  if (verificationUrl) {
    try {
      const qr = QrCode.encodeText(verificationUrl, "M");
      qrSvg = qr.toSvg(2);
    } catch (err) {
      console.error("Failed to generate QR code SVG:", err);
    }
  }

  const issuedDateFormatted = issuedCert?.issuedAt
    ? new Date(issuedCert.issuedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

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
                href="/mbbs-foundation/learn"
                className="text-slate-600 hover:text-slate-900 transition font-medium"
              >
                Online Learning Programme
              </Link>
              <span>/</span>
              <span className="font-bold text-slate-900">Module 7: REVIVE</span>
            </nav>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">
                REVIVE
              </h1>
              <ShareReviveControl />
              <p className="w-full sm:w-auto text-sm sm:text-base text-slate-600 font-medium">
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
                    setIssuedCert(null);
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
                <span>Sign In / Register</span>
                <span>&rarr;</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 2. SEQUENTIAL LEARNING PATHWAY NAVIGATION BAR (4 STEPS)             */}
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
                    : issuedCert
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-300"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                <span>4. Certificate</span>
                {issuedCert && <span className="text-xs text-emerald-700 ml-1 font-extrabold">✓</span>}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* 3. MAIN CONTENT DISPLAY (TAB SWITCHED)                             */}
      {/* ------------------------------------------------------------------ */}
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-6">

        {/* ================================================================ */}
        {/* TAB 1: PRESENTATION SLIDES                                       */}
        {/* ================================================================ */}
        {activeSection === "slides" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Slide Viewer Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-teal-700">
                  Step 1 of 4 • Interactive Slide Deck
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  53-Slide Resuscitation Courseware
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-slate-500">
                  {learner ? "Complete Module (53 Slides)" : "Guest Preview (20 Slides)"}
                </span>
                {learner && (
                  <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-bold">
                    Full Access Unlocked
                  </span>
                )}
              </div>
            </div>

            {/* Render Slide Viewer based on Authentication */}
            {authLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="h-9 w-9 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-semibold text-slate-600">
                  Checking learner session...
                </p>
              </div>
            ) : learner ? (
              /* Authenticated Learner: Full 53 Slides */
              <div className="space-y-4">
                <RevivePdfSlideViewer
                  pdfUrl={REVIVE_MODULE_META.presentationPdfUrl}
                  maxAllowedSlides={53}
                  initialSlide={initialSlideNumber}
                  isGuestPreview={false}
                />

                {/* Bottom Transition Action */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <span className="text-xs sm:text-sm text-slate-500 font-medium">
                    Reviewed the presentation slides?
                  </span>
                  <button
                    onClick={() => {
                      markSectionCompleted("slides");
                      navigateToSection("videos");
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-3 text-xs sm:text-sm shadow-xs transition"
                  >
                    <span>Proceed to 2. Videos &rarr;</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Guest Learner: 20-Slide Preview */
              <div className="space-y-4">
                <RevivePdfSlideViewer
                  pdfUrl={REVIVE_MODULE_META.previewPdfUrl}
                  maxAllowedSlides={20}
                  initialSlide={1}
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
                    Sign In / Register to Unlock All 53 Slides &rarr;
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
                Step 2 of 4 • Instructional Demonstrations
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                Resuscitation Demonstrations
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
              /* Unauthenticated Guest Invitation */
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm text-center max-w-2xl mx-auto space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs font-black uppercase tracking-wider">
                  <span>🔒</span>
                  <span>Learner Registration Required</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Sign In to Watch Resuscitation Videos
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
                    Clinical video demonstrations are accessible for registered medical students and healthcare professionals. Sign in or create an account to unlock the 3-video sequence and continue learning.
                  </p>
                </div>

                {/* 3-Video Sequence Overview */}
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
                    <span>Sign In / Register to Watch Videos</span>
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
                  </div>
                </div>
              </div>
            ) : (
              /* Authenticated Learner Video Player */
              <div className="space-y-6">
                {(() => {
                  const currentVideo = REVIVE_VIDEOS[currentVideoIndex];
                  return (
                    <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                      <div className="relative aspect-video w-full bg-slate-950">
                        <iframe
                          key={currentVideo.youtubeId}
                          src={`https://www.youtube-nocookie.com/embed/${currentVideo.youtubeId}?rel=0&modestbranding=1&playsinline=1`}
                          title={currentVideo.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 h-full w-full border-0"
                        />
                      </div>

                      <div className="p-5 sm:p-7 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-teal-100 text-teal-950 border border-teal-200">
                            Video {currentVideo.id} of {REVIVE_VIDEOS.length}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                            {currentVideo.title}
                          </h3>
                        </div>

                        {/* Video Stepper Action */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setCurrentVideoIndex((prev) => Math.max(0, prev - 1))}
                            disabled={currentVideoIndex === 0}
                            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition"
                          >
                            &larr; Previous Video
                          </button>

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
                                navigateToSection("assessment");
                              }}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-md transition"
                            >
                              <span>Proceed to 3. Assessment &rarr;</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Playlist Below Player */}
                <div className="space-y-2">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-500 px-1">
                    Complete Demonstration Sequence (3 Videos)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {REVIVE_VIDEOS.map((v, idx) => {
                      const isActive = idx === currentVideoIndex;
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
        {/* TAB 3: MCQ ASSESSMENT                                            */}
        {/* ================================================================ */}
        {activeSection === "assessment" && (
          <ReviveAssessmentInterface
            learner={learner}
            onNavigateToCertificate={(certData) => {
              markSectionCompleted("assessment");
              if (certData && certData.certificateId) {
                setIssuedCert((prev) => ({ ...(prev || {}), ...certData }));
              }
              fetchCertificate();
              navigateToSection("certificate");
            }}
            onNavigateToVideos={() => navigateToSection("videos")}
          />
        )}

        {/* ================================================================ */}
        {/* TAB 4: CERTIFICATE (PHASE 7F DESIGN / LOCKED STATE)               */}
        {/* ================================================================ */}
        {activeSection === "certificate" && (
          <div className="space-y-8 animate-fadeIn max-w-3xl mx-auto">
            {issuedCert ? (
              /* -------------------------------------------------------- */
              /* EARNED STATE: OFFICIAL PHASE 7F VERIFIABLE CERTIFICATE   */
              /* -------------------------------------------------------- */
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
                  <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1 text-xs font-bold flex items-center gap-1.5 w-fit">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Official Issued Credential
                  </span>
                </div>

                {/* Certificate Canvas — Approved Phase 7F Design (Single-Page A4 Proportion) */}
                <div className="relative rounded-2xl border border-slate-300 bg-[#fdfdfc] p-6 sm:p-10 text-center space-y-5 shadow-sm overflow-hidden text-slate-900 font-sans">
                  {/* Subtle Inner Hairline Border */}
                  <div className="absolute inset-2 sm:inset-3 border border-slate-200 pointer-events-none rounded-xl" />

                  {/* Dedicated Central Watermark (MBBS Foundation Watermark ~5% opacity) */}
                  <img
                    src="/MBBS%20Foundation%20watermark.png"
                    alt=""
                    aria-hidden="true"
                    className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-80 md:w-[380px] opacity-[0.05] pointer-events-none select-none object-contain z-0"
                  />

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

                  {/* Full-Width Centered Title */}
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
                      {issuedCert.learnerName}
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-slate-800 pt-1">
                      from {formatConciseMedicalCollegeName(issuedCert.medicalCollege)}
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

                  {/* QR Code, Certificate ID & Institutional Attribution */}
                  <div className="relative z-10 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-5 text-left">
                    {/* Left: Dynamic QR Code & Unique ID */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-14 h-14 sm:w-16 sm:h-16 p-1 bg-white border border-slate-200 rounded-lg shadow-2xs shrink-0 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                        dangerouslySetInnerHTML={{ __html: qrSvg }}
                        aria-label={`Verification QR code for ${issuedCert.certificateId}`}
                      />

                      <div className="space-y-0.5 text-xs text-left">
                        <div className="font-mono text-[11px] sm:text-xs font-bold text-slate-800 tracking-wider">
                          ID: {issuedCert.certificateId}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Issued: {issuedDateFormatted}
                        </div>
                        <div className="text-[10px] text-teal-800 font-semibold">
                          Cryptographically Verified
                        </div>
                      </div>
                    </div>

                    {/* Right: Institutional Attribution */}
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

                  {/* LOWER ~20%: INSTITUTIONAL CPR AWARENESS PRACTICE SESSION */}
                  <div className="relative z-10 rounded-xl border border-slate-300 bg-slate-50/70 p-4 sm:p-5 text-left space-y-3">
                    <div className="border-b border-slate-200 pb-2 text-center">
                      <span className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-900 uppercase">
                        INSTITUTIONAL CPR AWARENESS PRACTICE SESSION
                      </span>
                    </div>

                    <p className="text-[11px] sm:text-xs text-slate-600 leading-snug">
                      This section may be completed by trained and authorized medical college faculty following a supervised hands-on CPR Awareness Session.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-1 text-[11px] sm:text-xs text-slate-800">
                      <div>
                        <div className="font-medium text-slate-600">Student Enrollment No.:</div>
                        <div className="border-b border-slate-400 mt-2 min-h-[16px]" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-600">Supervising Faculty Name &amp; Designation:</div>
                        <div className="border-b border-slate-400 mt-2 min-h-[16px]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] sm:text-xs text-slate-800 items-end">
                      <div>
                        <div className="font-medium text-slate-600">Hands-on Session Date:</div>
                        <div className="mt-1 font-mono text-slate-700">DD / MM / 202___</div>
                      </div>
                      <div>
                        <div className="font-medium text-slate-600">Faculty Signature:</div>
                        <div className="border-b border-slate-400 mt-2 min-h-[16px]" />
                      </div>
                      <div className="flex justify-start sm:justify-end">
                        <div className="border border-slate-400 border-dashed rounded p-2 text-center text-[10px] text-slate-500 w-28 h-14 flex items-center justify-center">
                          INSTITUTIONAL STAMP
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Area: Download PDF & Verification Link */}
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
              </div>
            ) : (
              /* -------------------------------------------------------- */
              /* LOCKED / NOT-YET-EARNED STATE (NO SAMPLE ID, NO FAKE QR)  */
              /* -------------------------------------------------------- */
              <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 text-center space-y-6 shadow-sm">
                <div className="h-16 w-16 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto text-2xl font-bold">
                  🔒
                </div>
                <div className="space-y-2 max-w-lg mx-auto">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                    Module 7: REVIVE • Final Credential
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Certificate Locked Pending Assessment
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Complete Module 7: REVIVE and achieve a passing score of at least 70% (14 / 20) on the knowledge assessment to earn your official, cryptographically verifiable digital certificate with optional institutional CPR practice endorsement.
                  </p>
                </div>

                {/* Completion Requirements Checklist */}
                <div className="max-w-md mx-auto rounded-2xl bg-slate-50 border border-slate-200 p-5 text-left text-xs sm:text-sm space-y-3">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-xs">
                    Completion Requirements
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700">1. Educational Slides (53 Slides)</span>
                      <span className={completedSections.slides ? "text-emerald-700 font-bold" : "text-slate-400"}>
                        {completedSections.slides ? "✓ Completed" : "Pending"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700">2. Instructional Videos (3 Videos)</span>
                      <span className={completedSections.videos ? "text-emerald-700 font-bold" : "text-slate-400"}>
                        {completedSections.videos ? "✓ Completed" : "Pending"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700">3. Assessment Score &ge; 70% (14 / 20)</span>
                      <span className={completedSections.assessment ? "text-emerald-700 font-bold" : "text-slate-400"}>
                        {completedSections.assessment ? "✓ Passed" : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => navigateToSection("assessment")}
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-3 text-sm shadow-xs transition"
                  >
                    <span>Take Assessment &rarr;</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* REGISTRATION INVITATION MODAL (GUEST PREVIEW)                        */}
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
            <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
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
                  Learner Registration
                </span>

                <h2
                  id="guest-invite-title"
                  className="text-xl sm:text-2xl font-black text-white mt-2.5 sm:mt-3 leading-snug"
                >
                  Continue Learning Module 7: REVIVE
                </h2>

                <p className="text-sm text-slate-200 mt-2 leading-relaxed">
                  You&apos;ve explored the first 20 slides of REVIVE. Registration unlocks all 53 slides, 3 instructional videos, online assessment, and verifiable certification.
                </p>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-7 space-y-5 overflow-y-auto flex-1">
                {/* 3-Step Pathway Chips */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
                    <span className="font-extrabold text-teal-950 text-xs sm:text-sm block">1. Slides</span>
                    <span className="text-[11px] sm:text-xs text-teal-700 font-semibold block mt-0.5">All 53 Slides</span>
                  </div>
                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
                    <span className="font-extrabold text-teal-950 text-xs sm:text-sm block">2. Videos</span>
                    <span className="text-[11px] sm:text-xs text-teal-700 font-semibold block mt-0.5">3 Demonstrations</span>
                  </div>
                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
                    <span className="font-extrabold text-teal-950 text-xs sm:text-sm block">3. Assessment</span>
                    <span className="text-[11px] sm:text-xs text-teal-700 font-semibold block mt-0.5">&amp; Certificate</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2.5 pt-2">
                  <Link
                    href={`/mbbs-foundation/learn/register?redirect=${encodeURIComponent(
                      "/mbbs-foundation/learn/modules/revive?section=slides&slide=21"
                    )}`}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-black px-6 py-3.5 text-base shadow-md hover:shadow-lg transition"
                  >
                    <span>Continue Learning — Register</span>
                    <span>&rarr;</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setShowGuestInvite(false)}
                    className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-800 font-medium transition"
                  >
                    Stay on slide preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

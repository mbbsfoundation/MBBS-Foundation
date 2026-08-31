"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export interface BookEngagementPromptProps {
  hasMeaningfulExploration: boolean;
  delayMs?: number; // default: 50000ms (50s, within 45–60s requirement)
}

const STORAGE_KEY = "mbbs_foundation_book_prompt_dismissed";
const DEFAULT_DELAY_MS = 50000; // 50 seconds

export default function BookEngagementPrompt({
  hasMeaningfulExploration,
  delayMs = DEFAULT_DELAY_MS,
}: BookEngagementPromptProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasDismissed, setHasDismissed] = useState<boolean>(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check sessionStorage once on client mount
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (dismissed === "true") {
        setHasDismissed(true);
      } else {
        setHasDismissed(false);
      }
    } catch {
      // In restricted contexts, default to not dismissed
      setHasDismissed(false);
    }
  }, []);

  // Dismiss handler: closes prompt and persists dismissal in sessionStorage for the session
  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    setHasDismissed(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Start the 45-60s discovery delay ONLY AFTER meaningful exploration has occurred
  useEffect(() => {
    // If already dismissed for this session, or no meaningful exploration yet, or already open
    if (hasDismissed || !hasMeaningfulExploration || isOpen) {
      return;
    }

    // Start timer strictly after meaningful exploration
    timerRef.current = setTimeout(() => {
      // Double check sessionStorage in case another tab or action dismissed it
      try {
        if (sessionStorage.getItem(STORAGE_KEY) === "true") {
          setHasDismissed(true);
          return;
        }
      } catch {}

      setIsOpen(true);
    }, delayMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [hasMeaningfulExploration, hasDismissed, isOpen, delayMs]);

  // Keyboard accessibility: Escape key dismisses the prompt
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleDismiss]);

  if (!isOpen || hasDismissed) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-prompt-title"
      aria-describedby="book-prompt-desc"
      onClick={(e) => {
        // Backdrop click dismisses
        if (e.target === e.currentTarget) {
          handleDismiss();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-300 overflow-y-auto"
    >
      <div
        className="relative w-full max-w-2xl sm:max-w-3xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200/90 animate-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 h-9 w-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-slate-300"
          aria-label="Dismiss book prompt"
        >
          ✕
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
          {/* LEFT: Large Prominent Book Cover (35-40% of area on desktop) */}
          <div className="md:col-span-5 flex justify-center">
            <div className="relative w-40 sm:w-48 md:w-full max-w-[230px] aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border border-slate-200/80 bg-slate-100 ring-1 ring-black/5">
              <Image
                src="/preview/01_Cover_Front.png"
                alt="MBBS Foundation: Your First Book of Medicine Book Cover"
                fill
                sizes="(max-width: 768px) 180px, 240px"
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* RIGHT: Content Hierarchy */}
          <div className="md:col-span-7 space-y-4 text-left">
            {/* Eyebrow / Context Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/90 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-blue-900">
              <span>📖</span>
              <span>Planning Your Medical College?</span>
            </div>

            {/* Headline */}
            <div className="space-y-1">
              <h2
                id="book-prompt-title"
                className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight"
              >
                Prepare for What Comes Next.
              </h2>
              <p className="text-sm sm:text-base font-extrabold text-blue-900 leading-snug">
                MBBS Foundation: Your First Book of Medicine
              </p>
            </div>

            {/* Supporting Text */}
            <p
              id="book-prompt-desc"
              className="text-xs sm:text-sm text-slate-600 leading-relaxed"
            >
              From counselling to your first days in medical college — explore the Foundation Course, AETCOM, CPR, clinical orientation, essential skills and the hidden curriculum.
            </p>

            {/* Actions: Primary CTA + Secondary Not Now */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/book"
                onClick={handleDismiss}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-900 hover:bg-blue-950 text-white px-5 py-3 text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all"
              >
                <span>Explore the Book</span>
                <span aria-hidden="true">→</span>
              </Link>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

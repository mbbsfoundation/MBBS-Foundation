"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface BookEngagementPromptProps {
  engagementCount: number;
  isIdle?: boolean;
}

const STORAGE_KEY = "mbbs_foundation_book_prompt_dismissed";

export default function BookEngagementPrompt({
  engagementCount,
  isIdle = true,
}: BookEngagementPromptProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasDismissed, setHasDismissed] = useState<boolean>(true);

  // Check sessionStorage on mount
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        setHasDismissed(false);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  // Trigger prompt when engagement count reaches threshold and UI is idle
  useEffect(() => {
    if (!hasDismissed && engagementCount >= 2 && isIdle) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [engagementCount, hasDismissed, isIdle]);

  const handleDismiss = () => {
    setIsOpen(false);
    setHasDismissed(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore
    }
  };

  if (!isOpen || hasDismissed) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-prompt-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center transition"
          aria-label="Dismiss book prompt"
        >
          ✕
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-900">
            <span>📖</span>
            <span>Transition to Medicine</span>
          </span>
        </div>

        {/* Content with Thumbnail */}
        <div className="flex gap-4 items-start">
          <div className="relative shrink-0 w-20 aspect-[3/4] rounded-lg overflow-hidden shadow-sm border border-slate-200 bg-slate-50">
            <Image
              src="/preview/01_Cover_Front.png"
              alt="MBBS Foundation Book Cover"
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>

          <div className="space-y-1.5 flex-1">
            <h3 id="book-prompt-title" className="text-base font-black text-slate-900 leading-snug">
              Planning beyond counselling?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Have you explored <strong>MBBS Foundation: Your First Book of Medicine</strong>? Prepare for the transition
              from NEET to your first year of MBBS.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2 justify-end border-t border-slate-100 text-xs">
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-xl px-3.5 py-2 font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Not Now
          </button>
          <Link
            href="/book"
            onClick={handleDismiss}
            className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white shadow-xs hover:bg-slate-800 transition inline-flex items-center gap-1"
          >
            <span>Explore the Book</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

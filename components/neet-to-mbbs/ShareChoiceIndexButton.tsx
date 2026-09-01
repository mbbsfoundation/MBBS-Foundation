"use client";

import React, { useState } from "react";

interface ShareChoiceIndexButtonProps {
  title?: string;
  text?: string;
  canonicalUrl?: string;
  className?: string;
  variant?: "primary" | "secondary";
}

export default function ShareChoiceIndexButton({
  title = "NEET Choice Index 2026 vs NIRF",
  text = "Do NEET allotment patterns agree with NIRF medical rankings? See where India's leading medical colleges stand in the NEET Choice Index 2026.",
  canonicalUrl = "https://mbbsfoundation.com/neet-to-mbbs/counselling/neet-choice-index-2026",
  className = "",
  variant = "primary",
}: ShareChoiceIndexButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  const handleShare = async () => {
    // 1. Try Web Share API on supported devices
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          text,
          url: canonicalUrl,
        });
        return;
      } catch (err: unknown) {
        // If the user cancelled the share sheet, exit gracefully with no error
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
      }
    }

    // 2. Desktop / Clipboard fallback
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(canonicalUrl);
        setStatus("copied");
        setTimeout(() => setStatus("idle"), 2500);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = canonicalUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setStatus("copied");
        setTimeout(() => setStatus("idle"), 2500);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
    }
  };

  const isPrimary = variant === "primary";

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Share This Analysis"
      className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl border transition-all cursor-pointer select-none focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        status === "copied"
          ? "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm"
          : status === "error"
          ? "border-rose-300 bg-rose-50 text-rose-800"
          : isPrimary
          ? "border-blue-700 bg-blue-700 hover:bg-blue-800 text-white shadow-sm hover:shadow-md active:scale-[0.98]"
          : "border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-2xs hover:border-slate-400 active:scale-[0.98]"
      } ${className}`}
    >
      {status === "copied" ? (
        <>
          <svg
            className="w-4 h-4 text-emerald-600 shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Link copied ✓</span>
        </>
      ) : status === "error" ? (
        <span>Unable to copy link</span>
      ) : (
        <>
          <svg
            className={`w-4 h-4 shrink-0 ${isPrimary ? "text-blue-100" : "text-slate-600"}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>Share This Analysis</span>
        </>
      )}
    </button>
  );
}

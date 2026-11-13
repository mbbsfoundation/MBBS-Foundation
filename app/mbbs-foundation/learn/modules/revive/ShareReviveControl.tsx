"use client";

import React, { useState, useEffect, useRef } from "react";

const REVIVE_PUBLIC_URL = "https://mbbsfoundation.com/mbbs-foundation/learn/modules/revive";
const SHARE_TITLE = "REVIVE | CPR & Choking Relief — MBBS Foundation";
const SHARE_DESCRIPTION =
  "Explore REVIVE, Module 7 of the MBBS Foundation Online Learning Programme. Learn CPR and choking relief through educational slides, instructional videos and an online assessment, with a verifiable Module Completion Certificate.";

// Formatted specifically for WhatsApp with single-asterisk bold syntax
const WHATSAPP_SHARE_MESSAGE = `*REVIVE* | CPR & Choking Relief — *MBBS Foundation*

Explore *REVIVE*, Module 7 of the *MBBS Foundation* Online Learning Programme. Learn *CPR and choking relief* through educational slides, instructional videos and an online assessment, with a verifiable *Module Completion Certificate*.

${REVIVE_PUBLIC_URL}`;

export default function ShareReviveControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true);
    }
  }, []);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Copy link handler
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(REVIVE_PUBLIC_URL);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = REVIVE_PUBLIC_URL;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn("Failed to copy link:", err);
    }
  };

  // Native share handler
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: SHARE_TITLE,
          text: SHARE_DESCRIPTION,
          url: REVIVE_PUBLIC_URL,
        });
        setIsOpen(false);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        // Fallback to menu if native share errors
        setIsOpen(true);
      }
    }
  };

  // Main button trigger
  const handleTriggerClick = () => {
    const isMobile =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 || navigator.maxTouchPoints > 0);

    // On supported mobile devices, prefer native Web Share API
    if (isMobile && canNativeShare) {
      handleNativeShare();
    } else {
      setIsOpen((prev) => !prev);
    }
  };

  // Social destination URLs
  const shareUrls = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(
      WHATSAPP_SHARE_MESSAGE
    )}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      SHARE_DESCRIPTION
    )}&url=${encodeURIComponent(REVIVE_PUBLIC_URL)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      REVIVE_PUBLIC_URL
    )}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      REVIVE_PUBLIC_URL
    )}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(
      REVIVE_PUBLIC_URL
    )}&text=${encodeURIComponent(SHARE_DESCRIPTION)}`,
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Compact Share REVIVE Control Button */}
      <button
        type="button"
        onClick={handleTriggerClick}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Share REVIVE module"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 text-xs sm:text-sm font-bold transition shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-teal-600 focus:ring-offset-1"
      >
        {/* Share Icon */}
        <svg
          className="w-3.5 h-3.5 text-teal-700 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        <span>Share REVIVE</span>
        {/* Small arrow indicator */}
        <svg
          className={`w-3 h-3 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Sharing Dropdown Menu / Modal */}
      {isOpen && (
        <>
          {/* Mobile Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/25 backdrop-blur-2xs z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Share REVIVE options"
            className="fixed sm:absolute inset-x-4 sm:inset-x-auto top-24 sm:top-auto sm:left-0 sm:mt-2 z-50 mx-auto sm:mx-0 w-auto sm:w-80 max-w-sm rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 text-slate-900 animate-fadeIn"
          >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-teal-700">
                Spread the Word
              </p>
              <h3 className="text-sm font-bold text-slate-900">
                Share REVIVE Module
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md text-sm font-bold"
              aria-label="Close share dialog"
            >
              ✕
            </button>
          </div>

          {/* Direct Copy Link Input */}
          <div className="mt-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Public Link
            </label>
            <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <input
                type="text"
                readOnly
                value={REVIVE_PUBLIC_URL}
                className="w-full bg-transparent text-xs text-slate-600 px-1 font-mono focus:outline-hidden truncate"
                aria-label="REVIVE module URL"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  copied
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-teal-700 hover:bg-teal-800 text-white shadow-2xs"
                }`}
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Social Destinations Grid */}
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Share to Platform
            </p>
            <div className="grid grid-cols-2 gap-2">
              {/* WhatsApp */}
              <a
                href={shareUrls.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-xs font-semibold text-slate-800 transition group"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white font-bold text-xs group-hover:scale-105 transition-transform">
                  💬
                </span>
                <span>WhatsApp</span>
              </a>

              {/* X / Twitter */}
              <a
                href={shareUrls.x}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-xs font-semibold text-slate-800 transition group"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-black text-white font-black text-xs group-hover:scale-105 transition-transform">
                  𝕏
                </span>
                <span>X (Twitter)</span>
              </a>

              {/* LinkedIn */}
              <a
                href={shareUrls.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-xs font-semibold text-slate-800 transition group"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs group-hover:scale-105 transition-transform">
                  in
                </span>
                <span>LinkedIn</span>
              </a>

              {/* Telegram */}
              <a
                href={shareUrls.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 text-xs font-semibold text-slate-800 transition group"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-white font-bold text-xs group-hover:scale-105 transition-transform">
                  ✈
                </span>
                <span>Telegram</span>
              </a>

              {/* Facebook */}
              <a
                href={shareUrls.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 flex items-center justify-center gap-2 p-2 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-xs font-semibold text-slate-800 transition group"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white font-black text-xs group-hover:scale-105 transition-transform">
                  f
                </span>
                <span>Facebook</span>
              </a>
            </div>
          </div>

          {/* Native Mobile Device Share Sheet Option if available */}
          {canNativeShare && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                <span>📱</span>
                <span>More sharing options on this device</span>
              </button>
            </div>
          )}
        </div>
      </>
    )}
    </div>
  );
}

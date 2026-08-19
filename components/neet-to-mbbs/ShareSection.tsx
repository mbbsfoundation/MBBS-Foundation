"use client";

import React, { useState } from "react";
import { trackNeetEvent } from "@/lib/analytics";

interface ShareSectionProps {
  heading: string;
  subheading?: string;
  eyebrow?: string;
  sharePath: string; // e.g. "/neet-to-mbbs/counselling"
  whatsappMessage: string;
  compact?: boolean;
}

const BASE_URL = "https://mbbsfoundation.com";

export default function ShareSection({
  heading,
  subheading,
  eyebrow = "Share This Resource",
  sharePath,
  whatsappMessage,
  compact = false,
}: ShareSectionProps) {
  const [copied, setCopied] = useState(false);

  // Deterministic canonical URL for both server SSR and client render (eliminates hydration mismatch)
  const canonicalUrl = `${BASE_URL}${sharePath}`;
  const formattedMessage = whatsappMessage.replace("[URL]", canonicalUrl);
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(formattedMessage)}`;

  const handleWhatsAppClick = () => {
    trackNeetEvent("neet_whatsapp_share", { path: sharePath });
  };

  const handleCopy = async () => {
    trackNeetEvent("neet_copy_link", { path: sharePath });
    const urlToCopy = typeof window !== "undefined" && window.location.href.startsWith("http")
      ? window.location.href
      : canonicalUrl;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(urlToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = urlToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2.5 print:hidden">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsAppClick}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition"
          aria-label="Share on WhatsApp"
        >
          <span>💬</span>
          <span>WhatsApp</span>
        </a>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          aria-label="Copy Page Link"
        >
          <span>🔗</span>
          <span>{copied ? "✓ Link Copied" : "Copy Link"}</span>
        </button>
      </div>
    );
  }

  return (
    <section className="border-t border-slate-100 bg-slate-50/60 py-12 sm:py-16 px-4 sm:px-6 print:hidden">
      <div className="mx-auto max-w-4xl text-center space-y-4">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
            {eyebrow}
          </p>
        )}

        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">
          {heading}
        </h2>

        {subheading && (
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            {subheading}
          </p>
        )}

        {/* Share Action Buttons */}
        <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer"
            aria-label={`Share on WhatsApp: ${heading}`}
          >
            <span>💬</span>
            <span>Share on WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            aria-label="Copy link to clipboard"
          >
            <span>🔗</span>
            <span>{copied ? "✓ Link Copied to Clipboard!" : "Copy Link"}</span>
          </button>
        </div>

        {/* Accessible live region for screen readers */}
        <div aria-live="polite" className="sr-only">
          {copied ? "Page link successfully copied to clipboard." : ""}
        </div>
      </div>
    </section>
  );
}

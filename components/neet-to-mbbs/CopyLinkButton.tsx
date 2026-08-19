"use client";

import React, { useState } from "react";

interface CopyLinkButtonProps {
  label?: string;
  copiedLabel?: string;
  className?: string;
}

export default function CopyLinkButton({
  label = "Copy Page Link",
  copiedLabel = "✓ Link Copied to Clipboard!",
  className = "inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-slate-800 transition cursor-pointer",
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  return (
    <button type="button" onClick={handleCopy} className={className}>
      <span>🔗</span>
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
}

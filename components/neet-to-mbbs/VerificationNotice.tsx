import React from "react";

interface VerificationNoticeProps {
  lastVerified?: string;
  authority?: string;
  officialUrl?: string;
  officialUrlLabel?: string;
  note?: string;
  className?: string;
}

export default function VerificationNotice({
  lastVerified = "Active 2026 Academic Session",
  authority = "MCC, NMC & State Counselling Authorities",
  officialUrl = "https://mcc.nic.in",
  officialUrlLabel = "MCC Official Portal",
  note = "Counselling schedules, seat reservation matrices, and state bond rules are subject to official regulatory gazettes. Always cross-verify critical deadlines on the official authority portal.",
  className = "my-6",
}: VerificationNoticeProps) {
  return (
    <aside
      aria-label="Official Policy and Verification Notice"
      className={`rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 sm:p-5 text-xs sm:text-sm text-amber-950 shadow-2xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5">
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-200/70 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
              <span>⚖️</span> Understand Here • Verify Officially
            </span>
            {lastVerified && (
              <span className="text-[11px] font-semibold text-amber-800/90">
                Session: {lastVerified}
              </span>
            )}
          </div>

          <p className="text-xs text-amber-900 leading-relaxed">
            {note}
          </p>

          <p className="text-[11px] font-medium text-amber-800">
            <strong>Regulatory Authority:</strong> {authority}
          </p>
        </div>

        {officialUrl && (
          <div className="shrink-0 pt-1">
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-900 px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-amber-800 transition"
            >
              <span>{officialUrlLabel}</span>
              <span>↗</span>
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}

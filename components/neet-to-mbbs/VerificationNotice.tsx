import React from "react";

interface VerificationNoticeProps {
  lastVerified?: string;
  authority?: string;
  officialUrl?: string;
  officialUrlLabel?: string;
  secondaryOfficialUrl?: string;
  secondaryOfficialUrlLabel?: string;
  note?: string;
  className?: string;
}

export default function VerificationNotice({
  lastVerified = "Active 2026 Academic Session",
  authority = "MCC, NMC & State Counselling Authorities",
  officialUrl = "https://mcc.nic.in",
  officialUrlLabel = "MCC Official Portal",
  secondaryOfficialUrl,
  secondaryOfficialUrlLabel = "NMC Official Portal",
  note = "2026 counselling decision-support based on MCC Round-1 allotment, MCC seat-matrix and available NMC seat data. AI-assisted analysis is used to organise and interpret the information. It may contain errors or omissions and should not be treated as an official allotment, cutoff or counselling decision. Always verify current seats, eligibility, counselling rules, vacancies and final information from MCC and the relevant official Government/State counselling portals before making a choice.",
  className = "my-4",
}: VerificationNoticeProps) {
  return (
    <aside
      aria-label="Official Policy and Verification Notice"
      className={`rounded-2xl border border-amber-200 bg-amber-50/60 p-3 sm:p-4 text-xs text-amber-950 shadow-2xs ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-200/80 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-950">
              <span>⚖️</span> Understand Here • Verify Officially
            </span>
            {lastVerified && (
              <span className="text-[10px] font-bold text-amber-800">
                Session: {lastVerified}
              </span>
            )}
          </div>

          <p className="text-[11px] sm:text-xs text-amber-900 leading-snug">
            {note}
          </p>

          <p className="text-[10px] font-semibold text-amber-800">
            <strong>Authoritative Portals:</strong> {authority}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 pt-0.5">
          {officialUrl && (
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-xl bg-amber-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-amber-800 transition whitespace-nowrap"
            >
              <span>{officialUrlLabel}</span>
              <span>↗</span>
            </a>
          )}
          {secondaryOfficialUrl && (
            <a
              href={secondaryOfficialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-xl bg-white border border-amber-300 px-3 py-1.5 text-xs font-bold text-amber-950 shadow-2xs hover:bg-amber-100/60 transition whitespace-nowrap"
            >
              <span>{secondaryOfficialUrlLabel}</span>
              <span>↗</span>
            </a>
          )}
        </div>
      </div>
    </aside>
  );
}

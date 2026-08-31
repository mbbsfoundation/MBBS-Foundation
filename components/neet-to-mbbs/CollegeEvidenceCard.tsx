"use client";

import React from "react";
import type {
  DomicileCollegeSummary,
  CollegeRound1CategoryProfile,
} from "@/lib/counselling/evidenceTypes";
import {
  getStudentFriendlyQuotaLabel,
  getPrimaryOpenBenchmark,
  sortCategoryProfiles,
} from "@/lib/counselling/pathwayOrdering";

export interface CollegeEvidenceCardProps {
  college: DomicileCollegeSummary;
  studentAir?: number;
  studentCategory?: string;
  isPwD?: boolean;
  isCompared?: boolean;
  onToggleCompare?: (collegeId: string) => void;
  onViewDetails?: (college: DomicileCollegeSummary) => void;
  isInPlan?: boolean;
  onTogglePlan?: (item: {
    collegeId: string;
    collegeName: string;
    state: string;
    managementType: string;
    route: string;
    quota: string;
    seatCategory: string;
    isPwD: boolean;
    medianAIR: number | null;
    highestAIR: number | null;
    sampleSize: number;
    estimatedPool: number | null;
  }) => void;
  onMeaningfulInteraction?: () => void;
}

export default function CollegeEvidenceCard({
  college,
  studentAir,
  studentCategory = "OPEN",
  isPwD = false,
  isCompared = false,
  onToggleCompare,
  onViewDetails,
  isInPlan = false,
  onTogglePlan,
  onMeaningfulInteraction,
}: CollegeEvidenceCardProps) {
  const openProfile = getPrimaryOpenBenchmark(college.allCategoryProfiles);

  // Student category profile if reserved or PwD
  let studentProfile: CollegeRound1CategoryProfile | undefined;
  if (studentCategory !== "OPEN" || isPwD) {
    const matchingProfiles = college.allCategoryProfiles.filter(
      (p) => p.seatCategory === studentCategory && p.isPwD === isPwD
    );
    if (matchingProfiles.length > 0) {
      studentProfile = sortCategoryProfiles(matchingProfiles, "STANDARD")[0];
    }
  }

  // Subtle accessible light tint based on college management type
  let cardTintStyle = "bg-linear-to-b from-white via-slate-50/50 to-slate-50 border-slate-200/80";
  let managementBadgeStyle = "bg-slate-100 border-slate-200 text-slate-700";

  if (college.isINI) {
    cardTintStyle = "bg-linear-to-b from-indigo-50/35 via-white to-slate-50/30 border-indigo-200/80";
    managementBadgeStyle = "bg-indigo-50 border-indigo-200 text-indigo-800";
  } else if (college.isCentralUniversity) {
    cardTintStyle = "bg-linear-to-b from-blue-50/35 via-white to-slate-50/30 border-blue-200/80";
    managementBadgeStyle = "bg-blue-50 border-blue-200 text-blue-800";
  } else if (college.isDeemed) {
    cardTintStyle = "bg-linear-to-b from-purple-50/35 via-white to-slate-50/30 border-purple-200/80";
    managementBadgeStyle = "bg-purple-50 border-purple-200 text-purple-800";
  } else if (college.managementType === "GOVERNMENT") {
    cardTintStyle = "bg-linear-to-b from-emerald-50/30 via-white to-slate-50/30 border-emerald-200/80";
    managementBadgeStyle = "bg-emerald-50 border-emerald-200 text-emerald-800";
  } else if (college.managementType === "PRIVATE") {
    cardTintStyle = "bg-linear-to-b from-amber-50/25 via-white to-slate-50/30 border-amber-200/70";
    managementBadgeStyle = "bg-amber-50 border-amber-200 text-amber-800";
  }

  // Plain-Language Factual AIR Comparison for OPEN student
  let openComparisonText: string | null = null;
  let openComparisonStyle = "bg-blue-50 border-blue-200 text-blue-900";
  if (studentAir !== undefined && studentCategory === "OPEN" && !isPwD && openProfile) {
    if (openProfile.medianAIR !== null && studentAir <= openProfile.medianAIR) {
      openComparisonText = `Your AIR (${studentAir.toLocaleString("en-IN")}) is better than the Typical (Median) OPEN AIR (${openProfile.medianAIR.toLocaleString("en-IN")}) observed in Round 1.`;
      openComparisonStyle = "bg-emerald-50 border-emerald-200 text-emerald-900";
    } else if (openProfile.highestAIR !== null && studentAir <= openProfile.highestAIR) {
      openComparisonText = `Your AIR (${studentAir.toLocaleString("en-IN")}) falls within the observed MCC Round-1 OPEN range (up to AIR ${openProfile.highestAIR.toLocaleString("en-IN")}).`;
      openComparisonStyle = "bg-blue-50 border-blue-200 text-blue-900";
    } else if (openProfile.highestAIR !== null && studentAir > openProfile.highestAIR) {
      openComparisonText = `Your AIR (${studentAir.toLocaleString("en-IN")}) is beyond the Last Observed OPEN AIR (${openProfile.highestAIR.toLocaleString("en-IN")}) in Round 1.`;
      openComparisonStyle = "bg-amber-50 border-amber-200 text-amber-900";
    }
  }

  // Plain-Language Factual AIR Comparison for Reserved/PwD student
  let studentComparisonText: string | null = null;
  let studentComparisonStyle = "bg-blue-50 border-blue-200 text-blue-900";
  if (studentAir !== undefined && (studentCategory !== "OPEN" || isPwD) && studentProfile) {
    const catLabel = `${studentCategory}${isPwD ? " (PwD)" : ""}`;
    if (studentProfile.medianAIR !== null && studentAir <= studentProfile.medianAIR) {
      studentComparisonText = `Your AIR (${studentAir.toLocaleString("en-IN")}) is better than the Typical (Median) ${catLabel} AIR (${studentProfile.medianAIR.toLocaleString("en-IN")}) observed in Round 1.`;
      studentComparisonStyle = "bg-emerald-50 border-emerald-200 text-emerald-900";
    } else if (studentProfile.highestAIR !== null && studentAir <= studentProfile.highestAIR) {
      studentComparisonText = `Your AIR (${studentAir.toLocaleString("en-IN")}) falls within the observed MCC Round-1 ${catLabel} range (up to AIR ${studentProfile.highestAIR.toLocaleString("en-IN")}).`;
      studentComparisonStyle = "bg-blue-50 border-blue-200 text-blue-900";
    } else if (studentProfile.highestAIR !== null && studentAir > studentProfile.highestAIR) {
      studentComparisonText = `Your AIR (${studentAir.toLocaleString("en-IN")}) is beyond the Last Observed ${catLabel} AIR (${studentProfile.highestAIR.toLocaleString("en-IN")}) in Round 1.`;
      studentComparisonStyle = "bg-amber-50 border-amber-200 text-amber-900";
    }
  }

  const handleToggleCompareClick = () => {
    onMeaningfulInteraction?.();
    onToggleCompare?.(college.collegeId);
  };

  const handleViewDetailsClick = () => {
    onMeaningfulInteraction?.();
    onViewDetails?.(college);
  };

  const handleTogglePlanClick = () => {
    onMeaningfulInteraction?.();
    if (!onTogglePlan) return;
    const targetProf = studentCategory !== "OPEN" && studentProfile ? studentProfile : openProfile;
    onTogglePlan({
      collegeId: college.collegeId,
      collegeName: college.collegeName,
      state: college.state,
      managementType: college.managementType,
      route: "MCC",
      quota: targetProf?.quota || "All India",
      seatCategory: targetProf?.seatCategory || studentCategory,
      isPwD: targetProf?.isPwD || isPwD,
      medianAIR: targetProf?.medianAIR ?? null,
      highestAIR: targetProf?.highestAIR ?? null,
      sampleSize: targetProf?.seatsAllotted || 0,
      estimatedPool: null,
    });
  };

  return (
    <div
      className={`rounded-3xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${cardTintStyle}`}
    >
      <div className="space-y-3.5">
        {/* 1. College Identity & Badges */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${managementBadgeStyle}`}>
              {college.managementType}
            </span>
            <div className="flex items-center gap-1">
              {college.isINI && (
                <span className="inline-block rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                  INI
                </span>
              )}
              {college.isDeemed && (
                <span className="inline-block rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                  Deemed
                </span>
              )}
              {college.isCentralUniversity && (
                <span className="inline-block rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                  Central Univ
                </span>
              )}
              {college.isESIC && (
                <span className="inline-block rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                  ESIC
                </span>
              )}
            </div>
          </div>
          <h4 className="font-extrabold text-slate-900 text-sm leading-snug mt-1.5 line-clamp-2">
            {college.collegeName}
          </h4>
          <div className="text-xs text-slate-500 mt-0.5">📍 {college.state}</div>
        </div>

        {/* 2. PRIMARY OPEN ROUND-1 AIR BENCHMARK (DOMINANT FIRST EVIDENCE BLOCK) */}
        {openProfile ? (
          <div className="rounded-2xl border border-blue-100 bg-linear-to-b from-blue-50/60 to-slate-50/50 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-blue-950 uppercase tracking-wide text-[11px]">
                {getStudentFriendlyQuotaLabel(openProfile.quota)} • OPEN
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {openProfile.seatsAllotted} Round-1 Allotments
              </span>
            </div>

            {/* Dominant Typical (Median) AIR Display */}
            <div className="bg-white rounded-xl border border-blue-200/70 p-2.5 shadow-2xs text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Typical (Median) AIR
              </span>
              <div className="text-2xl sm:text-3xl font-black text-blue-700 tracking-tight mt-0.5">
                {openProfile.medianAIR !== null ? openProfile.medianAIR.toLocaleString("en-IN") : "—"}
              </div>
            </div>

            {/* Supporting Best and Last Observed AIR */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="rounded-lg bg-white/80 border border-slate-200/70 px-2 py-1.5">
                <span className="text-[10px] font-semibold text-slate-500 block">Best AIR</span>
                <span className="text-xs font-bold text-slate-800">
                  {openProfile.bestAIR !== null ? openProfile.bestAIR.toLocaleString("en-IN") : "—"}
                </span>
              </div>
              <div className="rounded-lg bg-white/80 border border-slate-200/70 px-2 py-1.5">
                <span className="text-[10px] font-semibold text-slate-500 block">Last Observed AIR</span>
                <span className="text-xs font-bold text-slate-800">
                  {openProfile.highestAIR !== null ? openProfile.highestAIR.toLocaleString("en-IN") : "—"}
                </span>
              </div>
            </div>

            {/* Contextual OPEN Student Comparison Text */}
            {openComparisonText && (
              <div className={`rounded-xl border p-2 text-[11px] font-semibold leading-relaxed ${openComparisonStyle}`}>
                {openComparisonText}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-center text-xs text-slate-400">
            {college.allCategoryProfiles.length > 0
              ? `${college.allCategoryProfiles.length} Special/Minority Pathways Recorded`
              : "No MCC Round-1 allotments recorded"}
          </div>
        )}

        {/* 3. SECONDARY 2026 SEAT STRUCTURE (COMPACT FACTUAL METRICS BELOW AIR) */}
        <div className="rounded-2xl bg-slate-50/80 border border-slate-200/70 p-2.5 grid grid-cols-4 gap-1 text-center text-[11px]">
          <div>
            <div className="text-[9px] font-bold text-slate-500 uppercase truncate" title="2026 MBBS Seats">
              Seats
            </div>
            <div className="text-xs font-extrabold text-slate-700 mt-0.5">
              {college.totalMBBSSeats2026 > 0 ? college.totalMBBSSeats2026 : "—"}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-bold text-slate-500 uppercase truncate" title="MCC Round-1 Offered">
              MCC Offered
            </div>
            <div className="text-xs font-extrabold text-slate-700 mt-0.5">
              {college.mccRound1SeatsOffered}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-bold text-slate-500 uppercase truncate" title="MCC Round-1 Allotted">
              MCC Allotted
            </div>
            <div className="text-xs font-extrabold text-slate-700 mt-0.5">
              {college.mccRound1SeatsAllotted}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-bold text-slate-500 uppercase truncate" title="Approx Outside MCC Pool">
              Outside Pool
            </div>
            <div className="text-xs font-extrabold text-slate-700 mt-0.5">
              ~{college.approxOutsideMccRound1Pool}
            </div>
          </div>
        </div>

        {/* 4. STUDENT-SPECIFIC CATEGORY PROFILE (IF RESERVED OR PWD) */}
        {studentAir !== undefined && (studentCategory !== "OPEN" || isPwD) && (
          <div className="rounded-2xl border border-indigo-200 bg-linear-to-b from-indigo-50/50 to-slate-50/40 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-indigo-950 uppercase tracking-wide text-[11px]">
                Your Category — {studentCategory}
                {isPwD && " (PwD)"}
                {studentProfile && ` (${getStudentFriendlyQuotaLabel(studentProfile.quota)})`}
              </span>
              <span className="text-[10px] font-bold text-indigo-700">
                {studentProfile ? `${studentProfile.seatsAllotted} Allotted` : "0 Allotted"}
              </span>
            </div>

            {studentProfile ? (
              <>
                <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                  <div className="rounded-lg bg-white border border-indigo-100 p-1.5">
                    <span className="text-[9px] font-semibold text-slate-400 block">Best AIR</span>
                    <span className="text-xs font-bold text-slate-800">
                      {studentProfile.bestAIR !== null ? studentProfile.bestAIR.toLocaleString("en-IN") : "—"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-white border border-indigo-200 p-1.5">
                    <span className="text-[9px] font-bold text-indigo-600 block">Typical AIR</span>
                    <span className="text-xs font-black text-indigo-900">
                      {studentProfile.medianAIR !== null ? studentProfile.medianAIR.toLocaleString("en-IN") : "—"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-white border border-indigo-100 p-1.5">
                    <span className="text-[9px] font-semibold text-slate-400 block">Last Observed</span>
                    <span className="text-xs font-bold text-slate-800">
                      {studentProfile.highestAIR !== null ? studentProfile.highestAIR.toLocaleString("en-IN") : "—"}
                    </span>
                  </div>
                </div>

                {studentComparisonText && (
                  <div
                    className={`rounded-xl border p-2 text-[11px] font-semibold leading-relaxed ${studentComparisonStyle}`}
                  >
                    {studentComparisonText}
                  </div>
                )}
              </>
            ) : (
              <div className="text-[11px] text-slate-500 italic text-center py-1">
                No MCC Round-1 allotments observed for {studentCategory}
                {isPwD && " (PwD)"} at this college.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Card Actions */}
      {(onViewDetails || onToggleCompare || onTogglePlan) && (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          {onViewDetails && (
            <button
              type="button"
              onClick={handleViewDetailsClick}
              className="flex-1 rounded-xl bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800 transition text-center whitespace-nowrap"
            >
              👁️ View Details
            </button>
          )}

          {onToggleCompare && (
            <button
              type="button"
              onClick={handleToggleCompareClick}
              className={`rounded-xl px-3 py-2 text-xs font-bold border transition whitespace-nowrap ${
                isCompared
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {isCompared ? "✓ Comparing" : "+ Compare"}
            </button>
          )}

          {onTogglePlan && (
            <button
              type="button"
              onClick={handleTogglePlanClick}
              className={`rounded-xl px-3 py-2 text-xs font-bold border transition whitespace-nowrap ${
                isInPlan
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              {isInPlan ? "✓ In Plan" : "+ Plan"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

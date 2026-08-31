"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import type {
  Round1EvidenceResponse,
  ExactAllotmentRecord,
  NearbyAllotmentRecord,
  WindowAllotmentItem,
  WindowAllotmentResult,
  DomicileCollegeSummary,
  CollegeRound1CategoryProfile,
  SupportedWindow,
  CategoryMode,
} from "@/lib/counselling/evidenceTypes";
import {
  sortCategoryProfiles,
  getStudentFriendlyQuotaLabel,
  getPathwayGroup,
  isPrimaryOpenBenchmark,
} from "@/lib/counselling/pathwayOrdering";
import CollegeEvidenceCard from "./CollegeEvidenceCard";

interface Round1EvidenceExplorerProps {
  initialEvidence: Round1EvidenceResponse;
  studentAir: number;
  studentCategory: string;
  isPwD: boolean;
  domicileState: string;
  selectedCollegeIds: string[];
  onToggleComparison: (college: DomicileCollegeSummary | string) => void;
  plannedItemIds: Set<string>;
  onTogglePlan: (item: {
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
  onSelectCollegeDetail?: (collegeId: string) => void;
  onMeaningfulInteraction?: () => void;
}

export default function Round1EvidenceExplorer({
  initialEvidence,
  studentAir,
  studentCategory,
  isPwD,
  domicileState,
  selectedCollegeIds,
  onToggleComparison,
  plannedItemIds,
  onTogglePlan,
  onSelectCollegeDetail,
  onMeaningfulInteraction,
}: Round1EvidenceExplorerProps) {
  // Rank Window Interactive State
  const [windowSize, setWindowSize] = useState<SupportedWindow>(
    (initialEvidence.windowAllotments.window as SupportedWindow) || 500
  );
  const [categoryMode, setCategoryMode] = useState<CategoryMode>("ELIGIBLE");
  const [page, setPage] = useState<number>(1);
  const [stateFilter, setStateFilter] = useState<string>("");
  const [managementFilter, setManagementFilter] = useState<string>("ALL");
  const [quotaFilter, setQuotaFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Window Data State
  const [windowData, setWindowData] = useState<WindowAllotmentResult>(initialEvidence.windowAllotments);
  const [isWindowLoading, setIsWindowLoading] = useState<boolean>(false);
  const [windowError, setWindowError] = useState<string | null>(null);

  // Domicile State Explorer Sort & Filter State
  const [domicileSort, setDomicileSort] = useState<"TYPICAL_AIR" | "BEST_AIR" | "LAST_AIR" | "TOTAL_SEATS" | "NAME">(
    "TYPICAL_AIR"
  );
  const [domicileMgmtFilter, setDomicileMgmtFilter] = useState<string>("ALL");
  const [activeCategoryModalCollege, setActiveCategoryModalCollege] = useState<DomicileCollegeSummary | null>(null);
  const [modalSortMode, setModalSortMode] = useState<"STANDARD" | "BEST_AIR">("STANDARD");

  // Re-fetch window allotments when interactive controls change
  const fetchWindowAllotments = async (
    newWindow: SupportedWindow,
    newMode: CategoryMode,
    newPage: number,
    newState: string,
    newMgmt: string,
    newQuota: string
  ) => {
    setIsWindowLoading(true);
    setWindowError(null);
    try {
      const params = new URLSearchParams();
      params.set("air", studentAir.toString());
      params.set("window", newWindow.toString());
      params.set("category", studentCategory);
      params.set("categoryMode", newMode);
      params.set("isPwD", isPwD ? "true" : "false");
      params.set("page", newPage.toString());
      params.set("pageSize", "50");

      if (newState.trim()) params.set("state", newState.trim());
      if (newMgmt !== "ALL") params.set("managementType", newMgmt);
      if (newQuota.trim()) params.set("quota", newQuota.trim());

      const res = await fetch(`/api/counselling/round1/evidence?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load matching allotments for this range.");
      }
      const data: Round1EvidenceResponse = await res.json();
      setWindowData(data.windowAllotments);
    } catch (err: any) {
      setWindowError(err.message || "Could not retrieve allotments.");
    } finally {
      setIsWindowLoading(false);
    }
  };

  const handleWindowChange = (w: SupportedWindow) => {
    setWindowSize(w);
    setPage(1);
    fetchWindowAllotments(w, categoryMode, 1, stateFilter, managementFilter, quotaFilter);
  };

  const handleCategoryModeChange = (m: CategoryMode) => {
    setCategoryMode(m);
    setPage(1);
    fetchWindowAllotments(windowSize, m, 1, stateFilter, managementFilter, quotaFilter);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchWindowAllotments(windowSize, categoryMode, newPage, stateFilter, managementFilter, quotaFilter);
    // Smooth scroll to top of window section
    document.getElementById("rank-window-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchWindowAllotments(windowSize, categoryMode, 1, stateFilter, managementFilter, quotaFilter);
  };

  const handleResetFilters = () => {
    setStateFilter("");
    setManagementFilter("ALL");
    setQuotaFilter("");
    setPage(1);
    fetchWindowAllotments(windowSize, categoryMode, 1, "", "ALL", "");
  };

  // Domicile College Filtering & Sorting
  const rawDomicileColleges = initialEvidence.domicileSummary?.colleges || [];

  const filteredDomicileColleges = rawDomicileColleges.filter((c) => {
    if (domicileMgmtFilter === "ALL") return true;
    if (domicileMgmtFilter === "GOVERNMENT") return c.managementType === "GOVERNMENT";
    if (domicileMgmtFilter === "PRIVATE") return c.managementType === "PRIVATE" && !c.isDeemed;
    if (domicileMgmtFilter === "DEEMED") return c.isDeemed;
    if (domicileMgmtFilter === "INI") return c.isINI;
    return true;
  });

  const sortedDomicileColleges = [...filteredDomicileColleges].sort((a, b) => {
    const aOpen = a.openRound1Profiles.find((p) => p.quota === "All India") || a.openRound1Profiles[0];
    const bOpen = b.openRound1Profiles.find((p) => p.quota === "All India") || b.openRound1Profiles[0];

    if (domicileSort === "TYPICAL_AIR") {
      const aMed = aOpen?.medianAIR ?? 9999999;
      const bMed = bOpen?.medianAIR ?? 9999999;
      return aMed - bMed;
    }
    if (domicileSort === "BEST_AIR") {
      const aBest = aOpen?.bestAIR ?? 9999999;
      const bBest = bOpen?.bestAIR ?? 9999999;
      return aBest - bBest;
    }
    if (domicileSort === "LAST_AIR") {
      const aLast = aOpen?.highestAIR ?? 9999999;
      const bLast = bOpen?.highestAIR ?? 9999999;
      return aLast - bLast;
    }
    if (domicileSort === "TOTAL_SEATS") {
      return b.totalMBBSSeats2026 - a.totalMBBSSeats2026;
    }
    // Default NAME
    return a.collegeName.localeCompare(b.collegeName);
  });

  const exact = initialEvidence.exactMatch;
  const nearby = initialEvidence.nearbyAllotments;

  return (
    <div className="w-full space-y-10">
      {/* 1. Header & Compact Profile Bar */}
      <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-b from-white to-blue-50/30 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-xs font-bold text-blue-900">
              <span>🏛️</span> Factual Round-1 Evidence
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              See What Happened Around Your AIR
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Explore actual MCC Round-1 MBBS allotments around your rank, then compare medical colleges and plan your
              counselling choices.
            </p>
          </div>

          {/* Compact Profile Badge */}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Profile:</div>
            <div className="inline-flex items-center gap-1 font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg text-sm">
              <span className="text-slate-400 font-normal">AIR</span> {studentAir.toLocaleString("en-IN")}
            </div>
            <div className="inline-flex items-center font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg text-sm">
              {studentCategory}
            </div>
            <div className="inline-flex items-center font-medium text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-sm">
              📍 {domicileState}
            </div>
            {isPwD && (
              <div className="inline-flex items-center font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg text-xs">
                PwD
              </div>
            )}
          </div>
        </div>

        {/* How To Use This Page Box */}
        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-blue-900 mb-2">
            <span>💡</span> How to use this page
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs text-slate-700 leading-snug">
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-[10px]">
                1
              </span>
              <span>See what happened at and around your AIR in Round 1.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-[10px]">
                2
              </span>
              <span>Explore colleges and category-wise AIR patterns.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-[10px]">
                3
              </span>
              <span>Review colleges in your domicile state ({domicileState}).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-[10px]">
                4
              </span>
              <span>Compare colleges and add choices to your personal plan.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-[10px]">
                5
              </span>
              <span>Review the Round-2 interpretation as an advisory guide.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Exact AIR Result & Nearby Allotments Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Exact AIR Result (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  What Happened At Your AIR?
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  Exact Match
                </span>
              </div>

              {exact ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase">MCC Round-1 Result at Rank</div>
                    <div className="text-2xl font-black text-slate-900">AIR {exact.candidateRank.toLocaleString("en-IN")}</div>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 space-y-2.5">
                    <div className="font-bold text-slate-900 text-base leading-tight">{exact.collegeName}</div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                      <span className="font-medium text-slate-800">📍 {exact.state}</span>
                      <span>•</span>
                      <span className="inline-block rounded-md bg-white border border-slate-200 px-2 py-0.5 font-semibold text-slate-700">
                        {exact.managementType}
                      </span>
                      {exact.isINI && (
                        <span className="inline-block rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 font-bold text-indigo-700">
                          INI
                        </span>
                      )}
                      {exact.isDeemed && (
                        <span className="inline-block rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 font-bold text-purple-700">
                          Deemed
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-blue-100/80 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-slate-500 text-[11px]">Counselling Quota</div>
                        <div className="font-bold text-slate-800">{exact.quota}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[11px]">Seat Category Allotted</div>
                        <div className="font-bold text-emerald-700">{exact.allottedCategory}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[11px]">Candidate Category</div>
                        <div className="font-bold text-slate-800">{exact.candidateCategory}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[11px]">Course</div>
                        <div className="font-bold text-slate-800">{exact.course}</div>
                      </div>
                    </div>
                  </div>

                  {/* Clarification Box distinguishing student's category vs historical allotment */}
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 leading-relaxed space-y-1">
                    <div className="font-semibold text-slate-800 flex items-center gap-1">
                      <span>ℹ️</span> Understanding this result:
                    </div>
                    <p>
                      At this AIR in MCC Round 1, the recorded allotment was for a candidate with category{" "}
                      <strong className="text-slate-900">{exact.candidateCategory}</strong> allotted under an{" "}
                      <strong className="text-slate-900">{exact.allottedCategory}</strong> seat.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      This factual record shows where your rank stood nationally in Round 1.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 text-xl">
                    🔍
                  </div>
                  <div className="font-bold text-slate-800 text-sm">
                    No MBBS allotment was recorded at exactly AIR {studentAir.toLocaleString("en-IN")} in MCC Round 1.
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Candidates holding ranks immediately above and below you received the allotments shown on the right.
                  </p>
                </div>
              )}
            </div>

            {exact && (
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleComparison(exact.collegeId)}
                  className={`flex-1 rounded-xl py-2 px-3 text-xs font-bold transition-all ${
                    selectedCollegeIds.includes(exact.collegeId)
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                  }`}
                >
                  {selectedCollegeIds.includes(exact.collegeId) ? "✓ Comparing" : "+ Compare"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onTogglePlan({
                      collegeId: exact.collegeId,
                      collegeName: exact.collegeName,
                      state: exact.state,
                      managementType: exact.managementType,
                      route: "MCC",
                      quota: exact.quota,
                      seatCategory: exact.allottedCategory,
                      isPwD: exact.allottedPwD,
                      medianAIR: exact.candidateRank,
                      highestAIR: exact.candidateRank,
                      sampleSize: 1,
                      estimatedPool: null,
                    })
                  }
                  className={`flex-1 rounded-xl py-2 px-3 text-xs font-bold transition-all ${
                    plannedItemIds.has(`${exact.collegeId}__MCC__${exact.quota}__${exact.allottedCategory}__${exact.allottedPwD}`)
                      ? "bg-blue-600 text-white"
                      : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                  }`}
                >
                  {plannedItemIds.has(
                    `${exact.collegeId}__MCC__${exact.quota}__${exact.allottedCategory}__${exact.allottedPwD}`
                  )
                    ? "✓ In Plan"
                    : "+ Add to Plan"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Nearby AIR Timeline (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  What Happened Just Around Your AIR?
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Actual MCC Round-1 allotments immediately above and below your rank.
                </p>
              </div>
            </div>

            {/* Timeline View */}
            <div className="space-y-1 flex-1">
              {/* Better Ranks */}
              {nearby.better.map((r) => (
                <div
                  key={`nearby-better-${r.candidateRank}`}
                  className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50/80 transition-colors text-xs border border-transparent hover:border-slate-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-bold text-slate-700 w-16 text-right shrink-0">
                      {r.candidateRank.toLocaleString("en-IN")}
                    </span>
                    <span className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-[260px]">
                      {r.collegeName}
                    </span>
                    <span className="text-[11px] text-slate-500 hidden sm:inline-block shrink-0">({r.state})</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 hidden md:inline-block">
                      {r.quota}
                    </span>
                    <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                      {r.allottedCategory}
                    </span>
                  </div>
                </div>
              ))}

              {/* YOUR AIR Marker */}
              <div className="my-2 py-2 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>YOUR AIR {studentAir.toLocaleString("en-IN")}</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded text-[11px] font-medium">{studentCategory}</span>
                  {isPwD && <span className="bg-purple-400/40 px-1.5 py-0.5 rounded text-[10px]">PwD</span>}
                </div>
                <span className="text-[11px] font-normal text-blue-100 hidden sm:inline-block">
                  {exact ? "Exact allotment shown on left" : "No exact allotment recorded at this rank"}
                </span>
              </div>

              {/* Lower Ranks */}
              {nearby.lower.map((r) => (
                <div
                  key={`nearby-lower-${r.candidateRank}`}
                  className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50/80 transition-colors text-xs border border-transparent hover:border-slate-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-bold text-slate-700 w-16 text-right shrink-0">
                      {r.candidateRank.toLocaleString("en-IN")}
                    </span>
                    <span className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-[260px]">
                      {r.collegeName}
                    </span>
                    <span className="text-[11px] text-slate-500 hidden sm:inline-block shrink-0">({r.state})</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 hidden md:inline-block">
                      {r.quota}
                    </span>
                    <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                      {r.allottedCategory}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Rank-Window Playground ("EXPLORE AROUND YOUR RANK") */}
      <div id="rank-window-section" className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-0.5 text-xs font-bold text-indigo-900 mb-1">
              <span>🎯</span> Rank Range Explorer
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Explore Around Your Rank</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Showing actual Round-1 allotments within{" "}
              <strong className="text-slate-800">
                AIR {windowData.range.min.toLocaleString("en-IN")} – {windowData.range.max.toLocaleString("en-IN")}
              </strong>{" "}
              ({windowData.total} {categoryMode === "ALL" ? "total" : "matching"} allotments).
            </p>
          </div>

          {/* Window Selectors: ±250, ±500, ±1000, ±2500 */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
            {([250, 500, 1000, 2500] as SupportedWindow[]).map((w) => (
              <button
                key={`win-${w}`}
                type="button"
                onClick={() => handleWindowChange(w)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  windowSize === w
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                ±{w.toLocaleString("en-IN")}
              </button>
            ))}
          </div>
        </div>

        {/* Category Mode Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleCategoryModeChange("ELIGIBLE")}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                categoryMode === "ELIGIBLE"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              title="Includes Open seats and seats allotted under your category"
            >
              🎯 My Eligible Seats
            </button>

            {studentCategory !== "OPEN" && (
              <button
                type="button"
                onClick={() => handleCategoryModeChange("CATEGORY_ONLY")}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  categoryMode === "CATEGORY_ONLY"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {studentCategory} Seats Only
              </button>
            )}

            <button
              type="button"
              onClick={() => handleCategoryModeChange("MERIT_OPEN")}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                categoryMode === "MERIT_OPEN"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              title="Shows seats allotted as OPEN, including candidates from reserved categories who obtained an Open seat on merit"
            >
              Open Merit Seats
            </button>

            <button
              type="button"
              onClick={() => handleCategoryModeChange("ALL")}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                categoryMode === "ALL"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All Categories
            </button>

            <button
              type="button"
              onClick={() => handleCategoryModeChange("PWD")}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                categoryMode === "PWD"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
              }`}
            >
              PwD Seats
            </button>
          </div>

          {/* Toggle Filter Button */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl px-3 py-2 bg-white"
          >
            <span>⚙️</span>
            <span>Refine Results</span>
            <span>{showFilters ? "▲" : "▼"}</span>
          </button>
        </div>

        {/* Collapsible Refine Filters */}
        {showFilters && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Filter by State</label>
                <input
                  type="text"
                  placeholder="e.g. Rajasthan, Delhi..."
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">College Type</label>
                <select
                  value={managementFilter}
                  onChange={(e) => setManagementFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                >
                  <option value="ALL">All Types</option>
                  <option value="GOVERNMENT">Government Only</option>
                  <option value="PRIVATE">Private Only</option>
                  <option value="DEEMED">Deemed Universities</option>
                  <option value="CENTRAL">Central Universities</option>
                  <option value="INI">Institutes of National Importance (INI)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Counselling Quota</label>
                <input
                  type="text"
                  placeholder="e.g. All India, Delhi University..."
                  value={quotaFilter}
                  onChange={(e) => setQuotaFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleApplyFilters}
                className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Results View: Table (Desktop) / Cards (Mobile) */}
        {isWindowLoading ? (
          <div className="py-16 text-center space-y-2">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent"></div>
            <p className="text-xs font-semibold text-slate-500">Retrieving official Round-1 allotments...</p>
          </div>
        ) : windowError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-xs text-red-700">
            {windowError}
          </div>
        ) : windowData.items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-12 text-center space-y-2">
            <div className="text-2xl">📋</div>
            <div className="font-bold text-slate-800 text-sm">No allotments found matching your active filters.</div>
            <p className="text-xs text-slate-500">
              Try expanding your AIR window (e.g. ±1,000 or ±2,500) or clearing specific filters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-3 w-20">AIR</th>
                    <th className="py-3 px-3">College Name & State</th>
                    <th className="py-3 px-3 w-28">Type</th>
                    <th className="py-3 px-3 w-36">Quota</th>
                    <th className="py-3 px-3 w-28">Seat Cat.</th>
                    <th className="py-3 px-3 w-28">Cand. Cat.</th>
                    <th className="py-3 px-3 w-32 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {windowData.items.map((r) => {
                    const isExactAir = r.candidateRank === studentAir;
                    const planKey = `${r.collegeId}__MCC__${r.quota}__${r.allottedCategory}__${r.allottedPwD}`;
                    const isPlanned = plannedItemIds.has(planKey);
                    const isCompared = selectedCollegeIds.includes(r.collegeId);

                    return (
                      <tr
                        key={`win-item-${r.id}`}
                        className={`transition-colors hover:bg-slate-50/80 ${
                          isExactAir ? "bg-blue-50/60 font-medium" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {r.candidateRank.toLocaleString("en-IN")}
                          {isExactAir && (
                            <span className="block text-[9px] font-sans font-extrabold text-blue-600 uppercase">
                              Your AIR
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 leading-tight">{r.collegeName}</div>
                          <div className="text-[11px] text-slate-500">📍 {r.state}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            {r.managementType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">{r.quota}</td>
                        <td className="py-2.5 px-3">
                          <span className="inline-block rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                            {r.allottedCategory}
                          </span>
                          {r.allottedPwD && (
                            <span className="block text-[10px] text-purple-700 font-semibold">PwD</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{r.candidateCategory}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => onToggleComparison(r.collegeId)}
                              className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
                                isCompared
                                  ? "bg-slate-900 text-white"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                              }`}
                            >
                              {isCompared ? "✓" : "Compare"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onTogglePlan({
                                  collegeId: r.collegeId,
                                  collegeName: r.collegeName,
                                  state: r.state,
                                  managementType: r.managementType,
                                  route: "MCC",
                                  quota: r.quota,
                                  seatCategory: r.allottedCategory,
                                  isPwD: r.allottedPwD,
                                  medianAIR: r.candidateRank,
                                  highestAIR: r.candidateRank,
                                  sampleSize: 1,
                                  estimatedPool: null,
                                })
                              }
                              className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
                                isPlanned
                                  ? "bg-blue-600 text-white"
                                  : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {isPlanned ? "✓ In Plan" : "+ Plan"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="md:hidden space-y-3">
              {windowData.items.map((r) => {
                const isExactAir = r.candidateRank === studentAir;
                const planKey = `${r.collegeId}__MCC__${r.quota}__${r.allottedCategory}__${r.allottedPwD}`;
                const isPlanned = plannedItemIds.has(planKey);
                const isCompared = selectedCollegeIds.includes(r.collegeId);

                return (
                  <div
                    key={`mobile-win-item-${r.id}`}
                    className={`rounded-2xl border p-4 space-y-3 ${
                      isExactAir ? "border-blue-400 bg-blue-50/40" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono font-black text-sm text-slate-900">
                          AIR {r.candidateRank.toLocaleString("en-IN")}
                        </div>
                        <div className="font-bold text-slate-900 text-xs leading-tight mt-0.5">{r.collegeName}</div>
                        <div className="text-[11px] text-slate-500">
                          📍 {r.state} • {r.managementType}
                        </div>
                      </div>
                      <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800 shrink-0">
                        {r.allottedCategory}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div>Quota: {r.quota}</div>
                      <div>Cand: {r.candidateCategory}</div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onToggleComparison(r.collegeId)}
                        className={`flex-1 rounded-xl py-1.5 text-xs font-bold ${
                          isCompared ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800 border border-slate-200"
                        }`}
                      >
                        {isCompared ? "✓ Comparing" : "Compare"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onTogglePlan({
                            collegeId: r.collegeId,
                            collegeName: r.collegeName,
                            state: r.state,
                            managementType: r.managementType,
                            route: "MCC",
                            quota: r.quota,
                            seatCategory: r.allottedCategory,
                            isPwD: r.allottedPwD,
                            medianAIR: r.candidateRank,
                            highestAIR: r.candidateRank,
                            sampleSize: 1,
                            estimatedPool: null,
                          })
                        }
                        className={`flex-1 rounded-xl py-1.5 text-xs font-bold ${
                          isPlanned ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {isPlanned ? "✓ In Plan" : "+ Add to Plan"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {windowData.total > windowData.pageSize && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                <div className="text-slate-500">
                  Showing {(page - 1) * windowData.pageSize + 1}–
                  {Math.min(page * windowData.pageSize, windowData.total)} of {windowData.total} allotments
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 disabled:opacity-40"
                  >
                    ← Previous
                  </button>
                  <span className="font-semibold text-slate-600">
                    Page {page} of {Math.ceil(windowData.total / windowData.pageSize)}
                  </span>
                  <button
                    type="button"
                    disabled={!windowData.hasMore}
                    onClick={() => handlePageChange(page + 1)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Domicile State Section ("[STATE] MEDICAL COLLEGES") */}
      {initialEvidence.domicileSummary && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-900 mb-1">
                <span>📍</span> State College Picture
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase">
                {domicileState} Medical Colleges
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                See the 2026 seat position and MCC Round-1 rank pattern for medical colleges in your domicile state.
              </p>
            </div>

            {/* Domicile State Count Badge */}
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-xs">
              <span>🏛️</span>
              <span>{initialEvidence.domicileSummary.totalColleges} Medical Colleges Listed</span>
            </div>
          </div>

          {/* Domicile Filter & Sort Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
            {/* Management Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-semibold text-slate-500 uppercase shrink-0">Type:</span>
              {(["ALL", "GOVERNMENT", "PRIVATE", "DEEMED", "INI"] as const).map((m) => (
                <button
                  key={`dom-mgmt-${m}`}
                  type="button"
                  onClick={() => setDomicileMgmtFilter(m)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all shrink-0 ${
                    domicileMgmtFilter === m
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  {m === "ALL" ? "All Colleges" : m}
                </button>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase shrink-0">Sort By:</span>
              <select
                value={domicileSort}
                onChange={(e: any) => setDomicileSort(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-800"
              >
                <option value="TYPICAL_AIR">Typical Open AIR (Lowest First)</option>
                <option value="BEST_AIR">Best Open AIR</option>
                <option value="LAST_AIR">Last Observed Open AIR</option>
                <option value="TOTAL_SEATS">Total MBBS Seats (Highest First)</option>
                <option value="NAME">College Name (A–Z)</option>
              </select>
            </div>
          </div>

          {/* Explanatory helper box rendered once near the top of the grid */}
          <div className="rounded-2xl bg-blue-50/60 border border-blue-100 p-4 text-xs text-slate-700 leading-relaxed grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <strong className="text-blue-950 font-bold block mb-0.5">Best AIR</strong>
              Best (numerically lowest) rank that received an allotment in this Round-1 pathway.
            </div>
            <div>
              <strong className="text-blue-950 font-bold block mb-0.5">Typical (Median) AIR</strong>
              Middle / median observed Round-1 rank for this pathway.
            </div>
            <div>
              <strong className="text-blue-950 font-bold block mb-0.5">Last Observed AIR</strong>
              Highest numerical AIR observed receiving an allotment in that pathway.
            </div>
          </div>

          {/* Domicile College Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedDomicileColleges.map((col) => {
              const openProfile = col.openRound1Profiles[0];
              const studentProfile = col.studentCategoryRound1Profiles[0];
              const targetQuota =
                studentCategory !== "OPEN" && studentProfile ? studentProfile.quota : openProfile?.quota || "All India";
              const targetSeatCat =
                studentCategory !== "OPEN" && studentProfile ? studentCategory : "OPEN";
              const defaultPlanKey = `${col.collegeId}__MCC__${targetQuota}__${targetSeatCat}__${isPwD}`;
              const isPlanned = plannedItemIds.has(defaultPlanKey);

              return (
                <CollegeEvidenceCard
                  key={`dom-col-${col.collegeId}`}
                  college={col}
                  studentAir={studentAir}
                  studentCategory={studentCategory}
                  isPwD={isPwD}
                  isCompared={selectedCollegeIds.includes(col.collegeId)}
                  onToggleCompare={onToggleComparison}
                  onViewDetails={(college) => {
                    onMeaningfulInteraction?.();
                    setActiveCategoryModalCollege(college);
                  }}
                  isInPlan={isPlanned}
                  onTogglePlan={onTogglePlan}
                  onMeaningfulInteraction={onMeaningfulInteraction}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Modal: View All Categories Detail for a College */}
      {activeCategoryModalCollege && (() => {
        const allProfiles = activeCategoryModalCollege.allCategoryProfiles;
        const sortedProfiles = sortCategoryProfiles(allProfiles, modalSortMode);

        const ordinaryProfiles = sortedProfiles.filter((p) => getPathwayGroup(p.quota) === "ORDINARY");
        const specialProfiles = sortedProfiles.filter((p) => getPathwayGroup(p.quota) === "SPECIAL");

        const ordinaryNonPwd = ordinaryProfiles.filter((p) => !p.isPwD);
        const ordinaryPwd = ordinaryProfiles.filter((p) => p.isPwD);

        const specialNonPwd = specialProfiles.filter((p) => !p.isPwD);
        const specialPwd = specialProfiles.filter((p) => p.isPwD);

        const renderProfileRow = (p: CollegeRound1CategoryProfile, idx: number) => {
          const planKey = `${activeCategoryModalCollege.collegeId}__MCC__${p.quota}__${p.seatCategory}__${p.isPwD}`;
          const isPlanned = plannedItemIds.has(planKey);
          const isBenchmark = isPrimaryOpenBenchmark(p, allProfiles);
          const friendlyQuota = getStudentFriendlyQuotaLabel(p.quota);

          let catBadgeClass = "bg-slate-100 text-slate-800";
          if (p.seatCategory === "EWS") catBadgeClass = "bg-amber-50 text-amber-900 border border-amber-200";
          else if (p.seatCategory === "OBC") catBadgeClass = "bg-blue-50 text-blue-900 border border-blue-200";
          else if (p.seatCategory === "SC") catBadgeClass = "bg-emerald-50 text-emerald-900 border border-emerald-200";
          else if (p.seatCategory === "ST") catBadgeClass = "bg-purple-50 text-purple-900 border border-purple-200";

          return (
            <tr
              key={`cat-prof-${idx}-${p.quota}-${p.seatCategory}-${p.isPwD}`}
              className={`hover:bg-slate-50/80 transition-colors ${
                isBenchmark ? "bg-blue-50/40 border-l-2 border-l-blue-600" : ""
              }`}
            >
              <td className="py-2.5 px-3">
                <div className="font-semibold text-slate-900 leading-tight">{friendlyQuota}</div>
                {friendlyQuota !== p.quota && (
                  <div className="text-[10px] text-slate-400 font-normal">Source: {p.quota}</div>
                )}
                {isBenchmark && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 text-blue-900 px-1.5 py-0.2 text-[9px] font-black uppercase mt-0.5">
                    Primary Open Benchmark
                  </span>
                )}
              </td>
              <td className="py-2.5 px-2">
                <div className="flex items-center gap-1">
                  <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${catBadgeClass}`}>
                    {p.seatCategory}
                  </span>
                  {p.isPwD && (
                    <span className="rounded bg-purple-100 text-purple-800 text-[10px] font-extrabold px-1 py-0.2">
                      PwD
                    </span>
                  )}
                </div>
              </td>
              <td className="py-2.5 px-2 text-right text-slate-600 font-mono">
                {p.seatsOffered}
                <span className="text-[10px] text-slate-400 ml-1">/ {p.seatsAllotted}</span>
              </td>
              <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                {p.bestAIR !== null ? p.bestAIR.toLocaleString("en-IN") : "—"}
              </td>
              <td className="py-2.5 px-2 text-right font-mono font-black text-blue-700">
                {p.medianAIR !== null ? p.medianAIR.toLocaleString("en-IN") : "—"}
              </td>
              <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                {p.highestAIR !== null ? p.highestAIR.toLocaleString("en-IN") : "—"}
              </td>
              <td className="py-2.5 px-3 text-right">
                <button
                  type="button"
                  onClick={() =>
                    onTogglePlan({
                      collegeId: activeCategoryModalCollege.collegeId,
                      collegeName: activeCategoryModalCollege.collegeName,
                      state: activeCategoryModalCollege.state,
                      managementType: activeCategoryModalCollege.managementType,
                      route: "MCC",
                      quota: p.quota,
                      seatCategory: p.seatCategory,
                      isPwD: p.isPwD,
                      medianAIR: p.medianAIR,
                      highestAIR: p.highestAIR,
                      sampleSize: p.sampleSize,
                      estimatedPool: activeCategoryModalCollege.approxOutsideMccRound1Pool,
                    })
                  }
                  className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${
                    isPlanned ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                  }`}
                >
                  {isPlanned ? "✓ In Plan" : "+ Plan"}
                </button>
              </td>
            </tr>
          );
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[88vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-block rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {activeCategoryModalCollege.managementType}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">📍 {activeCategoryModalCollege.state}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{activeCategoryModalCollege.collegeName}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCategoryModalCollege(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              {/* Controls Bar: Order By Toggle & Summary Count */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mr-1">
                    Order by:
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalSortMode("STANDARD")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      modalSortMode === "STANDARD"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                    }`}
                  >
                    Standard View (Recommended)
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalSortMode("BEST_AIR")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      modalSortMode === "BEST_AIR"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                    }`}
                  >
                    Best AIR (Numerical)
                  </button>
                </div>

                <div className="text-[11px] font-semibold text-slate-600">
                  {allProfiles.length} Quota/Category Pathways Recorded
                </div>
              </div>

              {/* Table Body */}
              <div className="overflow-y-auto space-y-4 flex-1 pr-1">
                {modalSortMode === "STANDARD" ? (
                  <div className="space-y-4">
                    {/* 1. Ordinary Round-1 Pathways Section */}
                    {ordinaryProfiles.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 bg-slate-100/80 px-3 py-1 rounded-lg">
                          🏛️ Ordinary Round-1 Pathways
                        </div>
                        <table className="w-full text-left text-xs border-collapse rounded-xl overflow-hidden border border-slate-200">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-500">
                              <th className="py-2.5 px-3">Quota / Pathway</th>
                              <th className="py-2.5 px-2">Category</th>
                              <th className="py-2.5 px-2 text-right">Offered / Allotted</th>
                              <th className="py-2.5 px-2 text-right">Best AIR</th>
                              <th className="py-2.5 px-2 text-right">Typical (Median) AIR</th>
                              <th className="py-2.5 px-2 text-right">Last AIR</th>
                              <th className="py-2.5 px-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {ordinaryNonPwd.map((p, idx) => renderProfileRow(p, idx))}
                            {ordinaryPwd.length > 0 && (
                              <>
                                <tr className="bg-purple-50/50">
                                  <td colSpan={7} className="py-1 px-3 text-[10px] font-bold uppercase tracking-wider text-purple-900">
                                    ♿ Persons with Disabilities (PwD) Pathways
                                  </td>
                                </tr>
                                {ordinaryPwd.map((p, idx) => renderProfileRow(p, idx + 1000))}
                              </>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* 2. Special & Institutional Pathways Section */}
                    {specialProfiles.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 bg-slate-100/80 px-3 py-1 rounded-lg">
                          ⚙️ Special & Institutional Pathways
                        </div>
                        <table className="w-full text-left text-xs border-collapse rounded-xl overflow-hidden border border-slate-200">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-500">
                              <th className="py-2.5 px-3">Quota / Pathway</th>
                              <th className="py-2.5 px-2">Category</th>
                              <th className="py-2.5 px-2 text-right">Offered / Allotted</th>
                              <th className="py-2.5 px-2 text-right">Best AIR</th>
                              <th className="py-2.5 px-2 text-right">Typical (Median) AIR</th>
                              <th className="py-2.5 px-2 text-right">Last AIR</th>
                              <th className="py-2.5 px-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {specialNonPwd.map((p, idx) => renderProfileRow(p, idx + 2000))}
                            {specialPwd.length > 0 && (
                              <>
                                <tr className="bg-purple-50/50">
                                  <td colSpan={7} className="py-1 px-3 text-[10px] font-bold uppercase tracking-wider text-purple-900">
                                    ♿ Persons with Disabilities (PwD) Pathways
                                  </td>
                                </tr>
                                {specialPwd.map((p, idx) => renderProfileRow(p, idx + 3000))}
                              </>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Flat Best AIR Table View */
                  <table className="w-full text-left text-xs border-collapse rounded-xl overflow-hidden border border-slate-200">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-500">
                        <th className="py-2.5 px-3">Quota / Pathway</th>
                        <th className="py-2.5 px-2">Category</th>
                        <th className="py-2.5 px-2 text-right">Offered / Allotted</th>
                        <th className="py-2.5 px-2 text-right">Best AIR</th>
                        <th className="py-2.5 px-2 text-right">Typical (Median) AIR</th>
                        <th className="py-2.5 px-2 text-right">Last AIR</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedProfiles.map((p, idx) => renderProfileRow(p, idx))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="text-slate-500 text-[11px]">
                  Factual Round-1 MCC allotments & seat matrix.
                </div>
                <div className="flex items-center gap-2">
                  {activeCategoryModalCollege.slug && (
                    <Link
                      href={`/neet-to-mbbs/colleges/${activeCategoryModalCollege.slug}/counselling-2026`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    >
                      <span>View College Page</span>
                      <span>→</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveCategoryModalCollege(null)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

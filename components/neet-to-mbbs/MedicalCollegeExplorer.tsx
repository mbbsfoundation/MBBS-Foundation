"use client";

import React, { useState, useEffect, useTransition } from "react";
import type {
  DomicileCollegeSummary,
  CollegeRound1CategoryProfile,
  CollegeTypeFilter,
  CollegeSortOption,
  CollegeSearchResult,
} from "@/lib/counselling/evidenceTypes";
import {
  sortCategoryProfiles,
  getStudentFriendlyQuotaLabel,
  getPathwayGroup,
  isPrimaryOpenBenchmark,
  getPrimaryOpenBenchmark,
} from "@/lib/counselling/pathwayOrdering";
import CollegeEvidenceCard from "./CollegeEvidenceCard";

const INDIAN_STATES_AND_UTS = [
  "All States",
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

interface MedicalCollegeExplorerProps {
  selectedCollegeIds: string[];
  onToggleComparison: (collegeId: string) => void;
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
  onMeaningfulInteraction?: () => void;
}

export default function MedicalCollegeExplorer({
  selectedCollegeIds,
  onToggleComparison,
  plannedItemIds,
  onTogglePlan,
  onMeaningfulInteraction,
}: MedicalCollegeExplorerProps) {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("All States");
  const [selectedType, setSelectedType] = useState<CollegeTypeFilter>("ALL");
  const [sortBy, setSortBy] = useState<CollegeSortOption>("TYPICAL_AIR");
  const [page, setPage] = useState<number>(1);

  // Result State
  const [data, setData] = useState<CollegeSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [activeDetailCollege, setActiveDetailCollege] = useState<DomicileCollegeSummary | null>(null);
  const [modalSortMode, setModalSortMode] = useState<"STANDARD" | "BEST_AIR">("STANDARD");

  // Fetch colleges from server
  const fetchColleges = async (
    q: string,
    st: string,
    tp: CollegeTypeFilter,
    sb: CollegeSortOption,
    p: number
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("query", q.trim());
      if (st && st !== "All States") params.set("state", st);
      if (tp && tp !== "ALL") params.set("collegeType", tp);
      params.set("sortBy", sb);
      params.set("page", p.toString());
      params.set("pageSize", "24");
      params.set("includeEvidence", "true");

      const res = await fetch(`/api/counselling/colleges?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load medical colleges.");
      }
      const json: CollegeSearchResult = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching medical colleges.");
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search when text changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchColleges(searchQuery, selectedState, selectedType, sortBy, 1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedState, selectedType, sortBy]);

  // Page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchColleges(searchQuery, selectedState, selectedType, sortBy, newPage);
    window.scrollTo({ top: 200, behavior: "smooth" });
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedState("All States");
    setSelectedType("ALL");
    setSortBy("TYPICAL_AIR");
    setPage(1);
  };

  // Open modal
  const handleOpenModal = (college: DomicileCollegeSummary) => {
    setActiveDetailCollege(college);
    setModalSortMode("STANDARD");
    onMeaningfulInteraction?.();
  };

  // Header summary string
  const getHeaderTitle = () => {
    if (isLoading && !data) return "Searching Medical Colleges...";
    if (!data) return "Medical Colleges";

    const parts: string[] = [];
    if (selectedType === "GOVERNMENT") parts.push("Government");
    else if (selectedType === "PRIVATE") parts.push("Private");
    else if (selectedType === "DEEMED") parts.push("Deemed University");
    else if (selectedType === "CENTRAL") parts.push("Central University");
    else if (selectedType === "INI") parts.push("INI");
    else if (selectedType === "ESIC") parts.push("ESIC");

    parts.push("Medical Colleges");

    if (selectedState !== "All States") {
      parts.push(`in ${selectedState}`);
    }

    if (searchQuery.trim()) {
      parts.push(`matching "${searchQuery.trim()}"`);
    }

    return `${parts.join(" ")} (${data.total.toLocaleString("en-IN")})`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Guidance */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-900">
            <span>🏛️</span>
            <span>NATIONAL MEDICAL COLLEGE DIRECTORY</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Explore Medical Colleges & Round-1 AIR Patterns
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            Search medical colleges in the 2026 counselling dataset to view approved 2026 MBBS seats, MCC Round-1 seat
            structure and actual category-wise AIR patterns. No student AIR is required.
          </p>
        </div>

        {/* 2. Primary Filter Discovery Controls (Row 1: State, College Type, Sort By) */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* State Filter */}
          <div className="space-y-1.5">
            <label htmlFor="college-state-select" className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
              State / UT
            </label>
            <select
              id="college-state-select"
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                onMeaningfulInteraction?.();
              }}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 px-3 py-2.5 text-xs font-bold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
            >
              {INDIAN_STATES_AND_UTS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* College Type Filter */}
          <div className="space-y-1.5">
            <label htmlFor="college-type-select" className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
              College Type
            </label>
            <select
              id="college-type-select"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as CollegeTypeFilter);
                onMeaningfulInteraction?.();
              }}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 px-3 py-2.5 text-xs font-bold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
            >
              <option value="ALL">All Medical Colleges</option>
              <option value="GOVERNMENT">Government Medical Colleges</option>
              <option value="PRIVATE">Private Medical Colleges</option>
              <option value="DEEMED">Deemed University (MCC UG NEET Seat Matrix 2026)</option>
              <option value="CENTRAL">Central University (MCC UG NEET Seat Matrix 2026)</option>
              <option value="INI">Institutes of National Importance (AIIMS / JIPMER)</option>
              <option value="ESIC">ESIC Medical Colleges</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="space-y-1.5">
            <label htmlFor="college-sort-select" className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
              Sort By
            </label>
            <select
              id="college-sort-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as CollegeSortOption);
                onMeaningfulInteraction?.();
              }}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 px-3 py-2.5 text-xs font-bold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
            >
              <option value="TYPICAL_AIR">Typical (Median) Open AIR — Strongest First</option>
              <option value="BEST_AIR">Best Open AIR — Strongest First</option>
              <option value="LAST_AIR">Last Observed Open AIR — Strongest First</option>
              <option value="TOTAL_SEATS">Total MBBS Seats — High to Low</option>
              <option value="NAME">College Name (A to Z)</option>
              <option value="STATE">State (A to Z)</option>
            </select>
          </div>
        </div>

        {/* Informational Source Note */}
        <p className="mt-2.5 text-[11px] text-slate-500 font-medium">
          ℹ️ Government/Private classification follows NMC Management; Deemed/Central University grouping follows MCC UG NEET Seat Matrix 2026.
        </p>

        {/* 3. Secondary Optional Filter Row (College Name / City Search) */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="space-y-1.5 max-w-2xl">
            <label htmlFor="college-search-input" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Optional: Search a Specific College
            </label>
            <div className="relative">
              <input
                id="college-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.length > 2) onMeaningfulInteraction?.();
                }}
                placeholder="Type college name or city..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-xs font-bold text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase mr-1">Quick Filters:</span>
          <button
            type="button"
            onClick={() => {
              setSelectedType("GOVERNMENT");
              setSelectedState("All States");
            }}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              selectedType === "GOVERNMENT" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            🏛️ Government
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedType("INI");
              setSelectedState("All States");
            }}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              selectedType === "INI" ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
            }`}
          >
            ⭐ INI Institutions
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedType("DEEMED");
              setSelectedState("All States");
            }}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              selectedType === "DEEMED" ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-800 hover:bg-purple-100"
            }`}
          >
            🏢 Deemed Universities
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedState("Rajasthan");
              setSelectedType("ALL");
            }}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              selectedState === "Rajasthan" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            📍 Rajasthan
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedState("Delhi");
              setSelectedType("ALL");
            }}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              selectedState === "Delhi" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            📍 Delhi
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedState("Karnataka");
              setSelectedType("ALL");
            }}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              selectedState === "Karnataka" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            📍 Karnataka
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedState("Maharashtra");
              setSelectedType("ALL");
            }}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              selectedState === "Maharashtra" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            📍 Maharashtra
          </button>

          {(searchQuery || selectedState !== "All States" || selectedType !== "ALL" || sortBy !== "TYPICAL_AIR") && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="ml-auto text-[11px] font-bold text-red-600 hover:text-red-800 underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Results Header with Typical (Median) AIR Helper */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="space-y-0.5">
          <h3 className="text-base sm:text-lg font-black text-slate-900">{getHeaderTitle()}</h3>
          <p className="text-xs text-slate-500">
            💡 <strong>Typical (Median) AIR</strong> is the middle observed Round-1 AIR for the college&apos;s primary Open pathway. Lower AIR generally indicates stronger Round-1 competition.
          </p>
        </div>
        {data && (
          <div className="text-xs font-semibold text-slate-500 shrink-0">
            Showing {(page - 1) * data.pageSize + 1}–{Math.min(page * data.pageSize, data.total)} of{" "}
            {data.total.toLocaleString("en-IN")} colleges
          </div>
        )}
      </div>

      {/* 4. Loading & Error States */}
      {isLoading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          <p className="text-xs font-bold text-slate-500 mt-3">Loading medical colleges & Round-1 statistics...</p>
        </div>
      )}

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-xs font-bold text-red-800">
          ⚠️ {error}
        </div>
      )}

      {/* 5. Empty Results State */}
      {!isLoading && data && data.items.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <div className="text-3xl">🔍</div>
          <h4 className="text-base font-bold text-slate-900">No medical colleges match your criteria</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search query, clearing the state filter, or selecting &quot;All College Types&quot;.
          </p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* 6. Medical College Cards Grid */}
      {!isLoading && data && data.items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.items.map((col) => (
            <CollegeEvidenceCard
              key={`explorer-col-${col.collegeId}`}
              college={col}
              isCompared={selectedCollegeIds.includes(col.collegeId)}
              onToggleCompare={onToggleComparison}
              onViewDetails={setActiveDetailCollege}
              onMeaningfulInteraction={onMeaningfulInteraction}
            />
          ))}
        </div>
      )}

      {/* 7. Pagination Controls */}
      {!isLoading && data && data.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white border border-slate-200 p-4 text-xs">
          <div className="text-slate-500 font-semibold">
            Page {data.page} of {data.totalPages} ({data.total.toLocaleString("en-IN")} total medical colleges)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handlePageChange(Math.max(1, data.page - 1))}
              disabled={data.page <= 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ← Previous
            </button>

            {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (data.totalPages > 5) {
                if (data.page > 3) {
                  pageNum = data.page - 2 + i;
                }
                if (pageNum > data.totalPages) {
                  pageNum = data.totalPages - (4 - i);
                }
              }

              return (
                <button
                  key={`page-${pageNum}`}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`rounded-lg px-3 py-1.5 font-bold text-xs transition ${
                    data.page === pageNum
                      ? "bg-slate-900 text-white shadow-xs"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => handlePageChange(Math.min(data.totalPages, data.page + 1))}
              disabled={data.page >= data.totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* 8. Modal: View All Categories Detail for a College */}
      {activeDetailCollege && (() => {
        const allProfiles = activeDetailCollege.allCategoryProfiles;
        const sortedProfiles = sortCategoryProfiles(allProfiles, modalSortMode);

        const ordinaryProfiles = sortedProfiles.filter((p) => getPathwayGroup(p.quota) === "ORDINARY");
        const specialProfiles = sortedProfiles.filter((p) => getPathwayGroup(p.quota) === "SPECIAL");

        const ordinaryNonPwd = ordinaryProfiles.filter((p) => !p.isPwD);
        const ordinaryPwd = ordinaryProfiles.filter((p) => p.isPwD);

        const specialNonPwd = specialProfiles.filter((p) => !p.isPwD);
        const specialPwd = specialProfiles.filter((p) => p.isPwD);

        const renderProfileRow = (p: CollegeRound1CategoryProfile, idx: number) => {
          const planKey = `${activeDetailCollege.collegeId}__MCC__${p.quota}__${p.seatCategory}__${p.isPwD}`;
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
                      collegeId: activeDetailCollege.collegeId,
                      collegeName: activeDetailCollege.collegeName,
                      state: activeDetailCollege.state,
                      managementType: activeDetailCollege.managementType,
                      route: "MCC",
                      quota: p.quota,
                      seatCategory: p.seatCategory,
                      isPwD: p.isPwD,
                      medianAIR: p.medianAIR,
                      highestAIR: p.highestAIR,
                      sampleSize: p.sampleSize,
                      estimatedPool: activeDetailCollege.approxOutsideMccRound1Pool,
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
                      {activeDetailCollege.managementType}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">📍 {activeDetailCollege.state}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{activeDetailCollege.collegeName}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDetailCollege(null)}
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
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-slate-500 text-[11px]">
                  Factual MCC Round-1 allotments and approved 2026 college capacities.
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDetailCollege(null)}
                  className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

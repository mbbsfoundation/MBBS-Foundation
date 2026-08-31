"use client";

import React, { useState, useTransition, useCallback } from "react";
import type { CounsellingRecommendation, OpportunityBand } from "@/lib/counselling/recommendationEngine";
import Round1EvidenceExplorer from "./Round1EvidenceExplorer";
import MedicalCollegeExplorer from "./MedicalCollegeExplorer";
import BookDiscoveryCard from "./BookDiscoveryCard";
import BookEngagementPrompt from "./BookEngagementPrompt";
import type { Round1EvidenceResponse } from "@/lib/counselling/evidenceTypes";

const INDIAN_STATES_AND_UTS = [
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
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
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

export interface PersonalCollegeFactors {
  annualTuition?: number;
  firstYearCost?: number;
  hostelCost?: number;
  serviceBond?: "YES" | "NO" | "UNKNOWN";
  bondDurationYears?: number;
  bondPenalty?: number;
  personalNote?: string;
}

export interface CounsellingPlanItem {
  id: string; // Unique key: collegeId__route__quota__seatCategory__isPwD
  collegeId: string;
  collegeName: string;
  state: string;
  managementType: string;
  route: string;
  quota: string;
  seatCategory: string;
  isPwD: boolean;
  opportunityBand: OpportunityBand;
  medianAIR: number | null;
  highestAIR: number | null;
  sampleSize: number;
  estimatedPool: number | null;
  reasonSummary: string;
  reasonCodes: string[];
  routeGroup: "MCC" | "STATE" | "INSTITUTIONAL";
  addedAt: number;
}

interface RecommendationResponse {
  profile: {
    air: number;
    category: string;
    isPwD: boolean;
    domicileState: string;
    goal: string;
  };
  summary: {
    totalEvaluated: number;
    totalReturned: number;
    strong: number;
    realistic: number;
    stretch: number;
    lowEvidence: number;
  };
  recommendations: CounsellingRecommendation[];
}

export function getRouteGroup(r: { route: string; quota: string; reasonCodes?: string[] }): "MCC" | "STATE" | "INSTITUTIONAL" {
  if (r.route === "STATE_ESTIMATE" || (r.reasonCodes && r.reasonCodes.includes("STATE_RANK_DATA_AWAITED"))) {
    return "STATE";
  }
  const q = r.quota.toLowerCase();
  if (
    q.includes("delhi university") ||
    q.includes("ip university") ||
    q.includes("insured person") ||
    q.includes("aligarh muslim") ||
    q.includes("puducherry") ||
    q.includes("armed forces") ||
    q.includes("internal")
  ) {
    return "INSTITUTIONAL";
  }
  return "MCC";
}

export default function Round2Planner() {
  // Top-Level Entry Mode: Explore by AIR vs Explore Medical Colleges
  const [entryMode, setEntryMode] = useState<"AIR" | "COLLEGES">("AIR");

  // Form State
  const [air, setAir] = useState<string>("");
  const [category, setCategory] = useState<string>("OPEN");
  const [isPwD, setIsPwD] = useState<boolean>(false);
  const [domicileState, setDomicileState] = useState<string>("Delhi");
  const [goal, setGoal] = useState<string>("GET_SEAT");

  // Advanced Special Pathways State (Collapsed by default)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [isNRI, setIsNRI] = useState<boolean>(false);
  const [isESI, setIsESI] = useState<boolean>(false);
  const [isCW, setIsCW] = useState<boolean>(false);
  const [isInternalDU, setIsInternalDU] = useState<boolean>(false);
  const [isInternalIPU, setIsInternalIPU] = useState<boolean>(false);
  const [isInternalPuducherry, setIsInternalPuducherry] = useState<boolean>(false);
  const [isAMUInternal, setIsAMUInternal] = useState<boolean>(false);
  const [isMinority, setIsMinority] = useState<boolean>(false);
  const [minorityType, setMinorityType] = useState<string>("MUSLIM");

  // Filter State
  const [selectedManagementGroup, setSelectedManagementGroup] = useState<string>("ALL"); // ALL, GOVT_CENTRAL, PRIVATE_DEEMED
  const [selectedRoute, setSelectedRoute] = useState<string>("ALL");
  const [filterExpansionOnly, setFilterExpansionOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Loading & Results State
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [evidenceData, setEvidenceData] = useState<Round1EvidenceResponse | null>(null);

  // Comparison State (Transient in memory)
  const [selectedCollegeIds, setSelectedCollegeIds] = useState<string[]>([]);
  const [comparisonNotice, setComparisonNotice] = useState<string | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState<boolean>(false);

  // Personal Decision Factors State (Transient in React memory)
  const [personalFactors, setPersonalFactors] = useState<Record<string, PersonalCollegeFactors>>({});

  // Planning List State (Transient in React memory)
  const [planningItems, setPlanningItems] = useState<CounsellingPlanItem[]>([]);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [includeNotesInPrint, setIncludeNotesInPrint] = useState<boolean>(true);

  // Meaningful exploration tracking for contextual book discovery
  const [hasMeaningfulExploration, setHasMeaningfulExploration] = useState<boolean>(false);
  const recordMeaningfulExploration = useCallback(() => {
    setHasMeaningfulExploration(true);
  }, []);

  // Expanded card IDs
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());
  const [showLimitedEvidenceSection, setShowLimitedEvidenceSection] = useState<boolean>(false);
  const [visibleCountPerStream, setVisibleCountPerStream] = useState<Record<string, number>>({
    GOVT: 8,
    STATE: 8,
    PRIVATE: 8,
    LIMITED: 8,
  });

  const toggleCard = (id: string) => {
    recordMeaningfulExploration();
    setExpandedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleShowMore = (streamKey: string) => {
    setVisibleCountPerStream((prev) => ({
      ...prev,
      [streamKey]: (prev[streamKey] || 8) + 12,
    }));
  };

  // Comparison Handlers
  const handleToggleComparison = (collegeId: string) => {
    setComparisonNotice(null);
    recordMeaningfulExploration();
    setSelectedCollegeIds((prev) => {
      if (prev.includes(collegeId)) {
        return prev.filter((id) => id !== collegeId);
      }
      if (prev.length >= 3) {
        setComparisonNotice("You can compare up to 3 colleges at a time.");
        return prev;
      }
      return [...prev, collegeId];
    });
  };

  const handleClearComparison = () => {
    setSelectedCollegeIds([]);
    setComparisonNotice(null);
  };

  const handleUpdatePersonalFactors = (collegeId: string, factors: PersonalCollegeFactors) => {
    setPersonalFactors((prev) => ({
      ...prev,
      [collegeId]: factors,
    }));
  };

  const handleClearPersonalFactors = (collegeId: string) => {
    setPersonalFactors((prev) => {
      const next = { ...prev };
      delete next[collegeId];
      return next;
    });
  };

  // Planning List Handlers
  const handleTogglePlanItem = (r: CounsellingRecommendation) => {
    recordMeaningfulExploration();
    const itemId = `${r.collegeId}__${r.route}__${r.quota}__${r.seatCategory}__${r.isPwD}`;
    setPlanningItems((prev) => {
      const exists = prev.some((item) => item.id === itemId);
      if (exists) {
        return prev.filter((item) => item.id !== itemId);
      }
      const newItem: CounsellingPlanItem = {
        id: itemId,
        collegeId: r.collegeId,
        collegeName: r.collegeName,
        state: r.state,
        managementType: r.managementType,
        route: r.route,
        quota: r.quota,
        seatCategory: r.seatCategory,
        isPwD: r.isPwD,
        opportunityBand: r.opportunityBand,
        medianAIR: r.medianAIR,
        highestAIR: r.highestAIR,
        sampleSize: r.sampleSize,
        estimatedPool: r.estimatedPool,
        reasonSummary: r.reasonSummary,
        reasonCodes: r.reasonCodes,
        routeGroup: getRouteGroup(r),
        addedAt: Date.now(),
      };
      return [...prev, newItem];
    });
  };

  const handleTogglePlanFromEvidence = (item: {
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
  }) => {
    recordMeaningfulExploration();
    const itemId = `${item.collegeId}__${item.route}__${item.quota}__${item.seatCategory}__${item.isPwD}`;
    setPlanningItems((prev) => {
      const exists = prev.some((i) => i.id === itemId);
      if (exists) {
        return prev.filter((i) => i.id !== itemId);
      }
      const newItem: CounsellingPlanItem = {
        id: itemId,
        collegeId: item.collegeId,
        collegeName: item.collegeName,
        state: item.state,
        managementType: item.managementType,
        route: item.route,
        quota: item.quota,
        seatCategory: item.seatCategory,
        isPwD: item.isPwD,
        opportunityBand: "REALISTIC" as OpportunityBand,
        medianAIR: item.medianAIR,
        highestAIR: item.highestAIR,
        sampleSize: item.sampleSize,
        estimatedPool: item.estimatedPool,
        reasonSummary: `Round-1 Median AIR: ${item.medianAIR?.toLocaleString("en-IN") ?? "N/A"}`,
        reasonCodes: ["ROUND1_EVIDENCE_RECORD"],
        routeGroup: getRouteGroup({ route: item.route, quota: item.quota }),
        addedAt: Date.now(),
      };
      return [...prev, newItem];
    });
  };

  const handleRemovePlanItem = (id: string) => {
    setPlanningItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMovePlanItem = (id: string, direction: "UP" | "DOWN") => {
    setPlanningItems((prev) => {
      const targetItem = prev.find((item) => item.id === id);
      if (!targetItem) return prev;

      // Group items by routeGroup to move within their specific authority list
      const groupItems = prev.filter((item) => item.routeGroup === targetItem.routeGroup);
      const otherItems = prev.filter((item) => item.routeGroup !== targetItem.routeGroup);

      const idx = groupItems.findIndex((item) => item.id === id);
      if (idx === -1) return prev;
      if (direction === "UP" && idx === 0) return prev;
      if (direction === "DOWN" && idx === groupItems.length - 1) return prev;

      const targetIdx = direction === "UP" ? idx - 1 : idx + 1;
      const reorderedGroup = [...groupItems];
      const temp = reorderedGroup[idx];
      reorderedGroup[idx] = reorderedGroup[targetIdx];
      reorderedGroup[targetIdx] = temp;

      return [...otherItems, ...reorderedGroup];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedAir = parseInt(air.replace(/,/g, "").trim(), 10);
    if (isNaN(parsedAir) || parsedAir <= 0 || parsedAir > 2500000) {
      setErrorMessage("Please enter a valid NEET-UG 2026 All India Rank (AIR) between 1 and 2,500,000.");
      return;
    }

    setIsLoading(true);

    // Rule: Clear previous comparison state, personal values, and plan on new profile submission
    setSelectedCollegeIds([]);
    setIsComparisonModalOpen(false);
    setComparisonNotice(null);
    setPersonalFactors({});
    setPlanningItems([]);
    setIsPlanModalOpen(false);
    setEvidenceData(null);

    try {
      const payload = {
        air: parsedAir,
        category,
        isPwD,
        domicileState,
        goal,
        specialPathwayEligibility: {
          isNRI,
          isESI,
          isCW,
          isInternalDU,
          isInternalIPU,
          isInternalPuducherry,
          isAMUInternal,
          isMinority,
          minorityType: isMinority ? minorityType : undefined,
        },
        limitPerBand: 50,
      };

      const evidenceUrl = `/api/counselling/round1/evidence?air=${parsedAir}&category=${category}&domicileState=${encodeURIComponent(
        domicileState
      )}&window=500&categoryMode=ELIGIBLE&isPwD=${isPwD ? "true" : "false"}`;

      const [resRec, resEvidence] = await Promise.all([
        fetch("/api/counselling/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        fetch(evidenceUrl),
      ]);

      if (!resRec.ok) {
        const errData = await resRec.json().catch(() => ({}));
        throw new Error(errData?.error?.message || "Failed to calculate recommendations. Please check inputs.");
      }

      const jsonRec: RecommendationResponse = await resRec.json();
      const jsonEvidence: Round1EvidenceResponse = resEvidence.ok ? await resEvidence.json() : null;

      startTransition(() => {
        setData(jsonRec);
        setEvidenceData(jsonEvidence);
        setIsLoading(false);
      });
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while generating recommendations.");
      setIsLoading(false);
    }
  };

  // Group recommendations into decision streams
  const allRecs = data?.recommendations || [];

  // Filter recommendations based on user filter controls
  const filteredRecs = allRecs.filter((r) => {
    const isGovtCentral = r.managementType === "GOVERNMENT" || r.isINI || r.isCentralUniversity || r.isESIC;
    const isPrivateDeemed = !isGovtCentral;

    if (selectedManagementGroup === "GOVT_CENTRAL" && !isGovtCentral) return false;
    if (selectedManagementGroup === "PRIVATE_DEEMED" && !isPrivateDeemed) return false;

    if (selectedRoute !== "ALL" && r.route !== selectedRoute) return false;
    if (filterExpansionOnly && !(r.seatIncrease2026 > 0 || r.isNewEstablishment2026)) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = r.collegeName.toLowerCase().includes(q);
      const matchState = r.state.toLowerCase().includes(q);
      const matchQuota = r.quota.toLowerCase().includes(q);
      if (!matchName && !matchState && !matchQuota) return false;
    }
    return true;
  });

  // STREAM 1: MCC Government & Central Counselling Opportunities
  const mccGovtRecs = filteredRecs.filter(
    (r) =>
      r.route === "MCC" &&
      (r.managementType === "GOVERNMENT" || r.isINI || r.isCentralUniversity || r.isESIC) &&
      r.opportunityBand !== "LOW_EVIDENCE"
  );

  // STREAM 2: State Counselling Opportunities (Domicile state prioritized first)
  const stateOpportunityRecs = filteredRecs
    .filter((r) => r.route === "STATE_ESTIMATE" || r.reasonCodes.includes("STATE_RANK_DATA_AWAITED"))
    .sort((a, b) => {
      const aIsDomicile = a.state.toLowerCase() === domicileState.toLowerCase();
      const bIsDomicile = b.state.toLowerCase() === domicileState.toLowerCase();
      if (aIsDomicile && !bIsDomicile) return -1;
      if (!aIsDomicile && bIsDomicile) return 1;
      return 0;
    });

  // STREAM 3: Private & Deemed Counselling Opportunities
  const mccPrivateRecs = filteredRecs.filter(
    (r) =>
      r.route === "MCC" &&
      !(r.managementType === "GOVERNMENT" || r.isINI || r.isCentralUniversity || r.isESIC) &&
      r.opportunityBand !== "LOW_EVIDENCE"
  );

  // STREAM 4: Other Options with Limited Current Evidence (MCC Low Evidence)
  const otherLimitedRecs = filteredRecs.filter(
    (r) => r.opportunityBand === "LOW_EVIDENCE" && r.route === "MCC" && !r.reasonCodes.includes("STATE_RANK_DATA_AWAITED")
  );

  // Helper to get college name map for selected comparison colleges
  const selectedCollegesSummary = selectedCollegeIds.map((id) => {
    const matchingRec = allRecs.find((r) => r.collegeId === id);
    return {
      id,
      name: matchingRec?.collegeName || id,
    };
  });

  // Plan items breakdown
  const mccPlanItems = planningItems.filter((i) => i.routeGroup === "MCC");
  const statePlanItems = planningItems.filter((i) => i.routeGroup === "STATE");
  const institutionalPlanItems = planningItems.filter((i) => i.routeGroup === "INSTITUTIONAL");

  return (
    <div className="w-full space-y-6 pb-24">
      {/* 1. Compact Hero Header */}
      <div className="rounded-3xl border border-slate-200 bg-linear-to-b from-white to-slate-50/70 p-4 sm:p-6 shadow-xs no-print">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-blue-900">
            <span>🎯</span>
            <span>NEET 2026 • Counselling Decision Support</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
            NEET-UG 2026 Counselling Planner
          </h1>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
            Explore actual Round-1 allotments, understand medical-college AIR patterns and organise your counselling choices.
          </p>
          <div className="pt-1 text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
            <span>📊</span>
            <span>Based on MCC Round-1 allotment & seat-matrix data and available 2026 NMC MBBS seat data.</span>
          </div>
        </div>

        {/* Compact Status Indicators */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-900">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>MCC Round-1 Evidence Available</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            <span>Official Round-2 Vacancy: Awaiting Release</span>
          </div>
        </div>
      </div>

      {/* 2. Primary Entry Choices (Prominent Radio-Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto my-2 no-print">
        {/* Card 1: Explore by AIR */}
        <button
          type="button"
          onClick={() => {
            setEntryMode("AIR");
          }}
          className={`group relative rounded-3xl p-5 text-left transition-all duration-200 border-2 flex items-start gap-4 cursor-pointer ${
            entryMode === "AIR"
              ? "bg-blue-50/70 border-blue-600 shadow-md ring-2 ring-blue-100"
              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs"
          }`}
        >
          <div
            className={`p-3 rounded-2xl text-2xl shrink-0 transition-colors ${
              entryMode === "AIR" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 group-hover:bg-slate-200"
            }`}
          >
            🎯
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-black tracking-wider uppercase ${
                  entryMode === "AIR" ? "text-blue-900" : "text-slate-700"
                }`}
              >
                I Have An AIR
              </span>
              <span
                className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  entryMode === "AIR" ? "border-blue-600 bg-blue-600" : "border-slate-300"
                }`}
              >
                {entryMode === "AIR" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              EXPLORE BY AIR
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-snug">
              See actual Round-1 allotments around your AIR and category.
            </p>
          </div>
        </button>

        {/* Card 2: Explore Medical Colleges */}
        <button
          type="button"
          onClick={() => {
            setEntryMode("COLLEGES");
          }}
          className={`group relative rounded-3xl p-5 text-left transition-all duration-200 border-2 flex items-start gap-4 cursor-pointer ${
            entryMode === "COLLEGES"
              ? "bg-indigo-50/70 border-indigo-600 shadow-md ring-2 ring-indigo-100"
              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs"
          }`}
        >
          <div
            className={`p-3 rounded-2xl text-2xl shrink-0 transition-colors ${
              entryMode === "COLLEGES" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 group-hover:bg-slate-200"
            }`}
          >
            🏛️
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-black tracking-wider uppercase ${
                  entryMode === "COLLEGES" ? "text-indigo-900" : "text-slate-700"
                }`}
              >
                I Want To Explore Colleges
              </span>
              <span
                className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  entryMode === "COLLEGES" ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                }`}
              >
                {entryMode === "COLLEGES" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              EXPLORE MEDICAL COLLEGES
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-snug">
              Browse colleges by state/type and compare their Round-1 AIR patterns.
            </p>
          </div>
        </button>
      </div>

      {entryMode === "COLLEGES" ? (
        <MedicalCollegeExplorer
          selectedCollegeIds={selectedCollegeIds}
          onToggleComparison={handleToggleComparison}
          plannedItemIds={new Set(planningItems.map((i) => i.id))}
          onTogglePlan={handleTogglePlanFromEvidence}
          onMeaningfulInteraction={recordMeaningfulExploration}
        />
      ) : (
        <>
          {/* 2. Intake Form */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm no-print">
            <div className="mb-6 space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Enter Your Counselling Profile</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Your details are processed in memory to compute deterministic evidence. Profiles are never stored.
              </p>
            </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* AIR Input */}
            <div className="space-y-1.5">
              <label htmlFor="air-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                NEET-UG 2026 AIR <span className="text-red-500">*</span>
              </label>
              <input
                id="air-input"
                type="text"
                required
                value={air}
                onChange={(e) => setAir(e.target.value)}
                placeholder="e.g. 14,250"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            {/* Category Select */}
            <div className="space-y-1.5">
              <label htmlFor="category-select" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
              >
                <option value="OPEN">General / Open</option>
                <option value="OBC">OBC (Other Backward Class)</option>
                <option value="EWS">EWS (Economically Weaker)</option>
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
              </select>
            </div>

            {/* Domicile State Select */}
            <div className="space-y-1.5">
              <label htmlFor="domicile-select" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Domicile State <span className="text-red-500">*</span>
              </label>
              <select
                id="domicile-select"
                value={domicileState}
                onChange={(e) => setDomicileState(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
              >
                {INDIAN_STATES_AND_UTS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Goal Select */}
            <div className="space-y-1.5">
              <label htmlFor="goal-select" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Counselling Goal
              </label>
              <select
                id="goal-select"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
              >
                <option value="GET_SEAT">Get a seat in Round 2</option>
                <option value="UPGRADE">Upgrade my current Round-1 seat</option>
                <option value="COMPARE">Compare my options</option>
                <option value="RETAIN">Understand whether to retain my seat</option>
              </select>
            </div>
          </div>

          {/* PwD Toggle Button */}
          <div className="flex items-center gap-3 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Person with Disability (PwD) Horizontal Reservation:
            </span>
            <div className="inline-flex rounded-xl border border-slate-300 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setIsPwD(false)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  !isPwD ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => setIsPwD(true)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  isPwD ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Yes (PwD)
              </button>
            </div>
          </div>

          {/* Collapsible Advanced Special Pathways */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center justify-between text-left text-xs sm:text-sm font-bold text-slate-800 hover:text-blue-600 transition"
            >
              <span className="flex items-center gap-2">
                <span>⚙️</span>
                <span>Additional Counselling Eligibility (Optional Special Quotas)</span>
              </span>
              <span className="text-slate-500 text-xs font-medium">
                {showAdvanced ? "▲ Hide special quotas" : "▼ Show special quotas"}
              </span>
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 pt-3 border-t border-slate-200/80">
                <p className="text-xs text-slate-500">
                  Select only if you know that you meet the applicable counselling eligibility criteria.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 cursor-pointer hover:border-blue-300 transition">
                    <input
                      type="checkbox"
                      checked={isInternalDU}
                      onChange={(e) => setIsInternalDU(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Delhi University (DU) Internal Quota</span>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 cursor-pointer hover:border-blue-300 transition">
                    <input
                      type="checkbox"
                      checked={isInternalIPU}
                      onChange={(e) => setIsInternalIPU(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>IP University (IPU) Internal Quota</span>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 cursor-pointer hover:border-blue-300 transition">
                    <input
                      type="checkbox"
                      checked={isESI}
                      onChange={(e) => setIsESI(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>ESIC Insured Person (IP) Ward</span>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 cursor-pointer hover:border-blue-300 transition">
                    <input
                      type="checkbox"
                      checked={isCW}
                      onChange={(e) => setIsCW(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Children/Widows of Armed Forces (CW)</span>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 cursor-pointer hover:border-blue-300 transition">
                    <input
                      type="checkbox"
                      checked={isInternalPuducherry}
                      onChange={(e) => setIsInternalPuducherry(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Internal Puducherry UT Quota</span>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 cursor-pointer hover:border-blue-300 transition">
                    <input
                      type="checkbox"
                      checked={isAMUInternal}
                      onChange={(e) => setIsAMUInternal(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>AMU Internal Institutional Quota</span>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 cursor-pointer hover:border-blue-300 transition">
                    <input
                      type="checkbox"
                      checked={isNRI}
                      onChange={(e) => setIsNRI(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Non-Resident Indian (NRI) Quota</span>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 cursor-pointer hover:border-blue-300 transition">
                    <input
                      type="checkbox"
                      checked={isMinority}
                      onChange={(e) => setIsMinority(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Religious Minority Quota</span>
                  </label>
                </div>

                {isMinority && (
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-xs font-bold text-slate-700">Minority Type:</span>
                    <select
                      value={minorityType}
                      onChange={(e) => setMinorityType(e.target.value)}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="MUSLIM">Muslim Minority (Jamia / Hamdard / etc.)</option>
                      <option value="JAIN">Jain Minority</option>
                      <option value="OTHER">Other Minority</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-3.5 text-sm font-extrabold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Calculating Round-2 Options...</span>
                </>
              ) : (
                <>
                  <span>Show My Round-2 Options</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Results Section (Evidence Explorer FIRST, Round-2 Interpretation SECOND) */}
      {(evidenceData || data) && (
        <div className="space-y-12 animate-in fade-in duration-300">
          {/* Primary View: Round-1 Evidence Explorer */}
          {evidenceData && data && (
            <Round1EvidenceExplorer
              initialEvidence={evidenceData}
              studentAir={data.profile.air}
              studentCategory={data.profile.category}
              isPwD={data.profile.isPwD}
              domicileState={data.profile.domicileState}
              selectedCollegeIds={selectedCollegeIds}
              onToggleComparison={handleToggleComparison}
              plannedItemIds={new Set(planningItems.map((i) => i.id))}
              onTogglePlan={handleTogglePlanFromEvidence}
              onMeaningfulInteraction={recordMeaningfulExploration}
            />
          )}

          {/* Secondary View: Round-2 Interpretation */}
          {data && (
            <div className="space-y-8 no-print">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-xs font-bold text-amber-900 mb-1">
                      <span>🔮</span> Secondary Interpretation
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase">
                      What Could This Mean For Round 2?
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                      Round-2 availability depends on vacancies, upgrades, non-joining and counselling movement. The
                      information below interprets Round-1 patterns; it is not a guarantee of allotment.
                    </p>
                  </div>

                  {/* Vacancy Status & Plan CTA */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900">
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      <span>Official MCC Round-2 vacancy data: Awaiting release</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPlanModalOpen(true)}
                      className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-xs hover:bg-slate-800 transition flex items-center gap-1.5"
                    >
                      <span>📋 My Counselling Plan</span>
                      <span className="rounded-full bg-blue-500 px-1.5 py-0.2 text-[10px] text-white">
                        {planningItems.length}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Secondary Interpretation Guidance Banner */}
                <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-xs text-slate-700 space-y-1.5">
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>💡</span>
                    <span>How to Read This Interpretation</span>
                  </div>
                  <p className="leading-relaxed">
                    Round-2 availability depends on actual vacancies, upgrades, non-joining and counselling movement. The college-level interpretation below compares your AIR with observed MCC Round-1 allotment ranges.
                  </p>
                </div>

                {/* Filters Bar */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Filter View:</span>

                  {/* Management Group Filter */}
                  <select
                    value={selectedManagementGroup}
                    onChange={(e) => setSelectedManagementGroup(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All College Types</option>
                    <option value="GOVT_CENTRAL">Government / Central / INI</option>
                    <option value="PRIVATE_DEEMED">Private / Deemed / Self-Financed</option>
                  </select>

                  {/* Route Filter */}
                  <select
                    value={selectedRoute}
                    onChange={(e) => setSelectedRoute(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All Routes (MCC + State)</option>
                    <option value="MCC">MCC Only</option>
                    <option value="STATE_ESTIMATE">State Counselling Only</option>
                  </select>
                </div>
              </div>

          {/* ========================================================================= */}
          {/* STREAM 1: GOVERNMENT & CENTRAL COUNSELLING OPPORTUNITIES */}
          {/* ========================================================================= */}
          {mccGovtRecs.length > 0 && (
            <div className="space-y-4 no-print">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600">
                      <span>🏛️</span> Primary MCC Stream
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                      Government & Central Counselling Opportunities ({mccGovtRecs.length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Government, Central and INI options identified from your eligible MCC counselling pathways.
                    </p>
                  </div>
                  <span className="self-start sm:self-center text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1">
                    AIQ 15% & Central Pools
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mccGovtRecs.slice(0, visibleCountPerStream.GOVT || 8).map((r, idx) => {
                    const planId = `${r.collegeId}__${r.route}__${r.quota}__${r.seatCategory}__${r.isPwD}`;
                    const isInPlan = planningItems.some((item) => item.id === planId);

                    return (
                      <RecommendationCard
                        key={`${r.collegeId}-${r.quota}-${r.seatCategory}-${r.isPwD}-${idx}`}
                        recommendation={r}
                        studentAir={data.profile.air}
                        isExpanded={expandedCardIds.has(`${r.collegeId}-${r.quota}-${r.seatCategory}-${r.isPwD}`)}
                        onToggle={() => toggleCard(`${r.collegeId}-${r.quota}-${r.seatCategory}-${r.isPwD}`)}
                        isCompared={selectedCollegeIds.includes(r.collegeId)}
                        onToggleCompare={() => handleToggleComparison(r.collegeId)}
                        isInPlan={isInPlan}
                        onTogglePlan={() => handleTogglePlanItem(r)}
                      />
                    );
                  })}
                </div>

                {mccGovtRecs.length > (visibleCountPerStream.GOVT || 8) && (
                  <div className="text-center pt-5">
                    <button
                      type="button"
                      onClick={() => handleShowMore("GOVT")}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                    >
                      <span>Show more Government options ({mccGovtRecs.length - (visibleCountPerStream.GOVT || 8)} remaining)</span>
                      <span>↓</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STREAM 2: YOUR STATE COUNSELLING OPPORTUNITIES */}
          {/* ========================================================================= */}
          {stateOpportunityRecs.length > 0 && (
            <div className="space-y-4 no-print">
              <div className="rounded-3xl border border-purple-200 bg-purple-50/40 p-6 shadow-sm">
                <div className="space-y-1 pb-4 border-b border-purple-200/60">
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-900">
                    <span>📍</span> Domicile State Prioritized
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                    Your State Counselling Opportunities ({stateOpportunityRecs.length})
                  </h3>
                  <div className="text-xs font-bold text-purple-900">
                    Seat capacity identified — state rank data awaited
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                    These colleges have seats outside the MCC Round-1 pool that may be relevant through your state counselling.
                    State-specific Round-1 rank/category data has not yet been incorporated, so your competitiveness cannot currently be estimated.
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stateOpportunityRecs.slice(0, visibleCountPerStream.STATE || 8).map((r, idx) => {
                    const planId = `${r.collegeId}__${r.route}__${r.quota}__${r.seatCategory}__${r.isPwD}`;
                    const isInPlan = planningItems.some((item) => item.id === planId);

                    return (
                      <RecommendationCard
                        key={`${r.collegeId}-${r.quota}-${r.seatCategory}-${r.isPwD}-${idx}`}
                        recommendation={r}
                        studentAir={data.profile.air}
                        isExpanded={expandedCardIds.has(`${r.collegeId}-${r.quota}-${r.seatCategory}-${r.isPwD}`)}
                        onToggle={() => toggleCard(`${r.collegeId}-${r.quota}-${r.seatCategory}-${r.isPwD}`)}
                        isCompared={selectedCollegeIds.includes(r.collegeId)}
                        onToggleCompare={() => handleToggleComparison(r.collegeId)}
                        isInPlan={isInPlan}
                        onTogglePlan={() => handleTogglePlanItem(r)}
                      />
                    );
                  })}
                </div>

                {stateOpportunityRecs.length > (visibleCountPerStream.STATE || 8) && (
                  <div className="text-center pt-5">
                    <button
                      type="button"
                      onClick={() => handleShowMore("STATE")}
                      className="inline-flex items-center gap-1 rounded-xl border border-purple-200 bg-white px-4 py-2 text-xs font-bold text-purple-900 hover:bg-purple-50 transition"
                    >
                      <span>Show more State options ({stateOpportunityRecs.length - (visibleCountPerStream.STATE || 8)} remaining)</span>
                      <span>↓</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STREAM 3: PRIVATE & DEEMED COUNSELLING OPPORTUNITIES */}
          {/* ========================================================================= */}
          {mccPrivateRecs.length > 0 && (
            <div className="space-y-4 no-print">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <span>🏥</span> Institutional / Self-Financed Stream
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                      Private & Deemed Counselling Opportunities ({mccPrivateRecs.length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      These options may have different fee structures, institutional quotas and counselling rules. Historical rank position does not indicate affordability or preference.
                    </p>
                  </div>
                  <span className="self-start sm:self-center text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1">
                    Self-Financed & Deemed
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mccPrivateRecs.slice(0, visibleCountPerStream.PRIVATE || 8).map((r, idx) => {
                    const planId = `${r.collegeId}__${r.route}__${r.quota}__${r.seatCategory}__${r.isPwD}`;
                    const isInPlan = planningItems.some((item) => item.id === planId);

                    return (
                      <RecommendationCard
                        key={`${r.collegeId}-${r.quota}-${r.seatCategory}-${r.isPwD}-${idx}`}
                        recommendation={r}
                        studentAir={data.profile.air}
                        isExpanded={expandedCardIds.has(`${r.collegeId}-${r.quota}-${r.seatCategory}-${r.isPwD}`)}
                        onToggle={() => toggleCard(`${r.collegeId}-${r.quota}-${r.seatCategory}-${r.isPwD}`)}
                        isCompared={selectedCollegeIds.includes(r.collegeId)}
                        onToggleCompare={() => handleToggleComparison(r.collegeId)}
                        isInPlan={isInPlan}
                        onTogglePlan={() => handleTogglePlanItem(r)}
                      />
                    );
                  })}
                </div>

                {mccPrivateRecs.length > (visibleCountPerStream.PRIVATE || 8) && (
                  <div className="text-center pt-5">
                    <button
                      type="button"
                      onClick={() => handleShowMore("PRIVATE")}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                    >
                      <span>Show more Private/Deemed options ({mccPrivateRecs.length - (visibleCountPerStream.PRIVATE || 8)} remaining)</span>
                      <span>↓</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STREAM 4: OTHER OPTIONS WITH LIMITED ROUND-1 SUPPORT (COLLAPSED) */}
          {/* ========================================================================= */}
          {otherLimitedRecs.length > 0 && (
            <div className="pt-2 no-print">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                <button
                  type="button"
                  onClick={() => setShowLimitedEvidenceSection(!showLimitedEvidenceSection)}
                  className="flex w-full items-center justify-between text-left text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 transition"
                >
                  <span className="flex items-center gap-2">
                    <span>🔍</span>
                    <span>Other options with limited Round-1 support ({otherLimitedRecs.length})</span>
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {showLimitedEvidenceSection ? "▲ Hide limited evidence options" : "▼ Show options beyond observed range"}
                  </span>
                </button>

                {showLimitedEvidenceSection && (
                  <div className="mt-4 space-y-4 pt-3 border-t border-slate-200">
                    <p className="text-xs text-slate-500">
                      Your AIR is outside, or not well supported by, the observed Round-1 range for these pathways.
                      Round-2 movement may still change availability.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {otherLimitedRecs.slice(0, visibleCountPerStream.LIMITED || 8).map((r, idx) => {
                        const planId = `${r.collegeId}__${r.route}__${r.quota}__${r.seatCategory}__${r.isPwD}`;
                        const isInPlan = planningItems.some((item) => item.id === planId);

                        return (
                          <RecommendationCard
                            key={`${r.collegeId}-${r.quota}-${r.seatCategory}-${r.isPwD}-${idx}`}
                            recommendation={r}
                            studentAir={data.profile.air}
                            isExpanded={expandedCardIds.has(`${r.collegeId}-${r.quota}-${r.seatCategory}-${r.isPwD}`)}
                            onToggle={() => toggleCard(`${r.collegeId}-${r.quota}-${r.seatCategory}-${r.isPwD}`)}
                            isCompared={selectedCollegeIds.includes(r.collegeId)}
                            onToggleCompare={() => handleToggleComparison(r.collegeId)}
                            isInPlan={isInPlan}
                            onTogglePlan={() => handleTogglePlanItem(r)}
                          />
                        );
                      })}
                    </div>

                    {otherLimitedRecs.length > (visibleCountPerStream.LIMITED || 8) && (
                      <div className="text-center pt-3">
                        <button
                          type="button"
                          onClick={() => handleShowMore("LIMITED")}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                          <span>Show more ({otherLimitedRecs.length - (visibleCountPerStream.LIMITED || 8)} remaining)</span>
                          <span>↓</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
            </div>
          )}
        </div>
      )}
    </>
  )}

      {/* 4. Persistent Comparison Tray */}
      {selectedCollegeIds.length > 0 && (
        <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 z-40 max-w-2xl bg-white border border-slate-300 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom duration-200 no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Compare Colleges ({selectedCollegeIds.length} of 3 selected)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                {selectedCollegesSummary.map((col) => (
                  <span
                    key={col.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-800"
                  >
                    <span className="max-w-[140px] truncate">{col.name}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleComparison(col.id)}
                      className="text-slate-400 hover:text-red-600 transition"
                      aria-label={`Remove ${col.name} from comparison`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleClearComparison}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition px-2 py-1"
              >
                Clear all
              </button>
              <button
                type="button"
                disabled={selectedCollegeIds.length < 2}
                onClick={() => setIsComparisonModalOpen(true)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {selectedCollegeIds.length < 2 ? "Select at least 2" : `Compare Selected (${selectedCollegeIds.length})`}
              </button>
            </div>
          </div>

          {comparisonNotice && (
            <div className="mt-2 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-1.5 text-center">
              ⚠️ {comparisonNotice}
            </div>
          )}
        </div>
      )}

      {/* 5. Floating Bottom "My Plan" Indicator */}
      {planningItems.length > 0 && !isPlanModalOpen && (
        <div className="fixed bottom-4 left-4 z-40 no-print">
          <button
            type="button"
            onClick={() => setIsPlanModalOpen(true)}
            className="rounded-2xl bg-slate-900 border border-slate-700 px-4 py-3 text-xs font-extrabold text-white shadow-2xl hover:bg-slate-800 transition flex items-center gap-2.5"
          >
            <span>📋 My Counselling Plan</span>
            <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
              {planningItems.length} selected
            </span>
          </button>
        </div>
      )}

      {/* 6. In-Page Comparison Modal / Overlay */}
      {isComparisonModalOpen && (
        <ComparisonModal
          selectedCollegeIds={selectedCollegeIds}
          allRecommendations={allRecs}
          personalFactors={personalFactors}
          domicileState={domicileState}
          onClose={() => setIsComparisonModalOpen(false)}
          onRemoveCollege={handleToggleComparison}
          onUpdateFactors={handleUpdatePersonalFactors}
          onClearFactors={handleClearPersonalFactors}
        />
      )}

      {/* 7. My Counselling Plan & Printable Worksheet Modal */}
      {isPlanModalOpen && (
        <CounsellingPlanModal
          profile={data?.profile || { air: parseInt(air, 10) || 0, category, isPwD, domicileState, goal }}
          planningItems={planningItems}
          personalFactors={personalFactors}
          includeNotesInPrint={includeNotesInPrint}
          setIncludeNotesInPrint={setIncludeNotesInPrint}
          onClose={() => setIsPlanModalOpen(false)}
          onRemoveItem={handleRemovePlanItem}
          onMoveItem={handleMovePlanItem}
          onClearPlan={() => setPlanningItems([])}
        />
      )}

      {/* 8. MBBS Foundation Book Discovery Card (Moved ABOVE Methodology) */}
      <BookDiscoveryCard className="no-print" />

      {/* 9. Compact Methodology Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 space-y-4 no-print shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-base">⚙️</span>
          <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900">
            How These Suggestions Are Generated
          </h3>
        </div>

        {/* 3 Concise Primary Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs text-slate-700">
          <div className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-3.5 space-y-1">
            <span className="text-[10px] font-black text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded-md uppercase tracking-wider block w-fit">
              1. Official Data
            </span>
            <p className="leading-relaxed text-slate-600">
              MCC Round-1 allotments and seat matrix, combined with available 2026 NMC approved MBBS seat data.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-3.5 space-y-1">
            <span className="text-[10px] font-black text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded-md uppercase tracking-wider block w-fit">
              2. Round-1 Evidence
            </span>
            <p className="leading-relaxed text-slate-600">
              We compare your AIR, category, college, quota/pathway and observed Round-1 AIR patterns.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-3.5 space-y-1">
            <span className="text-[10px] font-black text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded-md uppercase tracking-wider block w-fit">
              3. Decision Support
            </span>
            <p className="leading-relaxed text-slate-600">
              The tool organises this evidence to help you explore colleges and plan choices. It does not predict or guarantee an allotment.
            </p>
          </div>
        </div>

        {/* Expandable Detailed Technical Methodology */}
        <details className="pt-2 border-t border-slate-100 text-xs text-slate-600 group">
          <summary className="cursor-pointer font-bold text-slate-700 hover:text-slate-950 transition flex items-center justify-between py-1 select-none">
            <span>View Detailed Methodology & Statistical Architecture</span>
            <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-3 space-y-2 pl-2 border-l-2 border-slate-200 text-slate-600 leading-relaxed text-[11px] sm:text-xs">
            <p>
              • <strong>Linear Quartile Distributions:</strong> Historical rank ranges are evaluated from 25,635 validated Round-1 allotments to calculate stronger quartile and typical observed ranges.
            </p>
            <p>
              • <strong>Pathway Isolation:</strong> PwD horizontal reservations and Open Merit admissions are strictly segregated to avoid statistical rank contamination.
            </p>
            <p>
              • <strong>Seat Gaps vs. Vacancies:</strong> Observed Round-1 seat differences are noted as historical movement signals and are not treated as confirmed Round-2 vacancies.
            </p>
            <p>
              • <strong>State Counselling Pools:</strong> State capacity estimates reflect seats outside MCC allotments. State-specific rank recommendations will become more precise as official state counselling rank datasets are incorporated.
            </p>
          </div>
        </details>
      </div>

      {/* 10. Consolidated Decision-Support & Official Verification Section */}
      <aside
        aria-label="Decision Support and Official Verification"
        className="rounded-3xl border border-amber-200/80 bg-amber-50/50 p-4 sm:p-5 text-xs text-amber-950 no-print shadow-2xs space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-200/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-950">
                <span>⚖️</span> Decision-Support & Official Verification
              </span>
              <span className="text-[10px] font-bold text-amber-800">
                Active 2026 Session
              </span>
            </div>

            <div className="space-y-1 text-[11px] sm:text-xs text-amber-900 leading-relaxed max-w-3xl">
              <p>
                This planner uses official MCC Round-1 allotment and seat-matrix data, available NMC 2026 MBBS seat
                information, and AI-assisted analysis to organise and interpret counselling evidence.
              </p>
              <p>
                It is a decision-support tool, not an official allotment, cutoff or counselling authority. AI-assisted
                interpretation may contain errors or omissions.
              </p>
              <p>
                Before making or submitting counselling choices, always verify current seats, eligibility, rules,
                vacancies and other critical information from MCC and the relevant official Government/State counselling
                portals.
              </p>
            </div>
          </div>

          {/* Vertical Action Column on Desktop, Stacked on Mobile */}
          <div className="flex flex-col gap-2 shrink-0 w-full sm:w-44">
            <a
              href="https://mcc.nic.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-900 px-3 py-2 text-xs font-bold text-white shadow-2xs hover:bg-amber-800 transition text-center w-full"
            >
              <span>MCC Official Portal</span>
              <span className="text-[10px]">↗</span>
            </a>
            <a
              href="https://www.nmc.org.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white border border-amber-300 px-3 py-2 text-xs font-bold text-amber-950 shadow-2xs hover:bg-amber-100/70 transition text-center w-full"
            >
              <span>NMC Official Portal</span>
              <span className="text-[10px]">↗</span>
            </a>
          </div>
        </div>

        {/* Compact Copyright & Data Notice and Non-Affiliation */}
        <div className="pt-3 border-t border-amber-200/70 text-[10px] sm:text-[11px] text-amber-900/80 leading-relaxed space-y-1">
          <p className="font-semibold text-amber-950 uppercase tracking-wider text-[9px] sm:text-[10px]">
            Copyright &amp; Data Notice
          </p>
          <p>
            © 2026 MBBS Foundation™. All rights reserved. The original organization, compilation, analysis, presentation,
            software and decision-support content of this platform are proprietary to MBBS Foundation, except where otherwise
            stated. Government and third-party data, names, trademarks and source materials remain the property of their respective
            authorities or owners. Official-source data are used for informational and analytical purposes with source attribution.
            Reproduction, systematic extraction, republication or commercial reuse of the platform’s original compilations,
            analyses or presentation without permission is prohibited.
          </p>
          <p className="text-[10px] text-amber-800/90 pt-0.5">
            MBBS Foundation™ is an independent educational initiative and is not affiliated with or endorsed by MCC, NMC,
            NEET-UG or any Government counselling authority unless expressly stated.
          </p>
        </div>
      </aside>

      {/* 11. Contextual Session Book Engagement Prompt */}
      <BookEngagementPrompt
        hasMeaningfulExploration={hasMeaningfulExploration}
      />
    </div>
  );
}

// -------------------------------------------------------------
// Individual Recommendation Card Component
// -------------------------------------------------------------
function RecommendationCard({
  recommendation,
  studentAir,
  isExpanded,
  onToggle,
  isCompared,
  onToggleCompare,
  isInPlan,
  onTogglePlan,
}: {
  recommendation: CounsellingRecommendation;
  studentAir: number;
  isExpanded: boolean;
  onToggle: () => void;
  isCompared: boolean;
  onToggleCompare: () => void;
  isInPlan: boolean;
  onTogglePlan: () => void;
}) {
  const r = recommendation;

  // Plain-Language Evidence-First Factual Comparison
  let comparisonText = "";
  let comparisonBg = "bg-slate-50 border-slate-200 text-slate-800";

  if (r.route === "MCC") {
    if (r.medianAIR !== null && studentAir <= r.medianAIR) {
      comparisonText = `Your AIR (${studentAir.toLocaleString("en-IN")}) is better than the typical Round-1 ${r.seatCategory} AIR (${r.medianAIR.toLocaleString("en-IN")}) observed at this college.`;
      comparisonBg = "bg-emerald-50 border-emerald-200 text-emerald-900";
    } else if (r.highestAIR !== null && studentAir <= r.highestAIR) {
      comparisonText = `Your AIR (${studentAir.toLocaleString("en-IN")}) falls within the observed MCC Round-1 ${r.seatCategory} allotment range (up to AIR ${r.highestAIR.toLocaleString("en-IN")}) at this college.`;
      comparisonBg = "bg-blue-50 border-blue-200 text-blue-900";
    } else if (r.highestAIR !== null && studentAir > r.highestAIR) {
      comparisonText = `Your AIR (${studentAir.toLocaleString("en-IN")}) is beyond the last observed Round-1 ${r.seatCategory} allotment (AIR ${r.highestAIR.toLocaleString("en-IN")}) at this college.`;
      comparisonBg = "bg-amber-50 border-amber-200 text-amber-900";
    } else {
      comparisonText = `Limited MCC Round-1 allotment records for this specific category pathway.`;
      comparisonBg = "bg-slate-50 border-slate-200 text-slate-700";
    }
  } else {
    // State opportunity
    comparisonText = `State quota seat matrix (~${r.estimatedPool ?? 0} seats). State-level rank list & Round-1 allotment data awaited.`;
    comparisonBg = "bg-purple-50 border-purple-200 text-purple-900";
  }

  // Secondary subtle band label
  const bandBadge = {
    STRONG: { label: "Strong Position", bg: "bg-emerald-50 text-emerald-800 border-emerald-200" },
    REALISTIC: { label: "Typical Range", bg: "bg-blue-50 text-blue-800 border-blue-200" },
    STRETCH: { label: "Stretch Range", bg: "bg-amber-50 text-amber-800 border-amber-200" },
    LOW_EVIDENCE: {
      label: r.reasonCodes.includes("STATE_RANK_DATA_AWAITED") ? "State Opportunity" : "Limited Evidence",
      bg: r.reasonCodes.includes("STATE_RANK_DATA_AWAITED")
        ? "bg-purple-50 text-purple-800 border-purple-200"
        : "bg-slate-100 text-slate-700 border-slate-200",
    },
  }[r.opportunityBand];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between space-y-3">
      <div className="space-y-2.5">
        {/* Header & Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
              {r.managementType}
            </span>
            <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
              {r.route === "MCC" ? "MCC R1" : "State Pool (Est.)"}
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${bandBadge.bg}`}
          >
            {bandBadge.label}
          </span>
        </div>

        {/* College Name & State */}
        <div>
          <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">{r.collegeName}</h4>
          <p className="text-xs text-slate-500 font-medium mt-0.5">📍 {r.state}</p>
        </div>

        {/* Quota & Category Pathway */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
          <span className="font-semibold text-slate-700">Pathway:</span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-800">{r.quota}</span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-800">
            {r.seatCategory} {r.isPwD && "(PwD)"}
          </span>
        </div>

        {/* Factual Round-1 Evidence Box */}
        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1 text-xs">
          {r.route === "MCC" ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                <span>{r.seatCategory} Round-1 Evidence:</span>
                <span className="text-[10px] text-slate-500 font-normal">{r.sampleSize} allotments</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[11px] pt-1 font-mono">
                <div>
                  <span className="text-[9px] text-slate-400 block font-sans">Best AIR</span>
                  <span className="font-bold text-slate-800">{r.bestAIR?.toLocaleString("en-IN") ?? "—"}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-sans">Typical (Median) AIR</span>
                  <span className="font-black text-blue-700">{r.medianAIR?.toLocaleString("en-IN") ?? "—"}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-sans">Last AIR</span>
                  <span className="font-bold text-slate-800">{r.highestAIR?.toLocaleString("en-IN") ?? "—"}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[11px] font-semibold text-purple-900">
              Approx. non-MCC state seat pool: ~{r.estimatedPool ?? 0} seats
            </div>
          )}

          {/* Plain-Language Comparison Statement */}
          <div className={`rounded-lg border p-2 text-xs font-semibold leading-relaxed mt-2 ${comparisonBg}`}>
            {comparisonText}
          </div>
        </div>

        {/* 2026 Expansion Signals */}
        {(r.seatIncrease2026 > 0 || r.isNewEstablishment2026) && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {r.seatIncrease2026 > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                <span>📈</span> +{r.seatIncrease2026} seats in 2026
              </span>
            )}
            {r.isNewEstablishment2026 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                <span>✨</span> New college 2026
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onTogglePlan}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              isInPlan
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
            }`}
          >
            {isInPlan ? "✓ In My Plan" : "+ Add to Plan"}
          </button>

          <button
            type="button"
            onClick={onToggleCompare}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold transition ${
              isCompared
                ? "bg-blue-100 text-blue-900 border border-blue-300"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {isCompared ? "✓ Compared" : "+ Compare"}
          </button>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
        >
          {isExpanded ? "▲ Hide Summary" : "▼ Summary"}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 space-y-1.5">
          <p className="leading-relaxed font-medium text-slate-800">{r.reasonSummary}</p>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Format INR Currency Helper
// -------------------------------------------------------------
function formatINR(val?: number): string {
  if (val === undefined || val === null || isNaN(val)) return "Not entered";
  if (val >= 10000000) {
    const cr = val / 10000000;
    return `₹${cr % 1 === 0 ? cr : cr.toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    const lakh = val / 100000;
    return `₹${lakh % 1 === 0 ? lakh : lakh.toFixed(2)} Lakh`;
  }
  return `₹${val.toLocaleString("en-IN")}`;
}

// -------------------------------------------------------------
// Side-by-Side Comparison Modal Component
// -------------------------------------------------------------
function ComparisonModal({
  selectedCollegeIds,
  allRecommendations,
  personalFactors,
  domicileState,
  onClose,
  onRemoveCollege,
  onUpdateFactors,
  onClearFactors,
}: {
  selectedCollegeIds: string[];
  allRecommendations: CounsellingRecommendation[];
  personalFactors: Record<string, PersonalCollegeFactors>;
  domicileState: string;
  onClose: () => void;
  onRemoveCollege: (collegeId: string) => void;
  onUpdateFactors: (collegeId: string, factors: PersonalCollegeFactors) => void;
  onClearFactors: (collegeId: string) => void;
}) {
  const [editingCollegeId, setEditingCollegeId] = useState<string | null>(null);

  const comparedColleges = selectedCollegeIds.map((id) => {
    const matchingRecs = allRecommendations.filter((r) => r.collegeId === id);
    const primary = matchingRecs[0];

    return {
      id,
      collegeName: primary?.collegeName || "Unknown College",
      state: primary?.state || "N/A",
      managementType: primary?.managementType || "N/A",
      approvedSeats2026: primary?.approvedSeats2026 || null,
      seatIncrease2026: primary?.seatIncrease2026 || 0,
      isNewEstablishment2026: primary?.isNewEstablishment2026 || false,
      isINI: primary?.isINI || false,
      isCentralUniversity: primary?.isCentralUniversity || false,
      isDeemed: primary?.isDeemed || false,
      isESIC: primary?.isESIC || false,
      pathways: matchingRecs,
      userFactors: personalFactors[id] || {},
    };
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 no-print"
    >
      <div className="relative w-full max-w-5xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600">
              <span>⚖️</span> Evidence-Based Comparator
            </div>
            <h3 id="comparison-modal-title" className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Side-by-Side Counselling Evidence Comparison
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="self-end sm:self-auto rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            ✕ Close Comparison
          </button>
        </div>

        {/* Explanatory Context Banner */}
        <div className="bg-blue-50 border-b border-blue-100 p-4 text-xs text-blue-950 leading-relaxed">
          <p>
            <strong>Decision-Support Context:</strong> Compare the counselling evidence available for each college. Historical rank position reflects observed Round-1 allotments and does not by itself determine college preference. Student-entered fee and bond values are personal notes for your comparison and are not verified system data.
          </p>
        </div>

        {/* Comparison Columns Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div
            className={`grid gap-5 ${
              comparedColleges.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3"
            }`}
          >
            {comparedColleges.map((col) => {
              const u = col.userFactors;
              const isEditing = editingCollegeId === col.id;

              return (
                <div
                  key={col.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-4">
                    {/* Top Header & Remove Action */}
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200">
                      <div>
                        <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-800">
                          {col.managementType}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 mt-1 leading-snug">
                          {col.collegeName}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">{col.state}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveCollege(col.id)}
                        className="text-slate-400 hover:text-red-600 transition text-xs font-bold p-1"
                        aria-label={`Remove ${col.collegeName}`}
                      >
                        ✕
                      </button>
                    </div>

                    {/* SECTION A: COUNSELLING EVIDENCE */}
                    <div className="space-y-3">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
                        1. Counselling Evidence
                      </div>

                      <div className="rounded-xl bg-white border border-slate-200 p-3 space-y-1.5 text-xs">
                        <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                          2026 Capacity & Expansion
                        </div>
                        <div className="flex justify-between text-slate-800 font-semibold">
                          <span>Approved MBBS Intake:</span>
                          <span>{col.approvedSeats2026 !== null ? `${col.approvedSeats2026} seats` : "N/A"}</span>
                        </div>
                        {col.seatIncrease2026 > 0 && (
                          <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 rounded px-2 py-0.5">
                            📈 +{col.seatIncrease2026} seats in 2026
                          </div>
                        )}
                        {col.isNewEstablishment2026 && (
                          <div className="text-[11px] font-bold text-blue-800 bg-blue-50 rounded px-2 py-0.5">
                            ✨ Newly Established 2026
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                          Your Eligible Pathways ({col.pathways.length})
                        </div>

                        {col.pathways.map((p, pIdx) => {
                          const bandBadge = {
                            STRONG: "bg-emerald-100 text-emerald-950 border-emerald-300",
                            REALISTIC: "bg-blue-100 text-blue-950 border-blue-300",
                            STRETCH: "bg-amber-100 text-amber-950 border-amber-300",
                            LOW_EVIDENCE: p.reasonCodes.includes("STATE_RANK_DATA_AWAITED")
                              ? "bg-purple-100 text-purple-950 border-purple-300"
                              : "bg-slate-100 text-slate-800 border-slate-300",
                          }[p.opportunityBand];

                          const bandLabel = {
                            STRONG: "Strong Historical Position",
                            REALISTIC: "Within Typical Round-1 Range",
                            STRETCH: "Stretch Based on Round-1",
                            LOW_EVIDENCE: p.reasonCodes.includes("STATE_RANK_DATA_AWAITED")
                              ? "State Opportunity — Rank Data Awaited"
                              : "Limited Historical Evidence",
                          }[p.opportunityBand];

                          return (
                            <div
                              key={`${p.quota}-${p.seatCategory}-${p.isPwD}-${pIdx}`}
                              className="rounded-xl bg-white border border-slate-200 p-3 space-y-2 text-xs"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <span className="font-bold text-slate-900">
                                  {p.quota} • {p.seatCategory} {p.isPwD && "(PwD)"}
                                </span>
                                <span className={`rounded px-2 py-0.5 text-[10px] font-extrabold border ${bandBadge}`}>
                                  {bandLabel}
                                </span>
                              </div>

                              {p.route === "MCC" ? (
                                <div className="space-y-1 text-[11px] text-slate-700">
                                  <div>
                                    <strong>Typical Round-1 range:</strong> around AIR {p.medianAIR?.toLocaleString() || "N/A"}
                                  </div>
                                  <div className="flex justify-between text-slate-500">
                                    <span>Highest: {p.highestAIR?.toLocaleString() || "N/A"}</span>
                                    <span>Sample: {p.sampleSize}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[11px] text-purple-900 font-medium">
                                  <strong>Approx. non-MCC pool:</strong> {p.estimatedPool !== null ? `${p.estimatedPool} seats` : "N/A"}
                                  <div className="text-[10px] text-slate-500 mt-0.5">State rank data awaited</div>
                                </div>
                              )}

                              <p className="text-[11px] text-slate-600 leading-snug border-t border-slate-100 pt-1.5">
                                {p.reasonSummary}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* SECTION B: YOUR DECISION FACTORS */}
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                          2. Your Decision Factors
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingCollegeId(isEditing ? null : col.id)}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition"
                        >
                          {isEditing ? "Done" : (u.annualTuition !== undefined || u.serviceBond ? "Edit details" : "+ Add fee/bond info")}
                        </button>
                      </div>

                      {!isEditing ? (
                        <div className="rounded-xl bg-white border border-slate-200 p-3 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Annual Tuition:</span>
                            <span className="font-bold text-slate-900">{formatINR(u.annualTuition)}</span>
                          </div>
                          {u.annualTuition !== undefined && (
                            <div className="text-[10px] text-slate-400 text-right -mt-1">Entered by you</div>
                          )}

                          {u.firstYearCost !== undefined && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">Est. 1st Year Cost:</span>
                              <span className="font-bold text-slate-900">{formatINR(u.firstYearCost)}</span>
                            </div>
                          )}

                          {u.hostelCost !== undefined && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">Hostel / Accom.:</span>
                              <span className="font-bold text-slate-900">{formatINR(u.hostelCost)}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
                            <span className="text-slate-600">Service Bond:</span>
                            <span className="font-bold text-slate-900">
                              {u.serviceBond === "YES" ? "Yes" : u.serviceBond === "NO" ? "No" : "Not sure / Not entered"}
                            </span>
                          </div>

                          {u.serviceBond === "YES" && (
                            <>
                              {u.bondDurationYears !== undefined && (
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-600">Bond Duration:</span>
                                  <span className="font-bold text-slate-900">{u.bondDurationYears} Year{u.bondDurationYears > 1 ? "s" : ""}</span>
                                </div>
                              )}
                              {u.bondPenalty !== undefined && (
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-600">Bond Penalty:</span>
                                  <span className="font-bold text-slate-900">{formatINR(u.bondPenalty)}</span>
                                </div>
                              )}
                            </>
                          )}

                          {u.personalNote && (
                            <div className="border-t border-slate-100 pt-1.5 space-y-0.5">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">My Note:</div>
                              <p className="text-[11px] text-slate-700 italic font-medium bg-slate-50 p-1.5 rounded">
                                &ldquo;{u.personalNote}&rdquo;
                              </p>
                            </div>
                          )}

                          {u.annualTuition === undefined && !u.serviceBond && !u.personalNote && (
                            <div className="text-[11px] text-slate-400 italic text-center py-1">
                              No personal fee or bond details entered yet.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-xl bg-blue-50/50 border border-blue-200 p-3 space-y-3 text-xs animate-in fade-in duration-150">
                          <div className="text-[11px] font-bold text-blue-900">
                            Enter Your Known College Details
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                              Annual Tuition (INR)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={u.annualTuition !== undefined ? u.annualTuition : ""}
                              onChange={(e) => {
                                const val = e.target.value ? Math.max(0, parseInt(e.target.value, 10)) : undefined;
                                onUpdateFactors(col.id, { ...u, annualTuition: val });
                              }}
                              placeholder="e.g. 60000 or 1800000"
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                              Service Bond Requirement
                            </label>
                            <select
                              value={u.serviceBond || "UNKNOWN"}
                              onChange={(e) => {
                                onUpdateFactors(col.id, { ...u, serviceBond: e.target.value as any });
                              }}
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="UNKNOWN">Not sure / Not entered</option>
                              <option value="NO">No Rural/State Service Bond</option>
                              <option value="YES">Yes, Compulsory Bond Required</option>
                            </select>
                          </div>

                          {u.serviceBond === "YES" && (
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                                  Duration (Years)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={u.bondDurationYears !== undefined ? u.bondDurationYears : ""}
                                  onChange={(e) => {
                                    const val = e.target.value ? Math.max(0, parseFloat(e.target.value)) : undefined;
                                    onUpdateFactors(col.id, { ...u, bondDurationYears: val });
                                  }}
                                  placeholder="e.g. 2"
                                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                                  Penalty (INR)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={u.bondPenalty !== undefined ? u.bondPenalty : ""}
                                  onChange={(e) => {
                                    const val = e.target.value ? Math.max(0, parseInt(e.target.value, 10)) : undefined;
                                    onUpdateFactors(col.id, { ...u, bondPenalty: val });
                                  }}
                                  placeholder="e.g. 1000000"
                                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                                />
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                              Personal Preference Note
                            </label>
                            <input
                              type="text"
                              maxLength={120}
                              value={u.personalNote || ""}
                              onChange={(e) => {
                                onUpdateFactors(col.id, { ...u, personalNote: e.target.value || undefined });
                              }}
                              placeholder="e.g. Confirmed from prospectus, near home"
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => onClearFactors(col.id)}
                              className="text-[10px] font-bold text-red-600 hover:text-red-800 transition"
                            >
                              Clear my values
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCollegeId(null)}
                              className="rounded-lg bg-blue-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-blue-700 transition"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 text-[10px] text-slate-400 font-medium text-center">
                    Counselling: MCC R1 / NMC 2026 • Factors: Student-entered
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            Done Viewing
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// My Counselling Plan & Printable Reference Worksheet Modal
// -------------------------------------------------------------
function CounsellingPlanModal({
  profile,
  planningItems,
  personalFactors,
  includeNotesInPrint,
  setIncludeNotesInPrint,
  onClose,
  onRemoveItem,
  onMoveItem,
  onClearPlan,
}: {
  profile: { air: number; category: string; isPwD: boolean; domicileState: string; goal: string };
  planningItems: CounsellingPlanItem[];
  personalFactors: Record<string, PersonalCollegeFactors>;
  includeNotesInPrint: boolean;
  setIncludeNotesInPrint: (val: boolean) => void;
  onClose: () => void;
  onRemoveItem: (id: string) => void;
  onMoveItem: (id: string, direction: "UP" | "DOWN") => void;
  onClearPlan: () => void;
}) {
  const [planSearch, setPlanSearch] = useState<string>("");

  const mccItems = planningItems.filter((i) => i.routeGroup === "MCC");
  const stateItems = planningItems.filter((i) => i.routeGroup === "STATE");
  const institutionalItems = planningItems.filter((i) => i.routeGroup === "INSTITUTIONAL");

  const filterBySearch = (items: CounsellingPlanItem[]) => {
    if (!planSearch.trim()) return items;
    const q = planSearch.toLowerCase().trim();
    return items.filter(
      (item) => item.collegeName.toLowerCase().includes(q) || item.state.toLowerCase().includes(q)
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600">
              <span>📋</span> Student-Controlled Planning List
            </div>
            <h3 id="plan-modal-title" className="text-xl sm:text-2xl font-extrabold text-slate-900">
              My Counselling Plan ({planningItems.length} options selected)
            </h3>
            <p className="text-xs text-slate-500">
              Build your personal preference plan across MCC, state, and institutional counselling routes. You control the order.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition flex items-center gap-1.5"
            >
              <span>🖨️ Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* PRINT-ONLY HEADER */}
        <div className="hidden print:block p-6 border-b border-slate-300">
          <div className="text-center space-y-1 pb-4 border-b border-slate-200">
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              NEET-UG 2026 Personal Counselling Planning Worksheet
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Personal Decision-Support Reference Worksheet • Not an official counselling submission
            </p>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div><strong>AIR:</strong> {profile.air.toLocaleString()}</div>
            <div><strong>Category:</strong> {profile.category} {profile.isPwD && "(PwD)"}</div>
            <div><strong>Domicile:</strong> {profile.domicileState}</div>
            <div><strong>Date:</strong> {new Date().toLocaleDateString("en-IN")}</div>
          </div>
        </div>

        {/* Action Controls & Interpretation Notice (Screen Only) */}
        <div className="p-4 bg-blue-50 border-b border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-950 no-print">
          <p className="leading-relaxed">
            <strong>Important:</strong> This is your personal planning order. The planner does not rank colleges for you. Verify the current official counselling rules, eligibility and available choices on the respective counselling portal before locking choices.
          </p>

          <div className="flex items-center gap-3 shrink-0">
            <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={includeNotesInPrint}
                onChange={(e) => setIncludeNotesInPrint(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
              />
              <span>Include my notes in print</span>
            </label>

            {planningItems.length > 0 && (
              <button
                type="button"
                onClick={onClearPlan}
                className="text-xs font-bold text-red-600 hover:text-red-800 transition"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Search Bar for Plan (Screen Only) */}
        {planningItems.length > 6 && (
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 no-print">
            <input
              type="text"
              value={planSearch}
              onChange={(e) => setPlanSearch(e.target.value)}
              placeholder="🔍 Search your selected colleges in plan..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Plan Body / Route Lists */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {planningItems.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <span className="text-4xl">📋</span>
              <h4 className="text-base font-bold text-slate-800">Your Planning List is Empty</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Click <strong>&ldquo;+ Add to Plan&rdquo;</strong> on any eligible recommendation card to add options here and organize your personal choice order.
              </p>
            </div>
          ) : (
            <>
              {/* ROUTE 1: MCC / CENTRAL COUNSELLING PLAN */}
              {mccItems.length > 0 && (
                <RoutePlanSection
                  title="1. MCC / Central Counselling Plan"
                  helper="Options you selected from pathways handled through MCC or the corresponding central counselling route."
                  items={filterBySearch(mccItems)}
                  personalFactors={personalFactors}
                  includeNotes={includeNotesInPrint}
                  onRemove={onRemoveItem}
                  onMove={onMoveItem}
                />
              )}

              {/* ROUTE 2: STATE COUNSELLING PLAN */}
              {stateItems.length > 0 && (
                <RoutePlanSection
                  title="2. State Counselling Plan"
                  helper="Options for state quota counselling. State rank data awaited — seats mapped by institutional capacity."
                  items={filterBySearch(stateItems)}
                  personalFactors={personalFactors}
                  includeNotes={includeNotesInPrint}
                  onRemove={onRemoveItem}
                  onMove={onMoveItem}
                />
              )}

              {/* ROUTE 3: INSTITUTIONAL & SPECIAL COUNSELLING ROUTES */}
              {institutionalItems.length > 0 && (
                <RoutePlanSection
                  title="3. Institutional & Special Authority Routes"
                  helper="Options with specific institutional eligibility criteria (DU, IPU, ESIC, AMU, Puducherry UT)."
                  items={filterBySearch(institutionalItems)}
                  personalFactors={personalFactors}
                  includeNotes={includeNotesInPrint}
                  onRemove={onRemoveItem}
                  onMove={onMoveItem}
                />
              )}
            </>
          )}

          {/* PRINT-ONLY DISCLAIMER */}
          <div className="hidden print:block pt-6 border-t border-slate-300 text-[10px] text-slate-600 leading-relaxed text-center">
            <strong>Print Worksheet Disclaimer:</strong> This is a personal decision-support worksheet and is not an official counselling submission. Verify current seat availability, eligibility, fees, service obligations and counselling rules on the relevant official portal before locking choices.
          </div>
        </div>

        {/* Modal Footer (Screen Only) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between no-print">
          <div className="text-xs text-slate-500 font-medium">
            Total Choices in Plan: <strong>{planningItems.length}</strong> (MCC: {mccItems.length}, State: {stateItems.length}, Special: {institutionalItems.length})
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Route-Specific Plan Sub-Section
// -------------------------------------------------------------
function RoutePlanSection({
  title,
  helper,
  items,
  personalFactors,
  includeNotes,
  onRemove,
  onMove,
}: {
  title: string;
  helper: string;
  items: CounsellingPlanItem[];
  personalFactors: Record<string, PersonalCollegeFactors>;
  includeNotes: boolean;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "UP" | "DOWN") => void;
}) {
  return (
    <div className="space-y-3">
      <div className="pb-2 border-b border-slate-200">
        <h4 className="text-base font-extrabold text-slate-900">{title} ({items.length})</h4>
        <p className="text-xs text-slate-500">{helper}</p>
      </div>

      <div className="space-y-2.5">
        {items.map((item, idx) => {
          const u = personalFactors[item.collegeId];
          const bandBadge = {
            STRONG: "bg-emerald-100 text-emerald-950 border-emerald-300",
            REALISTIC: "bg-blue-100 text-blue-950 border-blue-300",
            STRETCH: "bg-amber-100 text-amber-950 border-amber-300",
            LOW_EVIDENCE: item.reasonCodes.includes("STATE_RANK_DATA_AWAITED")
              ? "bg-purple-100 text-purple-950 border-purple-300"
              : "bg-slate-100 text-slate-800 border-slate-300",
          }[item.opportunityBand];

          const bandLabel = {
            STRONG: "Strong Historical Position",
            REALISTIC: "Within Typical Round-1 Range",
            STRETCH: "Stretch Based on Round-1",
            LOW_EVIDENCE: item.reasonCodes.includes("STATE_RANK_DATA_AWAITED")
              ? "State Opportunity — Rank Data Awaited"
              : "Limited Historical Evidence",
          }[item.opportunityBand];

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              {/* Order Number & College Info */}
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">
                  {idx + 1}
                </span>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-extrabold text-sm sm:text-base text-slate-900">
                      {item.collegeName}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">({item.state})</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-700">
                      {item.managementType}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Pathway:</span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-800">
                      {item.quota} • {item.seatCategory} {item.isPwD && "(PwD)"}
                    </span>
                    <span className={`rounded border px-2 py-0.5 text-[10px] font-extrabold ${bandBadge}`}>
                      {bandLabel}
                    </span>
                  </div>

                  {/* Evidence Context */}
                  <div className="text-[11px] text-slate-600">
                    {item.route === "MCC" ? (
                      <span>Typical R1: around AIR {item.medianAIR?.toLocaleString() || "N/A"} • Highest: {item.highestAIR?.toLocaleString() || "N/A"}</span>
                    ) : (
                      <span>Approx. non-MCC pool: {item.estimatedPool !== null ? `${item.estimatedPool} seats` : "N/A"}</span>
                    )}
                  </div>

                  {/* Personal Decision Factors / Student Note */}
                  {includeNotes && u && (u.annualTuition !== undefined || u.serviceBond || u.personalNote) && (
                    <div className="text-[11px] text-slate-600 bg-amber-50/70 border border-amber-200 rounded-lg p-2 mt-1 space-y-0.5">
                      <div className="font-bold text-[10px] uppercase text-amber-900">Your notes (Entered by you):</div>
                      <div className="flex flex-wrap gap-x-3 text-slate-800">
                        {u.annualTuition !== undefined && <span>Fee: {formatINR(u.annualTuition)}</span>}
                        {u.serviceBond === "YES" && <span>Bond: {u.bondDurationYears || 1} yr{u.bondPenalty ? ` (${formatINR(u.bondPenalty)})` : ""}</span>}
                        {u.serviceBond === "NO" && <span>Bond: None</span>}
                        {u.personalNote && <span>&ldquo;{u.personalNote}&rdquo;</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Controls & Actions (Screen Only) */}
              <div className="flex items-center gap-1 self-end sm:self-center shrink-0 no-print">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => onMove(item.id, "UP")}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  aria-label={`Move ${item.collegeName} up`}
                >
                  ▲ Up
                </button>
                <button
                  type="button"
                  disabled={idx === items.length - 1}
                  onClick={() => onMove(item.id, "DOWN")}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  aria-label={`Move ${item.collegeName} down`}
                >
                  ▼ Down
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-100 transition ml-1"
                  aria-label={`Remove ${item.collegeName} from plan`}
                >
                  ✕ Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

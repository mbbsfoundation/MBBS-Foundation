"use client";

import React, { useState, useEffect } from "react";
import type { CPRDayStateReport, CPRDayCentreReport } from "@/lib/cprCensus";
import type { CPRDayStateReconciliationReport, CentreReconciliationItem } from "@/lib/cprReporting";
import type { VenueReviewSnapshotItem, ReconciliationDecisionType } from "@/lib/cprReconciliationStore";
import {
  LOCKED_OFFICIAL_STATE_CENSUS,
  LOCKED_OFFICIAL_INDIA_TOTAL,
  LockedStateCensusEntry,
} from "@/lib/cprStateCensus";
import CPRVerificationInbox from "@/components/cpr/CPRVerificationInbox";
import { stateNameToSlug } from "@/lib/cprSlug";

export type ReportStatus = "DRAFT" | "FINAL";

interface CPRStateReportViewerProps {
  isAdmin?: boolean;
  status?: ReportStatus;
}

export default function CPRStateReportViewer({
  isAdmin = true,
  status = "DRAFT",
}: CPRStateReportViewerProps) {
  // Configurable report status: "DRAFT" for state verification, "FINAL" for approved official release
  const reportStatus: ReportStatus = status;
  const [selectedState, setSelectedState] = useState<string>("Maharashtra");
  const [report, setReport] = useState<CPRDayStateReport | null>(null);
  const [reconciliation, setReconciliation] = useState<CPRDayStateReconciliationReport | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<"REPORT" | "RECONCILIATION" | "VERIFICATION_INBOX">("REPORT");
  const [reconciliationFilter, setReconciliationFilter] = useState<string>("ALL");
  const [reconciliationSearch, setReconciliationSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generationDate, setGenerationDate] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Venue Reconciliation Review Workspace State
  const [reviewItems, setReviewItems] = useState<VenueReviewSnapshotItem[]>([]);
  const [reviewCategoryFilter, setReviewCategoryFilter] = useState<string>("ALL");
  const [selectedReviewItem, setSelectedReviewItem] = useState<VenueReviewSnapshotItem | null>(null);
  const [confirmModalType, setConfirmModalType] = useState<"SAME_VENUE" | "SUPPLEMENTARY" | "RESET" | null>(null);
  const [suppTrainedInput, setSuppTrainedInput] = useState<string>("");
  const [decisionNoteInput, setDecisionNoteInput] = useState<string>("");
  const [isSavingDecision, setIsSavingDecision] = useState<boolean>(false);
  const [decisionMessage, setDecisionMessage] = useState<string | null>(null);

  // Load initial default state report on mount
  useEffect(() => {
    handleGenerateReport("Maharashtra");
  }, []);

  const handleGenerateReport = async (stateToLoad?: string) => {
    const targetState = stateToLoad || selectedState;
    if (!targetState) {
      setError("Please select a state.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [res, decRes] = await Promise.all([
        fetch(`/api/cprsanjeevani/census?state=${encodeURIComponent(targetState)}`),
        fetch(`/api/cprsanjeevani/reconciliation/decisions?state=${encodeURIComponent(targetState)}`),
      ]);

      const data = await res.json();
      const decData = await decRes.json();

      if (res.ok && data.success && data.report) {
        setReport(data.report);
        setReconciliation(data.reconciliation || null);
        if (decData.success && Array.isArray(decData.items)) {
          setReviewItems(decData.items);
        }
        const now = new Date();
        setGenerationDate(
          now.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }) + ` at ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
        );
      } else {
        setError(data.error || `No census records found for state "${targetState}".`);
        setReport(null);
        setReconciliation(null);
        setReviewItems([]);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    if (!report) return;

    if (selectedState === "ALL_INDIA") {
      const stateList = (reconciliation as any)?.stateSummaries || (report as any)?.stateSummaries || [];
      const headers = [
        "S.No",
        "State / Union Territory",
        "Zone",
        "Courses / Sessions",
        "Physical Venues",
        "Baseline Reported Trained",
        "Participants Certified",
        "Draft Reconciled Trained",
        "Verification Status",
      ];

      const csvRows = [headers.join(",")];

      let sumCourses = 0;
      let sumVenues = 0;
      let sumBTrained = 0;
      let sumCertified = 0;
      let sumRecTrained = 0;

      stateList.forEach((s: any, idx: number) => {
        const courses = s.draftCourses ?? s.baselineCourses ?? s.centres ?? 0;
        const venues = s.draftVenues ?? s.baselineVenues ?? s.centres ?? 0;
        const bTrained = s.baselineTrained ?? s.participants ?? 0;
        const cert = s.certified ?? 0;
        const recTrained = s.reconciledTrained ?? s.participants ?? 0;

        sumCourses += courses;
        sumVenues += venues;
        sumBTrained += bTrained;
        sumCertified += cert;
        sumRecTrained += recTrained;

        const row = [
          idx + 1,
          `"${(s.canonicalState || s.state).replace(/"/g, '""')}"`,
          `"${(s.zone || "").replace(/"/g, '""')}"`,
          courses,
          venues,
          bTrained,
          cert,
          recTrained,
          `"${(s.verificationStatus || "Pending State Verification").replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(","));
      });

      // Total Row
      const totalRow = [
        `""`,
        `"INDIA TOTAL"`,
        `"National"`,
        sumCourses,
        sumVenues,
        sumBTrained,
        sumCertified,
        sumRecTrained,
        `"Pending State Verification"`,
      ];
      csvRows.push(totalRow.join(","));

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CPR_Sanjeevani_National_Draft_V1_Report.csv`;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    const stateCentres = reconciliation ? reconciliation.centres : report.centres;
    if (!stateCentres || stateCentres.length === 0) return;

    const headers = [
      "S.No",
      "Centre / Training Venue",
      "City",
      "Courses / Sessions",
      "Course Coordinator(s)",
      "CPR Champions",
      "Participants Trained (Draft Reconciled)",
      "Participants Certified",
      "Verification Status",
    ];

    const csvRows = [headers.join(",")];

    stateCentres.forEach((c: any) => {
      const coords = (c.allCoordinators || c.coordinators || []).join("; ");
      const champs = (c.allChampions || c.champions || []).join("; ");
      const trained = c.projectedTotal ?? c.participantsTrained ?? 0;
      const cert = c.liveRecords ?? 0;

      const row = [
        `"${String(c.serialNumber).replace(/"/g, '""')}"`,
        `"${String(c.venue).replace(/"/g, '""')}"`,
        `"${String(c.city || "").replace(/"/g, '""')}"`,
        c.coursesCount ?? 1,
        `"${coords.replace(/"/g, '""')}"`,
        `"${champs.replace(/"/g, '""')}"`,
        trained,
        cert,
        `"To Be Verified"`,
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CPR_Sanjeevani_State_Draft_V1_${report.canonicalState.replace(/\s+/g, "_")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Compute Data Quality Diagnostics (for Admin preview only, non-printing)
  const noCoordinatorCentres = report ? report.centres.filter((c) => c.coordinators.length === 0) : [];
  const noChampionCentres = report ? report.centres.filter((c) => c.champions.length === 0) : [];
  const zeroParticipantCentres = report ? report.centres.filter((c) => c.participantsTrained === 0) : [];
  const liveSupplementedCentres = report ? report.centres.filter((c) => c.supplementalFromLive) : [];

  // Filter reconciliation centres
  const filteredReconciliationCentres = reconciliation
    ? reconciliation.centres.filter((c) => {
        if (reconciliationFilter !== "ALL" && c.classification !== reconciliationFilter) {
          return false;
        }
        if (reconciliationSearch.trim()) {
          const q = reconciliationSearch.toLowerCase().trim();
          return (
            c.venue.toLowerCase().includes(q) ||
            c.city.toLowerCase().includes(q) ||
            c.allCoordinators.some((name) => name.toLowerCase().includes(q)) ||
            c.allChampions.some((name) => name.toLowerCase().includes(q))
          );
        }
        return true;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* 1. Admin Control & Selector Panel (Hidden when printing) */}
      <section className="no-print rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="rounded-full bg-teal-100 text-teal-900 border border-teal-200 px-3 py-1 text-xs font-black uppercase tracking-wider">
              📊 Administrator Reporting &amp; Census Engine
            </span>
            <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              National IAP CPR Day 2026 — Programme Reports
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Select All India for national consolidated analysis or choose any of the 28 authoritative States/UTs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
              🇮🇳 National Baseline: <strong className="text-slate-900">288 Physical Venues</strong> • <strong className="text-slate-900">391 Sessions</strong> • <strong className="text-slate-900">43,636 Trained</strong>
            </span>
          </div>
        </div>

        {/* View Mode Tabs (Admin Only) */}
        {isAdmin && (
          <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setActiveViewTab("REPORT")}
              className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-2 ${
                activeViewTab === "REPORT"
                  ? "bg-teal-800 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>📄</span> {selectedState === "ALL_INDIA" ? "Official National Report (DRAFT View)" : "Official State Report (DRAFT View)"}
            </button>

            <button
              type="button"
              onClick={() => setActiveViewTab("RECONCILIATION")}
              className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-2 ${
                activeViewTab === "RECONCILIATION"
                  ? "bg-indigo-900 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>🔍</span> {selectedState === "ALL_INDIA" ? "National Reconciliation & Audit" : "Admin Reconciliation & Audit"} (CPR Day 2026)
              {reconciliation && reconciliation.summary.reconciliation.supplementaryNewCourses > 0 && (
                <span className="rounded-full bg-emerald-500 text-white px-2 py-0.5 text-[10px] font-black">
                  +{reconciliation.summary.reconciliation.supplementaryNewCourses} New Courses
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveViewTab("VERIFICATION_INBOX")}
              className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-2 ${
                activeViewTab === "VERIFICATION_INBOX"
                  ? "bg-teal-900 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>📥</span> State Verification Inbox
            </button>
          </div>
        )}

        {/* State Selector Form */}
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[280px]">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              REPORTING SCOPE
            </label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                handleGenerateReport(e.target.value);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-none cursor-pointer"
            >
              <option value="ALL_INDIA" className="font-bold text-teal-900 bg-teal-50/50">
                🇮🇳 ALL INDIA — National Consolidated Report
              </option>
              <option disabled>────────── 28 Authoritative States / UTs ──────────</option>
              {LOCKED_OFFICIAL_STATE_CENSUS.map((s) => (
                <option key={s.canonicalState} value={s.canonicalState}>
                  {s.canonicalState} — ({s.centres} Centres • {s.participantsTrained.toLocaleString()} Trained)
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleGenerateReport()}
              disabled={loading}
              className="rounded-xl bg-teal-800 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow hover:bg-teal-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? "⏳ Loading..." : "🔄 Refresh Data"}
            </button>

            {report && activeViewTab === "REPORT" && (
              <>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="rounded-xl bg-gradient-to-r from-teal-700 to-indigo-900 px-5 py-2.5 text-xs sm:text-sm font-black text-white shadow-lg hover:from-teal-800 hover:to-indigo-950 transition flex items-center gap-1.5 cursor-pointer"
                  title="Print or Save as PDF in A4 Portrait format"
                >
                  🖨️ Print / Save as PDF
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  📥 Download CSV
                </button>

                {selectedState !== "ALL_INDIA" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const slug = stateNameToSlug(selectedState);
                        window.open(`/cprsanjeevani/verify/${slug}`, "_blank");
                      }}
                      className="rounded-xl bg-teal-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow hover:bg-teal-700 transition flex items-center gap-1.5 cursor-pointer"
                      title="Open public verification page for Course Coordinators in a new tab"
                    >
                      🔗 OPEN / SHARE VERIFICATION PAGE
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const slug = stateNameToSlug(selectedState);
                        const cleanUrl = `https://mbbsfoundation.com/cprsanjeevani/verify/${slug}`;
                        navigator.clipboard.writeText(cleanUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="rounded-xl border border-teal-300 bg-teal-50 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-teal-800 hover:bg-teal-100 transition flex items-center gap-1.5 cursor-pointer"
                      title="Copy clean canonical link for sharing in State WhatsApp group"
                    >
                      {copiedLink ? "✓ LINK COPIED!" : "📋 COPY VERIFICATION LINK"}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
            ⚠️ {error}
          </div>
        )}

        {/* Data Quality & Diagnostics Warning Area (Admin only, non-printing) */}
        {report && isAdmin && activeViewTab === "REPORT" && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <span>🔍</span> Data Diagnostics &amp; Baseline Quality Check (Internal Admin View Only):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="bg-white/80 p-2 rounded border border-amber-200">
                <span className="text-slate-500">Live Enriched Centres:</span>{" "}
                <strong className="text-teal-900">{liveSupplementedCentres.length}</strong>
              </div>
              <div className="bg-white/80 p-2 rounded border border-amber-200">
                <span className="text-slate-500">Centres without Coordinator:</span>{" "}
                <strong className={noCoordinatorCentres.length > 0 ? "text-amber-700" : "text-emerald-700"}>
                  {noCoordinatorCentres.length}
                </strong>
              </div>
              <div className="bg-white/80 p-2 rounded border border-amber-200">
                <span className="text-slate-500">Centres without Champions:</span>{" "}
                <strong className={noChampionCentres.length > 0 ? "text-amber-700" : "text-emerald-700"}>
                  {noChampionCentres.length}
                </strong>
              </div>
              <div className="bg-white/80 p-2 rounded border border-amber-200">
                <span className="text-slate-500">Centres with 0 Trained:</span>{" "}
                <strong className={zeroParticipantCentres.length > 0 ? "text-amber-700" : "text-emerald-700"}>
                  {zeroParticipantCentres.length}
                </strong>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2A-1. State Verification Inbox Tab */}
      {isAdmin && activeViewTab === "VERIFICATION_INBOX" && (
        <div className="no-print">
          <CPRVerificationInbox
            initialStateFilter={selectedState === "ALL_INDIA" ? "ALL" : selectedState}
            statesList={LOCKED_OFFICIAL_STATE_CENSUS.map((s) => s.canonicalState)}
          />
        </div>
      )}

      {/* 2A. Admin Reconciliation & Audit Panel (Dual Metrics) */}
      {reconciliation && activeViewTab === "RECONCILIATION" && (
        <div className="no-print space-y-6">
          {/* Summary Stat Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Baseline Census */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>1. Baseline Census</span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">Locked Standard</span>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-600">Physical Venues:</span>
                  <span className="text-base font-bold text-slate-800">{reconciliation.summary.baseline.uniqueVenues}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-600">Courses / Sessions:</span>
                  <span className="text-base font-bold text-slate-800">{reconciliation.summary.baseline.courses}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700">Reported Trained:</span>
                  <span className="text-xl font-black text-teal-900">{reconciliation.summary.baseline.reportedTrained.toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-2.5 text-[10px] text-slate-500">
                Official coordinator course reports baseline.
              </div>
            </div>

            {/* Card 2: Live Digital Certificates */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-wider text-blue-800 flex items-center justify-between">
                <span>2. Live Certificates</span>
                <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-900">21 July 2026</span>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-600">Participants Certified:</span>
                  <span className="text-xl font-black text-blue-950">{reconciliation.summary.liveData.participantCertificatesFound.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-600">Certificate Venues:</span>
                  <span className="text-base font-bold text-slate-800">{reconciliation.summary.liveData.uniqueVenuesRepresented}</span>
                </div>
                <div className="flex justify-between items-baseline text-xs text-slate-600 pt-1 border-t border-blue-100">
                  <span>Verified Faculty:</span>
                  <span><strong>{reconciliation.summary.liveData.coordinatorsFound}</strong> Coords • <strong>{reconciliation.summary.liveData.championsFound}</strong> Champs</span>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-blue-800/80">
                Unique verified digital certificate records.
              </div>
            </div>

            {/* Card 3: Audit Reconciliation Breakdown */}
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-wider text-indigo-900 flex items-center justify-between">
                <span>3. Reconciliation</span>
                <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-950">Audit Breakdown</span>
              </div>
              <div className="mt-2.5 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Matched Venues:</span>
                  <strong className="text-emerald-700">{reconciliation.summary.reconciliation.baselineMatchedVenues}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Supplementary New Courses:</span>
                  <strong className="text-indigo-800">+{reconciliation.summary.reconciliation.supplementaryNewCourses}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Venues in Review:</span>
                  <strong className="text-amber-700">{reconciliation.summary.reconciliation.reviewVenues}</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-indigo-100">
                  <span className="text-slate-600">Incremental Trained:</span>
                  <strong className="text-indigo-950">+{reconciliation.summary.reconciliation.confirmedNewIncrementalParticipants.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {/* Card 4: Dual-Metric Reconciled Totals */}
            <div className="rounded-2xl border-2 border-teal-600 bg-teal-50/60 p-5 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-wider text-teal-900 flex items-center justify-between">
                <span>4. Reconciled Totals</span>
                <span className="rounded bg-teal-200 px-2 py-0.5 text-[9px] font-black text-teal-950">DUAL METRIC</span>
              </div>
              <div className="mt-2.5 space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-teal-950">Participants Trained:</span>
                  <span className="text-xl font-black text-teal-950">{reconciliation.summary.reconciledReport.participantsTrained.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-blue-900">Participants Certified:</span>
                  <span className="text-base font-black text-blue-950">{reconciliation.summary.reconciledReport.participantsCertified.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-baseline text-xs text-slate-600 pt-1 border-t border-teal-200">
                  <span>Courses Conducted:</span>
                  <strong className="text-slate-900">{reconciliation.summary.reconciledReport.coursesConducted}</strong>
                </div>
              </div>
              <div className="mt-2 rounded bg-teal-100/90 border border-teal-300 px-2 py-0.5 text-[9px] font-bold text-teal-900 text-center leading-tight">
                PARTICIPANTS TRAINED (REACH) VS CERTIFIED (DIGITAL)
              </div>
            </div>
          </div>

          {/* State-Level or National Reconciliation Table */}
          {selectedState === "ALL_INDIA" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-black text-amber-900 tracking-wider uppercase">
                      NATIONAL RECONCILIATION OVERVIEW — DRAFT
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    All-India State/UT Programme Reconciliation Overview (28 States/UTs)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Click any State/UT name or &quot;Inspect State&quot; to drill down into its dedicated venue-level reconciliation workspace.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-800 text-white font-bold text-[11px] border-b border-slate-900">
                    <tr>
                      <th className="py-2.5 px-2 text-center w-12">S.No</th>
                      <th className="py-2.5 px-3 min-w-[180px]">State / Union Territory</th>
                      <th className="py-2.5 px-3 text-center">Baseline Courses</th>
                      <th className="py-2.5 px-3 text-right">Baseline Trained</th>
                      <th className="py-2.5 px-3 text-right text-blue-300">Certified</th>
                      <th className="py-2.5 px-3 text-right">Increment (+Δ)</th>
                      <th className="py-2.5 px-3 text-right bg-teal-900 text-teal-100">Reconciled Trained</th>
                      <th className="py-2.5 px-3 text-center">Pending Groups</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {((reconciliation as any)?.stateSummaries || []).map((s: any, idx: number) => (
                      <tr key={s.canonicalState || idx} className="hover:bg-slate-50 transition">
                        <td className="py-2 px-2 text-center font-mono text-slate-500">{s.sNo || idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedState(s.canonicalState);
                              handleGenerateReport(s.canonicalState);
                            }}
                            className="text-left font-bold text-teal-900 hover:text-teal-700 hover:underline cursor-pointer"
                          >
                            {s.canonicalState}
                          </button>
                        </td>
                        <td className="py-2 px-3 text-center font-mono">{s.baselineCourses}</td>
                        <td className="py-2 px-3 text-right font-mono">{s.baselineTrained.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-blue-900">{s.certified.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-indigo-900">
                          {s.reconciledIncrement > 0 ? `+${s.reconciledIncrement.toLocaleString()}` : "0"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black text-teal-950 bg-teal-50/40">
                          {s.reconciledTrained.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                              s.pendingReviewGroups > 0
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {s.pendingReviewGroups}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              s.status === "Reconciled"
                                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                : s.status === "Partially Reconciled"
                                ? "bg-indigo-100 text-indigo-900 border border-indigo-300"
                                : s.status === "No Reconciliation Required"
                                ? "bg-slate-100 text-slate-700 border border-slate-300"
                                : "bg-amber-100 text-amber-900 border border-amber-300"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedState(s.canonicalState);
                              handleGenerateReport(s.canonicalState);
                            }}
                            className="rounded bg-slate-100 hover:bg-teal-800 hover:text-white text-slate-700 text-[11px] font-bold px-2.5 py-1 transition cursor-pointer border border-slate-300"
                          >
                            Inspect State ↗
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-slate-950">
                      <td className="py-2.5 px-2 text-center font-mono">🇮🇳</td>
                      <td className="py-2.5 px-3 uppercase tracking-wider font-black">INDIA TOTAL (28 States / UTs)</td>
                      <td className="py-2.5 px-3 text-center font-mono">{reconciliation.summary.baseline.courses}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{reconciliation.summary.baseline.reportedTrained.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-300">
                        {reconciliation.summary.liveData.participantCertificatesFound.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-indigo-300">
                        +{reconciliation.summary.reconciliation.confirmedNewIncrementalParticipants.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-teal-300">
                        {reconciliation.summary.reconciledReport.participantsTrained.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">{reconciliation.summary.reconciliation.reviewVenues}</td>
                      <td colSpan={2} className="py-2.5 px-3 text-right text-[10px] uppercase tracking-wider text-amber-300">
                        DRAFT — RECONCILIATION IN PROGRESS
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <>
              {/* Centre-Level Reconciliation Table Section for Single State */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-black text-amber-900 tracking-wider uppercase">
                        INTERNAL RECONCILIATION – NOT FINAL REPORT
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900">
                      Canonical Physical Venue Reconciliation — {reconciliation.canonicalState}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Reconciled at the physical venue entity level with baseline session counts, baseline reported attendance, and verified participant certificates.
                    </p>
                  </div>

                  {/* Filters & Search */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
                      {(["ALL", "BASELINE_MATCH", "SUPPLEMENTARY_NEW_COURSE", "REVIEW_REQUIRED"] as const).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setReconciliationFilter(cat)}
                          className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                            reconciliationFilter === cat ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
                          }`}
                        >
                          {cat === "ALL"
                            ? "All Venues"
                            : cat === "BASELINE_MATCH"
                            ? "Baseline Matches"
                            : cat === "SUPPLEMENTARY_NEW_COURSE"
                            ? "New Courses"
                            : "Review Required"}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Filter venue, city, or coordinator..."
                      value={reconciliationSearch}
                      onChange={(e) => setReconciliationSearch(e.target.value)}
                      className="rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">S.No</th>
                        <th className="py-2.5 px-3 min-w-[220px]">Venue / Training Centre</th>
                        <th className="py-2.5 px-3 w-28">City</th>
                        <th className="py-2.5 px-3 w-20 text-center">Courses</th>
                        <th className="py-2.5 px-3 w-24 text-right">Baseline Reported</th>
                        <th className="py-2.5 px-3 w-24 text-center">Attendance</th>
                        <th className="py-2.5 px-3 w-24 text-right">Certified</th>
                        <th className="py-2.5 px-3 w-28 text-right bg-teal-50/50">Reconciled Trained</th>
                        <th className="py-2.5 px-3 min-w-[220px]">Faculty Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {filteredReconciliationCentres.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                            No venues match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredReconciliationCentres.map((c, i) => {
                          const isIncremented = c.projectedTotal > c.baselineParticipants;
                          const diff = c.projectedTotal - c.baselineParticipants;

                          return (
                            <tr
                              key={`${c.serialNumber}_${i}`}
                              className={`hover:bg-slate-50 transition ${
                                c.classification === "SUPPLEMENTARY_NEW_COURSE"
                                  ? "bg-indigo-50/20"
                                  : c.classification === "REVIEW_REQUIRED"
                                  ? "bg-amber-50/20"
                                  : ""
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                                {c.serialNumber}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-900">
                                <div>{c.venue}</div>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  <span
                                    className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                      c.classification === "BASELINE_MATCH"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : c.classification === "SUPPLEMENTARY_NEW_COURSE"
                                        ? "bg-indigo-100 text-indigo-800"
                                        : "bg-amber-100 text-amber-800"
                                    }`}
                                  >
                                    {c.classification === "BASELINE_MATCH"
                                      ? "Baseline Match"
                                      : c.classification === "SUPPLEMENTARY_NEW_COURSE"
                                      ? "Supplementary Course"
                                      : "Review Required"}
                                  </span>
                                  {c.classificationReason && (
                                    <span className="text-[9px] text-slate-400">
                                      ({c.classificationReason})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">{c.city || "—"}</td>
                              <td className="py-2.5 px-3 text-center font-mono">{c.coursesCount}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-600">
                                {c.baselineParticipants.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                                {c.verifiedAttendanceCount !== undefined
                                  ? c.verifiedAttendanceCount.toLocaleString()
                                  : "—"}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900">
                                {c.liveRecords.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono bg-teal-50/40">
                                <span className="font-bold text-teal-950">
                                  {c.projectedTotal.toLocaleString()}
                                </span>
                                {isIncremented && (
                                  <span className="ml-1.5 text-[10px] font-black text-emerald-600">
                                    (+{diff.toLocaleString()})
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-[11px] text-slate-600 space-y-0.5">
                                {c.allCoordinators.length > 0 && (
                                  <div>
                                    <span className="font-bold text-slate-700">Coord:</span>{" "}
                                    {c.allCoordinators.join(", ")}
                                  </div>
                                )}
                                {c.allChampions.length > 0 && (
                                  <div className="text-[10px] text-slate-500">
                                    <span className="font-semibold text-slate-600">Champs:</span>{" "}
                                    {c.allChampions.slice(0, 3).join(", ")}
                                    {c.allChampions.length > 3 && ` +${c.allChampions.length - 3} more`}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                        <td colSpan={3} className="py-2.5 px-3 text-right uppercase tracking-wider text-[10px]">
                          Reconciled Totals ({reconciliation.summary.baseline.uniqueVenues} Canonical Venues):
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">{reconciliation.summary.reconciledReport.coursesConducted}</td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {reconciliation.summary.baseline.reportedTrained.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400">—</td>
                        <td className="py-2.5 px-3 text-right font-mono text-blue-900">
                          {reconciliation.summary.reconciledReport.participantsCertified.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-teal-950 bg-teal-100/50">
                          {reconciliation.summary.reconciledReport.participantsTrained.toLocaleString()}
                          {reconciliation.summary.reconciliation.confirmedNewIncrementalParticipants > 0 && (
                            <span className="ml-1 text-[10px] font-black text-emerald-700">
                              (+{reconciliation.summary.reconciliation.confirmedNewIncrementalParticipants.toLocaleString()})
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[10px] text-slate-500">
                          {reconciliation.summary.reconciledReport.coordinatorsCount} Coords • {reconciliation.summary.reconciledReport.championsCount} Champs
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Venue-Level Reconciliation Workspace (for human review of remaining review items) */}
              <div className="rounded-2xl border-2 border-teal-700/60 bg-gradient-to-br from-teal-50/60 via-white to-indigo-50/60 p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-teal-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded-full bg-teal-900 text-white px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase">
                        Admin Reconciliation Workspace
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        (Venue-Level Decisions • Reversible)
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-slate-900">
                      Venue Reconciliation &amp; Supplementary Approval — {reconciliation.canonicalState}
                    </h4>
                  </div>

                  {decisionMessage && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-800">
                      ✅ {decisionMessage}
                    </div>
                  )}
                </div>

                {/* Review Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 shadow-xs">
                    <div className="text-[10px] font-black uppercase text-amber-900 tracking-wider">Pending Groups</div>
                    <div className="text-xl font-black text-amber-950 mt-1">
                      {reviewItems.filter((i) => i.status === "PENDING").length}
                    </div>
                    <div className="text-[10px] text-amber-800">Awaiting Admin Confirmation</div>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 shadow-xs">
                    <div className="text-[10px] font-black uppercase text-blue-900 tracking-wider">Pending Certified</div>
                    <div className="text-xl font-black text-blue-950 mt-1">
                      {reviewItems
                        .filter((i) => i.status === "PENDING")
                        .reduce((a, b) => a + b.certifiedCount, 0)
                        .toLocaleString()}
                    </div>
                    <div className="text-[10px] text-blue-800">Digital certificates pending</div>
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 shadow-xs">
                    <div className="text-[10px] font-black uppercase text-emerald-900 tracking-wider">Strong Same Match</div>
                    <div className="text-xl font-black text-emerald-950 mt-1">
                      {reviewItems.filter((i) => i.suggestedClassification === "STRONG_SAME_BASELINE_CANDIDATE").length}
                    </div>
                    <div className="text-[10px] text-emerald-800">High-confidence baseline counterpart</div>
                  </div>

                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 shadow-xs">
                    <div className="text-[10px] font-black uppercase text-indigo-900 tracking-wider">Possible / Ambiguous</div>
                    <div className="text-xl font-black text-indigo-950 mt-1">
                      {
                        reviewItems.filter(
                          (i) =>
                            i.suggestedClassification === "POSSIBLE_SAME_BASELINE_CANDIDATE" ||
                            i.suggestedClassification === "AMBIGUOUS_MULTIPLE_CANDIDATES"
                        ).length
                      }
                    </div>
                    <div className="text-[10px] text-indigo-800">Requires coordinator inspection</div>
                  </div>

                  <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3 shadow-xs col-span-2 sm:col-span-1">
                    <div className="text-[10px] font-black uppercase text-purple-900 tracking-wider">No Baseline Match</div>
                    <div className="text-xl font-black text-purple-950 mt-1">
                      {reviewItems.filter((i) => i.suggestedClassification === "NO_RELIABLE_BASELINE_MATCH").length}
                    </div>
                    <div className="text-[10px] text-purple-800">Potential supplementary facility</div>
                  </div>
                </div>

                {/* Review Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                    {(
                      [
                        { id: "ALL", label: "All Items" },
                        { id: "PENDING", label: "Pending" },
                        { id: "STRONG", label: "Strong Same Match" },
                        { id: "POSSIBLE", label: "Possible / Ambiguous" },
                        { id: "NO_MATCH", label: "No Baseline Match" },
                        { id: "APPROVED", label: "Approved" },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setReviewCategoryFilter(f.id)}
                        className={`px-3 py-1.5 rounded-lg transition cursor-pointer text-xs ${
                          reviewCategoryFilter === f.id
                            ? "bg-teal-900 text-white shadow-xs"
                            : "hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="text-xs text-slate-500 font-medium">
                    Showing{" "}
                    <strong>
                      {
                        reviewItems.filter((i) => {
                          if (reviewCategoryFilter === "PENDING") return i.status === "PENDING";
                          if (reviewCategoryFilter === "APPROVED") return i.status === "APPROVED";
                          if (reviewCategoryFilter === "STRONG")
                            return i.suggestedClassification === "STRONG_SAME_BASELINE_CANDIDATE";
                          if (reviewCategoryFilter === "POSSIBLE")
                            return (
                              i.suggestedClassification === "POSSIBLE_SAME_BASELINE_CANDIDATE" ||
                              i.suggestedClassification === "AMBIGUOUS_MULTIPLE_CANDIDATES"
                            );
                          if (reviewCategoryFilter === "NO_MATCH")
                            return i.suggestedClassification === "NO_RELIABLE_BASELINE_MATCH";
                          return true;
                        }).length
                      }
                    </strong>{" "}
                    review groups in {reconciliation.canonicalState}
                  </div>
                </div>

                {/* Review Table / Decision Cards */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">Review ID</th>
                        <th className="py-2.5 px-3">Live Certificate Venue</th>
                        <th className="py-2.5 px-3">City</th>
                        <th className="py-2.5 px-3 text-right">Certified</th>
                        <th className="py-2.5 px-3">Best Baseline Candidate</th>
                        <th className="py-2.5 px-3">Recommendation &amp; Reason</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reviewItems
                        .filter((i) => {
                          if (reviewCategoryFilter === "PENDING") return i.status === "PENDING";
                          if (reviewCategoryFilter === "APPROVED") return i.status === "APPROVED";
                          if (reviewCategoryFilter === "STRONG")
                            return i.suggestedClassification === "STRONG_SAME_BASELINE_CANDIDATE";
                          if (reviewCategoryFilter === "POSSIBLE")
                            return (
                              i.suggestedClassification === "POSSIBLE_SAME_BASELINE_CANDIDATE" ||
                              i.suggestedClassification === "AMBIGUOUS_MULTIPLE_CANDIDATES"
                            );
                          if (reviewCategoryFilter === "NO_MATCH")
                            return i.suggestedClassification === "NO_RELIABLE_BASELINE_MATCH";
                          return true;
                        })
                        .map((item) => (
                          <React.Fragment key={item.reviewId}>
                            <tr className="hover:bg-slate-50/70 transition">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-600">
                                {item.reviewId}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-900">
                                <div>{item.liveVenue}</div>
                                {item.sampleCertificateIds && item.sampleCertificateIds.length > 0 && (
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    e.g. {item.sampleCertificateIds[0]}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">{item.city || "—"}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900">
                                {item.certifiedCount.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-[11px] text-slate-700">
                                {item.bestCandidateVenueName ? (
                                  <div>
                                    <span className="font-semibold text-slate-900">
                                      {item.bestCandidateVenueName}
                                    </span>{" "}
                                    ({item.bestCandidateCity})
                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                      {item.bestCandidateSessions} session(s) •{" "}
                                      {item.bestCandidateReportedTrained} reported trained
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">No reliable baseline counterpart identified</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-[11px]">
                                <span
                                  className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold mr-1.5 ${
                                    item.suggestedClassification === "STRONG_SAME_BASELINE_CANDIDATE"
                                      ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                      : item.suggestedClassification === "POSSIBLE_SAME_BASELINE_CANDIDATE"
                                      ? "bg-blue-100 text-blue-900 border border-blue-300"
                                      : item.suggestedClassification === "AMBIGUOUS_MULTIPLE_CANDIDATES"
                                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                                      : "bg-slate-100 text-slate-700 border border-slate-300"
                                  }`}
                                >
                                  {item.suggestedClassification}
                                </span>
                                <span className="text-slate-600 text-[11px] block mt-0.5">
                                  {item.matchReason}
                                </span>
                                {item.candidateMatches && item.candidateMatches.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedReviewItem(
                                        selectedReviewItem?.reviewId === item.reviewId ? null : item
                                      )
                                    }
                                    className="text-[10px] font-bold text-teal-800 hover:text-teal-950 underline mt-1 cursor-pointer"
                                  >
                                    {selectedReviewItem?.reviewId === item.reviewId
                                      ? "Hide Candidate Evidence ▲"
                                      : `View Evidence (${item.candidateMatches.length} candidate${
                                          item.candidateMatches.length > 1 ? "s" : ""
                                        }) ▼`}
                                  </button>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                                    item.status === "APPROVED"
                                      ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                      : "bg-amber-100 text-amber-900 border border-amber-300"
                                  }`}
                                >
                                  {item.status === "APPROVED" ? item.finalDecision : "PENDING"}
                                </span>
                                {item.reviewedBy && (
                                  <div className="text-[9px] text-slate-400 mt-0.5">
                                    by {item.reviewedBy}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                                {item.status === "PENDING" ? (
                                  <>
                                    {item.bestCandidateVenueId && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedReviewItem(item);
                                          setConfirmModalType("SAME_VENUE");
                                        }}
                                        className="rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2.5 py-1 text-[11px] shadow-xs cursor-pointer transition"
                                      >
                                        Confirm Same
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedReviewItem(item);
                                        setSuppTrainedInput(String(item.certifiedCount));
                                        setConfirmModalType("SUPPLEMENTARY");
                                      }}
                                      className="rounded bg-indigo-700 hover:bg-indigo-800 text-white font-bold px-2.5 py-1 text-[11px] shadow-xs cursor-pointer transition"
                                    >
                                      Supplementary
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(
                                          `/api/cprsanjeevani/reconciliation/decisions?reviewId=${encodeURIComponent(
                                            item.reviewId
                                          )}`,
                                          { method: "DELETE" }
                                        );
                                        if (res.ok) {
                                          setDecisionMessage(`Reverted ${item.reviewId} to PENDING`);
                                          handleGenerateReport();
                                        }
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }}
                                    className="rounded border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold px-2 py-1 text-[10px] cursor-pointer transition"
                                  >
                                    ↺ Revert
                                  </button>
                                )}
                              </td>
                            </tr>

                            {/* Expandable Evidence Drawer */}
                            {selectedReviewItem?.reviewId === item.reviewId &&
                              item.candidateMatches &&
                              item.candidateMatches.length > 0 && (
                                <tr className="bg-teal-50/50 border-b border-teal-100">
                                  <td colSpan={8} className="p-3 pl-8">
                                    <div className="bg-white rounded-xl border border-teal-200 p-3 space-y-2 shadow-xs">
                                      <div className="flex items-center justify-between text-xs font-black text-teal-950 uppercase tracking-wide">
                                        <span>Candidate Baseline Evidence for {item.reviewId}</span>
                                        <span className="text-[10px] font-normal text-slate-500">
                                          Comparing live venue &quot;{item.liveVenue}&quot; ({item.city})
                                        </span>
                                      </div>
                                      <div className="space-y-1.5">
                                        {item.candidateMatches.map((c, cIdx) => (
                                          <div
                                            key={cIdx}
                                            className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2"
                                          >
                                            <div>
                                              <span className="font-bold text-slate-900">
                                                {c.canonicalVenueName}
                                              </span>{" "}
                                              <span className="text-slate-600 font-medium">
                                                ({c.city})
                                              </span>
                                              <div className="text-[10px] text-slate-500">
                                                ID: {c.canonicalVenueId} • Sessions: {c.baselineCourseCount} • Baseline Trained: {c.baselineReportedTrained} • Reason: {c.matchReason}
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className="rounded bg-teal-100 text-teal-900 px-2 py-0.5 text-[10px] font-bold">
                                                Score: {c.matchScore}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                          </React.Fragment>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

            {/* Interactive Confirmation Modal */}
            {confirmModalType && selectedReviewItem && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-base font-black text-slate-900">
                      {confirmModalType === "SAME_VENUE"
                        ? "Confirm Same Baseline Physical Venue"
                        : "Approve Supplementary New Course / Venue"}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setConfirmModalType(null)}
                      className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="text-xs text-slate-700 space-y-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                      <div>
                        <strong>Review Group:</strong> {selectedReviewItem.reviewId} —{" "}
                        {selectedReviewItem.liveVenue} ({selectedReviewItem.city})
                      </div>
                      <div>
                        <strong>Live Certified Participants:</strong>{" "}
                        <span className="font-mono text-blue-900 font-bold">
                          {selectedReviewItem.certifiedCount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {confirmModalType === "SAME_VENUE" && (
                      <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 space-y-1.5 text-emerald-950">
                        <div className="font-bold">Target Baseline Physical Venue:</div>
                        <div>{selectedReviewItem.bestCandidateVenueName}</div>
                        <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] border-t border-emerald-200">
                          <div>
                            Baseline Reported:{" "}
                            <strong>
                              {selectedReviewItem.bestCandidateReportedTrained?.toLocaleString()}
                            </strong>
                          </div>
                          <div>
                            Live Certified:{" "}
                            <strong>{selectedReviewItem.certifiedCount.toLocaleString()}</strong>
                          </div>
                          <div className="col-span-2 pt-1 text-xs">
                            Resulting Venue Reach (MAX Rule):{" "}
                            <strong className="text-emerald-900 font-black">
                              {Math.max(
                                selectedReviewItem.bestCandidateReportedTrained || 0,
                                selectedReviewItem.certifiedCount
                              ).toLocaleString()}{" "}
                              Trained
                            </strong>{" "}
                            (Delta: +
                            {Math.max(
                              0,
                              selectedReviewItem.certifiedCount -
                                (selectedReviewItem.bestCandidateReportedTrained || 0)
                            )}
                            )
                          </div>
                        </div>
                      </div>
                    )}

                    {confirmModalType === "SUPPLEMENTARY" && (
                      <div className="space-y-2.5">
                        <label className="block font-bold text-slate-800">
                          Approved Supplementary Trained Reach:
                        </label>
                        <input
                          type="number"
                          value={suppTrainedInput}
                          onChange={(e) => setSuppTrainedInput(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-bold font-mono text-slate-900"
                          placeholder="Enter verified supplementary reach"
                        />
                        <div className="text-[11px] text-slate-500">
                          Propose verified reach for this independent course/venue.
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="block font-bold text-slate-800">
                        Admin Note (Optional):
                      </label>
                      <input
                        type="text"
                        value={decisionNoteInput}
                        onChange={(e) => setDecisionNoteInput(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800"
                        placeholder="e.g. Verified with state coordinator"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setConfirmModalType(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSavingDecision}
                      onClick={async () => {
                        setIsSavingDecision(true);
                        try {
                          const payload = {
                            reviewId: selectedReviewItem.reviewId,
                            finalDecision:
                              confirmModalType === "SAME_VENUE"
                                ? "SAME_BASELINE_VENUE"
                                : "SUPPLEMENTARY_NEW_VENUE",
                            finalCanonicalVenueId:
                              confirmModalType === "SAME_VENUE"
                                ? selectedReviewItem.bestCandidateVenueId
                                : undefined,
                            supplementaryTrainedCount:
                              confirmModalType === "SUPPLEMENTARY"
                                ? Number(suppTrainedInput) || selectedReviewItem.certifiedCount
                                : undefined,
                            reviewedBy: "Admin",
                            reviewNote: decisionNoteInput || undefined,
                          };

                          const res = await fetch("/api/cprsanjeevani/reconciliation/decisions", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload),
                          });

                          if (res.ok) {
                            setDecisionMessage(`Saved decision for ${selectedReviewItem.reviewId}`);
                            setConfirmModalType(null);
                            handleGenerateReport();
                          }
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setIsSavingDecision(false);
                        }
                      }}
                      className="px-5 py-2 text-xs font-bold text-white bg-teal-900 hover:bg-teal-950 rounded-xl shadow cursor-pointer disabled:opacity-50"
                    >
                      {isSavingDecision ? "Saving..." : "Confirm & Save"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    )}

      {/* 2B. Official A4 Portrait Report Sheet (Print Optimized) */}
      {report && activeViewTab === "REPORT" && (
        <div className="printable-report-wrapper mx-auto max-w-4xl">
          <div className="printable-report-sheet relative overflow-hidden bg-white border border-slate-300 sm:rounded-2xl p-5 sm:p-8 md:p-9 shadow-lg text-slate-900 font-sans">
            {/* Prominent Diagonal DRAFT Watermark Overlay (Rendered in front of all content, pointer-events: none) */}
            {reportStatus === "DRAFT" && (
              <div className="report-watermark-overlay select-none pointer-events-none" aria-hidden="true">
                <div className="report-watermark-text">DRAFT — FOR VERIFICATION</div>
                <div className="report-watermark-text">DRAFT — FOR VERIFICATION</div>
                <div className="report-watermark-text">DRAFT — FOR VERIFICATION</div>
                <div className="report-watermark-text">DRAFT — FOR VERIFICATION</div>
              </div>
            )}

            <div className="relative z-10 report-content-root">
              {/* Header / Programme Title Block */}
              <div className="border-b-2 border-slate-900 pb-4 report-header-block">
                <div>
                  <div className="text-xs font-black tracking-widest uppercase text-teal-800">
                    Indian Academy of Pediatrics
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-950 uppercase mt-0.5">
                    National IAP CPR Day 2026
                  </h1>
                  <div className="text-sm sm:text-base font-bold text-slate-700 tracking-wide mt-0.5">
                    {selectedState === "ALL_INDIA"
                      ? "CPR SANJEEVANI — NATIONAL PROGRAMME REPORT"
                      : "CPR SANJEEVANI — STATE PROGRAMME REPORT"}
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 border border-amber-300/80 px-2.5 py-0.5 text-xs font-black text-amber-900 tracking-wider uppercase">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                      DRAFT — FOR STATE VERIFICATION
                    </span>
                    <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-300 px-2 py-0.5 text-[11px] font-bold text-slate-700 font-mono">
                      Draft Version 1 • CPRDAY_CENSUS_DRAFT_V1
                    </span>
                  </div>

                  {/* Top Purpose Statement (Section 5) */}
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 sm:p-3 text-[11px] sm:text-xs text-amber-950 font-medium leading-relaxed">
                    <strong className="font-bold text-amber-900">PROVISIONAL PROGRAMME REPORT:</strong> This is a provisional programme report prepared from course reports, available attendance/certification records and subsequent data reconciliation. State teams and Course Coordinators are requested to verify the information and report any corrections, missing courses or discrepancies before finalisation.
                  </div>

                  {/* Trained vs Certified Metric Distinction Note (Section 8) */}
                  <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/90 p-2.5 sm:p-3 text-[10.5px] sm:text-[11px] text-slate-700 leading-relaxed">
                    <strong className="font-bold text-slate-900">METRIC DISTINCTION:</strong> Participants Trained represents the best available programme reach based on course reports and reconciled participant records. Participants Certified represents participants for whom valid individual certificate records are currently available.
                  </div>
                </div>

                {/* 3-Column Leadership Strip (Present in DRAFT and FINAL) */}
                <div className="mt-4 pt-3 pb-2.5 border-t border-slate-200 bg-slate-50/80 rounded-xl px-3 sm:px-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-center sm:divide-x sm:divide-slate-200">
                    <div className="px-1 flex flex-col justify-center">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                        President
                      </div>
                      <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
                        Dr. Neelam Mohan
                      </div>
                    </div>
                    <div className="px-1 flex flex-col justify-center">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                        General Secretary
                      </div>
                      <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
                        Dr. Ruchira Gupta
                      </div>
                    </div>
                    <div className="px-1 flex flex-col justify-center">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 leading-tight">
                        National Convener &amp; Course Director
                      </div>
                      <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
                        Dr. Lokesh Tiwari
                      </div>
                    </div>
                  </div>
                </div>

                {/* State / Zone & Census Summary */}
                <div className="mt-4 bg-slate-100/90 p-3 sm:p-4 rounded-xl border border-slate-300">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300/80 pb-3 mb-3">
                    <div>
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                        {selectedState === "ALL_INDIA" ? "Reporting Scope" : "State / Union Territory"}
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight">
                        {selectedState === "ALL_INDIA" ? "ALL INDIA (28 STATES & UNION TERRITORIES)" : report.canonicalState}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block rounded-lg bg-slate-900 text-white font-black text-xs sm:text-sm px-3.5 py-1 tracking-wider uppercase">
                        {report.zone}
                      </span>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  {selectedState === "ALL_INDIA" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200 text-center sm:text-left">
                        <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600">
                          Physical Venues
                        </div>
                        <div className="text-lg sm:text-xl font-black text-slate-950">
                          {reconciliation?.summary?.reconciledReport?.uniqueVenues || 292}
                        </div>
                        <div className="text-[8.5px] text-slate-500 font-medium">
                          Baseline: {reconciliation?.summary?.baseline?.uniqueVenues || 288} (+4 Supp)
                        </div>
                      </div>

                      <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200 text-center sm:text-left">
                        <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600">
                          Courses / Sessions
                        </div>
                        <div className="text-lg sm:text-xl font-black text-slate-950">
                          {reconciliation?.summary?.reconciledReport?.coursesConducted || 395}
                        </div>
                        <div className="text-[8.5px] text-teal-700 font-semibold">
                          Baseline: {reconciliation?.summary?.baseline?.courses || 391} (+4 Supp)
                        </div>
                      </div>

                      <div className="bg-white/90 p-2.5 rounded-lg border border-teal-200 bg-teal-50/40 text-center sm:text-left">
                        <div className="text-[9.5px] font-bold uppercase tracking-wider text-teal-900">
                          Participants Trained
                        </div>
                        <div className="text-lg sm:text-xl font-black text-teal-950">
                          {(reconciliation?.summary?.reconciledReport?.participantsTrained ?? 47033).toLocaleString()}
                        </div>
                        <div className="text-[8.5px] text-teal-700 font-semibold">
                          Baseline: {(reconciliation?.summary?.baseline?.reportedTrained || 43636).toLocaleString()} (+3,397 Reach)
                        </div>
                      </div>

                      <div className="bg-white/90 p-2.5 rounded-lg border border-blue-200 bg-blue-50/40 text-center sm:text-left">
                        <div className="text-[9.5px] font-bold uppercase tracking-wider text-blue-900">
                          Participants Certified
                        </div>
                        <div className="text-lg sm:text-xl font-black text-blue-950">
                          {(reconciliation?.summary?.liveData?.participantCertificatesFound ?? 33477).toLocaleString()}
                        </div>
                        <div className="text-[8.5px] text-blue-700 font-semibold">Unique Valid Cert IDs</div>
                      </div>

                      <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200 text-center sm:text-left">
                        <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600">
                          Coordinators
                        </div>
                        <div className="text-lg sm:text-xl font-black text-slate-950">
                          {reconciliation?.summary?.reconciledReport?.coordinatorsCount ?? report.totalUniqueCoordinators}
                        </div>
                        <div className="text-[8.5px] text-slate-500 font-medium">Distinct Faculty</div>
                      </div>

                      <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200 text-center sm:text-left">
                        <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600">
                          CPR Champions
                        </div>
                        <div className="text-lg sm:text-xl font-black text-slate-950">
                          {reconciliation?.summary?.reconciledReport?.championsCount ?? report.totalUniqueChampions}
                        </div>
                        <div className="text-[8.5px] text-slate-500 font-medium">Distinct Champions</div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200 text-center sm:text-left">
                        <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600">
                          Physical Venues
                        </div>
                        <div className="text-lg sm:text-xl font-black text-slate-950">
                          {reconciliation?.summary?.reconciledReport?.uniqueVenues ?? reconciliation?.summary?.baseline?.uniqueVenues ?? report.censusCentres}
                        </div>
                        <div className="text-[8.5px] text-slate-500 font-medium">
                          Baseline: {reconciliation?.summary?.baseline?.uniqueVenues ?? report.censusCentres}
                          {reconciliation && reconciliation.summary.reconciliation.supplementaryNewCourses > 0 && (
                            <span> (+{reconciliation.summary.reconciliation.supplementaryNewCourses} Supp)</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200 text-center sm:text-left">
                        <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600">
                          Courses / Sessions
                        </div>
                        <div className="text-lg sm:text-xl font-black text-slate-950">
                          {reconciliation?.summary?.reconciledReport?.coursesConducted ?? report.censusCentres}
                        </div>
                        <div className="text-[8.5px] text-teal-700 font-semibold">
                          Baseline: {reconciliation?.summary?.baseline?.courses ?? report.censusCentres}
                          {reconciliation && reconciliation.summary.reconciliation.supplementaryNewCourses > 0 && (
                            <span> (+{reconciliation.summary.reconciliation.supplementaryNewCourses} Supp)</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-white/90 p-2.5 rounded-lg border border-teal-200 bg-teal-50/40 text-center sm:text-left">
                        <div className="text-[9.5px] font-bold uppercase tracking-wider text-teal-900">
                          Participants Trained
                        </div>
                        <div className="text-lg sm:text-xl font-black text-teal-950">
                          {(reconciliation?.summary?.reconciledReport?.participantsTrained ?? report.censusParticipants).toLocaleString()}
                        </div>
                        <div className="text-[8.5px] text-teal-700 font-semibold">
                          Baseline: {(reconciliation?.summary?.baseline?.reportedTrained ?? report.censusParticipants).toLocaleString()}
                          {reconciliation && reconciliation.summary.reconciliation.confirmedNewIncrementalParticipants > 0 && (
                            <span> (+{reconciliation.summary.reconciliation.confirmedNewIncrementalParticipants.toLocaleString()} Reach)</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-white/90 p-2.5 rounded-lg border border-blue-200 bg-blue-50/40 text-center sm:text-left">
                        <div className="text-[9.5px] font-bold uppercase tracking-wider text-blue-900">
                          Participants Certified
                        </div>
                        <div className="text-lg sm:text-xl font-black text-blue-950">
                          {(reconciliation?.summary?.liveData?.participantCertificatesFound ?? 0).toLocaleString()}
                        </div>
                        <div className="text-[8.5px] text-blue-700 font-semibold">Unique Valid Cert IDs</div>
                      </div>

                      <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200 text-center sm:text-left">
                        <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600">
                          Coordinators
                        </div>
                        <div className="text-lg sm:text-xl font-black text-slate-950">
                          {reconciliation?.summary?.reconciledReport?.coordinatorsCount ?? report.totalUniqueCoordinators}
                        </div>
                        <div className="text-[8.5px] text-slate-500 font-medium">Distinct Faculty</div>
                      </div>

                      <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200 text-center sm:text-left">
                        <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600">
                          CPR Champions
                        </div>
                        <div className="text-lg sm:text-xl font-black text-slate-950">
                          {reconciliation?.summary?.reconciledReport?.championsCount ?? report.totalUniqueChampions}
                        </div>
                        <div className="text-[8.5px] text-slate-500 font-medium">Distinct Champions</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Programme Table */}
              {selectedState === "ALL_INDIA" ? (
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                      State/UT-Wise Programme Summary (28 States &amp; Union Territories)
                    </h3>
                    <span className="text-[10.5px] text-slate-500 font-medium">
                      Consolidated National IAP CPR Day 2026 Programme Reach (Draft Version 1)
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-300 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse table-fixed">
                      <thead>
                        <tr className="bg-slate-800 text-white font-bold border-b border-slate-900">
                          <th className="py-2 px-1 text-center w-[4%] border-r border-slate-700 text-[10px]">S.No</th>
                          <th className="py-2 px-2 w-[20%] border-r border-slate-700 text-[10.5px]">State / Union Territory</th>
                          <th className="py-2 px-1.5 w-[10%] border-r border-slate-700 text-[10.5px] text-center">Zone</th>
                          <th className="py-2 px-1 text-center w-[8%] border-r border-slate-700 text-[10.5px]">Courses</th>
                          <th className="py-2 px-1 text-center w-[8%] border-r border-slate-700 text-[10.5px]">Venues</th>
                          <th className="py-2 px-1.5 text-right w-[11%] border-r border-slate-700 text-[10.5px]">Baseline Trained</th>
                          <th className="py-2 px-1.5 text-right w-[11%] border-r border-slate-700 text-[10.5px] text-blue-300">Certified</th>
                          <th className="py-2 px-1.5 text-right w-[13%] border-r border-slate-700 text-[10.5px] text-teal-300">Reconciled Trained</th>
                          <th className="py-2 px-1.5 text-center w-[15%] text-[10.5px]">Verification Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {((reconciliation as any)?.stateSummaries || (report as any)?.stateSummaries || []).map((s: any, idx: number) => (
                          <tr
                            key={s.canonicalState || idx}
                            className={`hover:bg-slate-50 transition ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                          >
                            <td className="py-1.5 px-1 text-center font-mono text-[10px] font-bold text-slate-600 border-r border-slate-200 align-top">
                              {s.sNo || idx + 1}
                            </td>
                            <td className="py-1.5 px-2 font-bold text-slate-900 border-r border-slate-200 align-top text-[10.5px] leading-snug">
                              {s.canonicalState}
                            </td>
                            <td className="py-1.5 px-1.5 text-center text-slate-600 border-r border-slate-200 align-top text-[10px]">
                              {s.zone || "—"}
                            </td>
                            <td className="py-1.5 px-1 text-center font-mono text-slate-800 border-r border-slate-200 align-top text-[10.5px]">
                              {s.draftCourses ?? s.baselineCourses ?? s.centres ?? 0}
                            </td>
                            <td className="py-1.5 px-1 text-center font-mono text-slate-800 border-r border-slate-200 align-top text-[10.5px]">
                              {s.draftVenues ?? s.baselineVenues ?? s.centres ?? 0}
                            </td>
                            <td className="py-1.5 px-1.5 text-right font-mono text-slate-700 border-r border-slate-200 align-top text-[10.5px]">
                              {(s.baselineTrained ?? s.participants ?? 0).toLocaleString()}
                            </td>
                            <td className="py-1.5 px-1.5 text-right font-mono font-bold text-blue-900 border-r border-slate-200 align-top text-[10.5px]">
                              {(s.certified ?? 0).toLocaleString()}
                            </td>
                            <td className="py-1.5 px-1.5 text-right font-mono font-bold text-teal-950 border-r border-slate-200 align-top text-[10.5px]">
                              {(s.reconciledTrained ?? s.participants ?? 0).toLocaleString()}
                            </td>
                            <td className="py-1.5 px-1.5 text-center align-top text-[10px]">
                              <span className="inline-block rounded-full bg-slate-100 border border-slate-300 px-2 py-0.5 text-[9.5px] font-bold text-slate-700">
                                {s.verificationStatus || "Pending State Verification"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-900 text-white font-black border-t-2 border-slate-950">
                          <td className="py-2 px-1 text-center font-mono text-[10px]">🇮🇳</td>
                          <td className="py-2 px-2 uppercase tracking-wider text-[10.5px]">
                            INDIA TOTAL (28 States / UTs)
                          </td>
                          <td className="py-2 px-1.5 text-center text-[10px] text-slate-300">National</td>
                          <td className="py-2 px-1 text-center font-mono text-xs">
                            {reconciliation?.summary?.reconciledReport?.coursesConducted || 395}
                          </td>
                          <td className="py-2 px-1 text-center font-mono text-xs">
                            {reconciliation?.summary?.reconciledReport?.uniqueVenues || 292}
                          </td>
                          <td className="py-2 px-1.5 text-right font-mono text-xs">
                            {(reconciliation?.summary?.baseline?.reportedTrained || 43636).toLocaleString()}
                          </td>
                          <td className="py-2 px-1.5 text-right font-mono text-xs text-blue-300">
                            {(reconciliation?.summary?.liveData?.participantCertificatesFound || 33477).toLocaleString()}
                          </td>
                          <td className="py-2 px-1.5 text-right font-mono text-xs text-teal-300">
                            {(reconciliation?.summary?.reconciledReport?.participantsTrained || 47033).toLocaleString()}
                          </td>
                          <td className="py-2 px-1.5 text-center text-[10px] uppercase font-bold text-amber-300">
                            Pending State Verification
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="mt-5">
                  {(() => {
                    const stateCentres = reconciliation ? reconciliation.centres : report.centres;
                    const coursesCount = reconciliation?.summary?.reconciledReport?.coursesConducted ?? report.centres.length;
                    const trainedTotal = reconciliation?.summary?.reconciledReport?.participantsTrained ?? report.censusParticipants;

                    return (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                            Centre-Wise Programme &amp; Faculty Details ({stateCentres.length} Training Venues / Sessions)
                          </h3>
                          <span className="text-[10.5px] text-slate-500 font-medium">
                            Showing all reconciled centres for {report.canonicalState}
                          </span>
                        </div>

                        <div className="overflow-x-auto border border-slate-300 rounded-lg">
                          <table className="w-full text-left text-xs border-collapse table-fixed">
                            <thead>
                              <tr className="bg-slate-800 text-white font-bold border-b border-slate-900">
                                <th className="py-2 px-1 text-center w-[5%] border-r border-slate-700 text-[10px]">S.No</th>
                                <th className="py-2 px-2 w-[25%] border-r border-slate-700 text-[10.5px]">Centre / Training Venue</th>
                                <th className="py-2 px-2 w-[11%] border-r border-slate-700 text-[10.5px]">City / District</th>
                                <th className="py-2 px-1 text-center w-[7%] border-r border-slate-700 text-[10.5px]">Courses</th>
                                <th className="py-2 px-2 w-[16%] border-r border-slate-700 text-[10.5px]">Course Coordinator(s)</th>
                                <th className="py-2 px-2 w-[19%] border-r border-slate-700 text-[10.5px]">CPR Champions</th>
                                <th className="py-2 px-1.5 text-right w-[8%] border-r border-slate-700 text-[10.5px]">Trained</th>
                                <th className="py-2 px-1.5 text-center w-[9%] text-[10.5px]">Verification</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {stateCentres.map((c: any, idx: number) => {
                                const coords = (c.allCoordinators || c.coordinators || []).filter(Boolean);
                                const champs = (c.allChampions || c.champions || []).filter(Boolean);
                                const trained = c.projectedTotal ?? c.participantsTrained ?? 0;
                                const isSupplementary = c.classification === "SUPPLEMENTARY_NEW_COURSE" || c.classification === "APPROVED_SUPPLEMENTARY";
                                const isReviewReq = c.classification === "REVIEW_REQUIRED";

                                return (
                                  <tr
                                    key={`${c.serialNumber}_${idx}`}
                                    className={`hover:bg-slate-50 transition ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                                  >
                                    <td className="py-1.5 px-1 text-center font-mono text-[10px] font-bold text-slate-600 border-r border-slate-200 align-top">
                                      {c.serialNumber}
                                    </td>
                                    <td className="py-1.5 px-2 font-bold text-slate-900 border-r border-slate-200 align-top text-[10.5px] leading-snug break-words">
                                      <div>{c.venue}</div>
                                      {isSupplementary && (
                                        <span className="inline-block mt-0.5 text-[8px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded">
                                          Supplementary Course
                                        </span>
                                      )}
                                      {isReviewReq && (
                                        <span className="inline-block mt-0.5 text-[8px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded">
                                          Review Required
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-2 font-semibold text-slate-700 border-r border-slate-200 align-top text-[10px] break-words">
                                      {c.city || "—"}
                                    </td>
                                    <td className="py-1.5 px-1 text-center font-mono text-slate-800 border-r border-slate-200 align-top text-[10.5px]">
                                      {c.coursesCount ?? 1}
                                    </td>
                                    <td className="py-1.5 px-2 text-slate-800 border-r border-slate-200 align-top text-[10px] leading-tight break-words">
                                      {coords.length > 0 ? (
                                        <span className="font-semibold">{coords.join(", ")}</span>
                                      ) : (
                                        <span className="text-slate-400 italic">—</span>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-2 text-slate-700 border-r border-slate-200 align-top text-[10px] leading-tight break-words">
                                      {champs.length > 0 ? (
                                        <span>{champs.join(", ")}</span>
                                      ) : (
                                        <span className="text-slate-400 italic">—</span>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-1.5 text-right font-mono font-bold text-teal-950 border-r border-slate-200 align-top text-[10.5px]">
                                      {trained > 0 ? trained.toLocaleString() : "—"}
                                    </td>
                                    <td className="py-1.5 px-1.5 text-center align-top text-[10px]">
                                      <span
                                        className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                          isReviewReq
                                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                                            : "bg-slate-100 text-slate-700 border border-slate-300"
                                        }`}
                                      >
                                        {isReviewReq ? "Review Req." : "To Be Verified"}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-100 font-black border-t-2 border-slate-400 text-slate-950">
                                <td colSpan={3} className="py-2 px-2 text-right uppercase tracking-wider text-[10.5px]">
                                  STATE TOTAL ({stateCentres.length} Venues / Sessions):
                                </td>
                                <td className="py-2 px-1 text-center font-mono text-xs text-slate-900 border-r border-slate-300">
                                  {coursesCount}
                                </td>
                                <td colSpan={2} className="py-2 px-2 text-right text-[10px] text-slate-600 border-r border-slate-300">
                                  Certified: {(reconciliation?.summary?.liveData?.participantCertificatesFound ?? 0).toLocaleString()}
                                </td>
                                <td className="py-2 px-1.5 text-right font-mono text-xs text-teal-950 border-r border-slate-300">
                                  {trainedTotal.toLocaleString()}
                                </td>
                                <td className="py-2 px-1.5 text-center text-[9.5px] uppercase text-slate-600 font-bold">
                                  To Be Verified
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* State Verification Request Box (Section 15) */}
              <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 sm:p-4 text-xs text-amber-950 space-y-1.5 report-verification-box">
                <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-amber-900 text-[11px] sm:text-xs">
                  <span>📋</span> STATE VERIFICATION REQUEST
                </div>
                <p className="text-[11px] sm:text-xs text-amber-900 leading-relaxed font-medium">
                  State teams and Course Coordinators are requested to verify the above programme data. Please report any missing course, incorrect venue, duplicate entry, incorrect participant count, Course Coordinator/CPR Champion correction, or other discrepancy for incorporation before finalisation.
                </p>
              </div>

              {/* Official Report Footer (Section 14) */}
              <div className="mt-6 pt-4 border-t border-slate-300 flex flex-wrap items-center justify-between text-[10.5px] text-slate-500 font-medium">
                <div>
                  <strong className="text-slate-800">CPR Sanjeevani — National IAP CPR Day 2026</strong> • <span className="font-bold text-amber-900">Draft Version 1</span> • <span className="font-semibold text-slate-700">For State Verification</span>
                  <div className="text-[9.5px] text-slate-500 mt-0.5">
                    Generated from programme reports and currently available reconciled records.
                  </div>
                </div>

                <div className="text-right text-[10px]">
                  <div>Version: <span className="font-mono font-bold text-slate-700">CPRDAY_CENSUS_DRAFT_V1</span></div>
                  <div>Generated: <span className="font-semibold text-slate-700">{generationDate || "4 September 2026"}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Print Stylesheet for Clean A4 Portrait Printing */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 10mm 10mm 12mm 10mm;
        }

        .report-watermark-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-evenly;
          pointer-events: none;
          user-select: none;
          z-index: 25;
          overflow: hidden;
          padding: 4rem 0;
        }

        .report-watermark-text {
          font-size: 5rem;
          font-weight: 900;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(15, 23, 42, 0.055);
          transform: rotate(-35deg);
          white-space: nowrap;
          line-height: 1;
          pointer-events: none;
          user-select: none;
        }

        @media print {
          /* Hide all page chrome and administrative controls */
          body {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          header,
          footer,
          nav,
          .no-print {
            display: none !important;
          }

          .printable-report-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .printable-report-sheet {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            border-radius: 0 !important;
            overflow: visible !important;
            max-width: 100% !important;
          }

          .report-watermark-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            z-index: 9999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            pointer-events: none !important;
            padding: 0 !important;
          }

          .report-watermark-overlay .report-watermark-text:not(:first-child) {
            display: none !important;
          }

          .report-watermark-text {
            font-size: 5.5rem !important;
            font-weight: 900 !important;
            letter-spacing: 0.18em !important;
            color: rgba(0, 0, 0, 0.06) !important;
            transform: rotate(-35deg) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
          }

          .report-header-block {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .report-verification-box {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          table {
            page-break-inside: auto;
            width: 100% !important;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          thead {
            display: table-header-group;
          }

          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>
    </div>
  );
}

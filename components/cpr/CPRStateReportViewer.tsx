"use client";

import React, { useState, useEffect } from "react";
import type { CPRDayStateReport, CPRDayCentreReport } from "@/lib/cprCensus";
import {
  LOCKED_OFFICIAL_STATE_CENSUS,
  LOCKED_OFFICIAL_INDIA_TOTAL,
  LockedStateCensusEntry,
} from "@/lib/cprStateCensus";

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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generationDate, setGenerationDate] = useState<string>("");

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
      const res = await fetch(`/api/cprsanjeevani/census?state=${encodeURIComponent(targetState)}`);
      const data = await res.json();

      if (res.ok && data.success && data.report) {
        setReport(data.report);
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
    if (!report || report.centres.length === 0) return;

    const headers = [
      "S.No",
      "Centre / Venue Name",
      "City",
      "State",
      "Zone",
      "Course Coordinator(s)",
      "CPR Champions",
      "Participants Trained",
    ];

    const csvRows = [headers.join(",")];

    report.centres.forEach((c) => {
      const row = [
        `"${c.serialNumber.replace(/"/g, '""')}"`,
        `"${c.venue.replace(/"/g, '""')}"`,
        `"${c.city.replace(/"/g, '""')}"`,
        `"${c.state.replace(/"/g, '""')}"`,
        `"${c.zone.replace(/"/g, '""')}"`,
        `"${c.coordinators.join("; ").replace(/"/g, '""')}"`,
        `"${c.champions.join("; ").replace(/"/g, '""')}"`,
        c.participantsTrained,
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CPR_Sanjeevani_State_Report_${report.canonicalState.replace(/\s+/g, "_")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Compute Data Quality Diagnostics (for Admin preview only, non-printing)
  const noCoordinatorCentres = report ? report.centres.filter((c) => c.coordinators.length === 0) : [];
  const noChampionCentres = report ? report.centres.filter((c) => c.champions.length === 0) : [];
  const zeroParticipantCentres = report ? report.centres.filter((c) => c.participantsTrained === 0) : [];
  const liveSupplementedCentres = report ? report.centres.filter((c) => c.supplementalFromLive) : [];

  return (
    <div className="space-y-6">
      {/* 1. Admin Control & Selector Panel (Hidden when printing) */}
      <section className="no-print rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="rounded-full bg-teal-100 text-teal-900 border border-teal-200 px-3 py-1 text-xs font-black uppercase tracking-wider">
              📊 Administrator State Reporting Engine
            </span>
            <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              National IAP CPR Day 2026 — State Reports
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Select any of the 28 authoritative States/UTs to generate a clean A4 Portrait official programme report.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
              🇮🇳 India Total: <strong className="text-slate-900">391 Centres</strong> • <strong className="text-slate-900">43,636 Trained</strong>
            </span>
          </div>
        </div>

        {/* State Selector Form */}
        <div className="mt-6 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Select State / Union Territory (28 Authoritative States)
            </label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                handleGenerateReport(e.target.value);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-none cursor-pointer"
            >
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
              {loading ? "⏳ Loading..." : "🔄 Refresh Report"}
            </button>

            {report && (
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
        {report && isAdmin && (
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

      {/* 2. Official A4 Portrait Report Sheet (Print Optimized) */}
      {report && (
        <div className="printable-report-wrapper mx-auto max-w-4xl">
          <div className="printable-report-sheet relative overflow-hidden bg-white border border-slate-300 sm:rounded-2xl p-5 sm:p-8 md:p-9 shadow-lg text-slate-900 font-sans">
            {/* Prominent Diagonal DRAFT Watermark Overlay (Rendered in front of all content, pointer-events: none) */}
            {reportStatus === "DRAFT" && (
              <div className="report-watermark-overlay select-none pointer-events-none" aria-hidden="true">
                <div className="report-watermark-text">DRAFT</div>
                <div className="report-watermark-text">DRAFT</div>
                <div className="report-watermark-text">DRAFT</div>
                <div className="report-watermark-text">DRAFT</div>
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
                    CPR SANJEEVANI — STATE PROGRAMME REPORT
                  </div>

                  {reportStatus === "DRAFT" ? (
                    <>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 border border-amber-300/80 px-2.5 py-0.5 text-xs font-black text-amber-900 tracking-wider uppercase">
                          <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                          DRAFT REPORT – FOR STATE VERIFICATION
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px] sm:text-xs text-slate-600 italic font-medium leading-relaxed max-w-3xl">
                        Draft report for verification of centre, participant, Course Coordinator and CPR Champion records. Please communicate corrections before finalisation.
                      </p>
                    </>
                  ) : (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-xs font-black text-emerald-900 tracking-wider uppercase">
                        OFFICIAL FINAL REPORT
                      </span>
                    </div>
                  )}
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
                        State / Union Territory
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight">
                        {report.canonicalState}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block rounded-lg bg-slate-900 text-white font-black text-xs sm:text-sm px-3.5 py-1 tracking-wider uppercase">
                        {report.zone}
                      </span>
                    </div>
                  </div>

                  {/* 4 Authoritative State Metrics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200 text-center sm:text-left">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600">
                        Centres / Records
                      </div>
                      <div className="text-lg sm:text-xl font-black text-slate-950">
                        {report.lockedCensusTotals?.officialCentres ?? report.censusCentres}
                      </div>
                      <div className="text-[8.5px] text-teal-700 font-semibold">Locked Official Census</div>
                    </div>

                    <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200 text-center sm:text-left">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600">
                        Participants Trained
                      </div>
                      <div className="text-lg sm:text-xl font-black text-teal-900">
                        {(report.lockedCensusTotals?.officialParticipants ?? report.censusParticipants).toLocaleString()}
                      </div>
                      <div className="text-[8.5px] text-teal-700 font-semibold">Derived Census Total</div>
                    </div>

                    <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200 text-center sm:text-left">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600">
                        Course Coordinators
                      </div>
                      <div className="text-lg sm:text-xl font-black text-slate-950">
                        {report.totalUniqueCoordinators}
                      </div>
                      <div className="text-[8.5px] text-slate-500 font-medium">Distinct Coordinators</div>
                    </div>

                    <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200 text-center sm:text-left">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600">
                        CPR Champions
                      </div>
                      <div className="text-lg sm:text-xl font-black text-slate-950">
                        {report.totalUniqueChampions}
                      </div>
                      <div className="text-[8.5px] text-slate-500 font-medium">Cumulative Champions</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Centre-wise Programme Details Table */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                    Centre-Wise Programme &amp; Faculty Details ({report.centres.length} Training Sessions)
                  </h3>
                  <span className="text-[10.5px] text-slate-500 font-medium">
                    Showing all centres for {report.canonicalState}
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse table-fixed">
                    <thead>
                      <tr className="bg-slate-800 text-white font-bold border-b border-slate-900">
                        <th className="py-2 px-1 text-center w-[5%] border-r border-slate-700 text-[10px]">S.No</th>
                        <th className="py-2 px-2 w-[26%] border-r border-slate-700 text-[10.5px]">Centre / Training Venue</th>
                        <th className="py-2 px-2 w-[13%] border-r border-slate-700 text-[10.5px]">City / District</th>
                        <th className="py-2 px-2 w-[17%] border-r border-slate-700 text-[10.5px]">Course Coordinator(s)</th>
                        <th className="py-2 px-2.5 w-[32%] border-r border-slate-700 text-[10.5px]">CPR Champions</th>
                        <th className="py-2 px-1.5 text-right w-[7%] text-[10.5px]">Trained</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {report.centres.map((c, idx) => (
                        <tr
                          key={`${c.serialNumber}_${idx}`}
                          className={`hover:bg-slate-50 transition ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                        >
                          <td className="py-1.5 px-1 text-center font-mono text-[10px] font-bold text-slate-600 border-r border-slate-200 align-top">
                            {c.serialNumber}
                          </td>
                          <td className="py-1.5 px-2 font-bold text-slate-900 border-r border-slate-200 align-top text-[10.5px] leading-snug break-words">
                            <div>{c.venue}</div>
                            {c.supplementalFromLive && (
                              <span className="no-print inline-block mt-0.5 text-[8px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-1 py-0.2 rounded">
                                + Live Data
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 px-2 font-semibold text-slate-700 border-r border-slate-200 align-top text-[10px] break-words">
                            {c.city || "—"}
                          </td>
                          <td className="py-1.5 px-2 text-slate-800 border-r border-slate-200 align-top text-[10px] leading-tight break-words">
                            {c.coordinators && c.coordinators.length > 0 ? (
                              <span className="font-semibold">{c.coordinators.join(", ")}</span>
                            ) : (
                              <span className="text-slate-400 italic">—</span>
                            )}
                          </td>
                          <td className="py-1.5 px-2.5 text-slate-700 border-r border-slate-200 align-top text-[10px] leading-tight break-words">
                            {c.champions && c.champions.length > 0 ? (
                              <span>{c.champions.join(", ")}</span>
                            ) : (
                              <span className="text-slate-400 italic">—</span>
                            )}
                          </td>
                          <td className="py-1.5 px-1.5 text-right font-mono font-bold text-teal-950 align-top text-[10.5px]">
                            {c.participantsTrained > 0 ? c.participantsTrained.toLocaleString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-black border-t-2 border-slate-400 text-slate-950">
                        <td colSpan={5} className="py-2 px-2 text-right uppercase tracking-wider text-[10.5px]">
                          State Total ({report.centres.length} Training Sessions):
                        </td>
                        <td className="py-2 px-1.5 text-right font-mono text-xs text-teal-950">
                          {(report.lockedCensusTotals?.officialParticipants ?? report.censusParticipants).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Official Report Footer */}
              <div className="mt-8 pt-4 border-t border-slate-300 flex flex-wrap items-center justify-between text-[10.5px] text-slate-500 font-medium">
                <div>
                  <strong className="text-slate-700">National IAP CPR Day 2026</strong> • CPR Sanjeevani
                  {reportStatus === "DRAFT" ? (
                    <> • <span className="font-bold text-amber-800">Draft – For State Verification</span></>
                  ) : (
                    <> • <span className="font-bold text-emerald-800">Official State Census Record</span></>
                  )}
                  <div className="text-[9.5px] text-slate-400 mt-0.5">
                    Data generated from CPR Sanjeevani Programme Records &amp; Baseline Census
                  </div>
                </div>

                <div className="text-right text-[10px]">
                  Report Generated: <span className="font-semibold text-slate-600">{generationDate || "27 August 2026"}</span>
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
          font-size: 7.5rem;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(15, 23, 42, 0.075);
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
            font-size: 8.5rem !important;
            font-weight: 900 !important;
            letter-spacing: 0.22em !important;
            color: rgba(0, 0, 0, 0.07) !important;
            transform: rotate(-35deg) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
          }

          .report-header-block {
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

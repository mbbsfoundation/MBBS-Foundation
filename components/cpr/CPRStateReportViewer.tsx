"use client";

import React, { useState, useEffect } from "react";
import type { CPRDayStateReport, CPRDayCentreReport } from "@/lib/cprCensus";
import {
  LOCKED_OFFICIAL_STATE_CENSUS,
  LOCKED_OFFICIAL_INDIA_TOTAL,
  LockedStateCensusEntry,
} from "@/lib/cprStateCensus";

interface CPRStateReportViewerProps {
  isAdmin?: boolean;
}

export default function CPRStateReportViewer({ isAdmin = true }: CPRStateReportViewerProps) {
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
              Select any of the 28 authoritative States/UTs to generate a clean A4 Landscape official programme report.
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
                  title="Print or Save as PDF in A4 Landscape format"
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

      {/* 2. Official A4 Landscape Report Sheet (Print Optimized) */}
      {report && (
        <div className="printable-report-wrapper">
          <div className="printable-report-sheet bg-white border border-slate-300 sm:rounded-2xl p-6 sm:p-10 shadow-lg text-slate-900 font-sans">
            {/* Header / Banner */}
            <div className="border-b-2 border-slate-900 pb-5">
              <div className="flex items-start justify-between gap-4">
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
                </div>

                <div className="text-right">
                  <span className="inline-block rounded-lg bg-slate-900 text-white font-black text-lg sm:text-xl px-4 py-1.5 tracking-wider uppercase">
                    {report.canonicalState}
                  </span>
                  <div className="text-xs font-semibold text-slate-500 mt-1">
                    {report.zone}
                  </div>
                </div>
              </div>

              {/* Authoritative State Metrics Cards */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-100/90 p-4 rounded-xl border border-slate-300">
                <div className="text-center sm:text-left border-r border-slate-300/80 pr-2">
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600">
                    Centres / Records
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-950">
                    {report.lockedCensusTotals?.officialCentres ?? report.censusCentres}
                  </div>
                  <div className="text-[9px] text-teal-700 font-semibold">Locked Official Census</div>
                </div>

                <div className="text-center sm:text-left border-r border-slate-300/80 pr-2">
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600">
                    Participants Trained
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-teal-900">
                    {(report.lockedCensusTotals?.officialParticipants ?? report.censusParticipants).toLocaleString()}
                  </div>
                  <div className="text-[9px] text-teal-700 font-semibold">Derived Census Total</div>
                </div>

                <div className="text-center sm:text-left border-r border-slate-300/80 pr-2">
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600">
                    Course Coordinators
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-950">
                    {report.totalUniqueCoordinators}
                  </div>
                  <div className="text-[9px] text-slate-500 font-medium">Distinct Coordinators</div>
                </div>

                <div className="text-center sm:text-left">
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600">
                    CPR Champions
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-950">
                    {report.totalUniqueChampions}
                  </div>
                  <div className="text-[9px] text-slate-500 font-medium">Cumulative Champions</div>
                </div>
              </div>
            </div>

            {/* Centre-wise Programme Details Table */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                  Centre-Wise Programme &amp; Faculty Details ({report.centres.length} Training Sessions)
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  Showing all session centres for {report.canonicalState}
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-300 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold border-b border-slate-900">
                      <th className="py-2.5 px-2.5 text-center w-12 border-r border-slate-700">S.No</th>
                      <th className="py-2.5 px-3 w-[28%] border-r border-slate-700">Centre / Training Venue</th>
                      <th className="py-2.5 px-3 w-[15%] border-r border-slate-700">City / District</th>
                      <th className="py-2.5 px-3 w-[22%] border-r border-slate-700">Course Coordinator(s)</th>
                      <th className="py-2.5 px-3 w-[25%] border-r border-slate-700">CPR Champions</th>
                      <th className="py-2.5 px-2.5 text-right w-16">Trained</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {report.centres.map((c, idx) => (
                      <tr
                        key={`${c.serialNumber}_${idx}`}
                        className={`hover:bg-slate-50 transition ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                      >
                        <td className="py-2 px-2.5 text-center font-mono text-[11px] font-bold text-slate-600 border-r border-slate-200">
                          {c.serialNumber}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">
                          <div>{c.venue}</div>
                          {c.supplementalFromLive && (
                            <span className="no-print inline-block mt-0.5 text-[9px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded">
                              + Live Data
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-700 border-r border-slate-200">
                          {c.city || "—"}
                        </td>
                        <td className="py-2 px-3 text-slate-800 border-r border-slate-200 leading-tight">
                          {c.coordinators && c.coordinators.length > 0 ? (
                            <div className="space-y-0.5">
                              {c.coordinators.map((coord, cIdx) => (
                                <div key={cIdx} className="font-semibold text-[11px]">
                                  {coord}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-700 border-r border-slate-200 leading-tight text-[11px]">
                          {c.champions && c.champions.length > 0 ? (
                            <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
                              {c.champions.map((champ, chIdx) => (
                                <span key={chIdx} className="inline-block">
                                  {champ}
                                  {chIdx < c.champions.length - 1 ? "," : ""}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-teal-950">
                          {c.participantsTrained > 0 ? c.participantsTrained.toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-black border-t-2 border-slate-400 text-slate-950">
                      <td colSpan={5} className="py-2.5 px-3 text-right uppercase tracking-wider text-xs">
                        State Total ({report.centres.length} Training Sessions):
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-sm text-teal-950">
                        {(report.lockedCensusTotals?.officialParticipants ?? report.censusParticipants).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Official Report Footer */}
            <div className="mt-8 pt-4 border-t border-slate-300 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-medium">
              <div>
                <strong className="text-slate-700">National IAP CPR Day 2026</strong> • CPR Sanjeevani
                <div className="text-[10px] text-slate-400">
                  Data generated from CPR Sanjeevani Programme Records &amp; Baseline Census
                </div>
              </div>

              <div className="text-right text-[10px]">
                Report Generated: <span className="font-semibold text-slate-600">{generationDate || "27 August 2026"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Print Stylesheet for Clean A4 Landscape Printing */}
      <style jsx global>{`
        @page {
          size: A4 landscape;
          margin: 12mm 10mm 12mm 10mm;
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
            margin: 0 !important;
            padding: 0 !important;
          }

          .printable-report-sheet {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }

          table {
            page-break-inside: auto;
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

"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatCoordinatorDisplayName, getNormalizedCoordinatorsForDisplay } from "@/lib/cprSlug";

interface ReportCentreItem {
  serialNumber: string;
  venue: string;
  normalizedVenue?: string;
  city: string;
  state: string;
  stateCode: string;
  coursesCount: number;
  baselineParticipants?: number;
  projectedTotal?: number;
  participantsTrained?: number;
  liveRecords?: number;
  participantsCertified?: number;
  classification?: string;
  classificationReason?: string;
  confirmedIncrement?: number;
  baselineCoordinators?: string[];
  additionalLiveCoordinators?: string[];
  allCoordinators: string[];
  baselineChampions?: string[];
  additionalLiveChampions?: string[];
  allChampions: string[];
  canonicalVenueId?: string;
}

interface StateReportData {
  canonicalState: string;
  stateCode: string;
  zone: string;
  censusParticipants: number;
  censusCentres: number;
  totalUniqueCoordinators: number;
  totalUniqueChampions: number;
  centres: ReportCentreItem[];
  summary?: {
    baseline?: {
      courses: number;
      uniqueVenues: number;
      reportedTrained: number;
    };
    liveData?: {
      participantCertificatesFound: number;
      uniqueVenuesRepresented: number;
      coordinatorsFound: number;
      championsFound: number;
    };
    reconciliation?: {
      baselineMatchedVenues: number;
      supplementaryNewCourses: number;
      reviewVenues: number;
      confirmedNewIncrementalParticipants: number;
    };
    reconciledReport?: {
      participantsTrained: number;
      participantsCertified: number;
      coursesConducted: number;
      uniqueVenues: number;
      coordinatorsCount: number;
      championsCount: number;
    };
  };
}

export default function StateCoordinatorVerificationPage() {
  const urlParams = useParams();
  const rawStateSlug = (urlParams?.state as string) || "";

  // State data
  const [stateName, setStateName] = useState<string>("");
  const [stateCode, setStateCode] = useState<string>("");
  const [zone, setZone] = useState<string>("");
  const [report, setReport] = useState<StateReportData | null>(null);
  const [rowStatusMap, setRowStatusMap] = useState<Record<string, { status: string; count: number }>>({});
  const [allStateCoordinators, setAllStateCoordinators] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active Target Row Modal for Row Verification / Suggest Edit
  const [targetRow, setTargetRow] = useState<ReportCentreItem | null>(null);
  const [modalTab, setModalTab] = useState<"VERIFY_CORRECT" | "SUBMIT_CORRECTION">("VERIFY_CORRECT");

  // Row Modal Form state
  const [selectedSubmitterType, setSelectedSubmitterType] = useState<string>(""); // specific coord name or "OTHER"
  const [customSubmitterName, setCustomSubmitterName] = useState<string>("");
  const [submitterMobile, setSubmitterMobile] = useState<string>("");
  const [submitterEmail, setSubmitterEmail] = useState<string>("");
  const [verifyDeclarationAgreed, setVerifyDeclarationAgreed] = useState<boolean>(false);

  // Correction field toggles & values
  const [corrFields, setCorrFields] = useState<{
    venueName: boolean;
    city: boolean;
    trainedCount: boolean;
    coordinators: boolean;
    champions: boolean;
    coursesCount: boolean;
    other: boolean;
  }>({
    venueName: false,
    city: false,
    trainedCount: false,
    coordinators: false,
    champions: false,
    coursesCount: false,
    other: false,
  });
  const [corrProposedVenue, setCorrProposedVenue] = useState<string>("");
  const [corrProposedCity, setCorrProposedCity] = useState<string>("");
  const [corrProposedTrained, setCorrProposedTrained] = useState<string>("");
  const [corrProposedCoords, setCorrProposedCoords] = useState<string>("");
  const [corrProposedChamps, setCorrProposedChamps] = useState<string>("");
  const [corrProposedSessions, setCorrProposedSessions] = useState<string>("");
  const [corrNote, setCorrNote] = useState<string>("");
  const [corrEvidenceNote, setCorrEvidenceNote] = useState<string>("");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [modalSuccessMsg, setModalSuccessMsg] = useState<string | null>(null);
  const [modalErrorMsg, setModalErrorMsg] = useState<string | null>(null);

  // Missing Course Modal
  const [showMissingModal, setShowMissingModal] = useState<boolean>(false);
  const [missingCoordName, setMissingCoordName] = useState<string>("");
  const [missingMobile, setMissingMobile] = useState<string>("");
  const [missingEmail, setMissingEmail] = useState<string>("");
  const [missingVenue, setMissingVenue] = useState<string>("");
  const [missingCity, setMissingCity] = useState<string>("");
  const [missingDate, setMissingDate] = useState<string>("2026-07-21");
  const [missingTrained, setMissingTrained] = useState<string>("");
  const [missingOtherCoords, setMissingOtherCoords] = useState<string>("");
  const [missingChamps, setMissingChamps] = useState<string>("");
  const [missingComments, setMissingComments] = useState<string>("");
  const [missingEvidenceNote, setMissingEvidenceNote] = useState<string>("");
  const [missingSubmitting, setMissingSubmitting] = useState<boolean>(false);
  const [missingSuccessMsg, setMissingSuccessMsg] = useState<string | null>(null);
  const [missingErrorMsg, setMissingErrorMsg] = useState<string | null>(null);

  // Load state report data
  const loadStateData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/cprsanjeevani/verify?state=${encodeURIComponent(rawStateSlug)}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setStateName(data.state);
        setStateCode(data.stateCode);
        setZone(data.zone || "");
        setReport(data.report);
        setRowStatusMap(data.rowStatusMap || {});
        setAllStateCoordinators(data.coordinators || []);
      } else {
        setError(data.error || "Failed to load state verification details.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Network error while loading state verification report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rawStateSlug) {
      loadStateData();
    }
  }, [rawStateSlug]);

  // Open modal for a specific report row
  const openRowModal = (centre: ReportCentreItem, initialTab: "VERIFY_CORRECT" | "SUBMIT_CORRECTION" = "VERIFY_CORRECT") => {
    setTargetRow(centre);
    setModalTab(initialTab);
    setModalSuccessMsg(null);
    setModalErrorMsg(null);
    setVerifyDeclarationAgreed(false);

    // Get normalized coordinator list for this exact row
    const rowCoords = getNormalizedCoordinatorsForDisplay(centre.allCoordinators || []);
    if (rowCoords.length > 0) {
      setSelectedSubmitterType(rowCoords[0]);
    } else {
      setSelectedSubmitterType("OTHER");
    }
    setCustomSubmitterName("");
    setSubmitterMobile("");
    setSubmitterEmail("");

    // Reset correction fields
    setCorrFields({
      venueName: false,
      city: false,
      trainedCount: false,
      coordinators: false,
      champions: false,
      coursesCount: false,
      other: false,
    });
    setCorrProposedVenue(centre.venue);
    setCorrProposedCity(centre.city);
    setCorrProposedTrained(String(centre.projectedTotal ?? centre.participantsTrained ?? 0));
    setCorrProposedCoords((centre.allCoordinators || []).join(", "));
    setCorrProposedChamps((centre.allChampions || []).join(", "));
    setCorrProposedSessions(String(centre.coursesCount || 1));
    setCorrNote("");
    setCorrEvidenceNote("");
  };

  // Submit Verify Correct or Correction
  const handleRowFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRow) return;

    const finalSubmitterName =
      selectedSubmitterType === "OTHER"
        ? customSubmitterName.trim()
        : selectedSubmitterType.trim();

    if (!finalSubmitterName) {
      setModalErrorMsg("Please select or enter the submitter / coordinator name.");
      return;
    }

    const cleanMobile = submitterMobile.replace(/\D/g, "");
    if (!cleanMobile || cleanMobile.length < 10) {
      setModalErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (modalTab === "VERIFY_CORRECT" && !verifyDeclarationAgreed) {
      setModalErrorMsg("Please check the declaration checkbox to confirm verification.");
      return;
    }

    if (modalTab === "SUBMIT_CORRECTION") {
      const modifiedFields = Object.entries(corrFields)
        .filter(([, v]) => v)
        .map(([k]) => k);

      if (modifiedFields.length === 0 && !corrNote.trim()) {
        setModalErrorMsg("Please select at least one field to correct or describe the correction in the note.");
        return;
      }
    }

    setSubmitting(true);
    setModalErrorMsg(null);

    const reportRowKey = targetRow.canonicalVenueId || targetRow.serialNumber || targetRow.venue;

    const payload: any = {
      state: stateName,
      submissionType: modalTab,
      reportRowId: reportRowKey,
      canonicalVenueId: targetRow.canonicalVenueId || targetRow.serialNumber,
      venue: targetRow.venue,
      city: targetRow.city,
      mappedCoordinatorName: selectedSubmitterType !== "OTHER" ? selectedSubmitterType : finalSubmitterName,
      submittedByName: finalSubmitterName,
      submittedByMobile: cleanMobile,
      submittedByEmail: submitterEmail.trim() || undefined,
      currentDataJson: {
        venue: targetRow.venue,
        city: targetRow.city,
        state: stateName,
        coursesCount: targetRow.coursesCount,
        participantsTrained: targetRow.projectedTotal ?? targetRow.participantsTrained ?? 0,
        coordinators: targetRow.allCoordinators || [],
        champions: targetRow.allChampions || [],
        serialNumber: targetRow.serialNumber,
      },
    };

    if (modalTab === "SUBMIT_CORRECTION") {
      const modifiedFields = Object.entries(corrFields)
        .filter(([, v]) => v)
        .map(([k]) => k);

      payload.proposedChangesJson = {
        venue: corrFields.venueName ? corrProposedVenue.trim() : undefined,
        city: corrFields.city ? corrProposedCity.trim() : undefined,
        participantsTrained: corrFields.trainedCount ? parseInt(corrProposedTrained, 10) || undefined : undefined,
        coordinators: corrFields.coordinators
          ? corrProposedCoords.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
        champions: corrFields.champions
          ? corrProposedChamps.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
        coursesCount: corrFields.coursesCount ? parseInt(corrProposedSessions, 10) || undefined : undefined,
        fieldsModified: modifiedFields,
      };
      payload.correctionNote = corrNote.trim();
      payload.evidenceNote = corrEvidenceNote.trim() || undefined;
    }

    try {
      const res = await fetch("/api/cprsanjeevani/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setModalSuccessMsg(data.message || "Feedback submitted successfully!");
        // Refresh local status map
        setRowStatusMap((prev) => ({
          ...prev,
          [reportRowKey]: {
            status: modalTab === "SUBMIT_CORRECTION" ? "CORRECTION_SUBMITTED" : "VERIFICATION_SUBMITTED",
            count: (prev[reportRowKey]?.count || 0) + 1,
          },
        }));

        setTimeout(() => {
          setTargetRow(null);
        }, 1800);
      } else {
        setModalErrorMsg(data.error || "Failed to submit verification feedback.");
      }
    } catch (err) {
      console.error(err);
      setModalErrorMsg("Network error submitting verification feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Missing Course
  const handleMissingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!missingVenue.trim() || !missingCity.trim()) {
      setMissingErrorMsg("Venue Name and City are required.");
      return;
    }
    if (!missingCoordName.trim()) {
      setMissingErrorMsg("Course Coordinator name is required.");
      return;
    }
    const cleanMobile = missingMobile.replace(/\D/g, "");
    if (!cleanMobile || cleanMobile.length < 10) {
      setMissingErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    setMissingSubmitting(true);
    setMissingErrorMsg(null);

    try {
      const res = await fetch("/api/cprsanjeevani/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: stateName,
          submissionType: "MISSING_COURSE",
          venue: missingVenue.trim(),
          city: missingCity.trim(),
          mappedCoordinatorName: missingCoordName.trim(),
          submittedByName: missingCoordName.trim(),
          submittedByMobile: cleanMobile,
          submittedByEmail: missingEmail.trim() || undefined,
          proposedChangesJson: {
            venue: missingVenue.trim(),
            city: missingCity.trim(),
            courseDate: missingDate,
            participantsTrained: parseInt(missingTrained, 10) || 0,
            coordinators: missingOtherCoords
              ? [missingCoordName.trim(), ...missingOtherCoords.split(",").map((s) => s.trim()).filter(Boolean)]
              : [missingCoordName.trim()],
            champions: missingChamps ? missingChamps.split(",").map((s) => s.trim()).filter(Boolean) : [],
          },
          correctionNote: missingComments.trim(),
          evidenceNote: missingEvidenceNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMissingSuccessMsg(data.message || "Missing course reported successfully for Admin Review!");
        setTimeout(() => {
          setShowMissingModal(false);
          setMissingVenue("");
          setMissingCity("");
          setMissingTrained("");
          setMissingOtherCoords("");
          setMissingChamps("");
          setMissingComments("");
          setMissingEvidenceNote("");
        }, 1800);
      } else {
        setMissingErrorMsg(data.error || "Failed to submit missing course report.");
      }
    } catch (err) {
      console.error(err);
      setMissingErrorMsg("Network error submitting missing course report.");
    } finally {
      setMissingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold tracking-wide uppercase text-slate-600">
          Loading Official State Programme Report for Verification...
        </p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center">
          <span className="text-4xl block mb-3">⚠️</span>
          <h2 className="text-xl font-black text-slate-900 mb-2">Report Not Found</h2>
          <p className="text-sm text-slate-600 mb-6">{error || "Unable to retrieve state programme census."}</p>
          <Link
            href="/cprsanjeevani"
            className="inline-block px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider shadow"
          >
            ← Return to CPR Sanjeevani
          </Link>
        </div>
      </div>
    );
  }

  const centresList = report.centres || [];
  const rowNormalizedCoordinators = targetRow
    ? getNormalizedCoordinatorsForDisplay(targetRow.allCoordinators || [])
    : [];

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 pb-20 font-sans">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 text-white shadow-md border-b border-teal-800/40">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/cprsanjeevani"
              className="text-xs font-bold text-teal-300 hover:text-white transition flex items-center gap-1"
            >
              <span>←</span> CPR Sanjeevani
            </Link>
            <span className="text-slate-600">|</span>
            <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              State Verification Mode
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowMissingModal(true);
                setMissingSuccessMsg(null);
                setMissingErrorMsg(null);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>➕</span> Report Missing Course
            </button>
          </div>
        </div>
      </header>

      {/* Main Printable Report Wrapper */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 mt-6">
        <div className="printable-report-sheet relative overflow-hidden bg-white border border-slate-300 rounded-2xl p-5 sm:p-8 md:p-9 shadow-lg text-slate-900">
          {/* Watermark */}
          <div className="report-watermark-overlay select-none pointer-events-none opacity-5" aria-hidden="true">
            <div className="report-watermark-text text-6xl font-black rotate-[-25deg] text-slate-400 my-16 text-center">
              DRAFT — FOR VERIFICATION
            </div>
            <div className="report-watermark-text text-6xl font-black rotate-[-25deg] text-slate-400 my-16 text-center">
              DRAFT — FOR VERIFICATION
            </div>
          </div>

          <div className="relative z-10">
            {/* Header Block */}
            <div className="border-b-2 border-slate-900 pb-4">
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

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-black text-amber-900 tracking-wider uppercase">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                    DRAFT — FOR STATE VERIFICATION
                  </span>
                  <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-300 px-2 py-0.5 text-[11px] font-bold text-slate-700 font-mono">
                    Draft Version 1 • CPRDAY_CENSUS_DRAFT_V1
                  </span>
                </div>

                {/* Purpose Note */}
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-950 leading-relaxed">
                  <strong className="font-bold text-amber-900">PROVISIONAL PROGRAMME REPORT:</strong> This is the provisional programme report prepared from course reports, available attendance/certification records, and data reconciliation. State teams and Course Coordinators are requested to review their course/venue records below and click <strong>VERIFY / SUGGEST EDIT</strong> on their respective rows to submit confirmations or corrections.
                </div>

                {/* Metric Distinction Note */}
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/90 p-2.5 text-[11px] text-slate-700 leading-relaxed">
                  <strong className="font-bold text-slate-900">METRIC DISTINCTION:</strong> Participants Trained represents the best available programme reach based on course reports and reconciled participant records. Participants Certified represents participants for whom valid individual certificate records are currently available.
                </div>
              </div>

              {/* Leadership Strip */}
              <div className="mt-4 pt-3 pb-2.5 border-t border-slate-200 bg-slate-50/80 rounded-xl px-3 sm:px-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center sm:divide-x sm:divide-slate-200">
                  <div>
                    <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">President</div>
                    <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">Dr. Neelam Mohan</div>
                  </div>
                  <div>
                    <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">General Secretary</div>
                    <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">Dr. Ruchira Gupta</div>
                  </div>
                  <div>
                    <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">National Convener &amp; Course Director</div>
                    <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">Dr. Lokesh Tiwari</div>
                  </div>
                </div>
              </div>

              {/* State Header & Metric Cards */}
              <div className="mt-4 bg-slate-100/90 p-3 sm:p-4 rounded-xl border border-slate-300">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300/80 pb-3 mb-3">
                  <div>
                    <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">State / Union Territory</div>
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

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center sm:text-left">
                    <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600">Physical Venues</div>
                    <div className="text-lg sm:text-xl font-black text-slate-950">
                      {report.summary?.reconciledReport?.uniqueVenues ?? report.summary?.baseline?.uniqueVenues ?? report.censusCentres}
                    </div>
                    <div className="text-[8.5px] text-slate-500 font-medium">
                      Baseline: {report.summary?.baseline?.uniqueVenues ?? report.censusCentres}
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center sm:text-left">
                    <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600">Courses / Sessions</div>
                    <div className="text-lg sm:text-xl font-black text-slate-950">
                      {report.summary?.reconciledReport?.coursesConducted ?? report.censusCentres}
                    </div>
                    <div className="text-[8.5px] text-teal-700 font-semibold">
                      Baseline: {report.summary?.baseline?.courses ?? report.censusCentres}
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-teal-200 bg-teal-50/40 text-center sm:text-left">
                    <div className="text-[9.5px] font-bold uppercase tracking-wider text-teal-900">Participants Trained</div>
                    <div className="text-lg sm:text-xl font-black text-teal-950">
                      {(report.summary?.reconciledReport?.participantsTrained ?? report.censusParticipants).toLocaleString()}
                    </div>
                    <div className="text-[8.5px] text-teal-700 font-semibold">
                      Baseline: {(report.summary?.baseline?.reportedTrained ?? report.censusParticipants).toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-blue-200 bg-blue-50/40 text-center sm:text-left">
                    <div className="text-[9.5px] font-bold uppercase tracking-wider text-blue-900">Participants Certified</div>
                    <div className="text-lg sm:text-xl font-black text-blue-950">
                      {(report.summary?.liveData?.participantCertificatesFound ?? 0).toLocaleString()}
                    </div>
                    <div className="text-[8.5px] text-blue-700 font-semibold">Unique Valid Cert IDs</div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center sm:text-left">
                    <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600">Coordinators</div>
                    <div className="text-lg sm:text-xl font-black text-slate-950">
                      {report.summary?.reconciledReport?.coordinatorsCount ?? report.totalUniqueCoordinators}
                    </div>
                    <div className="text-[8.5px] text-slate-500 font-medium">Distinct Faculty</div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center sm:text-left">
                    <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600">CPR Champions</div>
                    <div className="text-lg sm:text-xl font-black text-slate-950">
                      {report.summary?.reconciledReport?.championsCount ?? report.totalUniqueChampions}
                    </div>
                    <div className="text-[8.5px] text-slate-500 font-medium">Distinct Champions</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Centre-Wise Table (The Core Verification Surface) */}
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <span>Centre-Wise Programme &amp; Faculty Details</span>
                  <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
                    {centresList.length} Venues / Sessions
                  </span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  Click <strong>Verify / Suggest Edit</strong> on your venue row to submit feedback
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold border-b border-slate-950">
                      <th className="py-2.5 px-2 text-center w-12 border-r border-slate-800 text-[10.5px]">S.No</th>
                      <th className="py-2.5 px-3 min-w-[200px] border-r border-slate-800 text-[11px]">Centre / Training Venue</th>
                      <th className="py-2.5 px-2.5 min-w-[100px] border-r border-slate-800 text-[11px]">City / District</th>
                      <th className="py-2.5 px-2 text-center w-16 border-r border-slate-800 text-[10.5px]">Courses</th>
                      <th className="py-2.5 px-3 min-w-[160px] border-r border-slate-800 text-[11px]">Course Coordinator(s)</th>
                      <th className="py-2.5 px-3 min-w-[180px] border-r border-slate-800 text-[11px]">CPR Champions</th>
                      <th className="py-2.5 px-2.5 text-right w-20 border-r border-slate-800 text-[11px]">Trained</th>
                      <th className="py-2.5 px-3 text-center min-w-[150px] text-[11px]">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {centresList.map((centre, idx) => {
                      const rowKey = centre.canonicalVenueId || centre.serialNumber || centre.venue;
                      const rowStatus = rowStatusMap[rowKey];
                      const isSupplementary = centre.classification === "SUPPLEMENTARY_NEW_COURSE" || centre.classification === "APPROVED_SUPPLEMENTARY";
                      const isReviewReq = centre.classification === "REVIEW_REQUIRED";
                      const trained = centre.projectedTotal ?? centre.participantsTrained ?? 0;
                      const rawCoords = centre.allCoordinators || [];
                      const rawChamps = centre.allChampions || [];

                      return (
                        <tr
                          key={`${centre.serialNumber}_${idx}`}
                          className={`hover:bg-slate-50/90 transition ${
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                          }`}
                        >
                          <td className="py-2.5 px-2 text-center font-mono text-[10.5px] font-bold text-slate-600 border-r border-slate-200 align-top">
                            {centre.serialNumber}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-200 align-top text-[11px] leading-snug">
                            <div>{centre.venue}</div>
                            {isSupplementary && (
                              <span className="inline-block mt-1 text-[9px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                                Supplementary Course
                              </span>
                            )}
                            {isReviewReq && (
                              <span className="inline-block mt-1 text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                Review Required
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2.5 text-slate-700 font-medium border-r border-slate-200 align-top text-[11px]">
                            {centre.city || "—"}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800 border-r border-slate-200 align-top text-[11px]">
                            {centre.coursesCount || 1}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800 border-r border-slate-200 align-top text-[11px] leading-relaxed">
                            {rawCoords.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {getNormalizedCoordinatorsForDisplay(rawCoords).map((c, i) => (
                                  <span key={i} className="inline-block bg-teal-50 text-teal-900 border border-teal-200/80 px-1.5 py-0.5 rounded text-[10.5px] font-semibold">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">None Listed</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200 align-top text-[10.5px] leading-relaxed">
                            {rawChamps.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {rawChamps.map((ch, i) => (
                                  <span key={i} className="inline-block bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                                    {formatCoordinatorDisplayName(ch)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">None Listed</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-mono font-black text-slate-950 border-r border-slate-200 align-top text-[11.5px]">
                            {trained.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center align-top">
                            {rowStatus?.status === "VERIFICATION_SUBMITTED" ? (
                              <div className="space-y-1">
                                <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
                                  ✓ Verified
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openRowModal(centre, "SUBMIT_CORRECTION")}
                                  className="block w-full text-[10px] text-teal-700 hover:underline font-bold cursor-pointer"
                                >
                                  Suggest Edit
                                </button>
                              </div>
                            ) : rowStatus?.status === "CORRECTION_SUBMITTED" ? (
                              <div className="space-y-1">
                                <span className="inline-block px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[10px]">
                                  ✎ Correction Sent
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openRowModal(centre, "SUBMIT_CORRECTION")}
                                  className="block w-full text-[10px] text-indigo-700 hover:underline font-bold cursor-pointer"
                                >
                                  View / Add Note
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openRowModal(centre, "VERIFY_CORRECT")}
                                className="inline-flex items-center justify-center gap-1 w-full px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] shadow-sm transition active:scale-95 cursor-pointer"
                              >
                                <span>✓</span> Verify / Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* 1. MODAL: VERIFY / SUGGEST EDIT (TARGETED TO EXACT REPORT ROW)     */}
      {/* ------------------------------------------------------------------ */}
      {targetRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Target Row • S.No {targetRow.serialNumber}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-950 mt-1">
                  {targetRow.venue}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTargetRow(null)}
                className="text-slate-400 hover:text-slate-700 text-2xl font-bold cursor-pointer px-2"
              >
                ✕
              </button>
            </div>

            {/* Current Row Snapshot Card */}
            <div className="mt-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Location:</span>
                <strong className="text-slate-800">{targetRow.city}, {stateName}</strong>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Courses / Sessions:</span>
                <strong className="text-slate-800">{targetRow.coursesCount || 1}</strong>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Participants Trained:</span>
                <strong className="text-teal-950 text-sm">{(targetRow.projectedTotal ?? targetRow.participantsTrained ?? 0).toLocaleString()}</strong>
              </div>
              <div className="pt-1 border-t border-slate-200 flex justify-between items-baseline text-[11px]">
                <span className="text-slate-500">Coordinators:</span>
                <span className="font-semibold text-slate-800">
                  {rowNormalizedCoordinators.join(", ") || "None listed"}
                </span>
              </div>
            </div>

            {/* Action Selector Tabs */}
            <div className="mt-5 grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setModalTab("VERIFY_CORRECT")}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === "VERIFY_CORRECT"
                    ? "bg-white text-emerald-800 shadow-sm border border-emerald-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>✓</span> A. VERIFY CORRECT
              </button>
              <button
                type="button"
                onClick={() => setModalTab("SUBMIT_CORRECTION")}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === "SUBMIT_CORRECTION"
                    ? "bg-white text-indigo-800 shadow-sm border border-indigo-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>✎</span> B. SUGGEST CORRECTION
              </button>
            </div>

            <form onSubmit={handleRowFormSubmit} className="mt-4 space-y-4">
              {/* Submitter Identification */}
              <div className="space-y-3 bg-teal-50/50 p-4 rounded-xl border border-teal-200/80">
                <label className="block text-xs font-black uppercase tracking-wider text-teal-950">
                  1. Submitter Identification
                </label>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Select Your Name (Course Coordinator) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSubmitterType}
                    onChange={(e) => setSelectedSubmitterType(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-600 cursor-pointer"
                  >
                    {rowNormalizedCoordinators.map((c, i) => (
                      <option key={i} value={c}>
                        {c} (Mapped to this venue)
                      </option>
                    ))}
                    <option value="OTHER">-- Other / Not Listed on this Row --</option>
                  </select>
                </div>

                {selectedSubmitterType === "OTHER" && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Your Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Full Name"
                      value={customSubmitterName}
                      onChange={(e) => setCustomSubmitterName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={submitterMobile}
                      onChange={(e) => setSubmitterMobile(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-600"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Private; for admin authentication.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="coordinator@example.com"
                      value={submitterEmail}
                      onChange={(e) => setSubmitterEmail(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                </div>
              </div>

              {/* Tab A: VERIFY CORRECT Form Fields */}
              {modalTab === "VERIFY_CORRECT" && (
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={verifyDeclarationAgreed}
                      onChange={(e) => setVerifyDeclarationAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-emerald-400 text-emerald-700 focus:ring-emerald-600 h-4 w-4"
                    />
                    <span>
                      I have reviewed this course/venue information and confirm that it is correct to the best of my knowledge.
                    </span>
                  </label>
                </div>
              )}

              {/* Tab B: SUBMIT CORRECTION Form Fields */}
              {modalTab === "SUBMIT_CORRECTION" && (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      2. What needs correction on this row?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {[
                        { key: "venueName", label: "Venue Name" },
                        { key: "city", label: "City / District" },
                        { key: "trainedCount", label: "Participants Trained" },
                        { key: "coordinators", label: "Coordinators" },
                        { key: "champions", label: "CPR Champions" },
                        { key: "coursesCount", label: "Sessions Count" },
                        { key: "other", label: "Other Discrepancy" },
                      ].map((f) => (
                        <label
                          key={f.key}
                          className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100"
                        >
                          <input
                            type="checkbox"
                            checked={(corrFields as any)[f.key]}
                            onChange={(e) =>
                              setCorrFields((prev) => ({
                                ...prev,
                                [f.key]: e.target.checked,
                              }))
                            }
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <span className="font-medium text-slate-800">{f.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Proposed Fields */}
                  <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                    {corrFields.venueName && (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Correct Venue Name</label>
                        <input
                          type="text"
                          value={corrProposedVenue}
                          onChange={(e) => setCorrProposedVenue(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-semibold"
                        />
                      </div>
                    )}
                    {corrFields.city && (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Correct City / District</label>
                        <input
                          type="text"
                          value={corrProposedCity}
                          onChange={(e) => setCorrProposedCity(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-semibold"
                        />
                      </div>
                    )}
                    {corrFields.trainedCount && (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Correct Participants Trained</label>
                        <input
                          type="number"
                          value={corrProposedTrained}
                          onChange={(e) => setCorrProposedTrained(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-semibold"
                        />
                      </div>
                    )}
                    {corrFields.coursesCount && (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Correct Sessions Count</label>
                        <input
                          type="number"
                          value={corrProposedSessions}
                          onChange={(e) => setCorrProposedSessions(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-semibold"
                        />
                      </div>
                    )}
                    {corrFields.coordinators && (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Correct Coordinators (Comma separated)</label>
                        <input
                          type="text"
                          value={corrProposedCoords}
                          onChange={(e) => setCorrProposedCoords(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                    )}
                    {corrFields.champions && (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Correct Champions (Comma separated)</label>
                        <input
                          type="text"
                          value={corrProposedChamps}
                          onChange={(e) => setCorrProposedChamps(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Correction Note / Explanation <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Please describe why this correction is needed..."
                        value={corrNote}
                        onChange={(e) => setCorrNote(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Supporting Link / Attendance Sheet Reference (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Google Drive link to attendance register or photo"
                        value={corrEvidenceNote}
                        onChange={(e) => setCorrEvidenceNote(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {modalErrorMsg && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 font-medium">
                  ⚠️ {modalErrorMsg}
                </div>
              )}

              {modalSuccessMsg && (
                <div className="bg-emerald-50 text-emerald-900 text-xs p-3 rounded-xl border border-emerald-300 font-bold">
                  ✓ {modalSuccessMsg}
                </div>
              )}

              {/* Modal Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTargetRow(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer ${
                    modalTab === "VERIFY_CORRECT"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {submitting
                    ? "Submitting..."
                    : modalTab === "VERIFY_CORRECT"
                    ? "CONFIRM AS CORRECT"
                    : "SUBMIT FOR ADMIN REVIEW"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 2. MODAL: REPORT MISSING COURSE                                    */}
      {/* ------------------------------------------------------------------ */}
      {showMissingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="text-teal-600">➕</span> Report Missing Course — {stateName}
              </h3>
              <button
                type="button"
                onClick={() => setShowMissingModal(false)}
                className="text-slate-400 hover:text-slate-700 text-2xl font-bold cursor-pointer px-2"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-2">
              If a course was conducted in {stateName} on National CPR Day 2026 but does not appear in the Draft State Report above, please provide details below for Admin Review.
            </p>

            <form onSubmit={handleMissingSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Coordinator Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Full Name"
                    value={missingCoordName}
                    onChange={(e) => setMissingCoordName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={missingMobile}
                    onChange={(e) => setMissingMobile(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="coordinator@example.com"
                  value={missingEmail}
                  onChange={(e) => setMissingEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Venue / Institution Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Hospital, College or School"
                    value={missingVenue}
                    onChange={(e) => setMissingVenue(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    City / District <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="City / District"
                    value={missingCity}
                    onChange={(e) => setMissingCity(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Course Date
                  </label>
                  <input
                    type="date"
                    value={missingDate}
                    onChange={(e) => setMissingDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Participants Trained Count
                  </label>
                  <input
                    type="number"
                    placeholder="Approx number trained"
                    value={missingTrained}
                    onChange={(e) => setMissingTrained(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Other Coordinators (Optional, comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. A, Dr. B"
                  value={missingOtherCoords}
                  onChange={(e) => setMissingOtherCoords(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  CPR Champions / Instructors (Optional, comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. X, Dr. Y"
                  value={missingChamps}
                  onChange={(e) => setMissingChamps(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Comments / Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Details regarding programme conduct..."
                  value={missingComments}
                  onChange={(e) => setMissingComments(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Supporting Link / Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Google Drive link or reference"
                  value={missingEvidenceNote}
                  onChange={(e) => setMissingEvidenceNote(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              {missingErrorMsg && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200">
                  ⚠️ {missingErrorMsg}
                </div>
              )}

              {missingSuccessMsg && (
                <div className="bg-emerald-50 text-emerald-900 text-xs p-3 rounded-xl border border-emerald-300 font-bold">
                  ✓ {missingSuccessMsg}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMissingModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={missingSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {missingSubmitting ? "Submitting..." : "SUBMIT MISSING COURSE REPORT"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
